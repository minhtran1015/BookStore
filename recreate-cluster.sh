#!/bin/bash

# Script to recreate Kind cluster with increased resources
# This will delete the current cluster and all data

set -e

echo "⚠️  WARNING: This will delete the current Kind cluster and all data!"
echo "Make sure to backup any important data from PVCs."
echo ""
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo "🗑️  Deleting current cluster..."
kind delete cluster --name bookstore-argocd-test

echo "🔨 Creating new cluster with increased resources (8Gi total RAM)..."
kind create cluster --config argoCD/kind-cluster-config.yaml

echo "📦 Installing ArgoCD..."
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "⏳ Waiting for ArgoCD to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

echo "🔑 Getting ArgoCD password..."
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)

echo "🌐 Configuring ArgoCD service..."
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "NodePort", "ports": [{"port": 443, "targetPort": 8080, "nodePort": 30080}]}}'

echo "📋 Applying BookStore configurations..."
kubectl apply -f argoCD/argocd-project.yaml
kubectl apply -f argoCD/argocd-bookstore-app.yaml
kubectl apply -f argoCD/argocd-environments.yaml

echo ""
echo "✅ Cluster recreated successfully!"
echo "ArgoCD UI: https://localhost:30080"
echo "Username: admin"
echo "Password: $ARGOCD_PASSWORD"
echo ""
echo "Note: All previous data has been lost. You may need to reconfigure services."