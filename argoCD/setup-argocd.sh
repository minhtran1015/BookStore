#!/bin/bash

# BookStore ArgoCD Setup Script
# This script installs and configures ArgoCD for the BookStore application

set -e

echo "🚀 Setting up ArgoCD for BookStore Application..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot access Kubernetes cluster. Please ensure your kubeconfig is set up correctly."
    exit 1
fi

print_success "Kubernetes cluster is accessible"

# Create argocd namespace
print_status "Creating ArgoCD namespace..."
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

# Install ArgoCD
print_status "Installing ArgoCD..."
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
print_status "Waiting for ArgoCD to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd
kubectl wait --for=condition=available --timeout=300s deployment/argocd-repo-server -n argocd
kubectl wait --for=condition=available --timeout=300s deployment/argocd-application-controller -n argocd

print_success "ArgoCD installation completed"

# Get ArgoCD admin password
print_status "Retrieving ArgoCD admin password..."
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)

# Patch ArgoCD server service to use NodePort (for local testing)
print_status "Configuring ArgoCD server service..."
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "NodePort", "ports": [{"port": 443, "targetPort": 8080, "nodePort": 30080}]}}'

# Apply BookStore ArgoCD configurations
print_status "Applying BookStore ArgoCD configurations..."

# Apply project configuration
if [ -f "argoCD/argocd-project.yaml" ]; then
    kubectl apply -f argoCD/argocd-project.yaml
    print_success "Applied ArgoCD project configuration"
else
    print_warning "argocd-project.yaml not found, skipping..."
fi

# Apply main application
if [ -f "argoCD/argocd-bookstore-app.yaml" ]; then
    kubectl apply -f argoCD/argocd-bookstore-app.yaml
    print_success "Applied main BookStore application configuration"
else
    print_warning "argocd-bookstore-app.yaml not found, skipping..."
fi

# Apply environment-specific applications
if [ -f "argoCD/argocd-environments.yaml" ]; then
    kubectl apply -f argoCD/argocd-environments.yaml
    print_success "Applied environment-specific application configurations"
else
    print_warning "argocd-environments.yaml not found, skipping..."
fi

# Apply ApplicationSet (if supported by ArgoCD version)
if [ -f "argoCD/argocd-applicationset.yaml" ]; then
    kubectl apply -f argoCD/argocd-applicationset.yaml 2>/dev/null || print_warning "ApplicationSet not supported or failed to apply"
fi

print_success "ArgoCD setup completed successfully!"

echo ""
echo "🎉 ArgoCD Access Information:"
echo "================================"
echo "ArgoCD UI URL: https://localhost:30080 (or your-node-ip:30080)"
echo "Username: admin"
echo "Password: $ARGOCD_PASSWORD"
echo ""
echo "📋 Next Steps:"
echo "1. Access the ArgoCD UI using the credentials above"
echo "2. Verify that BookStore applications are visible"
echo "3. Sync the applications to deploy BookStore services"
echo "4. Monitor deployment status in the ArgoCD dashboard"
echo ""
echo "🔧 Useful Commands:"
echo "# Get ArgoCD server status"
echo "kubectl get pods -n argocd"
echo ""
echo "# Port forward ArgoCD UI (alternative access method)"
echo "kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo ""
echo "# Watch application sync status"
echo "kubectl get applications -n argocd -w"
echo ""
print_success "Setup complete! 🚀"