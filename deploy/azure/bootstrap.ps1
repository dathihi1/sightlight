[CmdletBinding()]
param(
    [string]$ResourceGroup = "signlight-mvp-eastasia-rg",
    [string]$Location = "eastasia",
    [string]$EnvironmentName = "signlight-mvp-env",
    [string]$ApiAppName = "signlight-api",
    [string]$AiAppName = "signlight-ai",
    [string]$PostgresServerName = "",
    [string]$RegistryName = "",
    [string]$IdentityName = "signlight-container-pull",
    [string]$DatabaseName = "signlight",
    [string]$DatabaseAdmin = "signlightadmin",
    [Parameter(Mandatory = $true)]
    [string]$WebBaseUrl,
    [Parameter(Mandatory = $true)]
    [string]$CdnBaseUrl,
    # Dung sau khi tao PostgreSQL de restore dump tu Docker truoc khi API khoi dong Flyway.
    [switch]$SkipApiDeployment,
    # Bo qua build/push neu image bootstrap da co tren ACR.
    [switch]$SkipImageBuild,
    # Chi bat trong lan khoi tao dau tien. SeedRunner la idempotent.
    [switch]$EnableSeed
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Require-Command([string]$Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Khong tim thay '$Name'. Hay cai Azure CLI va thu lai."
    }
}

function Require-EnvironmentValue([string]$Name) {
    $value = [Environment]::GetEnvironmentVariable($Name)
    if ([string]::IsNullOrWhiteSpace($value)) {
        throw "Thieu bien moi truong bat buoc: $Name"
    }
    return $value
}

