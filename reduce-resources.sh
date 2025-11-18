#!/bin/bash

# Script to reduce resource requirements for all microservices

echo "Reducing resource requirements for better cluster fit..."

# Get all deployments in bookstore namespace
deployments=$(kubectl get deployments -n bookstore -o name | grep -E "(account|billing|catalog|order|payment|zuul)")

for deployment in $deployments; do
    echo "Updating resource limits for $deployment"
    
    # Reduce CPU and memory limits/requests
    kubectl patch $deployment -n bookstore -p '{
        "spec": {
            "template": {
                "spec": {
                    "containers": [{
                        "name": "'$(echo $deployment | cut -d'/' -f2 | sed 's/bookstore-//' | sed 's/-service.*//')'"',
                        "resources": {
                            "requests": {
                                "memory": "64Mi",
                                "cpu": "50m"
                            },
                            "limits": {
                                "memory": "256Mi", 
                                "cpu": "200m"
                            }
                        }
                    }]
                }
            }
        }
    }' --type='merge' 2>/dev/null || echo "Failed to patch $deployment, trying alternative approach"
done

echo "Resource reduction complete. Waiting for pods to restart..."