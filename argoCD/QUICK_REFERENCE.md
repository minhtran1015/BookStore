# BookStore ArgoCD Quick Reference

## 🚀 Quick Start Commands

### Setup ArgoCD (Choose One)
```bash
# Option 1: Local testing with Kind
cd argoCD && ./test-argocd-setup.sh

# Option 2: Existing cluster
cd argoCD && ./setup-argocd.sh

# Option 3: Validate config first
cd argoCD && ./test-argocd-config.sh
```

### Access ArgoCD
```bash
# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Access via NodePort
open http://localhost:30080

# Or port-forward
kubectl port-forward svc/argocd-server -n argocd 8080:443
open https://localhost:8080
```

### ArgoCD CLI Commands
```bash
# Install CLI
./install-argocd-cli.sh

# Login
argocd login localhost:30080 --username admin --insecure

# List apps
argocd app list

# Sync app
argocd app sync bookstore-app

# Watch sync
argocd app wait bookstore-app

# Get app details
argocd app get bookstore-app

# View logs
argocd app logs bookstore-app -f
```

### Kubectl Commands
```bash
# Check ArgoCD pods
kubectl get pods -n argocd

# View applications
kubectl get applications -n argocd

# Watch sync status
kubectl get applications -n argocd -w

# Check specific app
kubectl describe application bookstore-app -n argocd

# ArgoCD server logs
kubectl logs deployment/argocd-server -n argocd -f
```

## 📱 Applications Overview

| Application | Namespace | Sync Policy | Purpose |
|-------------|-----------|-------------|---------|
| bookstore-app | bookstore | Automated | Main development |
| bookstore-staging | bookstore-staging | Automated | Pre-production testing |
| bookstore-production | bookstore-production | Manual | Production deployment |

## 🔧 Troubleshooting

### Common Issues
```bash
# App stuck syncing
argocd app get bookstore-app --refresh

# Out of sync
argocd app diff bookstore-app
argocd app sync bookstore-app --prune

# Permission issues
kubectl get applications -n argocd
kubectl describe application bookstore-app -n argocd

# ArgoCD not responding
kubectl rollout restart deployment/argocd-server -n argocd
```

### Health Checks
```bash
# Check all ArgoCD components
kubectl get deployments -n argocd

# Verify applications
argocd app list --output wide

# Check sync status
kubectl get applications -n argocd -o custom-columns=NAME:.metadata.name,SYNC:.status.sync.status,HEALTH:.status.health.status
```

## 📂 File Structure
```
argoCD/
├── argocd-bookstore-app.yaml     # Main application
├── argocd-project.yaml           # Project config
├── argocd-environments.yaml      # Staging + Production
├── argocd-applicationset.yaml    # Multi-env management
├── setup-argocd.sh              # Installation script
├── test-argocd-setup.sh         # Local testing script
├── test-argocd-config.sh        # Configuration validation
├── install-argocd-cli.sh        # CLI installation
├── kind-cluster-config.yaml     # Local cluster config
└── README.md                    # Complete documentation
```

## 🌟 Key Features

- ✅ GitOps-based deployments
- ✅ Multi-environment support  
- ✅ Automated sync with self-healing
- ✅ RBAC security model
- ✅ Integration with existing CI/CD
- ✅ Monitoring integration
- ✅ Production-ready configuration