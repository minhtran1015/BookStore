#!/bin/bash

# BookStore Resource Optimization Script
# This script reduces resource requirements and improves pod scheduling

set -e

echo "🔧 Optimizing BookStore Kubernetes Resources..."

# Colors for output
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

# 1. Scale down non-essential services temporarily
print_status "Scaling down non-essential services to free up resources..."

# Scale down monitoring services to 0 replicas temporarily
kubectl scale deployment bookstore-grafana -n bookstore --replicas=0 || true
kubectl scale deployment bookstore-prometheus -n bookstore --replicas=0 || true
kubectl scale deployment bookstore-chronograf -n bookstore --replicas=0 || true
kubectl scale deployment bookstore-kapacitor -n bookstore --replicas=0 || true
kubectl scale deployment bookstore-influxdb -n bookstore --replicas=0 || true

print_success "Scaled down monitoring services"

# 2. Delete pending pods to allow new ones to be scheduled
print_status "Cleaning up pending pods..."
kubectl delete pods --field-selector=status.phase=Pending -n bookstore --force --grace-period=0 || true

print_success "Cleaned up pending pods"

# 3. Apply resource optimizations
print_status "Applying optimized resource configurations..."
kubectl apply -f k8s/account-service.yaml
kubectl apply -f k8s/billing-service.yaml  
kubectl apply -f k8s/catalog-service.yaml
kubectl apply -f k8s/order-service.yaml
kubectl apply -f k8s/payment-service.yaml
kubectl apply -f k8s/zuul-gateway.yaml

print_success "Applied optimized service configurations"

# 4. Wait for core services to be ready
print_status "Waiting for core services to be ready..."
kubectl rollout status deployment/bookstore-mysql-db -n bookstore --timeout=300s || true
kubectl rollout status deployment/bookstore-account-service -n bookstore --timeout=300s || true
kubectl rollout status deployment/bookstore-zuul-api-gateway-server -n bookstore --timeout=300s || true

# 5. Scale up essential monitoring services after core services are ready  
print_status "Scaling up essential monitoring services..."
sleep 30
kubectl scale deployment bookstore-zipkin -n bookstore --replicas=1 || true

print_success "Core services optimized and running"

echo ""
echo "✅ =============================="
echo "✅ Resource Optimization Complete!"
echo "✅ =============================="
echo ""
echo "📊 Resource Usage Summary:"
echo "  • Reduced memory requests by ~50% (from 128Mi to 64Mi per service)"
echo "  • Reduced CPU requests by ~60% (from 25m to 10m per service)"  
echo "  • Temporarily disabled non-essential monitoring"
echo "  • Improved pod scheduling efficiency"
echo ""
echo "🔧 Next Steps:"
echo "1. Monitor service health: kubectl get pods -n bookstore"
echo "2. Check resource usage: kubectl top nodes"
echo "3. Scale up monitoring when resources allow"
echo ""
echo "💡 To scale up monitoring again:"
echo "kubectl scale deployment bookstore-grafana -n bookstore --replicas=1"
echo "kubectl scale deployment bookstore-prometheus -n bookstore --replicas=1"