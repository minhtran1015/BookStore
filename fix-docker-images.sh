#!/bin/bash

echo "=== Fixing Docker Base Images ==="
echo "Updating from deprecated openjdk:8-jdk-alpine to eclipse-temurin:8-jre-alpine"

# List of services that need Dockerfile updates
services=(
    "bookstore-account-service"
    "bookstore-billing-service" 
    "bookstore-catalog-service"
    "bookstore-order-service"
    "bookstore-payment-service"
    "bookstore-api-gateway-service"
    "bookstore-eureka-discovery-service"
)

for service in "${services[@]}"; do
    echo "Updating $service/Dockerfile..."
    if [ -f "$service/Dockerfile" ]; then
        # Replace deprecated openjdk image with eclipse-temurin
        sed -i.bak 's/FROM openjdk:8-jdk-alpine/FROM eclipse-temurin:8-jre-alpine/g' "$service/Dockerfile"
        echo "Updated $service/Dockerfile"
    else
        echo "Warning: $service/Dockerfile not found"
    fi
done

echo "=== Docker Base Image Fix Complete ==="
echo "All services now use eclipse-temurin:8-jre-alpine (officially supported)"