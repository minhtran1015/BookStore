#!/bin/bash

# Quick fix and monitor script
echo "🔧 Fixing deployment issues..."

# Fix MariaDB deployment - force delete and recreate
echo "1. Fixing MariaDB deployment..."
kubectl get deployment bookstore-mysql-db -n bookstore -o yaml | grep "image:" | head -1
kubectl delete deployment bookstore-mysql-db -n bookstore --force --grace-period=0
sleep 5

# Apply correct MariaDB deployment
cat > /tmp/mariadb-fix.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bookstore-mysql-db
  namespace: bookstore
spec:
  replicas: 1
  selector:
    matchLabels:
      app: bookstore-mysql-db
  template:
    metadata:
      labels:
        app: bookstore-mysql-db
    spec:
      containers:
      - name: mysql
        image: mariadb:10.6
        resources:
          requests:
            memory: "64Mi"
            cpu: "10m"
          limits:
            memory: "128Mi"
            cpu: "50m"
        ports:
        - containerPort: 3306
        env:
        - name: MYSQL_DATABASE
          value: "bookstore_db"
        - name: MYSQL_USER
          value: "bookstoreDBA"
        - name: MYSQL_PASSWORD
          value: "PaSSworD"
        - name: MYSQL_ROOT_PASSWORD
          value: "r00tPaSSworD"
EOF

kubectl apply -f /tmp/mariadb-fix.yaml
echo "✅ MariaDB deployment fixed"

# Fix account service image
echo "2. Fixing account service image..."
kubectl patch deployment bookstore-account-service -n bookstore --patch='{"spec":{"template":{"spec":{"containers":[{"name":"account","image":"gcr.io/lyrical-tooling-475815-i8/bookstore-account-service:amd64"}]}}}}'
echo "✅ Account service image updated"

# Monitor function
monitor_progress() {
    local count=0
    while [ $count -lt 20 ]; do
        echo ""
        echo "📊 Status Check #$((count + 1)) - $(date +%H:%M:%S)"
        echo "================================"
        
        # Check MariaDB
        MYSQL_POD=$(kubectl get pods -n bookstore -l app=bookstore-mysql-db -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
        if [ -n "$MYSQL_POD" ]; then
            echo "🗄️  MariaDB: $MYSQL_POD"
            echo "   Image: $(kubectl get pod $MYSQL_POD -n bookstore -o jsonpath='{.spec.containers[0].image}' 2>/dev/null || echo 'Unknown')"
            echo "   Status: $(kubectl get pod $MYSQL_POD -n bookstore -o jsonpath='{.status.phase}' 2>/dev/null || echo 'Unknown')"
            
            # Check for ready state
            if kubectl logs $MYSQL_POD -n bookstore 2>/dev/null | grep -q "ready for connections"; then
                if kubectl logs $MYSQL_POD -n bookstore 2>/dev/null | grep -q "port: 3306"; then
                    echo "   ✅ MariaDB ready for connections!"
                else
                    echo "   ⏳ MariaDB ready but still initializing..."
                fi
            else
                echo "   🔄 MariaDB starting up..."
            fi
        else
            echo "🗄️  MariaDB: No pod found"
        fi
        
        # Check Account Service
        ACCOUNT_POD=$(kubectl get pods -n bookstore -l app=bookstore-account-service --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
        if [ -n "$ACCOUNT_POD" ]; then
            echo "👤 Account Service: $ACCOUNT_POD"
            echo "   Image: $(kubectl get pod $ACCOUNT_POD -n bookstore -o jsonpath='{.spec.containers[0].image}' 2>/dev/null || echo 'Unknown')"
            if kubectl logs $ACCOUNT_POD -n bookstore 2>/dev/null | grep -q "Started.*Application"; then
                echo "   ✅ Service started successfully!"
            else
                echo "   ⏳ Waiting for startup..."
            fi
        else
            echo "👤 Account Service: No running pod found"
        fi
        
        # Check endpoints
        echo "🌐 Service Endpoints:"
        kubectl get endpoints bookstore-mysql-db -n bookstore 2>/dev/null | grep -v "NAME" | awk '{if($2) print "   MySQL: " $2; else print "   MySQL: No endpoints"}'
        
        # Resource usage
        echo "📈 Resource Usage:"
        kubectl top nodes 2>/dev/null | grep -v "NAME" | while read node cpu cpupct mem mempct; do
            echo "   Node $node: CPU $cpupct, Memory $mempct"
        done
        
        count=$((count + 1))
        if [ $count -lt 20 ]; then
            echo "Waiting 30 seconds for next check..."
            sleep 30
        fi
    done
}

echo ""
echo "Starting monitoring (20 cycles, 30s each)..."
monitor_progress

echo ""
echo "🎯 Monitoring complete. Final status:"
kubectl get pods -n bookstore | grep -E "(mysql|account)"