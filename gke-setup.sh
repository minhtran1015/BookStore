#!/bin/bash

# BookStore GKE Setup Script
# This script creates a GKE cluster and deploys the BookStore application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🚀 BookStore GKE Setup Script"
echo "=============================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed."
    echo "Install it with: brew install google-cloud-sdk"
    echo "Then run: gcloud auth login"
    exit 1
fi

print_success "gcloud CLI is installed"

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed."
    echo "Install it with: brew install kubectl"
    exit 1
fi

print_success "kubectl is installed"

# Load configuration from .env file
CONFIG_FILE=".env"

if [ -f "$CONFIG_FILE" ]; then
    print_status "Loading configuration from $CONFIG_FILE"
    # Export variables from .env file
    export $(grep -v '^#' $CONFIG_FILE | grep -v '^$' | xargs)
else
    print_error "No $CONFIG_FILE found!"
    echo ""
    echo "Please create a .env file from .env.example:"
    echo "  cp .env.example .env"
    echo "  # Then edit .env and set your GCP_PROJECT_ID"
    exit 1
fi

# Use environment variables from .env
PROJECT_ID=${GCP_PROJECT_ID}
CLUSTER_NAME=${CLUSTER_NAME:-bookstore-cluster}
ZONE=${GCP_ZONE:-us-central1-a}
NUM_NODES=${NUM_NODES:-2}
MACHINE_TYPE=${MACHINE_TYPE:-e2-medium}

# Check if PROJECT_ID is set
if [ -z "$PROJECT_ID" ]; then
    print_error "GCP_PROJECT_ID is not set in .env file!"
    echo ""
    echo "Please edit your .env file and set:"
    echo "  GCP_PROJECT_ID=your-project-id"
    exit 1
fi

echo ""
print_status "Configuration Summary:"
echo "  Project ID: $PROJECT_ID"
echo "  Cluster Name: $CLUSTER_NAME"
echo "  Zone: $ZONE"
echo "  Number of Nodes: $NUM_NODES"
echo "  Machine Type: $MACHINE_TYPE"
echo ""

# Check if non-interactive mode
if [ "$NON_INTERACTIVE" = "true" ] || [ "$CI" = "true" ]; then
    print_status "Running in non-interactive mode. Proceeding automatically..."
else
    read -p "Proceed with cluster creation? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Set the project
print_status "Setting GCP project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
print_status "Enabling required GCP APIs..."
gcloud services enable container.googleapis.com
gcloud services enable compute.googleapis.com

# Create GKE cluster
print_status "Creating GKE cluster (this may take 5-10 minutes)..."
gcloud container clusters create $CLUSTER_NAME \
  --zone=$ZONE \
  --num-nodes=$NUM_NODES \
  --machine-type=$MACHINE_TYPE \
  --disk-size=50GB \
  --enable-autoscaling \
  --min-nodes=1 \
  --max-nodes=5 \
  --enable-autorepair \
  --enable-autoupgrade \
  --addons=HorizontalPodAutoscaling,HttpLoadBalancing \
  --workload-pool=$PROJECT_ID.svc.id.goog

print_success "GKE cluster created successfully!"

# Get cluster credentials
print_status "Getting cluster credentials..."
gcloud container clusters get-credentials $CLUSTER_NAME --zone=$ZONE

# Verify cluster access
print_status "Verifying cluster access..."
kubectl cluster-info

print_success "Cluster is accessible"

# Create namespaces
print_status "Creating namespaces..."
kubectl create namespace bookstore --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

# Install ArgoCD
print_status "Installing ArgoCD..."
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
print_status "Waiting for ArgoCD to be ready (this may take a few minutes)..."
kubectl wait --for=condition=available --timeout=600s deployment/argocd-server -n argocd
kubectl wait --for=condition=available --timeout=600s deployment/argocd-repo-server -n argocd
kubectl wait --for=condition=available --timeout=600s deployment/argocd-application-controller -n argocd

print_success "ArgoCD installation completed"

# Get ArgoCD admin password
print_status "Retrieving ArgoCD admin password..."
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)

# Expose ArgoCD server
print_status "Exposing ArgoCD server..."
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'

# Wait for LoadBalancer IP
print_status "Waiting for ArgoCD LoadBalancer IP (this may take a minute)..."
sleep 30
ARGOCD_IP=""
for i in {1..30}; do
    ARGOCD_IP=$(kubectl get svc argocd-server -n argocd -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    if [ ! -z "$ARGOCD_IP" ]; then
        break
    fi
    echo "Waiting for IP assignment... ($i/30)"
    sleep 10
done

if [ -z "$ARGOCD_IP" ]; then
    print_warning "LoadBalancer IP not assigned yet. Check with: kubectl get svc argocd-server -n argocd"
else
    print_success "ArgoCD LoadBalancer IP: $ARGOCD_IP"
fi

# Apply BookStore ArgoCD configurations
print_status "Applying BookStore ArgoCD configurations..."

if [ -f "argoCD/argocd-project.yaml" ]; then
    kubectl apply -f argoCD/argocd-project.yaml
    print_success "Applied ArgoCD project configuration"
fi

if [ -f "argoCD/argocd-bookstore-app.yaml" ]; then
    kubectl apply -f argoCD/argocd-bookstore-app.yaml
    print_success "Applied main BookStore application configuration"
fi

if [ -f "argoCD/argocd-environments.yaml" ]; then
    kubectl apply -f argoCD/argocd-environments.yaml
    print_success "Applied environment-specific application configurations"
fi

if [ -f "argoCD/argocd-applicationset.yaml" ]; then
    kubectl apply -f argoCD/argocd-applicationset.yaml 2>/dev/null || print_warning "ApplicationSet not applied"
fi

echo ""
echo "✅ =============================="
echo "✅ GKE Setup Complete!"
echo "✅ =============================="
echo ""
echo "📋 Cluster Information:"
echo "  Project: $PROJECT_ID"
echo "  Cluster: $CLUSTER_NAME"
echo "  Zone: $ZONE"
echo ""
echo "🎉 ArgoCD Access Information:"
if [ ! -z "$ARGOCD_IP" ]; then
    echo "  ArgoCD UI: https://$ARGOCD_IP (or http://$ARGOCD_IP:80)"
else
    echo "  ArgoCD UI: Get IP with 'kubectl get svc argocd-server -n argocd'"
fi
echo "  Username: admin"
echo "  Password: $ARGOCD_PASSWORD"
echo ""
echo "🔧 Useful Commands:"
echo "# Get cluster credentials (for future use)"
echo "gcloud container clusters get-credentials $CLUSTER_NAME --zone=$ZONE"
echo ""
echo "# View all pods"
echo "kubectl get pods -A"
echo ""
echo "# View ArgoCD applications"
echo "kubectl get applications -n argocd"
echo ""
echo "# Port-forward ArgoCD (alternative access)"
echo "kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo ""
echo "# Delete cluster (when done)"
echo "gcloud container clusters delete $CLUSTER_NAME --zone=$ZONE"
echo ""
print_success "Setup complete! 🚀"
