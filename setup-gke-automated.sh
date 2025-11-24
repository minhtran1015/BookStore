#!/bin/bash

# Fully Automated GKE Setup Script
# This script sets up everything without any prompts

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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🚀 Fully Automated BookStore GKE Setup"
echo "======================================="
echo ""

# Load configuration
CONFIG_FILE=".gke-config"

if [ ! -f "$CONFIG_FILE" ]; then
    print_error "Configuration file $CONFIG_FILE not found!"
    echo ""
    echo "Please create it from the example:"
    echo "  cp .gke-config.example .gke-config"
    echo "  nano .gke-config  # Edit with your values"
    exit 1
fi

print_status "Loading configuration from $CONFIG_FILE"
source "$CONFIG_FILE"

# Validate required variables
if [ -z "$GCP_PROJECT_ID" ]; then
    print_error "GCP_PROJECT_ID is not set in $CONFIG_FILE"
    exit 1
fi

# Set defaults
CLUSTER_NAME=${CLUSTER_NAME:-bookstore-cluster}
GCP_ZONE=${GCP_ZONE:-us-central1-a}
NUM_NODES=${NUM_NODES:-3}
MACHINE_TYPE=${MACHINE_TYPE:-e2-medium}
REGISTRY_TYPE=${REGISTRY_TYPE:-gcr}
USE_PREEMPTIBLE=${USE_PREEMPTIBLE:-false}

print_status "Configuration:"
echo "  Project ID: $GCP_PROJECT_ID"
echo "  Cluster: $CLUSTER_NAME"
echo "  Zone: $GCP_ZONE"
echo "  Nodes: $NUM_NODES x $MACHINE_TYPE"
echo "  Preemptible: $USE_PREEMPTIBLE"
echo "  Registry: $REGISTRY_TYPE"
echo ""

# Step 1: Authenticate with GCP (if needed)
print_status "Checking GCP authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    print_error "Not authenticated with GCP. Please run:"
    echo "  gcloud auth login"
    exit 1
fi
print_success "Authenticated with GCP"

# Step 2: Set GCP project
print_status "Setting GCP project to $GCP_PROJECT_ID..."
gcloud config set project $GCP_PROJECT_ID

# Step 3: Enable required APIs
print_status "Enabling required GCP APIs..."
gcloud services enable container.googleapis.com --quiet
gcloud services enable compute.googleapis.com --quiet
print_success "APIs enabled"

# Step 4: Check if cluster already exists
print_status "Checking if cluster already exists..."
if gcloud container clusters describe $CLUSTER_NAME --zone=$GCP_ZONE &>/dev/null; then
    print_status "Cluster $CLUSTER_NAME already exists. Skipping creation."
    print_status "Getting cluster credentials..."
    gcloud container clusters get-credentials $CLUSTER_NAME --zone=$GCP_ZONE
else
    # Step 5: Create GKE cluster
    print_status "Creating GKE cluster (this may take 5-10 minutes)..."
    
    # Build cluster creation command with optional preemptible flag
    CREATE_CMD="gcloud container clusters create $CLUSTER_NAME \
      --zone=$GCP_ZONE \
      --num-nodes=$NUM_NODES \
      --machine-type=$MACHINE_TYPE \
      --disk-size=30GB \
      --enable-autoscaling \
      --min-nodes=1 \
      --max-nodes=3 \
      --enable-autorepair \
      --enable-autoupgrade \
      --addons=HorizontalPodAutoscaling,HttpLoadBalancing \
      --workload-pool=$GCP_PROJECT_ID.svc.id.goog"
    
    # Add preemptible flag if enabled
    if [ "$USE_PREEMPTIBLE" = "true" ]; then
        print_status "Using preemptible nodes for cost savings (nodes can be shut down at any time)"
        CREATE_CMD="$CREATE_CMD --preemptible"
    fi
    
    CREATE_CMD="$CREATE_CMD --quiet"
    
    eval $CREATE_CMD

    print_success "GKE cluster created!"

    # Get credentials
    print_status "Getting cluster credentials..."
    gcloud container clusters get-credentials $CLUSTER_NAME --zone=$GCP_ZONE
fi

# Step 6: Create namespaces
print_status "Creating namespaces..."
kubectl create namespace bookstore --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
print_success "Namespaces created"

# Step 7: Check if ArgoCD is already installed
print_status "Checking if ArgoCD is installed..."
if kubectl get namespace argocd &>/dev/null && kubectl get deployment argocd-server -n argocd &>/dev/null; then
    print_status "ArgoCD already installed. Skipping installation."
