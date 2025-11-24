# Fully Automated GKE Setup - Quick Start

This guide shows you how to set up your BookStore application on Google Kubernetes Engine (GKE) in a fully automated way with **zero prompts**.

## Prerequisites

1. **Install Google Cloud SDK**:
   ```bash
   brew install google-cloud-sdk
   ```

2. **Authenticate with Google Cloud**:
   ```bash
   gcloud auth login
   ```

3. **Have a GCP Project ready** with billing enabled

## Setup in 3 Steps

### Step 1: Create Configuration File

Copy the example config and edit it:

```bash
cp .gke-config.example .gke-config
```

Edit `.gke-config` with your values:

```bash
nano .gke-config
# or
code .gke-config
```

**Required settings:**
```bash
# Your GCP Project ID (REQUIRED)
GCP_PROJECT_ID=your-actual-project-id

# Optional settings (these have sensible defaults)
CLUSTER_NAME=bookstore-cluster
GCP_ZONE=us-central1-a
NUM_NODES=3
MACHINE_TYPE=e2-medium
REGISTRY_TYPE=gcr
```

**Important:** Replace `your-actual-project-id` with your real GCP project ID from https://console.cloud.google.com/

### Step 2: Run the Automated Setup

```bash
./setup-gke-automated.sh
```

That's it! The script will:
- ✅ Create GKE cluster
- ✅ Install ArgoCD
- ✅ Configure LoadBalancer
- ✅ Deploy BookStore
- ✅ Save credentials to `.gke-credentials`

### Step 3: Access Your Cluster

After setup completes, credentials are saved in `.gke-credentials`:

```bash
cat .gke-credentials
```

Access ArgoCD:
- URL will be displayed at the end of setup
- Username: `admin`
- Password: saved in `.gke-credentials`

## Configuration Options

### `.gke-config` File Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GCP_PROJECT_ID` | Your GCP project ID | None | ✅ Yes |
| `CLUSTER_NAME` | Name for your cluster | `bookstore-cluster` | No |
| `GCP_ZONE` | GCP zone | `us-central1-a` | No |
| `NUM_NODES` | Number of nodes | `3` | No |
| `MACHINE_TYPE` | VM size | `e2-medium` | No |
| `REGISTRY_TYPE` | `gcr` or `dockerhub` | `gcr` | No |

### Machine Type Options

| Type | vCPU | RAM | Cost/month | Use Case |
|------|------|-----|------------|----------|
| `e2-small` | 2 | 2GB | ~$24 | Testing only |
| `e2-medium` | 2 | 4GB | ~$48 | **Recommended** |
| `e2-standard-2` | 2 | 8GB | ~$96 | Heavy workloads |

## Alternative: Use Environment Variables

Instead of creating `.gke-config`, you can set environment variables:

```bash
export GCP_PROJECT_ID=your-project-id
export CLUSTER_NAME=bookstore-cluster
export GCP_ZONE=us-central1-a
export NUM_NODES=3
export MACHINE_TYPE=e2-medium
export REGISTRY_TYPE=gcr

./setup-gke-automated.sh
```

## Alternative: One-Line Setup

Set everything inline:

```bash
GCP_PROJECT_ID=your-project-id \
CLUSTER_NAME=bookstore-cluster \
GCP_ZONE=us-central1-a \
./setup-gke-automated.sh
```

## Building and Pushing Images

To build and push Docker images during setup, set:

```bash
export BUILD_IMAGES=true
./setup-gke-automated.sh
```

Or add to `.gke-config`:
```bash
BUILD_IMAGES=true
```

## What Gets Created

The automated script creates:

1. **GKE Cluster**
   - 3 nodes (default) with autoscaling (1-5 nodes)
   - Machine type: e2-medium (2 vCPU, 4GB RAM)
   - 50GB disk per node

2. **Kubernetes Resources**
   - Namespaces: `bookstore`, `argocd`
   - ArgoCD with LoadBalancer
   - BookStore application deployments

3. **Local Files**
   - `.gke-credentials` - Contains access information
   - `build_and_push.sh.backup` - Backup of original build script

## Accessing Services

### ArgoCD UI
```bash
# Get the LoadBalancer IP
kubectl get svc argocd-server -n argocd

# Or port-forward
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Then access: https://localhost:8080
```

### BookStore Services
```bash
# View all services
kubectl get svc -n bookstore

# Port-forward API Gateway
kubectl port-forward svc/bookstore-zuul-api-gateway-server -n bookstore 8765:8765
```

### View Pods
```bash
kubectl get pods -n bookstore
```

## Troubleshooting

### Authentication Error
```bash
gcloud auth list  # Check if authenticated
gcloud auth login  # Authenticate if needed
```

### Project Not Found
```bash
gcloud projects list  # List your projects
# Update GCP_PROJECT_ID in .gke-config with correct ID
```

### Cluster Already Exists
The script will skip cluster creation and use the existing one.

### Missing Configuration
```bash
# Error: GCP_PROJECT_ID is not set
# Solution: Create .gke-config file
cp .gke-config.example .gke-config
nano .gke-config  # Add your project ID
```

### Check Setup Status
```bash
# View cluster
gcloud container clusters list

# View ArgoCD status
kubectl get pods -n argocd

# View applications
kubectl get applications -n argocd
```

## Cost Management

### Monitor Costs
```bash
# View cluster details
gcloud container clusters describe bookstore-cluster --zone=us-central1-a

# Estimated monthly cost (3 x e2-medium):
# - Cluster: ~$144/month
# - Load Balancers: ~$18/month each
# - Total: ~$170-200/month
```

### Scale Down When Not in Use
```bash
# Resize to 1 node
gcloud container clusters resize bookstore-cluster --num-nodes=1 --zone=us-central1-a

# Or scale deployments to 0
kubectl scale deployment --all --replicas=0 -n bookstore
```

### Delete Cluster
```bash
gcloud container clusters delete bookstore-cluster --zone=us-central1-a --quiet
```

## CI/CD Integration

Add to GitHub Actions or CI pipeline:

```yaml
- name: Setup GKE
  env:
    GCP_PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
    GOOGLE_APPLICATION_CREDENTIALS: ${{ secrets.GCP_SA_KEY }}
  run: |
    echo "$GOOGLE_APPLICATION_CREDENTIALS" > gcp-key.json
    gcloud auth activate-service-account --key-file=gcp-key.json
    ./setup-gke-automated.sh
```

## Next Steps

After successful setup:

1. ✅ Check `.gke-credentials` for access info
2. ✅ Access ArgoCD UI and verify deployments
3. ✅ Test BookStore API endpoints
4. ✅ Configure custom domain (optional)
5. ✅ Set up monitoring (Prometheus/Grafana)

## Support

- GKE Documentation: https://cloud.google.com/kubernetes-engine/docs
- ArgoCD Documentation: https://argo-cd.readthedocs.io/
- BookStore Project: `/README.md`
