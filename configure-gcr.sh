#!/bin/bash

# Update Docker images to use Google Container Registry (GCR)
# This script updates build_and_push.sh to push images to GCR

set -e

echo "📝 Updating Docker configuration for GCR"

# Load configuration from .gke-config file or environment variables
CONFIG_FILE=".gke-config"

if [ -f "$CONFIG_FILE" ]; then
    echo "📥 Loading configuration from $CONFIG_FILE"
    source "$CONFIG_FILE"
fi

# Use environment variable or from config file
PROJECT_ID=${GCP_PROJECT_ID:-${PROJECT_ID:-""}}

if [ -z "$PROJECT_ID" ]; then
    echo "❌ GCP_PROJECT_ID is not set!"
    echo ""
    echo "Please set it in one of these ways:"
    echo "  1. Create .gke-config file (copy from .gke-config.example)"
    echo "  2. Set environment variable: export GCP_PROJECT_ID=your-project-id"
    echo "  3. Pass as argument: GCP_PROJECT_ID=your-project-id ./configure-gcr.sh"
    exit 1
fi

echo "🔧 Configuring Docker to use gcr.io/$PROJECT_ID"

# Update build_and_push.sh
if [ -f "build_and_push.sh" ]; then
    # Backup original
    cp build_and_push.sh build_and_push.sh.backup
    
    # Replace docker hub prefix with GCR
    sed -i.tmp "s|DOCKER_HUB_PREFIX=.*|DOCKER_HUB_PREFIX=\"gcr.io/$PROJECT_ID\"|g" build_and_push.sh
    rm build_and_push.sh.tmp
    
    echo "✅ Updated build_and_push.sh to use GCR"
else
    echo "❌ build_and_push.sh not found"
    exit 1
fi

# Update k8s deployment files to use GCR images
echo "🔧 Updating Kubernetes deployment files..."
for file in k8s/*-service.yaml; do
    if [ -f "$file" ]; then
        sed -i.tmp "s|image: devd.*|image: gcr.io/$PROJECT_ID/$(basename $file -service.yaml):latest|g" "$file"
        rm "$file.tmp"
        echo "  ✅ Updated $file"
    fi
done

# Update gateway
if [ -f "k8s/api-gateway-service.yaml" ]; then
    sed -i.tmp "s|image: devd.*|image: gcr.io/$PROJECT_ID/bookstore-zuul-api-gateway-server:latest|g" "k8s/api-gateway-service.yaml"
    rm "k8s/api-gateway-service.yaml.tmp"
    echo "  ✅ Updated k8s/api-gateway-service.yaml"
fi

echo ""
echo "✅ GCR configuration complete!"
echo ""
echo "📋 Next steps:"
echo "1. Authenticate Docker with GCR:"
echo "   gcloud auth configure-docker"
echo ""
echo "2. Build and push images:"
echo "   ./build_and_push.sh gcr"
echo ""
echo "3. Deploy to GKE:"
echo "   ./gke-setup.sh"
echo ""
