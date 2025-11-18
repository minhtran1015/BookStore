# BookStore ArgoCD Continuous Deployment Pipeline

## Overview

This document describes the complete ArgoCD-based Continuous Deployment (CD) pipeline setup for the BookStore microservices application. ArgoCD provides GitOps-based deployment automation, ensuring that the desired state defined in Git is automatically synchronized with the Kubernetes cluster.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub Repo   │    │     ArgoCD      │    │   Kubernetes    │
│   (Source)      │───▶│   (Controller)  │───▶│   (Target)      │
│                 │    │                 │    │                 │
│ • K8s Manifests │    │ • App Detection │    │ • BookStore     │
│ • Helm Charts   │    │ • Auto Sync     │    │   Services      │
│ • Kustomize     │    │ • Health Check  │    │ • Monitoring    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Components

### 1. ArgoCD Applications

#### Main Application (`argocd-bookstore-app.yaml`)
- **Purpose**: Primary BookStore application deployment
- **Source**: `https://github.com/minhtran1015/BookStore.git`
- **Path**: `k8s/`
- **Target**: `bookstore` namespace
- **Sync Policy**: Automated with self-healing

#### Environment Applications (`argocd-environments.yaml`)
- **Staging**: `bookstore-staging` namespace, automated sync
- **Production**: `bookstore-production` namespace, manual sync
- **Features**: Environment-specific configurations

#### ApplicationSet (`argocd-applicationset.yaml`)
- **Purpose**: Multi-environment management
- **Environments**: Development, Staging, Production
- **Generator**: List-based with environment parameters

### 2. ArgoCD Project (`argocd-project.yaml`)
- **Name**: `bookstore-project`
- **Source Repos**: BookStore GitHub repository
- **Destinations**: BookStore namespaces
- **RBAC**: Admin and developer roles

## Installation & Setup

### Prerequisites
- Kubernetes cluster (local or cloud)
- kubectl configured and connected
- Git repository access

### Quick Setup
```bash
# 1. Run the automated setup script
cd argoCD
./setup-argocd.sh

# 2. Install ArgoCD CLI (optional but recommended)
./install-argocd-cli.sh
```

### Manual Installation Steps
```bash
# 1. Create ArgoCD namespace
kubectl create namespace argocd

# 2. Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 3. Wait for ArgoCD to be ready
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

# 4. Expose ArgoCD server (NodePort for local testing)
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "NodePort", "ports": [{"port": 443, "targetPort": 8080, "nodePort": 30080}]}}'

# 5. Apply BookStore configurations
kubectl apply -f argocd-project.yaml
kubectl apply -f argocd-bookstore-app.yaml
kubectl apply -f argocd-environments.yaml
kubectl apply -f argocd-applicationset.yaml
```

## Access & Authentication

### ArgoCD UI Access
- **URL**: `https://localhost:30080` (NodePort) or `https://your-node-ip:30080`
- **Alternative**: Port forward - `kubectl port-forward svc/argocd-server -n argocd 8080:443`

### Default Credentials
```bash
# Username
admin

# Password (retrieve from secret)
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

### ArgoCD CLI Authentication
```bash
# Login via CLI
argocd login localhost:30080 --username admin --password <password> --insecure

