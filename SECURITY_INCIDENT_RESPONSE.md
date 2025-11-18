# 🚨 CRITICAL: GitHub Secret Exposure Response Plan

## IMMEDIATE ACTION REQUIRED

GitHub's secret scanning has detected an exposed Docker Hub Personal Access Token in your repository commits. This is a **CRITICAL SECURITY ISSUE** that requires immediate attention.

## 🔥 EXPOSED SECRET DETAILS

- **Type**: Docker Hub Personal Access Token
- **Value**: `dckr_pat_uJl-mK5rm4btvI8bwd5BUjLZPKk`
- **Files**: `GITHUB_SECRETS_SETUP.md`, `setup-github-secrets.sh`
- **Commits**: Multiple commits (ccefd89, 1e69bd8, and others)
- **Risk Level**: **CRITICAL** - Full Docker Hub account access

## ⚡ STEP-BY-STEP EMERGENCY RESPONSE

### 🔴 STEP 1: REVOKE THE EXPOSED TOKEN (DO THIS NOW!)

1. **Go to Docker Hub immediately**: https://hub.docker.com/settings/security
2. **Find the exposed token**: `dckr_pat_uJl-mK5rm4btvI8bwd5BUjLZPKk`
3. **Click "Revoke" or "Delete"** - This disables the token immediately
4. **Verify revocation** - The token should no longer appear in your active tokens

### 🟡 STEP 2: GENERATE NEW TOKEN

1. **Create new token**: Click "New Access Token" in Docker Hub
2. **Name it**: `BookStore-CI-CD-$(date +%Y%m%d)`
3. **Set permissions**: Read, Write, Delete (same as before)
4. **Copy the new token** - You'll need this for the next steps
5. **Store securely** - Don't paste it anywhere public!

### 🟠 STEP 3: UPDATE LOCAL ENVIRONMENT

```bash
# Update your .env file with the new token
cp .env .env.backup
sed -i '' 's/DOCKERHUB_TOKEN=.*/DOCKERHUB_TOKEN=YOUR_NEW_TOKEN_HERE/' .env

# Verify the change
grep DOCKERHUB_TOKEN .env
```

### 🟢 STEP 4: UPDATE GITHUB SECRETS

1. **Go to GitHub Secrets**: https://github.com/minhtran1015/BookStore/settings/secrets/actions
2. **Click on DOCKERHUB_TOKEN**
3. **Click "Update"**
4. **Paste your new token**
5. **Click "Update secret"**

### 🔵 STEP 5: CLEAN GIT HISTORY (CRITICAL!)

The exposed secret is still in your Git history. Run our cleanup script:

```bash
# Run the automated cleanup script
./cleanup-secrets.sh

# Follow the prompts - this will:
# 1. Create a backup branch
# 2. Remove secrets from all commits
# 3. Force push the cleaned history
```

**Alternative manual cleanup** (if script doesn't work):

```bash
# Install git-filter-repo (recommended)
pip install git-filter-repo

# Or use homebrew on macOS
brew install git-filter-repo

# Remove the secret from all history
git filter-repo --replace-text <(echo 'dckr_pat_uJl-mK5rm4btvI8bwd5BUjLZPKk==>***REMOVED***')

# Force push the cleaned history
git push --force-with-lease --all origin
```

## 🛡️ VERIFICATION CHECKLIST

After completing all steps, verify:

- [ ] ✅ Old token is revoked in Docker Hub
- [ ] ✅ New token is working (test `docker login`)
- [ ] ✅ `.env` file has new token
- [ ] ✅ GitHub Secrets updated with new token
- [ ] ✅ Git history cleaned (no more secret alerts)
- [ ] ✅ CI/CD pipeline works with new token

## 🔍 TEST THE FIX

```bash
# Test local Docker operations
source load_env.sh
echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin

# Test CI/CD pipeline
git commit --allow-empty -m "test: verify CI/CD works after token rotation"
git push origin master

# Monitor the workflow
open "https://github.com/minhtran1015/BookStore/actions"
```

## 🚨 POTENTIAL IMPACT

**What an attacker could do with the exposed token:**

- ✅ **BLOCKED**: Pull your private images (you have public images)
- ⚠️  **RISK**: Push malicious images to your repositories  
- ⚠️  **RISK**: Delete your existing Docker images
- ⚠️  **RISK**: Access your Docker Hub account settings
- ⚠️  **RISK**: View your private repository statistics

**Immediate risks mitigated by revoking the token:**
- No unauthorized pushes to your Docker repositories
- No deletion of your existing images
- No access to account information

## 📊 MONITORING & PREVENTION

### Monitor for suspicious activity:

1. **Docker Hub**: Check https://hub.docker.com/settings/audit-log
2. **Check recent image pushes**: Look for unknown tags or repositories
3. **Monitor CI/CD**: Watch for failed authentications

### Prevention for the future:

1. **Never commit secrets** - Always use `.env` files
2. **Enable pre-commit hooks** - Scan for secrets before commit
3. **Regular token rotation** - Rotate tokens every 90 days
4. **Use GitHub's secret scanning** - Already enabled ✅
5. **Audit dependencies** - Check for secret exposure in dependencies

## 📞 EMERGENCY CONTACTS

If you suspect unauthorized access:

- **Docker Hub Support**: https://hub.docker.com/support/contact/
- **GitHub Security**: security@github.com
- **Immediate response**: Revoke all tokens, change passwords

## 🎯 NEXT STEPS AFTER RESOLUTION

1. **Document the incident** - What happened, when, and how it was resolved
2. **Update security practices** - Review processes that led to the exposure  
3. **Team training** - Ensure all contributors know about secret management
4. **Security audit** - Review other repositories for similar issues

---

## 📚 HELPFUL RESOURCES

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Docker Hub Access Tokens](https://docs.docker.com/security/for-developers/access-tokens/)
- [Git History Rewriting](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Security Best Practices](https://docs.github.com/en/code-security/getting-started/securing-your-repository)

---

**⏰ Time is critical! Complete Steps 1-2 immediately to prevent unauthorized access.**