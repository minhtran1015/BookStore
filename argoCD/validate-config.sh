#!/bin/bash

# ArgoCD Configuration Validation Script
# Tests ArgoCD YAML configurations for syntax and best practices

set -e

echo "🔍 Validating ArgoCD Configuration Files..."

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

# Function to validate YAML syntax
validate_yaml() {
    local file=$1
    if command -v yq &> /dev/null; then
        if yq eval '.' "$file" > /dev/null 2>&1; then
            print_success "✓ $file - Valid YAML syntax"
            return 0
        else
            print_error "✗ $file - Invalid YAML syntax"
            return 1
        fi
    else
        # Fallback to python if yq not available
        if python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null; then
            print_success "✓ $file - Valid YAML syntax"
            return 0
        else
            print_error "✗ $file - Invalid YAML syntax"
            return 1
        fi
    fi
}

# Function to validate ArgoCD application
validate_application() {
    local file=$1
    local app_name=$(yq eval '.metadata.name' "$file" 2>/dev/null || echo "unknown")
    
    print_status "Validating ArgoCD Application: $app_name"
    
    # Check required fields
    local errors=0
    
    # Check apiVersion
    local api_version=$(yq eval '.apiVersion' "$file" 2>/dev/null)
    if [[ "$api_version" != "argoproj.io/v1alpha1" ]]; then
        print_error "  ✗ Invalid apiVersion: $api_version (expected: argoproj.io/v1alpha1)"
        ((errors++))
    fi
    
    # Check kind
    local kind=$(yq eval '.kind' "$file" 2>/dev/null)
    if [[ "$kind" != "Application" ]] && [[ "$kind" != "AppProject" ]] && [[ "$kind" != "ApplicationSet" ]]; then
        print_error "  ✗ Invalid kind: $kind"
        ((errors++))
    fi
    
    # Check source.repoURL for Applications
    if [[ "$kind" == "Application" ]] || [[ "$kind" == "ApplicationSet" ]]; then
        local repo_url=""
        if [[ "$kind" == "Application" ]]; then
            repo_url=$(yq eval '.spec.source.repoURL' "$file" 2>/dev/null)
        else
            repo_url=$(yq eval '.spec.template.spec.source.repoURL' "$file" 2>/dev/null)
        fi
        
        if [[ -z "$repo_url" ]] || [[ "$repo_url" == "null" ]]; then
            print_error "  ✗ Missing source.repoURL"
            ((errors++))
        elif [[ "$repo_url" == *"github.com/minhtran1015/BookStore"* ]]; then
            print_success "  ✓ Repository URL points to BookStore repo"
        else
            print_warning "  ⚠ Repository URL may need to be updated: $repo_url"
        fi
    fi
    
    # Check namespace
    local namespace=$(yq eval '.metadata.namespace' "$file" 2>/dev/null)
    if [[ "$namespace" != "argocd" ]]; then
        print_warning "  ⚠ Application not in argocd namespace: $namespace"
    fi
    
    if [ $errors -eq 0 ]; then
        print_success "  ✓ Application configuration is valid"
        return 0
    else
        print_error "  ✗ Found $errors error(s) in application configuration"
        return 1
    fi
}

# Function to check GitHub repository accessibility
check_repo_access() {
    local repo_url="https://github.com/minhtran1015/BookStore.git"
    print_status "Checking repository accessibility: $repo_url"
    
    if curl -s --head "$repo_url" | grep -q "200 OK"; then
        print_success "  ✓ Repository is accessible"
        return 0
    else
        print_warning "  ⚠ Repository may not be publicly accessible or URL needs verification"
        return 1
    fi
}