# Or using port-forward
kubectl port-forward svc/argocd-server -n argocd 8080:443 &
argocd login localhost:8080 --username admin --password <password> --insecure
```

## GitOps Workflow

### 1. Development Process
```
Developer → Code Changes → Git Push → GitHub → ArgoCD Detection → K8s Deployment
```

### 2. Deployment Environments

#### Development Environment
- **Namespace**: `bookstore`
- **Sync**: Automated (immediate)
- **Purpose**: Continuous integration testing
- **Replicas**: 1 (resource efficient)

#### Staging Environment  
- **Namespace**: `bookstore-staging`
- **Sync**: Automated (after successful dev deployment)
- **Purpose**: Pre-production testing
- **Replicas**: 2 (load testing)

#### Production Environment
- **Namespace**: `bookstore-production`
- **Sync**: Manual approval required
- **Purpose**: Live production workloads
- **Replicas**: 3+ (high availability)

### 3. Deployment Process

#### Automated Flow (Dev/Staging)
1. Code changes pushed to GitHub
2. ArgoCD detects manifest changes
3. ArgoCD automatically syncs applications
4. Health checks verify deployment success
5. Self-healing resolves any drift

#### Manual Flow (Production)
1. Code changes reach production branch
2. ArgoCD detects changes but waits
3. DevOps approves deployment via UI/CLI
4. ArgoCD syncs production environment
5. Monitoring validates deployment health

## Application Management

### ArgoCD CLI Commands
```bash
# List all applications
argocd app list

# Get application details
argocd app get bookstore-app

# Sync application
argocd app sync bookstore-app

# View sync status
argocd app wait bookstore-app

# View application logs
argocd app logs bookstore-app

# Delete application (careful!)
argocd app delete bookstore-app

# Set application parameters
argocd app set bookstore-app --parameter image.tag=v2.0.0
```

### Kubectl Commands
```bash
# Check ArgoCD status
kubectl get pods -n argocd

# View applications
kubectl get applications -n argocd

# Watch application sync status
kubectl get applications -n argocd -w

# Check application details
kubectl describe application bookstore-app -n argocd

# View ArgoCD server logs
kubectl logs deployment/argocd-server -n argocd
```

## Configuration Management

### Environment-Specific Values
ArgoCD supports multiple configuration management approaches:

#### 1. Kustomize Overlays
```yaml
# kustomization.yaml
resources:
- ../base
patchesStrategicMerge:
- deployment-patch.yaml
images:
- name: bookstore-service
  newTag: v1.2.3
```

#### 2. Helm Values
```yaml
# values-staging.yaml
replicaCount: 2
image:
  tag: "staging-latest"
resources:
  requests:
    cpu: 100m
    memory: 128Mi
```

#### 3. Environment Variables
```yaml
# Via ArgoCD Application spec
source:
  helm:
    valueFiles:
    - values-production.yaml
    parameters:
    - name: image.tag
      value: v1.2.3
```

### Sync Policies

#### Automated Sync
```yaml
syncPolicy:
  automated:
    prune: true      # Remove resources not in Git
    selfHeal: true   # Correct drift automatically
    allowEmpty: false # Prevent empty syncs
```

#### Manual Sync
```yaml
syncPolicy:
  syncOptions:
  - CreateNamespace=true
  - Validate=true
  # No automated section = manual sync required
```

### Sync Options
- **CreateNamespace**: Auto-create target namespace
- **PruneLast**: Delete resources after new ones are healthy
- **Replace**: Use replace instead of apply
- **Validate**: Validate resources before apply

## Monitoring & Observability

### ArgoCD Metrics
ArgoCD exposes Prometheus metrics for monitoring:

```yaml
# Prometheus scrape configuration
- job_name: argocd-metrics
  static_configs:
  - targets:
    - argocd-metrics:8082
```

### Key Metrics to Monitor
- Application sync status
- Sync frequency and duration
- Health status of applications
- Resource usage and performance

### Integration with BookStore Monitoring
The ArgoCD deployment status integrates with the existing Grafana dashboards:

1. **Application Health**: Monitor via ArgoCD UI
2. **Deployment Status**: Track in Grafana infrastructure dashboard
3. **Service Health**: Verify via microservices overview dashboard

## Security & RBAC

### Project-Level Security
```yaml
# ArgoCD Project RBAC
roles:
- name: bookstore-admin
  policies:
  - p, proj:bookstore-project:bookstore-admin, applications, *, *, allow
  groups:
  - bookstore:admin
```

### Application-Level Security
```yaml
# Resource whitelisting
namespaceResourceWhitelist:
- group: ""
  kind: Service
- group: apps
  kind: Deployment
