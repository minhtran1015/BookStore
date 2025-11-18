#!/bin/bash

# 🚨 CRITICAL: GitHub Secret Leak Cleanup Script
# This script helps you clean up exposed secrets from Git history

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${RED}🚨 CRITICAL SECURITY ALERT: Secret Exposure Detected${NC}"
echo ""
echo -e "${YELLOW}GitHub has detected exposed secrets in your commit history!${NC}"
echo "This is a serious security issue that needs immediate attention."
echo ""

echo -e "${BLUE}📋 Exposed Secret Details:${NC}"
echo "• Type: Docker Personal Access Token"
echo "• Value: dckr_pat_uJl-mK5rm4btvI8bwd5BUjLZPKk"
echo "• Files: GITHUB_SECRETS_SETUP.md, setup-github-secrets.sh"
echo "• Commits: Multiple commits (ccefd89, 1e69bd8, etc.)"
echo ""

echo -e "${RED}⚠️  IMMEDIATE ACTIONS REQUIRED:${NC}"
echo ""

echo -e "${PURPLE}1. REVOKE THE EXPOSED TOKEN IMMEDIATELY:${NC}"
echo "   → Go to Docker Hub: https://hub.docker.com/settings/security"
echo "   → Find token: dckr_pat_uJl-mK5rm4btvI8bwd5BUjLZPKk"
echo "   → Click 'Revoke' or 'Delete'"
echo ""

echo -e "${PURPLE}2. GENERATE A NEW TOKEN:${NC}"
echo "   → Go to Docker Hub: https://hub.docker.com/settings/security"
echo "   → Click 'New Access Token'"
echo "   → Name it 'BookStore-CI-CD-$(date +%Y%m%d)'"
echo "   → Copy the new token"
echo ""

echo -e "${PURPLE}3. UPDATE YOUR .env FILE:${NC}"
echo "   → Open your .env file"
echo "   → Replace DOCKERHUB_TOKEN with the new token"
echo "   → Save the file"
echo ""

echo -e "${PURPLE}4. UPDATE GITHUB SECRETS:${NC}"
echo "   → Go to: https://github.com/minhtran1015/BookStore/settings/secrets/actions"
echo "   → Update DOCKERHUB_TOKEN with the new value"
echo ""

echo -e "${PURPLE}5. CLEAN UP GIT HISTORY (CRITICAL):${NC}"
echo ""

read -p "Have you completed steps 1-4? (y/N): " -r
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Please complete steps 1-4 first, then run this script again.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🧹 Cleaning up Git history...${NC}"

# Check if we have uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}❌ You have uncommitted changes. Please commit or stash them first.${NC}"
    git status --porcelain
    exit 1
fi

# Create backup branch
echo -e "${BLUE}📱 Creating backup branch...${NC}"
git branch secret-cleanup-backup-$(date +%Y%m%d-%H%M%S)

# Method 1: Use git filter-repo if available (recommended)
if command -v git-filter-repo >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Using git-filter-repo (recommended method)${NC}"
    
    # Create expressions file for filtering
    cat > /tmp/secret-expressions.txt << 'EOF'
dckr_pat_uJl-mK5rm4btvI8bwd5BUjLZPKk
DOCKERHUB_TOKEN="dckr_pat_uJl-mK5rm4btvI8bwd5BUjLZPKk"
DOCKERHUB_TOKEN=dckr_pat_uJl-mK5rm4btvI8bwd5BUjLZPKk
"dckr_pat_uJl-mK5rm4btvI8bwd5BUjLZPKk"
'dckr_pat_uJl-mK5rm4btvI8bwd5BUjLZPKk'
EOF

    # Filter out the secrets
    git filter-repo --replace-text /tmp/secret-expressions.txt --force
    
    # Cleanup temp file
    rm /tmp/secret-expressions.txt
    
elif command -v git >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Using git filter-branch (slower but works)${NC}"
    
    # Use git filter-branch to remove secrets
    git filter-branch --tree-filter '
        find . -name "*.md" -o -name "*.sh" -o -name "*.yml" -o -name "*.yaml" | xargs -I {} sed -i.bak -e "s/dckr_pat_uJl-mK5rm4btvI8bwd5BUjLZPKk/[REMOVED-TOKEN]/g" {} 2>/dev/null || true
        find . -name "*.bak" -delete 2>/dev/null || true
    ' --all
    
    # Clean up filter-branch refs
    git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
    
else
    echo -e "${RED}❌ Git not found. Cannot clean history.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Git history cleaned!${NC}"

echo ""
echo -e "${PURPLE}6. FORCE PUSH CHANGES (DANGEROUS):${NC}"
echo -e "${RED}⚠️  WARNING: This will rewrite history and may affect other contributors!${NC}"
echo ""

read -p "Are you sure you want to force push the cleaned history? (y/N): " -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🚀 Force pushing cleaned history...${NC}"
    
    # Force push to all branches
    git push --force-with-lease --all origin
    git push --force-with-lease --tags origin
    
    echo -e "${GREEN}✅ Force push completed!${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping force push. You'll need to do this manually:${NC}"
    echo "   git push --force-with-lease --all origin"
    echo "   git push --force-with-lease --tags origin"
fi

echo ""
echo -e "${GREEN}🎉 CLEANUP COMPLETE!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. ✅ Verify GitHub no longer shows secret alerts"
echo "2. ✅ Test your CI/CD pipeline with the new token"
echo "3. ✅ Monitor for any unauthorized Docker Hub usage"
echo "4. ✅ Consider enabling Docker Hub audit logs"
echo ""

echo -e "${YELLOW}📚 Prevention Tips:${NC}"
echo "• Always use .env files for secrets (already in .gitignore)"
echo "• Use git pre-commit hooks to scan for secrets"
echo "• Enable GitHub secret scanning (already enabled)"
echo "• Regular security audits of your repositories"
echo ""

echo -e "${GREEN}🔒 Your secrets are now safely removed from Git history!${NC}"