# Function to validate Kubernetes manifests in k8s directory
validate_k8s_manifests() {
    print_status "Validating Kubernetes manifests in k8s/ directory..."
    local manifest_errors=0
    
    if [ ! -d "../k8s" ]; then
        print_error "  ✗ k8s/ directory not found"
        return 1
    fi
    
    for manifest in ../k8s/*.yaml; do
        if [ -f "$manifest" ]; then
            local filename=$(basename "$manifest")
            if validate_yaml "$manifest"; then
                # Additional K8s-specific validation
                local kind=$(yq eval '.kind' "$manifest" 2>/dev/null)
                local name=$(yq eval '.metadata.name' "$manifest" 2>/dev/null)
                print_success "    ✓ $filename ($kind: $name)"
            else
                print_error "    ✗ $filename - Invalid"
                ((manifest_errors++))
            fi
        fi
    done
    
    if [ $manifest_errors -eq 0 ]; then
        print_success "  ✓ All Kubernetes manifests are valid"
        return 0
    else
        print_error "  ✗ Found $manifest_errors error(s) in Kubernetes manifests"
        return 1
    fi
}

# Main validation process
main() {
    print_status "Starting ArgoCD configuration validation..."
    local total_errors=0
    
    # Check if we're in the right directory
    if [ ! -f "argocd-bookstore-app.yaml" ]; then
        print_error "ArgoCD configuration files not found. Please run from argoCD/ directory"
        exit 1
    fi
    
    # Install yq if not available (for better YAML parsing)
    if ! command -v yq &> /dev/null; then
        print_warning "yq not found. Installing yq for better YAML validation..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if command -v brew &> /dev/null; then
                brew install yq
            else
                print_warning "Please install yq manually or install Homebrew"
            fi
        else
            print_warning "Please install yq manually: https://github.com/mikefarah/yq"
        fi
    fi
    
    echo ""
    print_status "=== YAML Syntax Validation ==="
    
    # Validate each configuration file
    local files=(
        "argocd-bookstore-app.yaml"
        "argocd-project.yaml"
        "argocd-environments.yaml"
        "argocd-applicationset.yaml"
        "kind-cluster-config.yaml"
    )
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            if ! validate_yaml "$file"; then
                ((total_errors++))
            fi
        else
            print_warning "File not found: $file"
        fi
    done
    
    echo ""
    print_status "=== ArgoCD Configuration Validation ==="
    
    # Validate ArgoCD-specific configurations
    local argocd_files=(
        "argocd-bookstore-app.yaml"
        "argocd-project.yaml"
        "argocd-environments.yaml"
        "argocd-applicationset.yaml"
    )
    
    for file in "${argocd_files[@]}"; do
        if [ -f "$file" ]; then
            if ! validate_application "$file"; then
                ((total_errors++))
            fi
        fi
    done
    
    echo ""
    print_status "=== Repository and Manifests Validation ==="
    
    # Check repository access
    check_repo_access
    
    # Validate Kubernetes manifests
    validate_k8s_manifests
    
    echo ""
    print_status "=== Configuration Best Practices Check ==="
    
    # Check for best practices
    local warnings=0
    
    # Check if production sync is manual
    if grep -q '"automated"' argocd-environments.yaml 2>/dev/null; then
        if grep -A 10 "bookstore-production" argocd-environments.yaml | grep -q "automated:"; then
            print_warning "  ⚠ Production environment has automated sync enabled - consider manual approval"
            ((warnings++))
        else
            print_success "  ✓ Production environment uses manual sync"
        fi
    fi
    
    # Check for proper RBAC configuration
    if grep -q "roles:" argocd-project.yaml 2>/dev/null; then
        print_success "  ✓ RBAC roles configured in project"
    else
        print_warning "  ⚠ No RBAC roles found in project configuration"
        ((warnings++))
    fi
    
    # Check for resource limits
    local has_limits=false
    for file in ../k8s/*.yaml; do
        if grep -q "resources:" "$file" 2>/dev/null; then
            has_limits=true
            break
        fi
    done
    
    if [ "$has_limits" = true ]; then
        print_success "  ✓ Resource limits found in Kubernetes manifests"
    else
        print_warning "  ⚠ Consider adding resource limits to Kubernetes manifests"
        ((warnings++))
    fi
    
    echo ""
    print_status "=== Validation Summary ==="
    
    if [ $total_errors -eq 0 ]; then
        print_success "✅ All ArgoCD configurations are valid!"
        if [ $warnings -gt 0 ]; then
            print_warning "Found $warnings warning(s) - consider addressing for production use"
        fi
        
        echo ""
        print_status "🚀 Next Steps:"
        echo "1. Run './test-argocd-setup.sh' to test with a local Kubernetes cluster"
        echo "2. Or run './setup-argocd.sh' if you have an existing cluster"
        echo "3. Access ArgoCD UI and verify applications are syncing correctly"
        
        return 0
    else
        print_error "❌ Found $total_errors error(s) in ArgoCD configurations"
        print_error "Please fix the errors before deploying to a cluster"
        return 1
    fi
}

# Run validation
cd "$(dirname "$0")"
main "$@"