else
    # Install ArgoCD
    print_status "Installing ArgoCD..."
    kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

    # Wait for ArgoCD to be ready
    print_status "Waiting for ArgoCD to be ready..."
    kubectl wait --for=condition=available --timeout=600s deployment/argocd-server -n argocd 2>/dev/null || true
    kubectl wait --for=condition=available --timeout=600s deployment/argocd-repo-server -n argocd 2>/dev/null || true
    print_success "ArgoCD installed"
fi

# Step 8: Get ArgoCD password
print_status "Retrieving ArgoCD admin password..."
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" 2>/dev/null | base64 -d || echo "")
if [ -z "$ARGOCD_PASSWORD" ]; then
    print_error "Could not retrieve ArgoCD password. It may have been changed."
    ARGOCD_PASSWORD="<password-not-available>"
fi

# Step 9: Expose ArgoCD server
print_status "Configuring ArgoCD LoadBalancer..."
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}' 2>/dev/null || true

# Step 10: Wait for LoadBalancer IP
print_status "Waiting for ArgoCD LoadBalancer IP..."
sleep 20
ARGOCD_IP=""
for i in {1..30}; do
    ARGOCD_IP=$(kubectl get svc argocd-server -n argocd -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
    if [ ! -z "$ARGOCD_IP" ]; then
        break
    fi
    sleep 10
done

# Step 11: Configure Docker for GCR (if using GCR)
if [ "$REGISTRY_TYPE" = "gcr" ]; then
    print_status "Configuring Docker for GCR..."
    gcloud auth configure-docker --quiet
    
    print_status "Updating image references to use GCR..."
    GCP_PROJECT_ID=$GCP_PROJECT_ID ./configure-gcr.sh
    print_success "GCR configured"
fi

# Step 12: Apply BookStore ArgoCD configurations
print_status "Applying BookStore ArgoCD configurations..."

if [ -f "argoCD/argocd-project.yaml" ]; then
    kubectl apply -f argoCD/argocd-project.yaml
    print_success "Applied ArgoCD project"
fi

if [ -f "argoCD/argocd-bookstore-app.yaml" ]; then
    kubectl apply -f argoCD/argocd-bookstore-app.yaml
    print_success "Applied BookStore application"
fi

if [ -f "argoCD/argocd-environments.yaml" ]; then
    kubectl apply -f argoCD/argocd-environments.yaml
    print_success "Applied environment configurations"
fi

# Step 13: Build and push Docker images (if requested)
if [ "$BUILD_IMAGES" = "true" ]; then
    print_status "Building and pushing Docker images..."
    if [ "$REGISTRY_TYPE" = "gcr" ]; then
        ./build_and_push.sh gcr
    else
        ./build_and_push.sh docker-hub
    fi
    print_success "Images built and pushed"
fi

echo ""
echo "✅ ========================================="
echo "✅ GKE Setup Complete!"
echo "✅ ========================================="
echo ""
echo "📋 Cluster Information:"
echo "  Project: $GCP_PROJECT_ID"
echo "  Cluster: $CLUSTER_NAME"
echo "  Zone: $GCP_ZONE"
echo "  Context: $(kubectl config current-context)"
echo ""
echo "🎉 ArgoCD Access:"
if [ ! -z "$ARGOCD_IP" ]; then
    echo "  URL: https://$ARGOCD_IP"
    echo "       (or http://$ARGOCD_IP:80)"
else
    echo "  URL: Get IP with 'kubectl get svc argocd-server -n argocd'"
fi
echo "  Username: admin"
echo "  Password: $ARGOCD_PASSWORD"
echo ""
echo "🔧 Useful Commands:"
echo "  # View all pods"
echo "  kubectl get pods -n bookstore"
echo ""
echo "  # View ArgoCD apps"
echo "  kubectl get applications -n argocd"
echo ""
echo "  # Port-forward ArgoCD (alternative)"
echo "  kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo ""
echo "  # Delete cluster (when done)"
echo "  gcloud container clusters delete $CLUSTER_NAME --zone=$GCP_ZONE --quiet"
echo ""

# Save credentials to file
cat > .gke-credentials <<EOF
# GKE Cluster Credentials
# Generated: $(date)

GCP_PROJECT_ID=$GCP_PROJECT_ID
CLUSTER_NAME=$CLUSTER_NAME
GCP_ZONE=$GCP_ZONE
ARGOCD_URL=${ARGOCD_IP:-"pending"}
ARGOCD_USERNAME=admin
ARGOCD_PASSWORD=$ARGOCD_PASSWORD
EOF

print_success "Credentials saved to .gke-credentials"
print_success "Setup complete! 🚀"
