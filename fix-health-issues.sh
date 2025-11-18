#!/bin/bash

echo "=== BookStore Health Degradation Fix ==="
echo "Applying resource optimizations..."

# Function to update deployment resources
update_deployment_resources() {
    local deployment=$1
    local memory_request=$2
    local memory_limit=$3
    local cpu_request=$4
    local cpu_limit=$5
    
    echo "Updating $deployment with resources: CPU($cpu_request-$cpu_limit), Memory($memory_request-$memory_limit)"
    
    kubectl patch deployment $deployment -n bookstore --type='json' -p="[
        {\"op\": \"replace\", \"path\": \"/spec/template/spec/containers/0/resources/requests/memory\", \"value\": \"$memory_request\"},
        {\"op\": \"replace\", \"path\": \"/spec/template/spec/containers/0/resources/requests/cpu\", \"value\": \"$cpu_request\"},
        {\"op\": \"replace\", \"path\": \"/spec/template/spec/containers/0/resources/limits/memory\", \"value\": \"$memory_limit\"},
        {\"op\": \"replace\", \"path\": \"/spec/template/spec/containers/0/resources/limits/cpu\", \"value\": \"$cpu_limit\"}
    ]" 2>/dev/null || echo "Warning: Could not patch $deployment (may not exist or different structure)"
}

# Update all microservices with reduced resource requirements
update_deployment_resources "bookstore-account-service" "128Mi" "512Mi" "100m" "300m"
update_deployment_resources "bookstore-billing-service" "128Mi" "512Mi" "100m" "300m"  
update_deployment_resources "bookstore-catalog-service" "128Mi" "512Mi" "100m" "300m"
update_deployment_resources "bookstore-order-service" "128Mi" "512Mi" "100m" "300m"
update_deployment_resources "bookstore-payment-service" "128Mi" "512Mi" "100m" "300m"
update_deployment_resources "bookstore-zuul-api-gateway-server" "128Mi" "512Mi" "100m" "300m"

echo ""
echo "=== Scaling deployments to single replicas ==="

# Scale down to single replica for resource conservation
kubectl scale deployment bookstore-account-service --replicas=1 -n bookstore
kubectl scale deployment bookstore-billing-service --replicas=1 -n bookstore
kubectl scale deployment bookstore-catalog-service --replicas=1 -n bookstore
kubectl scale deployment bookstore-order-service --replicas=1 -n bookstore
kubectl scale deployment bookstore-payment-service --replicas=1 -n bookstore
kubectl scale deployment bookstore-zuul-api-gateway-server --replicas=1 -n bookstore

echo ""
echo "=== Cleaning up failed/pending pods ==="

# Delete all pending, error, and image pull backoff pods
kubectl get pods -n bookstore | grep -E "(Pending|Error|ImagePullBackOff|CrashLoopBackOff)" | awk '{print $1}' | xargs -r kubectl delete pod -n bookstore

echo ""
echo "=== Waiting for services to stabilize ==="
sleep 30

echo ""
echo "=== Final Status Check ==="
echo "Running pods:"
kubectl get pods -n bookstore | grep Running | wc -l
echo ""
echo "Problematic pods:"
kubectl get pods -n bookstore | grep -v Running | grep -v NAME | wc -l

echo ""
echo "=== Resource Usage ==="
kubectl top nodes
echo ""
echo "=== HPA Status ==="
kubectl get hpa -n bookstore

echo ""
echo "Health degradation fix complete!"