#!/bin/bash

# BookStore Deployment Monitoring Dashboard
# Real-time monitoring of GKE deployment status

echo "📊 BookStore Deployment Monitor - $(date)"
echo "============================================"

# Function to show resource usage
show_resources() {
    echo "🔧 Node Resource Usage:"
    kubectl top nodes 2>/dev/null || echo "  Metrics server not available"
    echo ""
}

# Function to show pod status
show_pods() {
    echo "🚀 Core Services Status:"
    kubectl get pods -n bookstore -l 'app in (bookstore-mysql-db,bookstore-account-service,bookstore-consul-discovery,bookstore-zuul-api-gateway-server)' -o wide
    echo ""
}

# Function to show service endpoints
show_endpoints() {
    echo "🌐 Service Endpoints:"
    kubectl get svc,endpoints -n bookstore | grep -E "(NAME|mysql|account|zuul|consul)"
    echo ""
}

# Function to check MariaDB status
check_mariadb() {
    echo "🗄️  MariaDB Status:"
    MYSQL_POD=$(kubectl get pods -n bookstore -l app=bookstore-mysql-db -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    if [ -n "$MYSQL_POD" ]; then
        echo "  Pod: $MYSQL_POD"
        echo "  Image: $(kubectl get pod $MYSQL_POD -n bookstore -o jsonpath='{.spec.containers[0].image}')"
        echo "  Status: $(kubectl get pod $MYSQL_POD -n bookstore -o jsonpath='{.status.phase}')"
        
        # Check if MariaDB is ready for connections
        READY_LOG=$(kubectl logs $MYSQL_POD -n bookstore 2>/dev/null | grep -E "(ready for connections|port.*3306)" | tail -1)
        if [[ $READY_LOG == *"ready for connections"* ]]; then
            if [[ $READY_LOG == *"port: 3306"* ]]; then
                echo "  ✅ MariaDB ready and accepting connections"
            else
                echo "  ⏳ MariaDB ready but initializing (temporary server)"
            fi
        else
            echo "  🔄 MariaDB still initializing..."
        fi
    else
        echo "  ❌ No MariaDB pod found"
    fi
    echo ""
}

# Function to check account service
check_account_service() {
    echo "👤 Account Service Status:"
    ACCOUNT_POD=$(kubectl get pods -n bookstore -l app=bookstore-account-service -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    if [ -n "$ACCOUNT_POD" ]; then
        echo "  Pod: $ACCOUNT_POD"
        echo "  Status: $(kubectl get pod $ACCOUNT_POD -n bookstore -o jsonpath='{.status.phase}')"
        
        # Check connection attempts
        CONN_LOG=$(kubectl logs $ACCOUNT_POD -n bookstore 2>/dev/null | tail -3 | grep -o "dial tcp.*:3306" | tail -1)
        if [ -n "$CONN_LOG" ]; then
            echo "  🔌 Connection attempt: $CONN_LOG"
        fi
        
        # Check if service is running
        if kubectl logs $ACCOUNT_POD -n bookstore 2>/dev/null | grep -q "Started.*Application"; then
            echo "  ✅ Application started successfully"
        else
            echo "  ⏳ Waiting for database connection..."
        fi
    else
        echo "  ❌ No account service pod found"
    fi
    echo ""
}

# Function to show deployment overview
show_deployments() {
    echo "📋 Deployment Overview:"
    kubectl get deployments -n bookstore -o custom-columns="NAME:.metadata.name,READY:.status.readyReplicas,DESIRED:.spec.replicas,IMAGE:.spec.template.spec.containers[0].image" | head -10
    echo ""
}

# Main monitoring loop
monitor() {
    while true; do
        clear
        echo "📊 BookStore Real-Time Monitor - $(date)"
        echo "========================================================"
        
        show_resources
        show_pods
        show_endpoints
        check_mariadb
        check_account_service
        show_deployments
        
        echo "Press Ctrl+C to stop monitoring"
        echo "Next update in 30 seconds..."
        sleep 30
    done
}

# Check if running in watch mode
if [ "$1" = "--watch" ]; then
    monitor
else
    # Single run
    show_resources
    show_pods
    show_endpoints
    check_mariadb
    check_account_service
    show_deployments
fi