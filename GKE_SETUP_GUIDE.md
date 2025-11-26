# Google Kubernetes Engine (GKE) Setup Guide for BookStore

**Last Updated:** November 26, 2025

This guide will help you deploy the BookStore application on Google Kubernetes Engine.

## 🎯 Current Production Deployment

Our BookStore application is currently deployed on GKE with the following configuration:

| Property | Value |
|----------|-------|
| **Project ID** | `lyrical-tooling-475815-i8` |
| **Cluster Name** | `bookstore-cluster` |
| **Zone** | `us-central1-a` |
| **Nodes** | 2 x e2-medium |
| **Container Registry** | `gcr.io/lyrical-tooling-475815-i8` |
| **ArgoCD URL** | https://34.136.30.74 |
| **ArgoCD Password** | `-mJR19yatNNHZ3km` |

## Prerequisites

### 1. Install Google Cloud SDK
```bash
# Install gcloud CLI
brew install google-cloud-sdk

# Initialize and authenticate
gcloud init
gcloud auth login
```

### 2. Install kubectl (if not already installed)
```bash
brew install kubectl
```

### 3. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing for the project (required for GKE)
4. Note your Project ID (e.g., `bookstore-project-12345`)

## Quick Setup (Automated)

The easiest way to set up everything is to run the automated script:

```bash
# Make the script executable
chmod +x gke-setup.sh

# Run the setup
./gke-setup.sh
```

The script will:
1. Create a GKE cluster with 3 nodes
2. Install ArgoCD
3. Deploy the BookStore application
4. Provide access credentials

### Script Prompts

You'll be asked for:
- **GCP Project ID**: Your Google Cloud project ID
- **Cluster Name**: Name for your cluster (default: `bookstore-cluster`)
- **Zone**: GCP zone (default: `us-central1-a`)
- **Number of Nodes**: Initial node count (default: `3`)
- **Machine Type**: VM size (default: `e2-medium`)

## Manual Setup (Step-by-Step)

If you prefer manual control, follow these steps:

### 1. Set Your GCP Project
```bash
gcloud config set project YOUR_PROJECT_ID
```

### 2. Enable Required APIs
```bash
gcloud services enable container.googleapis.com
gcloud services enable compute.googleapis.com
```

### 3. Create GKE Cluster
```bash
gcloud container clusters create bookstore-cluster \
  --zone=us-central1-a \
  --num-nodes=3 \
  --machine-type=e2-medium \
  --disk-size=50GB \
  --enable-autoscaling \
  --min-nodes=1 \
  --max-nodes=5 \
  --enable-autorepair \
  --enable-autoupgrade
```

**Machine Type Options:**
- `e2-micro`: 2 vCPUs, 1GB RAM (Free tier eligible, but too small for BookStore)
- `e2-small`: 2 vCPUs, 2GB RAM (~$24/month)
- `e2-medium`: 2 vCPUs, 4GB RAM (~$48/month) ✅ **Recommended**
- `e2-standard-2`: 2 vCPUs, 8GB RAM (~$96/month)

### 4. Get Cluster Credentials
```bash
gcloud container clusters get-credentials bookstore-cluster --zone=us-central1-a
```

### 5. Create Namespaces
```bash
kubectl create namespace bookstore
kubectl create namespace argocd
```

### 6. Install ArgoCD
```bash
# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
kubectl wait --for=condition=available --timeout=600s deployment/argocd-server -n argocd

# Get ArgoCD password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

### 7. Expose ArgoCD
```bash
# Option 1: LoadBalancer (gets public IP)
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'

# Get the external IP
kubectl get svc argocd-server -n argocd

# Option 2: Port-forward (for testing)
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

### 8. Deploy BookStore via ArgoCD
```bash
# Apply ArgoCD configurations
kubectl apply -f argoCD/argocd-project.yaml
kubectl apply -f argoCD/argocd-bookstore-app.yaml
kubectl apply -f argoCD/argocd-environments.yaml
```

## Accessing Your Application

