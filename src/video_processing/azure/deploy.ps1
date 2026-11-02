param(
    [Parameter(Mandatory = $true)][string]$ResourceGroup,
    [Parameter(Mandatory = $true)][string]$Image,
    [Parameter(Mandatory = $true)][string]$SpringBackendBaseUrl,
    [string]$Location = "southeastasia",
    [string]$AppName = "signlight-video-processing",
    [string]$AllowedOrigins = "https://signlight.id.vn",
    [string]$ExistingEnvironmentResourceId = "",
    [string]$RegistryServer = "",
    [string]$RegistryIdentityResourceId = ""
)

$ErrorActionPreference = "Stop"
$template = Join-Path $PSScriptRoot "main.bicep"

az group create --name $ResourceGroup --location $Location --output none
az deployment group create `
    --resource-group $ResourceGroup `
    --template-file $template `
    --parameters `
        location=$Location `
        appName=$AppName `
        image=$Image `
        springBackendBaseUrl=$SpringBackendBaseUrl `
        allowedOrigins=$AllowedOrigins `
        existingEnvironmentResourceId=$ExistingEnvironmentResourceId `
        registryServer=$RegistryServer `
        registryIdentityResourceId=$RegistryIdentityResourceId `
    --query "properties.outputs.serviceUrl.value" `
    --output tsv
