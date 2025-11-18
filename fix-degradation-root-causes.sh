#!/bin/bash

echo "=== Comprehensive BookStore Stability Fix ==="
echo "Fixing root causes of continuous degradation..."

# Step 1: Disable HPA temporarily to stop the scaling wars
echo "1. Disabling HPA to prevent scaling conflicts..."
kubectl patch hpa bookstore-account-service-hpa -n bookstore -p '{"spec":{"minReplicas":1,"maxReplicas":1}}'
kubectl patch hpa bookstore-catalog-service-hpa -n bookstore -p '{"spec":{"minReplicas":1,"maxReplicas":1}}'  
kubectl patch hpa bookstore-order-service-hpa -n bookstore -p '{"spec":{"minReplicas":1,"maxReplicas":1}}'

# Step 2: Increase memory limits to prevent OOM issues
echo "2. Increasing memory limits to handle actual usage..."

update_memory_limits() {
    local deployment=$1
    echo "Updating memory limits for $deployment"
    kubectl patch deployment $deployment -n bookstore --type='json' -p="[
        {\"op\": \"replace\", \"path\": \"/spec/template/spec/containers/0/resources/requests/memory\", \"value\": \"256Mi\"},
        {\"op\": \"replace\", \"path\": \"/spec/template/spec/containers/0/resources/limits/memory\", \"value\": \"1Gi\"},
        {\"op\": \"replace\", \"path\": \"/spec/template/spec/containers/0/resources/limits/cpu\", \"value\": \"500m\"}
    ]" 2>/dev/null || echo "Could not patch $deployment"
}

update_memory_limits "bookstore-account-service"
update_memory_limits "bookstore-billing-service" 
update_memory_limits "bookstore-catalog-service"
update_memory_limits "bookstore-order-service"
update_memory_limits "bookstore-payment-service"
update_memory_limits "bookstore-zuul-api-gateway-server"

# Step 3: Scale down to exactly 1 replica per service
echo "3. Enforcing single replica per service..."
kubectl scale deployment bookstore-account-service --replicas=1 -n bookstore
kubectl scale deployment bookstore-billing-service --replicas=1 -n bookstore
kubectl scale deployment bookstore-catalog-service --replicas=1 -n bookstore
kubectl scale deployment bookstore-order-service --replicas=1 -n bookstore
kubectl scale deployment bookstore-payment-service --replicas=1 -n bookstore
kubectl scale deployment bookstore-zuul-api-gateway-server --replicas=1 -n bookstore

# Step 4: Delete all problematic pods for fresh start
echo "4. Cleaning up all failed/problematic pods..."
kubectl get pods -n bookstore | grep -E "(Pending|Error|CrashLoopBackOff|ImagePullBackOff)" | awk '{print $1}' | xargs -r kubectl delete pod -n bookstore --force --grace-period=0

# Step 5: Delete duplicate MySQL instances
echo "5. Ensuring single MySQL instance..."
kubectl get pods -n bookstore | grep "bookstore-mysql-db" | tail -n +2 | awk '{print $1}' | xargs -r kubectl delete pod -n bookstore --force --grace-period=0

echo "6. Waiting for services to stabilize..."
sleep 45

echo "7. Final status check..."
kubectl get pods -n bookstore | grep -c Running
kubectl get hpa -n bookstore
kubectl top nodes

echo ""
echo "=== Fix Complete ==="
echo "If services are still crashing, we may need to rebuild Docker images with proper dependencies"