# GitHub Secrets Setup for CI/CD Pipeline

## Overview

This guide explains how to set up GitHub repository secrets for the CI/CD pipeline. All secrets are now centrally managed in the `.env` file for local development.

## Prerequisites

1. Copy `.env.example` to `.env` and fill in your actual credentials:
   ```bash
   cp .env.example .env
   # Edit .env with your real values
   ```

2. Use the `load_env.sh` script to load environment variables:
   ```bash
   ./load_env.sh
   ```

## Required GitHub Secrets

The CI/CD pipeline requires the following secrets to be configured in GitHub:

### 1. DOCKERHUB_USERNAME
- **Name**: `DOCKERHUB_USERNAME`
- **Value**: Your Docker Hub username (from `.env` file: `DOCKERHUB_USERNAME`)

### 2. DOCKERHUB_TOKEN
- **Name**: `DOCKERHUB_TOKEN`
- **Value**: Your Docker Hub personal access token (from `.env` file: `DOCKERHUB_TOKEN`)

### 3. GH_TOKEN (Optional - for GitOps)
- **Name**: `GH_TOKEN`
- **Value**: GitHub Personal Access Token with `repo` permissions (from `.env` file: `GH_TOKEN`)

## Step-by-Step Setup

### 1. Navigate to Repository Settings

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click on **Secrets and variables** → **Actions**

### 2. Add Docker Hub Secrets

Click **New repository secret** for each of the following:

#### Secret 1: DOCKERHUB_USERNAME
- **Name**: `DOCKERHUB_USERNAME`
- **Secret**: Copy the value from your `.env` file (`DOCKERHUB_USERNAME`)
- Click **Add secret**

#### Secret 2: DOCKERHUB_TOKEN
- **Name**: `DOCKERHUB_TOKEN`
- **Secret**: Copy the value from your `.env` file (`DOCKERHUB_TOKEN`)
- Click **Add secret**

#### Secret 3: GH_TOKEN (Optional)
- **Name**: `GH_TOKEN`
- **Secret**: Copy the value from your `.env` file (`GH_TOKEN`)
- Click **Add secret**

## Environment Protection (Optional but Recommended)

### 3. Create GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click **Generate new token (classic)**
3. Set expiration and select these scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
   - `write:packages` (Write packages to GitHub Package Registry)
4. Generate and copy the token

#### Secret 3: GH_TOKEN
- **Name**: `GH_TOKEN`
- **Secret**: `[Your generated GitHub token]`
- Click **Add secret**

## Environment Protection (Optional but Recommended)

### 1. Set up Development Environment
1. Go to **Settings** → **Environments**
2. Click **New environment**
3. Name: `development`
4. Configure deployment protection rules if needed

### 2. Set up Production Environment
1. Click **New environment**
2. Name: `production`
3. Enable **Required reviewers** and add yourself
4. Set **Wait timer** to 5 minutes (optional)

## Verification

After setting up the secrets, you can verify the configuration by:

1. **Check Secrets**: Go to Settings → Secrets and variables → Actions
   - You should see: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `GH_TOKEN`

2. **Test the Pipeline**: 
   ```bash
   # Make a small change and push to trigger CI/CD
   echo "# CI/CD Test" >> README.md
   git add README.md
   git commit -m "test: trigger CI/CD pipeline"
   git push origin master
   ```

3. **Monitor Workflow**: 
   - Go to **Actions** tab in your repository
   - Watch the workflow execution with all 9 jobs

## Security Best Practices

### Docker Hub Token Security
- ✅ Use Docker Hub Personal Access Tokens (not passwords)
- ✅ Set token permissions to minimum required (Read, Write, Delete for repositories)
- ✅ Regularly rotate tokens (every 90 days recommended)
- ✅ Monitor token usage in Docker Hub dashboard

### GitHub Token Security  
- ✅ Use fine-grained personal access tokens when possible
- ✅ Set appropriate expiration dates
- ✅ Limit token scope to specific repositories
- ✅ Enable token expiration notifications

### Repository Secrets
- ✅ Never commit secrets to code
- ✅ Use environment-specific secrets when needed
- ✅ Regularly audit secret usage
- ✅ Remove unused secrets promptly

## Troubleshooting

### Common Issues

**Docker Login Fails**
```
Error: Error response from daemon: unauthorized: incorrect username or password
```
**Solution**: Verify DOCKERHUB_USERNAME and DOCKERHUB_TOKEN are correct

**Push Permission Denied**
```
Error: denied: requested access to the resource is denied
```
**Solution**: Ensure Docker Hub token has Write permissions for repositories

**GitHub API Rate Limit**
```
Error: API rate limit exceeded
```
**Solution**: Ensure GH_TOKEN is properly configured and has correct permissions

### Testing Credentials Locally

You can test your Docker Hub credentials locally:

```bash
# Test Docker Hub login
echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin

# Test image push (if you have a test image)
docker tag hello-world $DOCKERHUB_USERNAME/test:latest
docker push $DOCKERHUB_USERNAME/test:latest

# Cleanup
docker rmi $DOCKERHUB_USERNAME/test:latest
```

## Next Steps

1. ✅ Configure all GitHub secrets
2. ✅ Set up environment protection rules
3. ✅ Test the pipeline with a commit
4. ✅ Deploy ArgoCD using: `cd argoCD && ./setup-argocd.sh`
5. ✅ Monitor the complete CI/CD flow

---

## Pipeline Flow with Your Credentials

Once configured, your CI/CD pipeline will:

1. **CI Phase** (GitHub Actions):
   - Build Java services with Maven
   - Build React frontend with npm
   - Run security scans and tests
   - Build Docker images
   - Login to Docker Hub using your credentials
   - Push images with tags like `$DOCKERHUB_USERNAME/bookstore-account-service:v20241117-abc123`

2. **CD Phase** (GitOps + ArgoCD):
   - Update Kubernetes manifests with new image tags
   - Commit changes to trigger ArgoCD sync
   - Deploy to development environment automatically
   - Deploy to production with manual approval

3. **Monitoring**:
   - Track deployments in ArgoCD UI
   - Monitor application health with Grafana dashboards
   - Distributed tracing with Zipkin

---

*Generated on $(date) for BookStore CI/CD Pipeline*