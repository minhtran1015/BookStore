#!/bin/bash

echo "=== FIXING DEPLOYMENT YAML FILES ==="
echo "Setting all services to replicas: 1 in Git so ArgoCD syncs correctly..."

# List of service YAML files that need fixing
services=(
    "billing-service"
    "catalog-service" 
    "order-service"
    "payment-service"
)

for service in "${services[@]}"; do
    file="k8s/${service}.yaml"
    if [ -f "$file" ]; then
        echo "Fixing $file..."
        # Replace replicas: 2 with replicas: 1
        sed -i.bak 's/replicas: 2/replicas: 1/g' "$file"
        echo "  Updated $service to replicas: 1"
    else
        echo "  Warning: $file not found"
    fi
done

echo ""
echo "=== VERIFICATION ==="
echo "Checking replica counts in YAML files:"
grep -n "replicas:" k8s/*service.yaml

echo ""
echo "YAML files updated! Ready to commit and push for ArgoCD sync."