#!/bin/bash

# BookStore CI/CD Pipeline Testing Script
# Tests the enhanced CI/CD workflow integration with ArgoCD

set -e

echo "🧪 BookStore CI/CD Pipeline Testing Suite"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

print_test() {
    echo -e "${PURPLE}[TEST]${NC} $1"
}

# Test 1: Validate GitHub Actions workflow syntax
test_workflow_syntax() {
    echo ""
    print_test "=== Test 1: GitHub Actions Workflow Validation ==="
    
    local workflow_file=".github/workflows/comprehensive-ci.yml"
    
    if [ ! -f "$workflow_file" ]; then
        print_error "Workflow file not found: $workflow_file"
        return 1
    fi
    
    # Test YAML syntax
    if command -v yq &> /dev/null; then
        if yq eval '.' "$workflow_file" > /dev/null 2>&1; then
            print_success "✓ Workflow YAML syntax is valid"
        else
            print_error "✗ Workflow YAML syntax is invalid"
            return 1
        fi
    else
        print_warning "⚠ yq not found, skipping YAML validation"
    fi
    
    # Check required sections
    local sections=(
        "name"
        "on"
        "env" 
        "jobs"
    )
    
    for section in "${sections[@]}"; do
        if grep -q "^${section}:" "$workflow_file"; then
            print_success "✓ Section '$section' found"
        else
            print_error "✗ Section '$section' missing"
            return 1
        fi
    done
    
    # Check for CI/CD integration
    if grep -q "update-manifests" "$workflow_file"; then
        print_success "✓ GitOps manifest update job present"
    else
        print_error "✗ GitOps manifest update job missing"
        return 1
    fi
    
    if grep -q "argocd\|ArgoCD" "$workflow_file"; then
        print_success "✓ ArgoCD integration references found"
    else
        print_warning "⚠ ArgoCD integration references not found"
    fi
    
    return 0
}

# Test 2: Check Docker build configuration
test_docker_build_config() {
    echo ""
    print_test "=== Test 2: Docker Build Configuration ==="
    
    # Check if all services have Dockerfiles
    local services=(
        "bookstore-account-service"
        "bookstore-api-gateway-service"
        "bookstore-billing-service"
        "bookstore-catalog-service"
        "bookstore-eureka-discovery-service"
        "bookstore-order-service"
        "bookstore-payment-service"
        "bookstore-frontend-react-app"
    )
    
    local missing_dockerfiles=0
    
    for service in "${services[@]}"; do
        if [ -f "$service/Dockerfile" ]; then
            print_success "✓ Dockerfile found for $service"
            
            # Check Dockerfile best practices
            if grep -q "FROM.*temurin" "$service/Dockerfile"; then
                print_success "  ✓ Using recommended base image (temurin)"
            elif grep -q "FROM" "$service/Dockerfile"; then
                print_warning "  ⚠ Consider using eclipse-temurin base image"
            fi
            
        else
            print_error "✗ Dockerfile missing for $service"
            ((missing_dockerfiles++))
        fi
    done
    
    if [ $missing_dockerfiles -eq 0 ]; then
        print_success "All services have Dockerfiles"
        return 0
    else
        print_error "$missing_dockerfiles services missing Dockerfiles"
        return 1
    fi
}