function Invoke-Az([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments) {
    & az @Arguments
    if ($LASTEXITCODE -ne 0) {
        # Không lặp lại toàn bộ arguments vì chúng có thể chứa password/token.
        throw "Azure CLI that bai. Xem thong bao loi ngay phia tren."
    }
}

function Invoke-Docker([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments) {
    & docker @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Docker that bai. Xem thong bao loi ngay phia tren."
    }
}

# Azure CLI trả mã khác 0 khi tài nguyên chưa tồn tại. PowerShell 7 mặc định có
# thể biến stderr của CLI thành terminating error; hàm này biến trường hợp đó
# thành `$null` để các bước tạo resource có thể tiếp tục bình thường.
function Get-AzExistingValue([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments) {
    $previousErrorAction = $ErrorActionPreference
    $isPowerShell7OrNewer = $PSVersionTable.PSVersion.Major -ge 7
    if ($isPowerShell7OrNewer) {
        $previousNativePreference = $PSNativeCommandUseErrorActionPreference
        $PSNativeCommandUseErrorActionPreference = $false
    }
    try {
        $ErrorActionPreference = "Continue"
        $value = & az @Arguments 2>$null
        if ($LASTEXITCODE -ne 0) {
            return $null
        }
        return ($value | Select-Object -First 1)
    } finally {
        $ErrorActionPreference = $previousErrorAction
        if ($isPowerShell7OrNewer) {
            $PSNativeCommandUseErrorActionPreference = $previousNativePreference
        }
    }
}

function Ensure-AzProvider([string]$Namespace) {
    $state = Get-AzExistingValue provider show --namespace $Namespace --query registrationState --output tsv
    if ($state -ne "Registered") {
        Write-Host "Dang dang ky Azure resource provider: $Namespace"
        Invoke-Az provider register --namespace $Namespace --wait --output none
    }
}

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    $standardAzureCliDirectory = "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin"
    if (Test-Path "$standardAzureCliDirectory\az.cmd") {
        $env:Path = "$standardAzureCliDirectory;$env:Path"
    }
}
Require-Command "az"
Require-Command "docker"

# Azure for Students chua dang ky mot so resource provider cho den lan dung dau tien.
foreach ($providerNamespace in @(
        "Microsoft.ContainerRegistry",
        "Microsoft.App",
        "Microsoft.DBforPostgreSQL",
        "Microsoft.ManagedIdentity",
        "Microsoft.OperationalInsights")) {
    Ensure-AzProvider $providerNamespace
}

$dbPassword = Require-EnvironmentValue "AZURE_DB_ADMIN_PASSWORD"
$jwtSecret = Require-EnvironmentValue "JWT_SECRET"
$mediaSigningKey = Require-EnvironmentValue "MEDIA_SIGNING_KEY"
$aiServiceToken = Require-EnvironmentValue "SIGNLIGHT_AI_SERVICE_TOKEN"
$ipHashSalt = Require-EnvironmentValue "IP_HASH_SALT"

$suffix = (az account show --query id -o tsv).Replace("-", "").Substring(0, 8).ToLowerInvariant()
if ($LASTEXITCODE -ne 0) {
    throw "Chua dang nhap Azure. Chay 'az login' truoc."
}
if ([string]::IsNullOrWhiteSpace($RegistryName)) {
    $RegistryName = "signlight$suffix"
}
if ([string]::IsNullOrWhiteSpace($PostgresServerName)) {
    $PostgresServerName = "signlight-pg-$suffix"
}

$WebBaseUrl = $WebBaseUrl.TrimEnd("/")
$CdnBaseUrl = $CdnBaseUrl.TrimEnd("/")

Write-Host "[1/8] Tao resource group"
Invoke-Az group create --name $ResourceGroup --location $Location --output none

Write-Host "[2/8] Tao Azure Container Registry Standard"
$acrExists = Get-AzExistingValue acr show --resource-group $ResourceGroup --name $RegistryName --query name --output tsv
if ([string]::IsNullOrWhiteSpace($acrExists)) {
    Invoke-Az acr create --resource-group $ResourceGroup --name $RegistryName --sku Standard --admin-enabled false --output none
}
$loginServer = az acr show --resource-group $ResourceGroup --name $RegistryName --query loginServer -o tsv

Write-Host "[3/8] Tao managed identity va quyen AcrPull"
$identityExists = Get-AzExistingValue identity show --resource-group $ResourceGroup --name $IdentityName --query id --output tsv
if ([string]::IsNullOrWhiteSpace($identityExists)) {
    Invoke-Az identity create --resource-group $ResourceGroup --name $IdentityName --location $Location --output none
}
$identityId = az identity show --resource-group $ResourceGroup --name $IdentityName --query id -o tsv
$identityPrincipalId = az identity show --resource-group $ResourceGroup --name $IdentityName --query principalId -o tsv
$acrId = az acr show --resource-group $ResourceGroup --name $RegistryName --query id -o tsv
$pullRole = Get-AzExistingValue role assignment list --assignee-object-id $identityPrincipalId --scope $acrId --role AcrPull --query "[0].id" --output tsv
if ([string]::IsNullOrWhiteSpace($pullRole)) {
    Invoke-Az role assignment create --assignee-object-id $identityPrincipalId --assignee-principal-type ServicePrincipal --scope $acrId --role AcrPull --output none
}

Write-Host "[4/8] Tao PostgreSQL Flexible Server B1ms / 32 GiB"
$pgExists = Get-AzExistingValue postgres flexible-server show --resource-group $ResourceGroup --name $PostgresServerName --query name --output tsv
if ([string]::IsNullOrWhiteSpace($pgExists)) {
    Invoke-Az postgres flexible-server create `
        --resource-group $ResourceGroup `
        --name $PostgresServerName `
        --location $Location `
        --admin-user $DatabaseAdmin `
        --admin-password $dbPassword `
        --sku-name Standard_B1ms `
        --tier Burstable `
        --storage-size 32 `
        --storage-auto-grow Disabled `
        --backup-retention 7 `
        --geo-redundant-backup Disabled `
        --version 17 `
        --public-access 0.0.0.0 `
        --yes `
        --output none
}
$pgCostSettings = az postgres flexible-server show --resource-group $ResourceGroup --name $PostgresServerName --query "{sku:sku.name,backupDays:backup.backupRetentionDays,geoBackup:backup.geoRedundantBackup,ha:highAvailability.mode,storageGb:storage.storageSizeGb}" -o json | ConvertFrom-Json
if ($pgCostSettings.sku -ne "Standard_B1ms" -or $pgCostSettings.backupDays -ne 7 -or $pgCostSettings.geoBackup -ne "Disabled" -or $pgCostSettings.ha -ne "Disabled" -or $pgCostSettings.storageGb -ne 32) {
    throw "PostgreSQL khong dung cost guard: can B1ms/32GiB, backup 7 ngay, geo backup va HA deu Disabled."
}
$databaseExists = Get-AzExistingValue postgres flexible-server db show --resource-group $ResourceGroup --server-name $PostgresServerName --name $DatabaseName --query name --output tsv
if ([string]::IsNullOrWhiteSpace($databaseExists)) {
    Invoke-Az postgres flexible-server db create --resource-group $ResourceGroup --server-name $PostgresServerName --name $DatabaseName --output none
}
$pgHost = az postgres flexible-server show --resource-group $ResourceGroup --name $PostgresServerName --query fullyQualifiedDomainName -o tsv
$jdbcUrl = "jdbc:postgresql://${pgHost}:5432/${DatabaseName}?sslmode=require"

Write-Host "[5/8] Tao Container Apps environment"
$environmentExists = Get-AzExistingValue containerapp env show --resource-group $ResourceGroup --name $EnvironmentName --query name --output tsv
if ([string]::IsNullOrWhiteSpace($environmentExists)) {
    Invoke-Az containerapp env create --resource-group $ResourceGroup --name $EnvironmentName --location $Location --logs-destination none --output none
}

Write-Host "[6/8] Build image tren Docker local va push len ACR"
if ($SkipImageBuild) {
    Write-Host "Da bo qua build/push image theo yeu cau."
} else {
    # Azure for Students co the chan ACR Tasks. Build local khong dung quota ACR Tasks.
    Invoke-Az acr login --name $RegistryName --output none
    Invoke-Docker build --tag "$loginServer/signlight-ai:bootstrap" "$PSScriptRoot\..\..\src\ai"
    Invoke-Docker push "$loginServer/signlight-ai:bootstrap"
    Invoke-Docker build --tag "$loginServer/signlight-api:bootstrap" "$PSScriptRoot\..\..\src\backend"
    Invoke-Docker push "$loginServer/signlight-api:bootstrap"
}

Write-Host "[7/8] Tao AI noi bo, scale-to-zero"
$aiExists = Get-AzExistingValue containerapp show --resource-group $ResourceGroup --name $AiAppName --query name --output tsv
if ([string]::IsNullOrWhiteSpace($aiExists)) {
    # 0.25 CPU / 0.5 GiB khong du de nap model mot cach on dinh.
    # Van scale ve 0 khi khong co request nen khong ton grant luc nhan roi.
    Invoke-Az containerapp create `
        --resource-group $ResourceGroup `
        --name $AiAppName `
        --environment $EnvironmentName `
        --image "$loginServer/signlight-ai:bootstrap" `
        --user-assigned $identityId `
        --registry-server $loginServer `
        --registry-identity $identityId `
        --ingress internal `
        --target-port 7860 `
        --transport http `
        --min-replicas 0 `
        --max-replicas 1 `
        --cpu 0.5 `
        --memory 1.0Gi `
        --secrets "ai-service-token=$aiServiceToken" `
        --env-vars `
            "MODEL_DIR=/app/runs/vsl_mvp400_v2_lite_transformer" `
            "SIGNLIGHT_AI_SERVICE_TOKEN=secretref:ai-service-token" `
            "SIGNLIGHT_AI_REQUIRE_TOKEN=true" `
            "ONNX_INTRA_OP_THREADS=1" `
            "OMP_NUM_THREADS=1" `
            "OPENBLAS_NUM_THREADS=1" `
            "MKL_NUM_THREADS=1" `
            "LOG_WEBHOOK_URL=" `
            "LOG_WEBHOOK_SECRET=" `
            "GDRIVE_FOLDER_ID=" `
        --output none
}
$aiFqdn = az containerapp show --resource-group $ResourceGroup --name $AiAppName --query properties.configuration.ingress.fqdn -o tsv

if ($SkipApiDeployment) {
    Write-Host "[8/8] Bo qua API de co the restore PostgreSQL tu Docker"
    Write-Host "Hay restore xong database, sau do chay lai script khong co -SkipApiDeployment."
} else {
    Write-Host "[8/8] Tao API cong khai, scale-to-zero"
    $apiExists = Get-AzExistingValue containerapp show --resource-group $ResourceGroup --name $ApiAppName --query name --output tsv
    if ([string]::IsNullOrWhiteSpace($apiExists)) {
        $seedEnabled = if ($EnableSeed) { "true" } else { "false" }
        # Internal ingress van dung FQDN HTTPS; ten ngan khong kich hoat scaler on dinh.
        Invoke-Az containerapp create `
        --resource-group $ResourceGroup `
        --name $ApiAppName `
        --environment $EnvironmentName `
        --image "$loginServer/signlight-api:bootstrap" `
        --user-assigned $identityId `
        --registry-server $loginServer `
        --registry-identity $identityId `
        --ingress external `
        --target-port 8080 `
        --transport http `
        --min-replicas 0 `
        --max-replicas 1 `
        --cpu 0.5 `
        --memory 1.0Gi `
        --secrets `
            "db-password=$dbPassword" `
            "jwt-secret=$jwtSecret" `
            "media-signing-key=$mediaSigningKey" `
            "ai-service-token=$aiServiceToken" `
            "ip-hash-salt=$ipHashSalt" `
        --env-vars `
            "SPRING_PROFILES_ACTIVE=prod" `
            "SPRING_DATASOURCE_URL=$jdbcUrl" `
            "SPRING_DATASOURCE_USERNAME=$DatabaseAdmin" `
            "SPRING_DATASOURCE_PASSWORD=secretref:db-password" `
            "DB_POOL_MAX_SIZE=4" `
            "DB_POOL_MIN_IDLE=0" `
            "SIGNLIGHT_SEED_ENABLED=$seedEnabled" `
            "SIGNLIGHT_AI_BASE_URL=https://${aiFqdn}" `
            "SIGNLIGHT_AI_TIMEOUT_MS=60000" `
            "SIGNLIGHT_AI_SERVICE_TOKEN=secretref:ai-service-token" `
            "SIGNLIGHT_AI_FREE_MODEL_VERSION=vsl-mvp30-v2-lite-transformer" `
            "SIGNLIGHT_AI_PREMIUM_MODEL_VERSION=vsl-mvp400-v2-lite-transformer" `
            "JWT_SECRET=secretref:jwt-secret" `
            "MEDIA_SIGNING_KEY=secretref:media-signing-key" `
            "IP_HASH_SALT=secretref:ip-hash-salt" `
            "PUBLIC_WEB_BASE_URL=$WebBaseUrl" `
            "NEXT_PUBLIC_APP_URL=$WebBaseUrl" `
            "R2_PUBLIC_BASE_URL=$CdnBaseUrl" `
            "MAIL_ENABLED=false" `
            --output none
    }
}

if (-not $SkipApiDeployment) {
    $apiFqdn = az containerapp show --resource-group $ResourceGroup --name $ApiAppName --query properties.configuration.ingress.fqdn -o tsv
    Invoke-Az containerapp update `
        --resource-group $ResourceGroup `
        --name $ApiAppName `
        --set-env-vars "PUBLIC_API_BASE_URL=https://$apiFqdn" `
        --output none
    Write-Host ""
    Write-Host "Da tao xong ha tang. API: https://$apiFqdn"
    Write-Host "Cap nhat NEXT_PUBLIC_API_BASE_URL tren Vercel bang URL tren."
}
Write-Host "ACR_NAME=$RegistryName"
Write-Host "POSTGRES_SERVER_NAME=$PostgresServerName"
