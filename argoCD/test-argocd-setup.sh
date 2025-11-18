#!/bin/bash

# BookStore ArgoCD Testing with Kind (Kubernetes in Docker)
set -e

echo "🚀 Setting up local Kubernetes cluster for ArgoCD testing..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if kind is installed
if ! command -v kind &> /dev/null; then
    print_status "Installing kind..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install kind
        else
            print_error "Please install Homebrew or kind manually from https://kind.sigs.k8s.io/docs/user/quick-start/"
            exit 1
        fi
    else
        # Linux
        curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
        chmod +x ./kind
        sudo mv ./kind /usr/local/bin/kind
    fi
    print_success "Kind installed successfully"
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    print_status "Installing kubectl..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install kubectl
        else
            curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/amd64/kubectl"
            chmod +x kubectl
            sudo mv kubectl /usr/local/bin/
        fi
    else
        # Linux
        curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
        chmod +x kubectl
        sudo mv kubectl /usr/local/bin/
    fi
    print_success "kubectl installed successfully"
fi

# Create kind cluster
CLUSTER_NAME="bookstore-argocd-test"

print_status "Creating kind cluster: $CLUSTER_NAME"
if kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
    print_warning "Cluster $CLUSTER_NAME already exists. Deleting and recreating..."
    kind delete cluster --name $CLUSTER_NAME
fi

kind create cluster --name $CLUSTER_NAME --config kind-cluster-config.yaml

print_success "Kind cluster created successfully"

# Wait for cluster to be ready
print_status "Waiting for cluster to be ready..."
kubectl wait --for=condition=Ready nodes --all --timeout=300s

print_success "Cluster is ready"

# Install ArgoCD
print_status "Installing ArgoCD..."

# Create argocd namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
print_status "Waiting for ArgoCD to be ready (this may take a few minutes)..."
kubectl wait --for=condition=available --timeout=600s deployment/argocd-server -n argocd
kubectl wait --for=condition=available --timeout=600s deployment/argocd-repo-server -n argocd
kubectl wait --for=condition=available --timeout=600s deployment/argocd-application-controller -n argocd

print_success "ArgoCD installation completed"

# Patch ArgoCD server service to use NodePort
print_status "Configuring ArgoCD server service..."
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "NodePort", "ports": [{"name": "https", "port": 443, "targetPort": 8080, "nodePort": 30080}]}}'

# Get ArgoCD admin password
print_status "Retrieving ArgoCD admin password..."
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)

# Apply BookStore ArgoCD configurations
print_status "Applying BookStore ArgoCD configurations..."

# Apply project configuration
kubectl apply -f argocd-project.yaml
print_success "Applied ArgoCD project configuration"

# Apply main application
kubectl apply -f argocd-bookstore-app.yaml
print_success "Applied main BookStore application configuration"

# Apply environment-specific applications (if they work with the cluster setup)
if kubectl apply -f argocd-environments.yaml 2>/dev/null; then
    print_success "Applied environment-specific application configurations"
else
    print_warning "Environment-specific applications may need manual configuration"
fi

print_success "ArgoCD setup completed successfully!"

echo ""
echo "🎉 ArgoCD Test Environment Ready!"
echo "=================================="
echo "Cluster: $CLUSTER_NAME"
echo "ArgoCD UI URL: http://localhost:30080"
echo "Username: admin"
echo "Password: $ARGOCD_PASSWORD"
echo ""
echo "📋 Test the Setup:"
echo "# Check ArgoCD pods"
echo "kubectl get pods -n argocd"
echo ""
echo "# Check BookStore applications"
echo "kubectl get applications -n argocd"
echo ""
echo "# Port forward ArgoCD UI (alternative access)"
echo "kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo ""
echo "🧪 Validate ArgoCD Applications:"
echo "1. Open http://localhost:30080 in your browser"
echo "2. Login with admin/$ARGOCD_PASSWORD"
echo "3. Verify BookStore applications are visible"
echo "4. Try syncing an application"
echo ""
echo "🧹 Cleanup (when done testing):"
echo "kind delete cluster --name $CLUSTER_NAME"
echo ""
print_success "Test environment ready! 🚀"