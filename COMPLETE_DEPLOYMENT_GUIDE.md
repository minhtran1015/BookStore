# Complete Beginner's Guide: Deploy BookStore to Google Cloud with Domain

**🎯 Goal:** Deploy your BookStore application to Google Cloud Platform (GKE) with your custom domain `bookscar.store`, and learn how to turn it off to avoid charges.

**⏱️ Time Required:** 30-45 minutes  
**💰 Cost:** ~$5-10 for testing (can be free with $300 GCP credit)

---

## 📋 Table of Contents

1. [Before You Start](#before-you-start)
2. [Part 1: Google Cloud Setup](#part-1-google-cloud-setup)
3. [Part 2: Deploy to GKE](#part-2-deploy-to-gke)
4. [Part 3: Configure Domain](#part-3-configure-domain)
5. [Part 4: Verify Deployment](#part-4-verify-deployment)
6. [Part 5: Turn Off to Save Money](#part-5-turn-off-to-save-money)
7. [Cost Breakdown](#cost-breakdown)
8. [Troubleshooting](#troubleshooting)

---

## Before You Start

### What You Need

- ✅ Google account (Gmail account)
- ✅ Credit/debit card (for GCP verification - won't be charged if you stay in free tier)
- ✅ Domain `bookscar.store` (already purchased from GoDaddy)
- ✅ Windows computer with PowerShell
- ✅ About 30-45 minutes of time

### What You'll Get

- 🌐 Your BookStore app running on Google Cloud
- 🔒 HTTPS with SSL certificate (secure connection)
- 🌍 Accessible at `https://bookscar.store`
- 📊 Monitoring and management tools
- 💰 Ability to turn on/off to control costs

---

## Part 1: Google Cloud Setup

### Step 1.1: Create Google Cloud Account

1. **Go to Google Cloud Console**
   - Open: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Activate Free Trial** (if first time)
   - Click "Activate" or "Try for Free"
   - Enter your credit card details (required for verification)
   - You get **$300 free credits** valid for 90 days
   - You won't be charged unless you explicitly upgrade

3. **Create a New Project**
   - Click "Select a project" at the top
   - Click "New Project"
   - **Project name:** `bookstore-app` (or any name you like)
   - **Project ID:** Will be auto-generated (e.g., `bookstore-app-123456`)
   - **Note down your Project ID** - you'll need it later!
   - Click "Create"

### Step 1.2: Enable Billing

1. Go to: https://console.cloud.google.com/billing
2. Link your project to billing account
3. Verify your project is selected at the top

### Step 1.3: Install Google Cloud CLI

**For Windows:**

1. **Download Google Cloud SDK**
   - Go to: https://cloud.google.com/sdk/docs/install
   - Download the Windows installer
   - Run the installer (GoogleCloudSDKInstaller.exe)

2. **Run the Installer**
   - Check "Run 'gcloud init'" at the end
   - Click "Finish"

3. **Initialize gcloud**
   A PowerShell window will open. Follow the prompts:
   
   ```powershell
   # You'll be asked to login
   # Choose: Y (Yes)
   # Your browser will open - login with your Google account
   
   # Choose your project
   # Enter the number for your bookstore project
   
   # Choose default region
   # Enter: 14 (for us-central1)
   ```

4. **Verify Installation**
   Open a new PowerShell window and run:
   ```powershell
   gcloud --version
   ```
   You should see version information.

### Step 1.4: Install kubectl

In PowerShell, run:

```powershell
gcloud components install kubectl
```

Verify:
  --region=us-central1 `
  --project=$env:GCP_PROJECT_ID

# Get the IP address
gcloud compute addresses describe bookstore-static-ip `
  --region=us-central1 `
  --format="get(address)"
```

**📝 IMPORTANT:** Copy this IP address! You'll need it for DNS configuration.

### Step 3.2: Install cert-manager (for SSL)

```powershell
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.2/cert-manager.yaml

# Wait for cert-manager to be ready (takes 1-2 minutes)
kubectl wait --for=condition=Available --timeout=300s deployment/cert-manager -n cert-manager
```

### Step 3.3: Apply Domain Configuration

```powershell
# Apply cert-manager configuration
kubectl apply -f k8s/cert-manager-setup.yaml

# Apply updated Ingress with domain
kubectl apply -f k8s/ingress.yaml

# Check Ingress status
kubectl get ingress -n bookstore
```

### Step 3.4: Configure DNS in GoDaddy

1. **Go to GoDaddy DNS Management**
   - Open: https://dcc.godaddy.com/manage/bookscar.store/dns
   - Sign in to your GoDaddy account

2. **Add A Record for Root Domain**
   - Click "Add" button
   - **Type:** A
   - **Name:** @ (this means root domain)
   - **Value:** Paste your static IP from Step 3.1
   - **TTL:** 600 seconds
   - Click "Save"

3. **Add A Record for WWW**
   - Click "Add" button again
   - **Type:** A
   - **Name:** www
   - **Value:** Same static IP as above
   - **TTL:** 600 seconds
   - Click "Save"

4. **Wait for DNS Propagation**
   - Usually takes 10-30 minutes
   - Can take up to 48 hours in rare cases

### Step 3.5: Verify DNS

```powershell
# Check if DNS is working
nslookup bookscar.store
nslookup www.bookscar.store

# You should see your static IP in the results
```

### Step 3.6: Wait for SSL Certificate

```powershell
# Check certificate status
kubectl get certificate -n bookstore

# Wait until you see: bookstore-tls   True
# This can take 5-10 minutes after DNS propagates

# If it's taking too long, check cert-manager logs:
kubectl logs -n cert-manager deployment/cert-manager --tail=50
```

---

## Part 4: Verify Deployment

### Step 4.1: Access Your Application

1. **Open your browser**
2. **Go to:** `https://bookscar.store`
3. **You should see:**
   - ✅ Your BookStore application
   - ✅ Green padlock (SSL certificate)
   - ✅ No security warnings

### Step 4.2: Test the Application

1. **Browse books** in the catalog
2. **Create an account** or login
3. **Add items to cart**
4. **Test checkout** (use test payment info)

### Step 4.3: Access Monitoring Tools

**ArgoCD (Deployment Management):**
```powershell
# Get ArgoCD URL
kubectl get svc argocd-server -n argocd

# Or port-forward to access locally
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Then open: https://localhost:8080
```

**Grafana (Monitoring):**
```powershell
kubectl port-forward svc/bookstore-graphana -n bookstore 3030:3000
# Then open: http://localhost:3030
# Username: admin, Password: admin
```

**Prometheus (Metrics):**
```powershell
kubectl port-forward svc/bookstore-prometheus -n bookstore 9090:9090
# Then open: http://localhost:9090
```

---

## Part 5: Turn Off to Save Money

### Option 1: Scale Down (Keeps cluster, no compute costs)

**When to use:** Short breaks (hours to days)

```powershell
# Scale all deployments to 0 replicas
kubectl scale deployment --all --replicas=0 -n bookstore

# Your cluster stays, but no pods are running
# Cost: ~$2-3/day for cluster management only
```

**To turn back on:**
```powershell
# Scale back up
kubectl scale deployment --all --replicas=1 -n bookstore
```

### Option 2: Delete Cluster (Complete shutdown)

**When to use:** Long breaks (weeks to months)

```powershell
# Delete the entire cluster
gcloud container clusters delete bookstore-cluster --zone=us-central1-a

# Confirm when prompted: Y

# Cost: $0/day
```

**To turn back on:**
```powershell
# Re-run the deployment script
bash gke-setup.sh

# Then reconfigure domain (Steps 3.3-3.6)
```

### Option 3: Pause Cluster (Not available in standard GKE)

GKE doesn't have a "pause" feature, so use Option 1 or 2.

### Important: Release Static IP (if deleting cluster)

```powershell
# Release the static IP to avoid charges
gcloud compute addresses delete bookstore-static-ip --region=us-central1

# Cost saved: ~$0.01/hour ($7/month)
```

---

## Cost Breakdown

### Monthly Costs (if running 24/7)

| Component | Cost/Month | Notes |
|-----------|------------|-------|
| **GKE Cluster Management** | $73 | Fixed cost for cluster |
| **2x e2-medium nodes** | ~$96 | 2 vCPUs, 4GB RAM each |
| **Static IP** | ~$7 | While reserved |
| **Load Balancer** | ~$18 | For Ingress |
| **Network Egress** | ~$5-10 | Data transfer out |
| **Persistent Disks** | ~$10 | For MySQL storage |
| **TOTAL** | **~$209/month** | If running continuously |

### Cost Optimization Strategies

1. **Use Free Credits**
   - $300 free for 90 days
   - Covers ~1.5 months of full operation

2. **Scale Down When Not Using**
   - Reduces to ~$80/month (just cluster + storage)

3. **Delete Cluster When Not Needed**
   - $0/month
   - Can redeploy anytime

4. **Use Smaller Nodes**
   - Change to `e2-small`: Saves ~$48/month
   - May be slower but works for testing

5. **Use Preemptible Nodes**
   - 80% cheaper but can be shut down anytime
   - Good for development/testing

### Recommended Approach for Students

1. **Deploy and test:** Use free credits
2. **Demo day:** Turn on cluster
3. **After demo:** Delete cluster
4. **Total cost:** $0 (within free credits)

---

## Troubleshooting

### Issue: "gcloud: command not found"

**Solution:**
```powershell
# Restart PowerShell
# Or add to PATH manually:
$env:Path += ";C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin"
```

### Issue: Pods stuck in "Pending" state

**Solution:**
```powershell
# Check pod details
kubectl describe pod <pod-name> -n bookstore

# Common causes:
# 1. Insufficient resources - scale down other pods
# 2. Image pull errors - check image names
# 3. Node not ready - wait a few minutes
```

### Issue: SSL Certificate not ready

**Solution:**
```powershell
# Check certificate status
kubectl describe certificate bookstore-tls -n bookstore

# Common causes:
# 1. DNS not propagated - wait longer
# 2. HTTP-01 challenge failed - check Ingress
# 3. Rate limit - wait 1 hour

# Force renewal:
kubectl delete certificate bookstore-tls -n bookstore
kubectl apply -f k8s/ingress.yaml
```

### Issue: "Insufficient quota" error

**Solution:**
1. Go to: https://console.cloud.google.com/iam-admin/quotas
2. Search for "CPUs" or "In-use IP addresses"
3. Request quota increase
4. Or use a different region

### Issue: Domain shows "404 Not Found"

**Solution:**
```powershell
# Check Ingress
kubectl describe ingress bookstore-ingress -n bookstore

# Check frontend service
kubectl get svc frontend-node-service -n bookstore

# Check frontend pods
kubectl get pods -n bookstore -l app=frontend

# Restart frontend
kubectl rollout restart deployment/frontend-deployment -n bookstore
```

### Issue: High costs

**Solution:**
```powershell
# Check current costs
# Go to: https://console.cloud.google.com/billing

# Scale down immediately
kubectl scale deployment --all --replicas=0 -n bookstore

# Or delete cluster
gcloud container clusters delete bookstore-cluster --zone=us-central1-a
```

---

## Quick Reference Commands

### Check Status
```powershell
# All pods
kubectl get pods -n bookstore

# All services
kubectl get svc -n bookstore

# Ingress
kubectl get ingress -n bookstore

# Certificates
kubectl get certificate -n bookstore
```

### View Logs
```powershell
# Specific pod
kubectl logs <pod-name> -n bookstore

# Follow logs
kubectl logs -f <pod-name> -n bookstore

# Previous crashed container
kubectl logs <pod-name> -n bookstore --previous
```

### Restart Services
```powershell
# Restart specific deployment
kubectl rollout restart deployment/<deployment-name> -n bookstore

# Restart all
kubectl rollout restart deployment --all -n bookstore
```

### Access Services Locally
```powershell
# Frontend
kubectl port-forward svc/frontend-node-service -n bookstore 3000:80

# API Gateway
kubectl port-forward svc/bookstore-zuul-api-gateway-server -n bookstore 8765:8765

# Grafana
kubectl port-forward svc/bookstore-graphana -n bookstore 3030:3000
```

---

## Next Steps

After successful deployment:

1. ✅ **Test thoroughly** - Try all features
2. ✅ **Set up monitoring** - Configure Grafana dashboards
3. ✅ **Configure backups** - For MySQL database
4. ✅ **Set up CI/CD** - Automate deployments
5. ✅ **Add custom features** - Enhance your app
6. ✅ **Monitor costs** - Check billing regularly

---

## Support Resources

- **GKE Documentation:** https://cloud.google.com/kubernetes-engine/docs
- **kubectl Cheat Sheet:** https://kubernetes.io/docs/reference/kubectl/cheatsheet/
- **cert-manager Docs:** https://cert-manager.io/docs/
- **GCP Pricing Calculator:** https://cloud.google.com/products/calculator
- **GCP Free Tier:** https://cloud.google.com/free

---

## Summary Checklist

- [ ] Created Google Cloud account with free credits
- [ ] Created GCP project and noted Project ID
- [ ] Installed gcloud CLI and kubectl
- [ ] Deployed GKE cluster
- [ ] Verified all pods are running
- [ ] Reserved static IP address
- [ ] Configured DNS in GoDaddy
- [ ] Installed cert-manager and applied configs
- [ ] Verified SSL certificate is ready
- [ ] Accessed application at https://bookscar.store
- [ ] Tested application features
- [ ] Know how to turn off to save money

**Congratulations! 🎉** Your BookStore application is now live on Google Cloud with your custom domain!

---

**💡 Pro Tip:** Set a billing alert in GCP Console to get notified if costs exceed $10/month. Go to: https://console.cloud.google.com/billing/alerts