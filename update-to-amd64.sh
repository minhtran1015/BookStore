#!/bin/bash

# Update all deployments to use AMD64 images
# This script patches all deployments in the bookstore namespace to use :amd64 tag

set -e

echo "🔄 Updating all BookStore deployments to use AMD64 images..."

# Update Java microservices
kubectl patch deployment bookstore-account-service -n bookstore -p '{"spec":{"template":{"spec":{"containers":[{"name":"account","image":"gcr.io/lyrical-tooling-475815-i8/bookstore-account-service:amd64"}]}}}}'

kubectl patch deployment bookstore-billing-service -n bookstore -p '{"spec":{"template":{"spec":{"containers":[{"name":"billing","image":"gcr.io/lyrical-tooling-475815-i8/bookstore-billing-service:amd64"}]}}}}'

kubectl patch deployment bookstore-catalog-service -n bookstore -p '{"spec":{"template":{"spec":{"containers":[{"name":"catalog","image":"gcr.io/lyrical-tooling-475815-i8/bookstore-catalog-service:amd64"}]}}}}'

kubectl patch deployment bookstore-order-service -n bookstore -p '{"spec":{"template":{"spec":{"containers":[{"name":"order","image":"gcr.io/lyrical-tooling-475815-i8/bookstore-order-service:amd64"}]}}}}'

kubectl patch deployment bookstore-payment-service -n bookstore -p '{"spec":{"template":{"spec":{"containers":[{"name":"payment","image":"gcr.io/lyrical-tooling-475815-i8/bookstore-payment-service:amd64"}]}}}}'

kubectl patch deployment bookstore-zuul-api-gateway-server -n bookstore -p '{"spec":{"template":{"spec":{"containers":[{"name":"zuul","image":"gcr.io/lyrical-tooling-475815-i8/bookstore-zuul-api-gateway-server:amd64"}]}}}}'

kubectl patch deployment eureka-server-deployment -n bookstore -p '{"spec":{"template":{"spec":{"containers":[{"name":"eureka","image":"gcr.io/lyrical-tooling-475815-i8/bookstore-eureka-discovery-service:amd64"}]}}}}'

# Update monitoring services
kubectl patch deployment bookstore-prometheus -n bookstore -p '{"spec":{"template":{"spec":{"containers":[{"name":"prometheus","image":"gcr.io/lyrical-tooling-475815-i8/bookstore-prometheus:amd64"}]}}}}'

kubectl patch deployment bookstore-grafana -n bookstore -p '{"spec":{"template":{"spec":{"containers":[{"name":"grafana","image":"gcr.io/lyrical-tooling-475815-i8/graphana:amd64"}]}}}}'

# Update frontend
kubectl patch deployment frontend-deployment -n bookstore -p '{"spec":{"template":{"spec":{"containers":[{"name":"frontend","image":"gcr.io/lyrical-tooling-475815-i8/bookstore-frontend-react-app:amd64"}]}}}}'

echo "✅ All deployments updated to use AMD64 images!"
echo ""
echo "Checking rollout status..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Wait for rollouts to complete
kubectl rollout status deployment/bookstore-account-service -n bookstore --timeout=180s
kubectl rollout status deployment/bookstore-billing-service -n bookstore --timeout=180s
kubectl rollout status deployment/bookstore-catalog-service -n bookstore --timeout=180s
kubectl rollout status deployment/bookstore-order-service -n bookstore --timeout=180s
kubectl rollout status deployment/bookstore-payment-service -n bookstore --timeout=180s
kubectl rollout status deployment/bookstore-zuul-api-gateway-server -n bookstore --timeout=180s
kubectl rollout status deployment/eureka-server-deployment -n bookstore --timeout=180s

echo ""
echo "🎉 All core services are now running with AMD64 images!"
echo "📊 Checking pod status..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

kubectl get pods -n bookstore | grep -E "account|billing|catalog|order|payment|zuul|eureka"