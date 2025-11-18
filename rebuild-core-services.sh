#!/bin/bash

echo "=== Fixing All Dockerfiles with Amazon Corretto ==="

services=(
    "bookstore-billing-service" 
    "bookstore-catalog-service"
    "bookstore-order-service"
    "bookstore-payment-service"
    "bookstore-api-gateway-service"
    "bookstore-eureka-discovery-service"
)

for service in "${services[@]}"; do
    echo "Updating $service/Dockerfile to use amazoncorretto:8-alpine-jre..."
    if [ -f "$service/Dockerfile" ]; then
        sed -i.bak 's/FROM eclipse-temurin:8-jre-alpine/FROM amazoncorretto:8-alpine-jre/g' "$service/Dockerfile"
        echo "Updated $service"
    fi
done

echo "=== Building Core Services ==="

# Build the most critical services
core_services=("bookstore-billing-service" "bookstore-catalog-service" "bookstore-order-service" "bookstore-api-gateway-service")

for service in "${core_services[@]}"; do
    echo "Building $service..."
    cd "$service"
    docker build -t "d1ff1c1le/$service:latest" . || echo "Failed to build $service"
    cd ..
done

echo "=== Pushing Updated Images ==="
for service in "${core_services[@]}"; do
    echo "Pushing d1ff1c1le/$service:latest..."
    docker push "d1ff1c1le/$service:latest" || echo "Failed to push $service"
done

docker push "d1ff1c1le/bookstore-account-service:latest" || echo "Failed to push account service"

echo "=== Docker Image Fix Complete ==="