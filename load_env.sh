#!/bin/bash

# BookStore Environment Loader
# This script loads environment variables from .env file for local development

set -a  # automatically export all variables

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.example to .env and fill in your values:"
    echo "  cp .env.example .env"
    exit 1
fi

# Load environment variables from .env file
source .env

set +a  # stop automatically exporting

echo "✅ Environment variables loaded from .env file"
echo "📋 Available variables:"
echo "  - DOCKERHUB_USERNAME: ${DOCKERHUB_USERNAME:-'not set'}"
echo "  - DOCKER_HUB_PREFIX: ${DOCKER_HUB_PREFIX:-'not set'}"
echo "  - GH_TOKEN: ${GH_TOKEN:+'set (hidden)'}"
echo "  - STRIPE_API_KEY: ${STRIPE_API_KEY:+'set (hidden)'}"
echo "  - REACT_APP_GEMINI_API_KEY: ${REACT_APP_GEMINI_API_KEY:+'set (hidden)'}"
echo ""
echo "💡 To use these variables in your current shell, run:"
echo "  source load_env.sh"
echo ""
echo "💡 To use in build scripts:"
echo "  ./load_env.sh && ./build_and_push.sh"