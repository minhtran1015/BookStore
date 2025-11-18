#!/bin/bash

# BookStore ArgoCD Comprehensive Test Suite
# Tests ArgoCD configuration and simulates deployment without requiring a full cluster

set -e

echo "🎯 BookStore ArgoCD Configuration Test Suite"

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

# Test 1: YAML Syntax Validation
test_yaml_syntax() {
    echo ""
    print_status "=== Test 1: YAML Syntax Validation ==="
    local errors=0
    
    local files=(
        "argocd-bookstore-app.yaml"
        "argocd-project.yaml" 
        "argocd-environments.yaml"
        "argocd-applicationset.yaml"
        "kind-cluster-config.yaml"
    )
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            if yq eval '.' "$file" > /dev/null 2>&1; then
                print_success "✓ $file - Valid YAML"
            else
                print_error "✗ $file - Invalid YAML"
                ((errors++))
            fi
        else
            print_warning "? $file - File not found"
        fi
    done
    
    if [ $errors -eq 0 ]; then
        print_success "All YAML files are syntactically valid"
        return 0
    else
        print_error "$errors YAML syntax errors found"
        return 1
    fi
}

# Test 2: ArgoCD API Version and Kind Validation  
test_argocd_spec() {
    echo ""
    print_status "=== Test 2: ArgoCD Specification Validation ==="
    local errors=0
    
    # Test main application
    if [ -f "argocd-bookstore-app.yaml" ]; then
        local api_version=$(yq eval '.apiVersion' argocd-bookstore-app.yaml)
        local kind=$(yq eval '.kind' argocd-bookstore-app.yaml)
        local repo_url=$(yq eval '.spec.source.repoURL' argocd-bookstore-app.yaml)
        
        if [[ "$api_version" == "argoproj.io/v1alpha1" ]]; then
            print_success "✓ Main app - Correct API version"
        else
            print_error "✗ Main app - Wrong API version: $api_version"
            ((errors++))
        fi
        
        if [[ "$kind" == "Application" ]]; then
            print_success "✓ Main app - Correct kind"
        else
            print_error "✗ Main app - Wrong kind: $kind"
            ((errors++))
        fi
        
        if [[ "$repo_url" == *"minhtran1015/BookStore"* ]]; then
            print_success "✓ Main app - Repository URL is correct"
        else
            print_error "✗ Main app - Repository URL needs verification: $repo_url"
            ((errors++))
        fi
    fi
    
    # Test project configuration
    if [ -f "argocd-project.yaml" ]; then
        local project_kind=$(yq eval '.kind' argocd-project.yaml)
        if [[ "$project_kind" == "AppProject" ]]; then
            print_success "✓ Project - Correct kind"
        else
            print_error "✗ Project - Wrong kind: $project_kind"
            ((errors++))
        fi
    fi
    
    if [ $errors -eq 0 ]; then
        print_success "All ArgoCD specifications are valid"
        return 0
    else
        print_error "$errors specification errors found"
        return 1
    fi
}

# Test 3: Repository Accessibility
test_repository_access() {
    echo ""
    print_status "=== Test 3: Repository Accessibility ==="
    
    local repo_url="https://github.com/minhtran1015/BookStore"
    print_status "Testing repository: $repo_url"
    
    if curl -s --head "$repo_url" | grep -q "200 OK"; then
        print_success "✓ Repository is publicly accessible"
        
        # Test if k8s directory exists in repo
        if curl -s "$repo_url/tree/master/k8s" | grep -q "k8s"; then
            print_success "✓ k8s directory exists in repository"
        else
            print_warning "⚠ Could not verify k8s directory in remote repository"
        fi
        
        return 0
    else
        print_warning "⚠ Repository accessibility could not be verified"
        return 1
    fi
}