```

### Best Practices
1. Use least-privilege RBAC policies
2. Enable audit logging
3. Regularly rotate admin passwords
4. Use SSO integration for team access
5. Implement approval workflows for production

## Troubleshooting

### Common Issues

#### 1. Sync Failures
```bash
# Check application status
argocd app get bookstore-app

# View sync logs
argocd app logs bookstore-app --follow

# Force refresh
argocd app get bookstore-app --refresh
```

#### 2. Out of Sync Status
```bash
# Compare desired vs actual state
argocd app diff bookstore-app

# Manual sync with options
argocd app sync bookstore-app --prune --strategy hook
```

#### 3. Health Check Failures
```bash
# Check resource status in K8s
kubectl get deployments -n bookstore

# Describe failing resources
kubectl describe deployment bookstore-account-service -n bookstore

# Check pod logs
kubectl logs -l app=bookstore-account-service -n bookstore
```

### Recovery Procedures

#### Application Recovery
```bash
# Delete and recreate application
argocd app delete bookstore-app
kubectl apply -f argocd-bookstore-app.yaml

# Hard refresh (ignore cache)
argocd app get bookstore-app --hard-refresh
```

#### ArgoCD Recovery
```bash
# Restart ArgoCD components
kubectl rollout restart deployment/argocd-server -n argocd
kubectl rollout restart deployment/argocd-application-controller -n argocd
kubectl rollout restart deployment/argocd-repo-server -n argocd
```

## Integration with CI Pipeline

### GitHub Actions Integration
The ArgoCD CD pipeline integrates with the existing GitHub Actions CI pipeline:

```yaml
# In .github/workflows/comprehensive-ci.yml
- name: Update K8s Manifests
  run: |
    # Update image tags in k8s manifests
    sed -i "s|image: bookstore-.*:.*|image: bookstore-service:${{ github.sha }}|g" k8s/*.yaml
    
- name: Commit Manifest Updates
  run: |
    git config --local user.email "action@github.com"
    git config --local user.name "GitHub Action"
    git add k8s/
    git commit -m "Update manifests with image ${{ github.sha }}" || exit 0
    git push
```

### Webhook Integration
```yaml
# ArgoCD webhook for faster detection
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-notifications-cm
  namespace: argocd
data:
  config.yaml: |
    triggers:
      - name: on-sync-succeeded
        enabled: true
      - name: on-health-degraded
        enabled: true
```

## Maintenance & Updates

### ArgoCD Updates
```bash
# Check current version
argocd version

# Update ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Verify update
kubectl rollout status deployment/argocd-server -n argocd
```

### Application Updates
```bash
# Update application configuration
kubectl apply -f argocd-bookstore-app.yaml

# Refresh application
argocd app get bookstore-app --refresh
```

## Performance Optimization

### Resource Management
```yaml
# ArgoCD resource requests/limits
spec:
  template:
    spec:
      containers:
      - name: argocd-server
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
```

### Sync Performance
- Use `--sync-timeout` for long-running syncs
- Implement progressive sync waves
- Optimize manifest sizes and complexity
- Use resource hooks for dependencies

## Future Enhancements

### Planned Features
1. **Multi-cluster Management**: Deploy to multiple K8s clusters
2. **Advanced Rollback**: Automated rollback on failure detection
3. **Blue-Green Deployments**: Zero-downtime deployment strategies
4. **Canary Releases**: Gradual rollout with traffic splitting
5. **Policy Enforcement**: OPA/Gatekeeper integration
6. **Secret Management**: Sealed Secrets or External Secrets integration

### Integration Opportunities
1. **Slack Notifications**: Real-time deployment alerts
2. **JIRA Integration**: Link deployments to tickets
3. **Monitoring Alerts**: Auto-rollback on metric thresholds
4. **Security Scanning**: Container and manifest security checks

---

This completes the comprehensive ArgoCD CD pipeline setup for the BookStore application. The system provides automated, reliable, and observable deployments with proper GitOps practices.