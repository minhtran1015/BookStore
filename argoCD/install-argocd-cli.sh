#!/bin/bash

# ArgoCD CLI Installation and Configuration Script
set -e

echo "🔧 Installing and configuring ArgoCD CLI..."

# Colors
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

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=linux;;
    Darwin*)    MACHINE=darwin;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

if [ "$MACHINE" = "UNKNOWN:${OS}" ]; then
    print_warning "Unsupported OS: ${OS}. Please install ArgoCD CLI manually."
    exit 1
fi

# Install ArgoCD CLI
print_status "Installing ArgoCD CLI for ${MACHINE}..."

if [ "$MACHINE" = "darwin" ]; then
    # macOS installation
    if command -v brew &> /dev/null; then
        print_status "Installing via Homebrew..."
        brew install argocd
    else
        print_status "Installing via direct download..."
        curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-darwin-amd64
        chmod +x argocd
        sudo mv argocd /usr/local/bin/
    fi
else
    # Linux installation
    print_status "Installing via direct download..."
    curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
    chmod +x argocd
    sudo mv argocd /usr/local/bin/
fi

# Verify installation
if command -v argocd &> /dev/null; then
    print_success "ArgoCD CLI installed successfully"
    argocd version --client
else
    print_warning "ArgoCD CLI installation may have failed"
    exit 1
fi

print_status "ArgoCD CLI configuration completed"

echo ""
echo "🎯 ArgoCD CLI Usage Examples:"
echo "=============================="
echo "# Login to ArgoCD server"
echo "argocd login localhost:30080 --username admin --password <password> --insecure"
echo ""
echo "# List applications"
echo "argocd app list"
echo ""
echo "# Get application details"
echo "argocd app get bookstore-app"
echo ""
echo "# Sync application"
echo "argocd app sync bookstore-app"
echo ""
echo "# View application logs"
echo "argocd app logs bookstore-app"
echo ""
echo "# Set application parameters"
echo "argocd app set bookstore-app --parameter replicas=3"
echo ""

print_success "ArgoCD CLI ready for use! 🚀"