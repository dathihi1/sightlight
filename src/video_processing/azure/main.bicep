@description('Azure region for the Container Apps environment.')
param location string = resourceGroup().location

@description('Globally unique Container App name.')
param appName string = 'signlight-video-processing'

@description('OCI image, for example an existing ACR or public GHCR image.')
param image string

@description('Existing Container Apps environment resource ID. Leave empty to create a dedicated environment.')
param existingEnvironmentResourceId string = ''

@description('Private registry hostname. Leave empty for a public image.')
param registryServer string = ''

@description('User-assigned identity resource ID with registry pull permission.')
param registryIdentityResourceId string = ''

@description('HTTPS URL of the authoritative SignLight Spring backend.')
@secure()
param springBackendBaseUrl string

@description('Comma-separated browser origins allowed by CORS.')
param allowedOrigins string = 'https://signlight.id.vn'

@minValue(0)
@maxValue(1)
param minReplicas int = 0

@minValue(1)
@maxValue(3)
param maxReplicas int = 3

resource environment 'Microsoft.App/managedEnvironments@2024-03-01' = if (empty(existingEnvironmentResourceId)) {
  name: '${appName}-env'
  location: location
}

resource app 'Microsoft.App/containerApps@2024-03-01' = {
  name: appName
  location: location
  identity: empty(registryIdentityResourceId) ? {
    type: 'SystemAssigned'
  } : {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${registryIdentityResourceId}': {}
    }
  }
  properties: {
    managedEnvironmentId: empty(existingEnvironmentResourceId) ? environment.id : existingEnvironmentResourceId
    configuration: {
      activeRevisionsMode: 'Single'
      registries: empty(registryServer) ? [] : [
        {
          server: registryServer
          identity: empty(registryIdentityResourceId) ? 'system' : registryIdentityResourceId
        }
      ]
      ingress: {
        external: true
        allowInsecure: false
        targetPort: 8000
        transport: 'auto'
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
      }
    }
    template: {
      containers: [
        {
          name: 'video-processing'
          image: image
          env: [
            {
              name: 'SPRING_BACKEND_BASE_URL'
              value: springBackendBaseUrl
            }
            {
              name: 'HOLISTIC_MODEL_PATH'
              value: '/app/models/holistic_landmarker.task'
            }
            {
              name: 'ALLOWED_ORIGINS'
              value: allowedOrigins
            }
            {
              name: 'REQUIRE_HTTPS_BACKEND'
              value: 'true'
            }
            {
              name: 'PROCESSING_CONCURRENCY'
              value: '1'
            }
            {
              name: 'MAX_UPLOAD_BYTES'
              value: '10485760'
            }
          ]
          resources: {
            cpu: json('1.0')
            memory: '2Gi'
          }
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/healthz'
                port: 8000
                scheme: 'HTTP'
              }
              initialDelaySeconds: 20
              periodSeconds: 30
              timeoutSeconds: 5
              failureThreshold: 3
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/readyz'
                port: 8000
                scheme: 'HTTP'
              }
              initialDelaySeconds: 10
              periodSeconds: 10
              timeoutSeconds: 5
              failureThreshold: 6
            }
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'one-active-request-per-replica'
            http: {
              metadata: {
                concurrentRequests: '1'
              }
            }
          }
        ]
      }
    }
  }
}

output serviceUrl string = 'https://${app.properties.configuration.ingress.fqdn}'