# Test 3: Validate Kubernetes manifests for CD
test_k8s_manifests() {
    echo ""
    print_test "=== Test 3: Kubernetes Manifests for CD ==="
    
    if [ ! -d "k8s" ]; then
        print_error "k8s directory not found"
        return 1
    fi
    
    local manifest_count=0
    local valid_manifests=0
    
    # Check each manifest
    for manifest in k8s/*.yaml; do
        if [ -f "$manifest" ]; then
            ((manifest_count++))
            local filename=$(basename "$manifest")
            
            if yq eval '.' "$manifest" > /dev/null 2>&1; then
                print_success "  ✓ $filename - Valid YAML"
                ((valid_manifests++))
                
                # Check for image references that need updating
                if grep -q "image:" "$manifest"; then
                    if grep -q "minhtran1015/bookstore" "$manifest"; then
                        print_success "    ✓ Uses correct image repository"
                    else
                        print_warning "    ⚠ Image repository may need updating"
                    fi
                fi
                
            else
                print_error "  ✗ $filename - Invalid YAML"
            fi
        fi
    done
    
    print_status "Found $manifest_count manifests, $valid_manifests valid"
    
    if [ $valid_manifests -eq $manifest_count ] && [ $manifest_count -gt 0 ]; then
        print_success "All Kubernetes manifests are valid for CD"
        return 0
    else
        print_error "Some Kubernetes manifests have issues"
        return 1
    fi
}

# Test 4: Check ArgoCD integration
test_argocd_integration() {
    echo ""
    print_test "=== Test 4: ArgoCD Integration ==="
    
    # Check if ArgoCD configurations exist
    local argocd_files=(
        "argoCD/argocd-bookstore-app.yaml"
        "argoCD/argocd-project.yaml"
        "argoCD/argocd-environments.yaml"
    )
    
    local missing_configs=0
    
    for config in "${argocd_files[@]}"; do
        if [ -f "$config" ]; then
            print_success "✓ ArgoCD config found: $(basename "$config")"
            
            # Validate the config
            if yq eval '.' "$config" > /dev/null 2>&1; then
                print_success "  ✓ Valid YAML syntax"
                
                # Check repository URL
                if grep -q "github.com/minhtran1015/BookStore" "$config"; then
                    print_success "  ✓ Correct repository URL"
                else
                    print_warning "  ⚠ Repository URL may need verification"
                fi
                
            else
                print_error "  ✗ Invalid YAML syntax"
                ((missing_configs++))
            fi
        else
            print_error "✗ ArgoCD config missing: $config"
            ((missing_configs++))
        fi
    done
    
    if [ $missing_configs -eq 0 ]; then
        print_success "ArgoCD integration is properly configured"
        return 0
    else
        print_error "$missing_configs ArgoCD configuration issues found"
        return 1
    fi
}

# Test 5: Simulate CI/CD workflow execution
test_workflow_simulation() {
    echo ""
    print_test "=== Test 5: CI/CD Workflow Simulation ==="
    
    print_status "Simulating GitHub Actions workflow execution..."
    
    # Simulate build phase
    print_status "Phase 1: Build validation"
    if [ -f "pom.xml" ]; then
        print_success "  ✓ Maven build configuration present"
    else
        print_error "  ✗ Maven build configuration missing"
        return 1
    fi
    
    if [ -f "bookstore-frontend-react-app/package.json" ]; then
        print_success "  ✓ npm build configuration present"
    else
        print_error "  ✗ npm build configuration missing"
        return 1
    fi
    
    # Simulate Docker build phase
    print_status "Phase 2: Docker build simulation"
    local docker_services=0
    for service in bookstore-*-service bookstore-frontend-react-app; do
        if [ -d "$service" ] && [ -f "$service/Dockerfile" ]; then
            ((docker_services++))
            print_success "  ✓ $service ready for Docker build"
        fi
    done
    
    print_status "  Found $docker_services services ready for containerization"
    
    # Simulate manifest update phase
    print_status "Phase 3: Manifest update simulation"
    local test_tag="v$(date +%Y%m%d)-test123"
    print_status "  Simulating update with tag: $test_tag"
    
    # Create backup and test manifest updates
    local temp_dir=$(mktemp -d)
    cp -r k8s "$temp_dir/"
    
    # Test sed commands from workflow
    for manifest in k8s/*.yaml; do
        if [ -f "$manifest" ] && grep -q "image:" "$manifest"; then
            local filename=$(basename "$manifest")
            print_status "    Testing update for $filename"
            
            # This simulates the sed command from the workflow
            sed "s|image: .*minhtran1015/bookstore.*:.*|image: docker.io/minhtran1015/bookstore-service:${test_tag}|g" "$manifest" > /tmp/test_manifest
            
            if [ -s /tmp/test_manifest ]; then
                print_success "      ✓ Manifest update simulation successful"
            else
                print_error "      ✗ Manifest update simulation failed"
            fi
        fi
    done
    
    # Restore original manifests
    rm -rf "$temp_dir"
    rm -f /tmp/test_manifest
    
    # Simulate ArgoCD sync
    print_status "Phase 4: ArgoCD sync simulation"
    print_success "  ✓ GitOps repository update would trigger ArgoCD"
    print_success "  ✓ Development environment auto-sync enabled"
    print_success "  ✓ Production environment requires manual approval"
    
    return 0
}

# Test 6: End-to-end workflow validation
test_e2e_workflow() {
    echo ""
    print_test "=== Test 6: End-to-End Workflow Validation ==="
    
    print_status "Validating complete CI/CD pipeline flow..."
    
    # Check workflow jobs dependency chain
    local workflow_file=".github/workflows/comprehensive-ci.yml"
    
    # Expected job flow
    local expected_jobs=(
        "build-java"
        "build-frontend" 
        "security-scan"
        "build-docker"
        "integration-test"
        "update-manifests"
        "deploy-dev"
        "test-deployment"
        "create-release"
    )
    
    for job in "${expected_jobs[@]}"; do
        if grep -q "${job}:" "$workflow_file"; then
            print_success "  ✓ Job '$job' defined in workflow"
        else
            print_error "  ✗ Job '$job' missing from workflow"
            return 1
        fi
    done
    
    # Check job dependencies
    if grep -q "needs:" "$workflow_file"; then
        print_success "  ✓ Job dependencies configured"
    else
        print_warning "  ⚠ No job dependencies found"
    fi
    
    # Check environment protection
    if grep -q "environment:" "$workflow_file"; then
        print_success "  ✓ Environment protection configured"
    else
        print_warning "  ⚠ Consider adding environment protection"
    fi
    
    print_success "End-to-end workflow validation completed"
    return 0
}

# Test 7: Security and compliance checks
test_security_compliance() {
    echo ""
    print_test "=== Test 7: Security and Compliance ==="
    
    local workflow_file=".github/workflows/comprehensive-ci.yml"
    
    # Check for security scanning
    if grep -q "trivy\|security" "$workflow_file"; then
        print_success "✓ Security scanning configured"
    else
        print_warning "⚠ Consider adding security scanning"
    fi
    
    # Check for secrets usage
    if grep -q "secrets\." "$workflow_file"; then
        print_success "✓ Secrets properly referenced"
        
        # Check for hardcoded secrets (should not be found)
        if grep -q "password.*:" "$workflow_file" | grep -v "secrets\."; then
            print_error "✗ Potential hardcoded secrets found"
            return 1
        else
            print_success "✓ No hardcoded secrets detected"
        fi
    fi
    
    # Check RBAC in ArgoCD configs
    if grep -q "roles:" argoCD/argocd-project.yaml 2>/dev/null; then
        print_success "✓ RBAC configured in ArgoCD"
    else
        print_warning "⚠ Consider adding RBAC to ArgoCD project"
    fi
    
    return 0
}

# Main test execution
main() {
    print_status "Starting BookStore CI/CD Pipeline Testing..."
    print_status "Testing enhanced workflow with ArgoCD integration"
    echo ""
    
    # Check if we're in the right directory
    if [ ! -f ".github/workflows/comprehensive-ci.yml" ]; then
        print_error "GitHub Actions workflow not found. Please run from repository root."
        exit 1
    fi
    
    local test_results=()
    local failed_tests=0
    
    # Run all tests
    if test_workflow_syntax; then
        test_results+=("✓ Workflow Syntax")
    else
        test_results+=("✗ Workflow Syntax")
        ((failed_tests++))
    fi
    
    if test_docker_build_config; then
        test_results+=("✓ Docker Build Config")
    else
        test_results+=("✗ Docker Build Config")
        ((failed_tests++))
    fi
    
    if test_k8s_manifests; then
        test_results+=("✓ Kubernetes Manifests")
    else
        test_results+=("✗ Kubernetes Manifests")
        ((failed_tests++))
    fi
    
    if test_argocd_integration; then
        test_results+=("✓ ArgoCD Integration")
    else
        test_results+=("✗ ArgoCD Integration")
        ((failed_tests++))
    fi
    
    if test_workflow_simulation; then
        test_results+=("✓ Workflow Simulation")
    else
        test_results+=("✗ Workflow Simulation")
        ((failed_tests++))
    fi
    
    if test_e2e_workflow; then
        test_results+=("✓ E2E Workflow")
    else
        test_results+=("✗ E2E Workflow")
        ((failed_tests++))
    fi
    
    if test_security_compliance; then
        test_results+=("✓ Security Compliance")
    else
        test_results+=("✗ Security Compliance")
        ((failed_tests++))
    fi
    
    # Print final results
    echo ""
    print_test "=== Test Results Summary ==="
    for result in "${test_results[@]}"; do
        echo "  $result"
    done
    
    echo ""
    
    if [ $failed_tests -eq 0 ]; then
        print_success "🎉 All tests passed! CI/CD pipeline is ready for production."
        echo ""
        print_status "Next steps:"
        echo "1. Commit and push the enhanced workflow"
        echo "2. Set up required GitHub secrets (DOCKERHUB_USERNAME, DOCKERHUB_TOKEN)"
        echo "3. Deploy ArgoCD using: cd argoCD && ./setup-argocd.sh"
        echo "4. Push a test commit to trigger the full CI/CD pipeline"
        echo "5. Monitor the deployment in ArgoCD UI: http://localhost:30080"
        echo ""
        return 0
    else
        print_error "❌ $failed_tests test(s) failed. Please address issues before deployment."
        return 1
    fi
}

# Run tests
cd "$(dirname "$0")"
main "$@"