### ArgoCD UI
- **LoadBalancer**: `https://<EXTERNAL-IP>` (get IP with `kubectl get svc argocd-server -n argocd`)
- **Port-forward**: `https://localhost:8080`
- **Username**: `admin`
- **Password**: Retrieved from secret (see step 6)

### BookStore Services
```bash
# Get service endpoints
kubectl get svc -n bookstore

# Port-forward individual services (for testing)
kubectl port-forward svc/bookstore-zuul-api-gateway-server -n bookstore 8765:8765
```

## Monitoring and Management

### View All Pods
```bash
kubectl get pods -A
```

### View BookStore Pods
```bash
kubectl get pods -n bookstore
```

### View Logs
```bash
kubectl logs -f <pod-name> -n bookstore
```

### View ArgoCD Applications
```bash
kubectl get applications -n argocd
```

### Scale Deployments
```bash
kubectl scale deployment bookstore-account-service -n bookstore --replicas=2
```

## Cost Management

### Monitor Costs
```bash
# View cluster info
gcloud container clusters describe bookstore-cluster --zone=us-central1-a

# Estimated costs (per month):
# - 3 x e2-medium nodes: ~$144/month
# - Network egress: ~$10-20/month
# - Load balancers: ~$18/month per LB
# Total: ~$170-200/month
```

### Reduce Costs

1. **Use Preemptible Nodes** (can be shut down anytime, 80% cheaper):
```bash
gcloud container node-pools create preemptible-pool \
  --cluster=bookstore-cluster \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --num-nodes=3 \
  --preemptible
```

2. **Enable Autopilot** (pay per pod instead of per node):
```bash
gcloud container clusters create-auto bookstore-autopilot \
  --region=us-central1
```

3. **Scale Down When Not in Use**:
```bash
# Scale down to 0 replicas
kubectl scale deployment --all --replicas=0 -n bookstore

# Or delete the cluster
gcloud container clusters delete bookstore-cluster --zone=us-central1-a
```

### Free Tier
- Google Cloud offers $300 in free credits for new accounts (valid for 90 days)
- After credits expire, you'll be charged based on usage

## Cleanup

### Delete Cluster
```bash
gcloud container clusters delete bookstore-cluster --zone=us-central1-a
```

### Delete Project (removes everything)
```bash
gcloud projects delete YOUR_PROJECT_ID
```

## Troubleshooting

### Cluster Creation Fails
- **Error**: "Insufficient quota"
  - **Solution**: Request quota increase in GCP Console or use a different region
  
### Pods Crash or Fail to Start
```bash
# Check pod status
kubectl describe pod <pod-name> -n bookstore

# Check logs
kubectl logs <pod-name> -n bookstore --previous
```

### ArgoCD Applications Not Syncing
```bash
# Check ArgoCD app status
kubectl get applications -n argocd

# View detailed status
kubectl describe application bookstore-app -n argocd

# Force sync
kubectl patch application bookstore-app -n argocd -p '{"operation":{"initiatedBy":{"username":"admin"},"sync":{"revision":"HEAD"}}}' --type merge
```

### Cannot Access Services
- Ensure LoadBalancer has an external IP assigned
- Check firewall rules in GCP Console
- Verify services are running: `kubectl get pods -n bookstore`

## Best Practices

1. **Enable Workload Identity**: For secure access to GCP services
2. **Use Namespaces**: Separate environments (dev, staging, prod)
3. **Enable Monitoring**: Use Google Cloud Monitoring & Logging
4. **Set Resource Limits**: Define CPU/memory requests and limits
5. **Use Persistent Volumes**: For MySQL and other stateful services
6. **Enable Network Policies**: For pod-to-pod security
7. **Regular Backups**: Backup persistent volumes and configurations

## Next Steps

After setup:
1. Access ArgoCD and verify all applications are synced
2. Test the BookStore API endpoints
3. Configure CI/CD to push images to Google Container Registry (GCR)
4. Set up monitoring with Prometheus/Grafana
5. Configure DNS for custom domains

## Support

For issues or questions:
- Check GKE documentation: https://cloud.google.com/kubernetes-engine/docs
- ArgoCD docs: https://argo-cd.readthedocs.io/
- BookStore project README: `/README.md`
