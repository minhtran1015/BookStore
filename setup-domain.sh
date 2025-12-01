#!/bin/bash

# Script to configure domain for BookStore application
# This script helps you set up bookscar.store domain on GKE

set -e

echo "=========================================="
echo "BookStore Domain Configuration Script"
echo "Domain: bookscar.store"
echo "=========================================="
echo ""


# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load configuration from .env file
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
else
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please create .env from .env.example and configure your settings"
    exit 1
fi

# Configuration from .env
PROJECT_ID=${GCP_PROJECT_ID}
REGION=${GCP_REGION:-"us-central1"}
CLUSTER_NAME=${CLUSTER_NAME:-"bookstore-cluster"}
NAMESPACE=${KUBERNETES_NAMESPACE:-"bookstore"}
STATIC_IP_NAME="bookstore-static-ip"
DOMAIN_NAME=${DOMAIN_NAME:-"bookscar.store"}
DOMAIN_EMAIL=${DOMAIN_EMAIL:-"admin@bookscar.store"}

# Step 1: Check prerequisites
echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"

if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI not found. Please install it first.${NC}"
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl not found. Please install it first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites check passed${NC}"
echo ""

# Step 2: Configure gcloud
echo -e "${YELLOW}Step 2: Configuring gcloud...${NC}"
gcloud config set project $PROJECT_ID
gcloud container clusters get-credentials $CLUSTER_NAME --region=$REGION --project=$PROJECT_ID
echo -e "${GREEN}✓ gcloud configured${NC}"
echo ""

# Step 3: Reserve static IP
echo -e "${YELLOW}Step 3: Reserving static IP address...${NC}"

# Check if IP already exists
if gcloud compute addresses describe $STATIC_IP_NAME --region=$REGION --project=$PROJECT_ID &> /dev/null; then
    echo -e "${YELLOW}Static IP already exists${NC}"
else
    gcloud compute addresses create $STATIC_IP_NAME \
        --region=$REGION \
        --project=$PROJECT_ID
    echo -e "${GREEN}✓ Static IP created${NC}"
fi

# Get the IP address
STATIC_IP=$(gcloud compute addresses describe $STATIC_IP_NAME \
    --region=$REGION \
    --project=$PROJECT_ID \
    --format="get(address)")

echo -e "${GREEN}Static IP Address: ${STATIC_IP}${NC}"
echo ""

# Step 4: Install cert-manager
echo -e "${YELLOW}Step 4: Checking cert-manager installation...${NC}"

if kubectl get namespace cert-manager &> /dev/null; then
    echo -e "${YELLOW}cert-manager namespace already exists${NC}"
else
    echo "Installing cert-manager..."
    kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.2/cert-manager.yaml
    
    echo "Waiting for cert-manager to be ready..."
    kubectl wait --for=condition=Available --timeout=300s deployment/cert-manager -n cert-manager
    kubectl wait --for=condition=Available --timeout=300s deployment/cert-manager-webhook -n cert-manager
    kubectl wait --for=condition=Available --timeout=300s deployment/cert-manager-cainjector -n cert-manager
    
    echo -e "${GREEN}✓ cert-manager installed${NC}"
fi
echo ""

# Step 5: Apply Kubernetes configurations
echo -e "${YELLOW}Step 5: Applying Kubernetes configurations...${NC}"

# Apply cert-manager ClusterIssuer
kubectl apply -f k8s/cert-manager-setup.yaml
echo -e "${GREEN}✓ ClusterIssuer applied${NC}"

# Apply updated Ingress
kubectl apply -f k8s/ingress.yaml
echo -e "${GREEN}✓ Ingress applied${NC}"

echo ""

# Step 6: Display DNS configuration instructions
echo -e "${YELLOW}=========================================="
echo "IMPORTANT: DNS Configuration Required"
echo "==========================================${NC}"
echo ""
echo "Please configure the following DNS A records in GoDaddy:"
echo ""
echo -e "${GREEN}Record 1:${NC}"
echo "  Type: A"
echo "  Name: @"
echo "  Value: $STATIC_IP"
echo "  TTL: 600"
echo ""
echo -e "${GREEN}Record 2:${NC}"
echo "  Type: A"
echo "  Name: www"
echo "  Value: $STATIC_IP"
echo "  TTL: 600"
echo ""
echo "Instructions:"
echo "1. Go to https://dcc.godaddy.com/manage/bookscar.store/dns"
echo "2. Click 'Add' to create new A records"
echo "3. Enter the values above for both records"
echo "4. Save changes"
echo ""
echo -e "${YELLOW}DNS propagation can take 10-30 minutes (max 48 hours)${NC}"
echo ""

# Step 7: Verification commands
echo -e "${YELLOW}=========================================="
echo "Verification Commands"
echo "==========================================${NC}"
echo ""
echo "After DNS propagation, run these commands:"
echo ""
echo "1. Check DNS resolution:"
echo "   nslookup bookscar.store"
echo "   nslookup www.bookscar.store"
echo ""
echo "2. Check Ingress status:"
echo "   kubectl get ingress -n $NAMESPACE"
echo ""
echo "3. Check SSL certificate status:"
echo "   kubectl get certificate -n $NAMESPACE"
echo "   kubectl describe certificate bookstore-tls -n $NAMESPACE"
echo ""
echo "4. Access the application:"
echo "   https://bookscar.store"
echo ""

echo -e "${GREEN}=========================================="
echo "Configuration Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Configure DNS in GoDaddy (see instructions above)"
echo "2. Wait for DNS propagation"
echo "3. Verify SSL certificate is issued"
echo "4. Access your application at https://bookscar.store"
echo ""
