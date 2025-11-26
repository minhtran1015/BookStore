#!/bin/bash

# Build all BookStore services for AMD64 architecture
# This script uses Docker buildx to build multi-platform images

set -e

# Configuration
DOCKER_HUB_PREFIX="gcr.io/lyrical-tooling-475815-i8"
GIT_COMMIT=$(git rev-parse --short HEAD)
TAG="amd64"

echo "🔧 Building BookStore services for AMD64 architecture..."
echo "Using tag: ${TAG}"

# Services to build
declare -a services=(
    "bookstore-account-service"
    "bookstore-billing-service" 
    "bookstore-catalog-service"
    "bookstore-order-service"
    "bookstore-payment-service"
    "bookstore-api-gateway-service:bookstore-zuul-api-gateway-server"
    "bookstore-eureka-discovery-service"
)

# Build Java services
for service_info in "${services[@]}"; do
    IFS=':' read -ra ADDR <<< "$service_info"
    service_dir="${ADDR[0]}"
    image_name="${ADDR[1]:-${ADDR[0]}}"
    
    echo "Building ${service_dir} -> ${image_name}..."
    cd "${service_dir}"
    
    docker buildx build \
        --platform linux/amd64 \
        -t "${DOCKER_HUB_PREFIX}/${image_name}:${TAG}" \
        --push \
        .
    
    cd ..
    echo "✅ ${service_dir} built successfully"
done

# Build monitoring services (they use different base images)
echo "Building monitoring services..."

# Prometheus
cd bookstore-prometheus
docker buildx build \
    --platform linux/amd64 \
    -t "${DOCKER_HUB_PREFIX}/bookstore-prometheus:${TAG}" \
    --push \
    .
cd ..
echo "✅ Prometheus built successfully"

# Grafana
cd bookstore-graphana
docker buildx build \
    --platform linux/amd64 \
    -t "${DOCKER_HUB_PREFIX}/graphana:${TAG}" \
    --push \
    .
cd ..
echo "✅ Grafana built successfully"

# Telegraf
cd bookstore-telegraph
docker buildx build \
    --platform linux/amd64 \
    -t "${DOCKER_HUB_PREFIX}/bookstore-telegraf:${TAG}" \
    --push \
    .
cd ..
echo "✅ Telegraf built successfully"

# Frontend React App
cd bookstore-frontend-react-app
docker buildx build \
    --platform linux/amd64 \
    -t "${DOCKER_HUB_PREFIX}/bookstore-frontend-react-app:${TAG}" \
    --push \
    .
cd ..
echo "✅ Frontend built successfully"

echo ""
echo "🎉 All services built successfully for AMD64 architecture!"
echo "Images are tagged with: ${TAG}"
echo ""
echo "Next steps:"
echo "1. Update Kubernetes manifests to use :amd64 tag"
echo "2. Apply the updated manifests"
echo "3. Verify all pods start successfully"