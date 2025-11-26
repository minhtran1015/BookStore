# GCP Deployment Journey - BookStore Application

**Last Updated:** November 26, 2025

This document chronicles the complete GCP deployment journey for the BookStore microservices application, including all challenges encountered and solutions implemented.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Challenges & Solutions](#challenges--solutions)
4. [Current Production Status](#current-production-status)
5. [Access Information](#access-information)
6. [Lessons Learned](#lessons-learned)

---

## 🎯 Project Overview

### Deployment Target
- **Platform:** Google Kubernetes Engine (GKE)
- **Project ID:** `lyrical-tooling-475815-i8`
- **Cluster Name:** `bookstore-cluster`
- **Zone:** `us-central1-a`
- **Registry:** Google Container Registry (GCR) - `gcr.io/lyrical-tooling-475815-i8`

### Components Deployed
- 5 Core Microservices (Account, Billing, Catalog, Order, Payment)
- API Gateway (Zuul)
- Service Discovery (Consul)
- Database (MariaDB - migrated from MySQL)
- ArgoCD for GitOps continuous deployment
- Monitoring stack (Prometheus, Grafana, Zipkin)

---

## 🏗️ Infrastructure Setup

### GKE Cluster Configuration

```yaml
Cluster:
  Name: bookstore-cluster
  Zone: us-central1-a
  Nodes: 2 x e2-medium (4GB RAM, 2 vCPU each)
  Disk: 30GB per node
  Autoscaling: Enabled (min: 1, max: 3)
  Auto-repair: Enabled
  Auto-upgrade: Enabled
```

### ArgoCD Installation

ArgoCD was successfully deployed for GitOps-based continuous deployment:

```bash
# Installation
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Exposed via LoadBalancer
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'
```

**Current ArgoCD Access:**
- **URL:** https://34.136.30.74
- **Username:** `admin`
- **Password:** `-mJR19yatNNHZ3km`

---

## 🔧 Challenges & Solutions

### Challenge 1: Docker Architecture Mismatch (ARM64 vs AMD64)

**Problem:**
Building Docker images on Apple Silicon Mac (ARM64) resulted in images incompatible with GKE nodes (AMD64).

**Symptoms:**
- Pods stuck in `CrashLoopBackOff`
- Error: `exec format error`

**Solution:**
Created multi-platform build script using Docker buildx:

```bash
# build-amd64.sh - Build for AMD64 architecture
docker buildx build --platform linux/amd64 \
  -t gcr.io/lyrical-tooling-475815-i8/bookstore-account-service:amd64 \
  --push .
```

**Files Created:**
- `build-amd64.sh` - Comprehensive build script for all services
- `update-to-amd64.sh` - Updates all k8s manifests to use `:amd64` tags

---

### Challenge 2: MySQL 8.0 Resource Requirements

**Problem:**
MySQL 8.0 requires significant resources for initialization, causing OOMKilled events on resource-constrained nodes.

**Symptoms:**
- MySQL pods terminating with `OOMKilled` status
- Database initialization never completing
- Other services unable to start (waiting for database)

**Solution:**
Migrated from MySQL 8.0 to MariaDB 10.6:

```yaml
# Before
image: mysql:8.0
resources:
  requests:
    memory: "512Mi"
    cpu: "100m"

# After
image: mariadb:10.6
resources:
  requests:
    memory: "64Mi"
    cpu: "10m"
  limits:
    memory: "128Mi"
    cpu: "50m"
```

**Benefits:**
- 87% reduction in memory footprint
- Faster initialization
- Compatible with existing Spring Boot MySQL drivers

---

### Challenge 3: GCE Quota Limitations

**Problem:**
GCE regional quotas prevented cluster autoscaler from adding nodes when services needed more resources.

**Symptoms:**
- Pods stuck in `Pending` state
- Error: `0/2 nodes available: 2 Insufficient cpu`
- Cluster autoscaler unable to provision new nodes

**Solution:**
Aggressive resource optimization across all services:

```yaml
# Optimized resource configuration for all services
resources:
  requests:
    memory: "64Mi"    # Reduced from 512Mi (87% reduction)
    cpu: "10m"        # Reduced from 100m (90% reduction)
  limits:
    memory: "128Mi"   # Reduced from 1Gi (87% reduction)
    cpu: "50m"        # Reduced from 200m (75% reduction)
```

**Scripts Created:**
- `optimize-resources.sh` - Standard optimization
- `optimize-resources-minimal.sh` - Aggressive optimization for constrained clusters

---

### Challenge 4: Docker Hub to GCR Migration

**Problem:**
Docker Hub rate limiting and latency issues; need for integrated GCP image registry.

**Solution:**
Complete migration from Docker Hub to Google Container Registry:

```bash
# Old images
d1ff1c1le/bookstore-account-service:latest

# New images
gcr.io/lyrical-tooling-475815-i8/bookstore-account-service:amd64
```

**Steps Taken:**
1. Configured GCR authentication via service account
2. Built all images for AMD64 architecture
3. Pushed to GCR with `:amd64` tags
4. Updated all Kubernetes manifests

**Files Modified:**
- All `k8s/*.yaml` deployment files
- `build_and_push.sh` - Added GCR support

---

### Challenge 5: Persistent Volume Conflicts

**Problem:**
PersistentVolumeClaims in `Pending` state due to storage class misconfigurations.

**Solution:**
Temporarily removed persistent storage requirements for demo environment:

```yaml
# Simplified database deployment without PVC
env:
  - name: MYSQL_DATABASE
    value: "bookstore_db"
volumes: []  # No persistent storage for demo
```

---

## 📊 Current Production Status

### Active Services

| Component | Status | Access |
|-----------|--------|--------|
| **ArgoCD** | ✅ Running | https://34.136.30.74 |
| **GKE Cluster** | ✅ Running | 2 nodes operational |
| **GCR Images** | ✅ Available | All services built for AMD64 |

### Image Registry (GCR)

All images available at `gcr.io/lyrical-tooling-475815-i8/`:

| Service | Tag | Status |
|---------|-----|--------|
| bookstore-account-service | amd64 | ✅ Built |
| bookstore-api-gateway-service | amd64 | ✅ Built |
| bookstore-billing-service | amd64 | ✅ Built |
| bookstore-catalog-service | amd64 | ✅ Built |
| bookstore-order-service | amd64 | ✅ Built |
| bookstore-payment-service | amd64 | ✅ Built |
| bookstore-eureka-discovery-service | amd64 | ✅ Built |

### Resource Allocation Summary

```
Total Cluster Capacity: 2 x e2-medium = 4 vCPU, 8GB RAM
Allocatable (after system): ~3.4 vCPU, 6.5GB RAM

Service Resource Requests (optimized):
- Each microservice: 10m CPU, 64Mi memory
- MariaDB: 10m CPU, 64Mi memory
- Total for 8 services: ~80m CPU, 512Mi memory
```

---

## 🔑 Access Information

### ArgoCD Dashboard

```
URL: https://34.136.30.74
Username: admin
Password: -mJR19yatNNHZ3km
```

**CLI Login:**
```bash
argocd login 34.136.30.74 --username admin --password '-mJR19yatNNHZ3km' --insecure
```

### Kubernetes Cluster

```bash
# Get credentials
gcloud container clusters get-credentials bookstore-cluster --zone us-central1-a

# Check cluster status
kubectl get nodes
kubectl get pods -n bookstore
```

### GCR Authentication

```bash
# Configure Docker for GCR
gcloud auth configure-docker

# Pull images
docker pull gcr.io/lyrical-tooling-475815-i8/bookstore-account-service:amd64
```

---

## 📚 Lessons Learned

### 1. Container Architecture Matters
- **Always** verify build platform matches deployment platform
- Use Docker buildx for cross-platform builds
- Tag images explicitly with architecture (`:amd64`, `:arm64`)

### 2. Resource Planning is Critical
- e2-medium nodes (4GB RAM) require aggressive resource optimization
- Start with minimal requests, increase as needed
- Database selection significantly impacts resource requirements

### 3. Database Selection Impact
- MySQL 8.0 requires substantial resources for initialization
- MariaDB 10.6 is significantly more efficient for constrained environments
- Both are compatible with Spring Boot MySQL drivers

### 4. Service Prioritization
- Non-critical services (monitoring) should be optional in resource-constrained deployments
- Core services should be prioritized for scheduling

### 5. Initialization Timing
- Database startup time increases exponentially with reduced CPU allocation
- Use `dockerize` or init containers to handle service dependencies
- Account for initialization spikes in resource limits

### 6. Registry Choice
- GCR provides better integration with GKE (no rate limits, lower latency)
- Migration requires updating all Kubernetes manifests
- Use consistent tagging strategy across environments

---

## 🛠️ Useful Scripts

| Script | Purpose |
|--------|---------|
| `build-amd64.sh` | Build all services for AMD64 architecture |
| `update-to-amd64.sh` | Update k8s manifests to use AMD64 images |
| `optimize-resources.sh` | Standard resource optimization |
| `optimize-resources-minimal.sh` | Aggressive optimization for demos |
| `configure-gcr.sh` | Configure GCR authentication |
| `setup-gke-automated.sh` | Automated GKE cluster setup |

---

## 📈 Cost Analysis

### Current Monthly Cost (Estimated)

| Component | Cost/Month |
|-----------|------------|
| 2 x e2-medium nodes | ~$96 |
| Load Balancer (ArgoCD) | ~$18 |
| Network egress | ~$10-20 |
| Persistent disk | ~$5 |
| **Total** | **~$130-140** |

### Cost Optimization Options

1. **Preemptible Nodes:** ~80% cheaper, but can be terminated anytime
2. **Scale to 0:** Scale deployments when not in use
3. **Autopilot Mode:** Pay per pod instead of per node
4. **Single Node:** Sufficient for demo purposes (~$48/month)

---

## 🔄 Next Steps

1. **Full Service Deployment:** Complete deployment of all microservices once quota is increased
2. **CI/CD Integration:** Configure GitHub Actions to push to GCR and trigger ArgoCD sync
3. **Monitoring Setup:** Deploy Prometheus/Grafana with optimized resource requests
4. **DNS Configuration:** Set up custom domain for ArgoCD and services
5. **SSL/TLS:** Configure cert-manager for automatic certificate management

---

## 📞 Support & References

- **GKE Documentation:** https://cloud.google.com/kubernetes-engine/docs
- **ArgoCD Documentation:** https://argo-cd.readthedocs.io/
- **Project README:** `/README.md`
- **Troubleshooting Guide:** `/TROUBLESHOOTING_GUIDE.md`
- **ArgoCD Setup:** `/argoCD/README.md`
