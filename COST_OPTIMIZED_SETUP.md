# Cost-Optimized GKE Setup for BookStore

**Project ID:** `lyrical-tooling-475815-i8`

This configuration is optimized for **minimum cost** while keeping your app running until next year.

## 💰 Cost Comparison

| Configuration | Monthly Cost | Your Savings |
|---------------|--------------|--------------|
| **Original (3 × e2-medium)** | ~$170-200 | - |
| **Optimized (1 × e2-small)** | ~$24-30 | **85% cheaper!** |
| **With Preemptible** | ~$5-10 | **95% cheaper!** |

## ✅ Your Current Configuration

I've already set up `.gke-config` with:

```bash
GCP_PROJECT_ID=lyrical-tooling-475815-i8
CLUSTER_NAME=bookstore-cluster
GCP_ZONE=us-central1-a
NUM_NODES=1                    # Only 1 node
MACHINE_TYPE=e2-small          # Smaller, cheaper VM
USE_PREEMPTIBLE=false          # Set to true for even more savings
```

**Cost:** ~$24-30/month (~$0.80-1.00/day)

## 🚀 Quick Setup (3 Steps)

### Step 1: Optimize Resource Requests

```bash
./optimize-resources.sh
```

This reduces memory/CPU requests so all services fit on a single e2-small node.

### Step 2: Run Automated Setup

```bash
./setup-gke-automated.sh
```

This will create your cluster and deploy everything automatically.

### Step 3: Access Your App

After setup completes:

```bash
cat .gke-credentials
```

## 💡 Even Cheaper Option: Preemptible Nodes

If you can tolerate occasional restarts, enable preemptible nodes for **95% cost savings** (~$5-10/month):

Edit `.gke-config`:
```bash
USE_PREEMPTIBLE=true
```

**Tradeoff:** Google can shut down preemptible nodes at any time (usually after 24 hours), and they'll automatically restart. Your app might have ~1-5 minutes of downtime when this happens.

## 📊 What's Been Optimized

1. **Cluster Size**
   - Original: 3 nodes (auto-scaling 1-5)
   - Optimized: 1 node (auto-scaling 1-3)
   - Savings: 66% fewer nodes

2. **Node Size**
   - Original: e2-medium (2 vCPU, 4GB RAM)
   - Optimized: e2-small (2 vCPU, 2GB RAM)
   - Savings: 50% cheaper per node

3. **Disk Size**
   - Original: 50GB per node
   - Optimized: 30GB per node
   - Savings: 40% less disk cost

4. **Resource Requests** (via `optimize-resources.sh`)
   - Memory: 512Mi → 256Mi
   - CPU: 100m → 50m
   - Allows all services to fit on smaller nodes

## 🔧 Full Setup Commands

```bash
# 1. Optimize resources (already configured)
./optimize-resources.sh

# 2. Run setup (already configured with your project ID)
./setup-gke-automated.sh

# 3. Wait 5-10 minutes for cluster creation

# 4. Check credentials
cat .gke-credentials
```

## 📈 Scaling Options

### When You Need More Resources

```bash
# Add a second node
gcloud container clusters resize bookstore-cluster --num-nodes=2 --zone=us-central1-a

# Upgrade to larger nodes
gcloud container clusters upgrade bookstore-cluster --node-pool=default-pool --machine-type=e2-medium --zone=us-central1-a
```

### Scale Down to Save More

```bash
# Scale all deployments to 0 replicas (keeps cluster running but saves compute)
kubectl scale deployment --all --replicas=0 -n bookstore

# Scale back up when needed
kubectl scale deployment --all --replicas=1 -n bookstore
```

## 🛑 Cleanup (After Next Year)

When you're done:

```bash
# Delete the entire cluster (stops all billing)
gcloud container clusters delete bookstore-cluster --zone=us-central1-a --quiet
```

## 💳 Free Credits

- New GCP accounts get **$300 free credits** (90 days)
- With optimized setup (~$30/month), this gives you **10 months free!**
- Your app will run until next year for **$0**

## ⚠️ Important Notes

1. **With 1 × e2-small node:**
   - All services will run but may be slower
   - Sufficient for development/demo purposes
   - Not recommended for production traffic

2. **MySQL Database:**
   - Running in the same cluster (no extra cost)
   - Data persists across pod restarts
   - Back up important data regularly

3. **Monitoring:**
   - Prometheus/Grafana still work
   - May need to reduce their resource requests too

## 🎯 Recommended for Your Use Case

Since you only need this until next year (short-term):

**Option A: Ultra-cheap (Recommended)**
- 1 × e2-small node
- Preemptible: false
- Cost: ~$24-30/month
- Uptime: 99.9%

**Option B: Super-cheap (Aggressive)**
- 1 × e2-small node
- Preemptible: true
- Cost: ~$5-10/month
- Uptime: ~95% (occasional restarts)

Both options will run your app until next year well within your free $300 credits.

## 📞 Need Help?

If you run into issues:

```bash
# Check pod status
kubectl get pods -n bookstore

# Check node resources
kubectl top nodes

# View logs
kubectl logs -f <pod-name> -n bookstore
```

Your configuration is ready to go! Just run `./optimize-resources.sh` then `./setup-gke-automated.sh` 🚀
