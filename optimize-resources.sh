#!/bin/bash

# Reduce resource requests in all deployment files for cost optimization
# This makes the services run on smaller, cheaper nodes

set -e

echo "🔧 Optimizing resource requests for cost savings..."

# Array of service deployment files
SERVICES=(
  "k8s/account-service.yaml"
  "k8s/billing-service.yaml"
  "k8s/catalog-service.yaml"
  "k8s/order-service.yaml"
  "k8s/payment-service.yaml"
  "k8s/api-gateway-service.yaml"
)

# Backup originals
echo "📦 Creating backups..."
for file in "${SERVICES[@]}"; do
  if [ -f "$file" ]; then
    cp "$file" "${file}.backup-original"
  fi
done

# Reduce resource requests
echo "⚙️  Reducing resource requests..."

for file in "${SERVICES[@]}"; do
  if [ -f "$file" ]; then
    # Reduce memory requests from 512Mi to 256Mi
    sed -i.tmp 's/memory: "512Mi"/memory: "256Mi"/g' "$file"
    
    # Reduce memory limits from 2Gi to 1Gi
    sed -i.tmp 's/memory: "2Gi"/memory: "1Gi"/g' "$file"
    
    # Reduce CPU requests from 100m to 50m
    sed -i.tmp 's/cpu: "100m"/cpu: "50m"/g' "$file"
    
    # Reduce CPU limits from 300m to 200m
    sed -i.tmp 's/cpu: "300m"/cpu: "200m"/g' "$file"
    
    rm "${file}.tmp"
    echo "  ✅ Updated $file"
  fi
done

echo ""
echo "✅ Resource optimization complete!"
echo ""
echo "📊 Changes made:"
echo "  Memory requests: 512Mi → 256Mi"
echo "  Memory limits:   2Gi   → 1Gi"
echo "  CPU requests:    100m  → 50m"
echo "  CPU limits:      300m  → 200m"
echo ""
echo "💡 This allows all services to run on 1-2 e2-small nodes"
echo ""
echo "⚠️  Note: Backups saved as *.backup-original"
echo "   To restore: cp k8s/*.backup-original k8s/"
