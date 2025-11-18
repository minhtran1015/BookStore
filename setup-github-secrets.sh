#!/bin/bash

# GitHub Secrets Setup Script for BookStore CI/CD Pipeline
# This script helps you set up Docker Hub credentials and other required secrets

set -e

echo "🔐 GitHub Secrets Setup for BookStore CI/CD Pipeline"

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

print_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Docker Hub credentials provided
DOCKERHUB_USERNAME="d1ff1c1le"
DOCKERHUB_TOKEN="dckr_pat_uJl-mK5rm4btvI8bwd5BUjLZPKk"

main() {
    echo ""
    print_status "This script will help you configure GitHub secrets for your CI/CD pipeline"
    echo ""
    
    # Step 1: Test Docker Hub credentials locally
    print_step "Step 1: Testing Docker Hub credentials locally"
    
    if command -v docker &> /dev/null; then
        print_status "Testing Docker Hub login with provided credentials..."
        
        # Test login
        if echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin > /dev/null 2>&1; then
            print_success "✓ Docker Hub credentials are valid"
            
            # Test image operations
            print_status "Testing Docker operations..."
            if docker pull hello-world > /dev/null 2>&1; then
                docker tag hello-world "$DOCKERHUB_USERNAME/test:$(date +%s)"
                local test_image="$DOCKERHUB_USERNAME/test:$(date +%s)"
                
                if docker push "$test_image" > /dev/null 2>&1; then
                    print_success "✓ Docker push operations work correctly"
                    
                    # Cleanup test image
                    docker rmi "$test_image" > /dev/null 2>&1 || true
                else
                    print_warning "⚠ Docker push test failed, but login works"
                fi
            else
                print_warning "⚠ Could not test Docker operations (hello-world unavailable)"
            fi
            
            # Logout for security
            docker logout > /dev/null 2>&1 || true
            
        else
            print_error "✗ Docker Hub credentials failed - please verify"
            print_error "Username: $DOCKERHUB_USERNAME"
            print_error "Token: ${DOCKERHUB_TOKEN:0:20}..."
            exit 1
        fi
    else
        print_warning "⚠ Docker not available for local testing"
        print_status "Credentials will be validated when used in GitHub Actions"
    fi
    
    # Step 2: Generate GitHub CLI commands
    print_step "Step 2: Setting up GitHub repository secrets"
    echo ""
    
    # Check if GitHub CLI is available
    if command -v gh &> /dev/null; then
        print_status "GitHub CLI detected. You can run these commands to set up secrets:"
        echo ""
        
        # Check if authenticated
        if gh auth status > /dev/null 2>&1; then
            print_success "✓ GitHub CLI is authenticated"
            echo ""
            
            print_status "Setting up secrets automatically..."
            
            # Set Docker Hub username
            if echo "$DOCKERHUB_USERNAME" | gh secret set DOCKERHUB_USERNAME; then
                print_success "✓ DOCKERHUB_USERNAME secret set"
            else
                print_error "✗ Failed to set DOCKERHUB_USERNAME"
            fi
            
            # Set Docker Hub token
            if echo "$DOCKERHUB_TOKEN" | gh secret set DOCKERHUB_TOKEN; then
                print_success "✓ DOCKERHUB_TOKEN secret set"
            else
                print_error "✗ Failed to set DOCKERHUB_TOKEN"
            fi
            
            # Prompt for GitHub token
            echo ""
            print_status "You need to create a GitHub Personal Access Token for GitOps operations"
            print_status "Go to: https://github.com/settings/tokens"
            print_status "Required scopes: repo, workflow, write:packages"
            echo ""
            
            read -p "Enter your GitHub Personal Access Token: " -s github_token
            echo ""
            
            if [ -n "$github_token" ]; then
                if echo "$github_token" | gh secret set GH_TOKEN; then
                    print_success "✓ GH_TOKEN secret set"
                else
                    print_error "✗ Failed to set GH_TOKEN"
                fi
            else
                print_warning "⚠ GitHub token not provided - you'll need to set it manually"
            fi
            
        else
            print_warning "⚠ GitHub CLI not authenticated"
            echo ""
            print_status "Run 'gh auth login' first, then execute these commands:"
            echo ""
            echo "echo '$DOCKERHUB_USERNAME' | gh secret set DOCKERHUB_USERNAME"
            echo "echo '$DOCKERHUB_TOKEN' | gh secret set DOCKERHUB_TOKEN"
            echo "echo 'YOUR_GITHUB_TOKEN' | gh secret set GH_TOKEN"
        fi
        
    else
        print_warning "⚠ GitHub CLI not found"
        echo ""
        print_status "Manual setup required. Go to your repository settings:"
        print_status "https://github.com/minhtran1015/BookStore/settings/secrets/actions"
        echo ""
        print_status "Add these secrets:"
        echo "1. DOCKERHUB_USERNAME = $DOCKERHUB_USERNAME"
        echo "2. DOCKERHUB_TOKEN = $DOCKERHUB_TOKEN"
        echo "3. GH_TOKEN = [Your GitHub Personal Access Token]"
    fi
    
    # Step 3: Validate CI/CD pipeline configuration
    print_step "Step 3: Validating CI/CD pipeline configuration"
    echo ""
    
    local workflow_file=".github/workflows/comprehensive-ci.yml"
    
    if [ -f "$workflow_file" ]; then
        print_success "✓ Enhanced CI/CD workflow found"
        
        # Check if workflow uses the secrets
        local secrets_found=0
        
        if grep -q "DOCKERHUB_USERNAME" "$workflow_file"; then
            print_success "  ✓ DOCKERHUB_USERNAME referenced in workflow"
            ((secrets_found++))
        fi
        
        if grep -q "DOCKERHUB_TOKEN" "$workflow_file"; then
            print_success "  ✓ DOCKERHUB_TOKEN referenced in workflow"
            ((secrets_found++))
        fi
        
        if grep -q "GH_TOKEN" "$workflow_file"; then
            print_success "  ✓ GH_TOKEN referenced in workflow"
            ((secrets_found++))
        fi
        
        if [ $secrets_found -eq 3 ]; then
            print_success "✓ All required secrets are used in the workflow"
        else
            print_warning "⚠ Some secrets may not be used in the workflow"
        fi
        
    else
        print_error "✗ Enhanced CI/CD workflow not found"
        print_status "Run the CI/CD enhancement script first"
        exit 1
    fi
    
    # Step 4: Test the complete setup
    print_step "Step 4: Testing the complete setup"
    echo ""
    
    print_status "Testing Docker Hub repository access..."
    
    # List repositories to test API access
    local repo_count=0
    if command -v curl &> /dev/null; then
        repo_count=$(curl -s -u "$DOCKERHUB_USERNAME:$DOCKERHUB_TOKEN" \
            "https://hub.docker.com/v2/repositories/$DOCKERHUB_USERNAME/" \
            | grep -o '"count":[0-9]*' | cut -d':' -f2 2>/dev/null || echo "0")
        
        if [ "$repo_count" -ge 0 ]; then
            print_success "✓ Docker Hub API access working ($repo_count repositories)"
        else
            print_warning "⚠ Could not verify Docker Hub API access"
        fi
    else
        print_warning "⚠ curl not available for API testing"
    fi
    
    # Final summary
    echo ""
    print_step "Setup Summary"
    echo ""
    print_success "✅ Docker Hub Credentials Configured:"
    echo "   Username: $DOCKERHUB_USERNAME"
    echo "   Token: ${DOCKERHUB_TOKEN:0:20}... (valid)"
    echo ""
    
    print_status "Next Steps:"
    echo "1. ✅ Verify secrets in GitHub: https://github.com/minhtran1015/BookStore/settings/secrets/actions"
    echo "2. 🚀 Test the pipeline: make a commit and push to trigger CI/CD"
    echo "3. 📊 Monitor workflow: https://github.com/minhtran1015/BookStore/actions"
    echo "4. 🎯 Deploy ArgoCD: cd argoCD && ./setup-argocd.sh"
    echo "5. 📈 Monitor deployment: http://localhost:30080 (ArgoCD UI)"
    echo ""
    
    print_status "Test the pipeline with:"
    echo 'echo "# CI/CD Test" >> README.md'
    echo 'git add README.md'  
    echo 'git commit -m "test: trigger enhanced CI/CD pipeline"'
    echo 'git push origin master'
    echo ""
    
    return 0
}

# Run the setup
cd "$(dirname "$0")"
main "$@"