# Test 4: Kubernetes Manifests Validation
test_k8s_manifests() {
    echo ""
    print_status "=== Test 4: Kubernetes Manifests Validation ==="
    
    if [ ! -d "../k8s" ]; then
        print_error "k8s directory not found"
        return 1
    fi
    
    local manifest_count=0
    local valid_manifests=0
    
    for manifest in ../k8s/*.yaml; do
        if [ -f "$manifest" ]; then
            ((manifest_count++))
            local filename=$(basename "$manifest")
            
            if yq eval '.' "$manifest" > /dev/null 2>&1; then
                local kind=$(yq eval '.kind' "$manifest" 2>/dev/null)
                local name=$(yq eval '.metadata.name' "$manifest" 2>/dev/null)
                print_success "  ✓ $filename ($kind: $name)"
                ((valid_manifests++))
            else
                print_error "  ✗ $filename - Invalid YAML"
            fi
        fi
    done
    
    print_status "Found $manifest_count manifests, $valid_manifests valid"
    
    if [ $valid_manifests -eq $manifest_count ] && [ $manifest_count -gt 0 ]; then
        print_success "All Kubernetes manifests are valid"
        return 0
    else
        print_error "Some Kubernetes manifests have issues"
        return 1
    fi
}

# Test 5: ArgoCD Configuration Best Practices
test_best_practices() {
    echo ""
    print_status "=== Test 5: Best Practices Validation ==="
    local warnings=0
    
    # Check for RBAC in project
    if grep -q "roles:" argocd-project.yaml 2>/dev/null; then
        print_success "✓ RBAC roles configured"
    else
        print_warning "⚠ Consider adding RBAC roles to project"
        ((warnings++))
    fi
    
    # Check for resource limits in manifests
    local has_limits=false
    for manifest in ../k8s/*.yaml; do
        if grep -q "resources:" "$manifest" 2>/dev/null; then
            has_limits=true
            break
        fi
    done
    
    if [ "$has_limits" = true ]; then
        print_success "✓ Resource limits found in manifests"
    else
        print_warning "⚠ Consider adding resource limits to deployments"
        ((warnings++))
    fi
    
    # Check for proper namespace configuration
    local namespaces=$(yq eval '.spec.destination.namespace' argocd-bookstore-app.yaml 2>/dev/null)
    if [[ "$namespaces" == "bookstore" ]]; then
        print_success "✓ Proper namespace configuration"
    else
        print_warning "⚠ Verify namespace configuration: $namespaces"
        ((warnings++))
    fi
    
    # Check for sync policies
    if grep -q "syncPolicy:" argocd-bookstore-app.yaml 2>/dev/null; then
        print_success "✓ Sync policies configured"
    else
        print_warning "⚠ Consider configuring sync policies"
        ((warnings++))
    fi
    
    if [ $warnings -eq 0 ]; then
        print_success "Configuration follows all best practices"
    else
        print_warning "Found $warnings best practice recommendations"
    fi
    
    return 0
}

# Test 6: Simulate ArgoCD Application Creation
test_application_simulation() {
    echo ""
    print_status "=== Test 6: ArgoCD Application Simulation ==="
    
    # Create temporary directory for simulation
    local temp_dir=$(mktemp -d)
    
    print_status "Simulating ArgoCD application creation..."
    
    # Extract application configurations
    local app_count=0
    
    # Count applications in files
    if [ -f "argocd-bookstore-app.yaml" ]; then
        ((app_count++))
        print_success "  ✓ Main application: bookstore-app"
    fi
    
    if [ -f "argocd-environments.yaml" ]; then
        local staging_count=$(yq eval '. | select(.metadata.name == "bookstore-staging") | length' argocd-environments.yaml 2>/dev/null || echo 0)
        local prod_count=$(yq eval '. | select(.metadata.name == "bookstore-production") | length' argocd-environments.yaml 2>/dev/null || echo 0)
        
        if [ "$staging_count" != "0" ]; then
            ((app_count++))
            print_success "  ✓ Staging application: bookstore-staging"
        fi
        
        if [ "$prod_count" != "0" ]; then
            ((app_count++))
            print_success "  ✓ Production application: bookstore-production"
        fi
    fi
    
    if [ -f "argocd-project.yaml" ]; then
        print_success "  ✓ Project configuration: bookstore-project"
    fi
    
    print_status "Simulation complete - $app_count applications would be created"
    
    # Cleanup
    rm -rf "$temp_dir"
    
    return 0
}

# Main test execution
main() {
    print_status "Starting BookStore ArgoCD Configuration Tests..."
    
    # Check if we're in the right directory
    if [ ! -f "argocd-bookstore-app.yaml" ]; then
        print_error "ArgoCD configuration files not found. Please run from argoCD/ directory"
        exit 1
    fi
    
    local test_results=()
    
    # Run all tests
    if test_yaml_syntax; then
        test_results+=("✓ YAML Syntax")
    else
        test_results+=("✗ YAML Syntax")
    fi
    
    if test_argocd_spec; then
        test_results+=("✓ ArgoCD Spec") 
    else
        test_results+=("✗ ArgoCD Spec")
    fi
    
    if test_repository_access; then
        test_results+=("✓ Repository Access")
    else
        test_results+=("⚠ Repository Access")
    fi
    
    if test_k8s_manifests; then
        test_results+=("✓ K8s Manifests")
    else
        test_results+=("✗ K8s Manifests")
    fi
    
    test_best_practices
    test_results+=("✓ Best Practices Check")
    
    test_application_simulation
    test_results+=("✓ Application Simulation")
    
    # Print final summary
    echo ""
    print_status "=== Test Summary ==="
    for result in "${test_results[@]}"; do
        echo "  $result"
    done
    
    echo ""
    
    # Count failures
    local failures=$(printf '%s\n' "${test_results[@]}" | grep -c "✗" || true)
    
    if [ $failures -eq 0 ]; then
        print_success "🎉 All tests passed! ArgoCD configuration is ready for deployment."
        echo ""
        print_status "Next steps:"
        echo "1. Run './test-argocd-setup.sh' to test with local Kubernetes cluster"
        echo "2. Or run './setup-argocd.sh' on your existing cluster"
        echo "3. Access ArgoCD UI and sync your applications"
        echo ""
        return 0
    else
        print_error "❌ $failures test(s) failed. Please address issues before deployment."
        return 1
    fi
}

# Run tests
cd "$(dirname "$0")"
main "$@"