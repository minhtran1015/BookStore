#!/bin/bash

# Build core services for AMD64 architecture
echo "🔧 Building core BookStore services for AMD64 architecture..."

TAG="amd64"
GCR_PROJECT="gcr.io/lyrical-tooling-475815-i8"

# Core services to build
services=("bookstore-account-service" "bookstore-api-gateway-service" "bookstore-eureka-discovery-service")

for service in "${services[@]}"
do
  echo "Building $service -> $service..."
  
  cd "$service"
  
  if [ -f "Dockerfile" ]; then
    docker buildx build --platform linux/amd64 -t "$GCR_PROJECT/$service:$TAG" --push .
    if [ $? -eq 0 ]; then
      echo "✅ $service built successfully"
    else
      echo "❌ Failed to build $service"
    fi
  else
    echo "⚠️  Dockerfile not found for $service"
  fi
  
  cd ..
done

echo "🎉 Core services build complete!"