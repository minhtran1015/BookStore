#!/bin/bash

echo "🔥 AGGRESSIVE DEMO SETUP - Minimal BookStore for Cloud Demo"
echo "=============================================="

# 1. Delete everything non-essential
echo "Step 1: Nuclear cleanup of non-essential services..."
kubectl delete deployment -n bookstore \
  bookstore-billing-service \
  bookstore-catalog-service \
  bookstore-order-service \
  bookstore-payment-service \
  bookstore-chronograf \
  bookstore-grafana \
  bookstore-influxdb \
  bookstore-kapacitor \
  bookstore-prometheus \
  bookstore-telegraf \
  bookstore-zipkin \
  frontend-deployment \
  eureka-server-deployment \
  --ignore-not-found=true

# 2. Use H2 in-memory database instead of MySQL/MariaDB
echo "Step 2: Switching to H2 in-memory database..."
kubectl delete deployment bookstore-mysql-db -n bookstore --ignore-not-found=true
kubectl delete svc bookstore-mysql-db -n bookstore --ignore-not-found=true

# 3. Deploy only account service with H2 (local profile)
echo "Step 3: Deploying minimal account service with H2..."
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bookstore-account-service-minimal
  namespace: bookstore
spec:
  replicas: 1
  selector:
    matchLabels:
      app: bookstore-account-service-minimal
  template:
    metadata:
      labels:
        app: bookstore-account-service-minimal
    spec:
      containers:
      - name: account
        image: gcr.io/lyrical-tooling-475815-i8/bookstore-account-service:amd64
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "200m"
        ports:
        - containerPort: 4001
        env:
        - name: SERVER_PORT
          value: "4001"
        - name: SPRING_PROFILES_ACTIVE
          value: "local"
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 4001
          initialDelaySeconds: 60
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 4001
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: bookstore-account-service-minimal
  namespace: bookstore
spec:
  type: LoadBalancer
  ports:
    - port: 80
      targetPort: 4001
      protocol: TCP
  selector:
    app: bookstore-account-service-minimal
EOF

# 4. Deploy super minimal API gateway
echo "Step 4: Deploying minimal API gateway..."
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bookstore-gateway-minimal
  namespace: bookstore
spec:
  replicas: 1
  selector:
    matchLabels:
      app: bookstore-gateway-minimal
  template:
    metadata:
      labels:
        app: bookstore-gateway-minimal
    spec:
      containers:
      - name: gateway
        image: gcr.io/lyrical-tooling-475815-i8/bookstore-api-gateway-service:amd64
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "200m"
        ports:
        - containerPort: 8765
        env:
        - name: SERVER_PORT
          value: "8765"
        - name: SPRING_PROFILES_ACTIVE
          value: "local"
---
apiVersion: v1
kind: Service
metadata:
  name: bookstore-gateway-minimal
  namespace: bookstore
spec:
  type: LoadBalancer
  ports:
    - port: 80
      targetPort: 8765
      protocol: TCP
  selector:
    app: bookstore-gateway-minimal
EOF

echo "Step 5: Waiting for deployments..."
sleep 30

echo "Step 6: Checking status..."
kubectl get pods -n bookstore -l app=bookstore-account-service-minimal
kubectl get pods -n bookstore -l app=bookstore-gateway-minimal

echo "Step 7: Getting LoadBalancer IPs..."
echo "Account Service:"
kubectl get svc bookstore-account-service-minimal -n bookstore
echo "Gateway Service:"  
kubectl get svc bookstore-gateway-minimal -n bookstore

echo ""
echo "🎉 MINIMAL DEMO SETUP COMPLETE!"
echo "=============================================="
echo "✅ H2 in-memory database (no external DB needed)"
echo "✅ Account service with authentication"
echo "✅ API Gateway for routing"
echo "✅ LoadBalancer services for external access"
echo "✅ Minimal resource usage"
echo ""
echo "Demo endpoints will be available at the LoadBalancer IPs above"
echo "Test with: curl http://<ACCOUNT_SERVICE_IP>/actuator/health"