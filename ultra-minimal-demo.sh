#!/bin/bash

echo "🚀 ULTRA-MINIMAL DEMO - Single Service Setup"
echo "============================================="

# Deploy ONLY the account service with H2 database and LoadBalancer
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bookstore-demo
  namespace: bookstore
spec:
  replicas: 1
  selector:
    matchLabels:
      app: bookstore-demo
  template:
    metadata:
      labels:
        app: bookstore-demo
    spec:
      containers:
      - name: account
        image: gcr.io/lyrical-tooling-475815-i8/bookstore-account-service:amd64
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        ports:
        - containerPort: 4001
        env:
        - name: SERVER_PORT
          value: "4001"
        - name: SPRING_PROFILES_ACTIVE
          value: "local"
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 4001
          initialDelaySeconds: 120
          periodSeconds: 30
          timeoutSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 4001
          initialDelaySeconds: 60
          periodSeconds: 10
          timeoutSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: bookstore-demo
  namespace: bookstore
spec:
  type: LoadBalancer
  ports:
    - name: http
      port: 80
      targetPort: 4001
      protocol: TCP
  selector:
    app: bookstore-demo
EOF

echo "Deployment created. Waiting for pod to start..."
sleep 20

echo "Checking status..."
kubectl get pods -n bookstore -l app=bookstore-demo
kubectl get svc bookstore-demo -n bookstore

echo ""
echo "🎯 DEMO ENDPOINTS:"
echo "================="
EXTERNAL_IP=$(kubectl get svc bookstore-demo -n bookstore -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
if [ -n "$EXTERNAL_IP" ]; then
    echo "✅ Demo URL: http://$EXTERNAL_IP"
    echo "✅ Health Check: http://$EXTERNAL_IP/actuator/health"
    echo "✅ Swagger UI: http://$EXTERNAL_IP/swagger-ui.html"
    echo "✅ H2 Console: http://$EXTERNAL_IP/h2-console"
else
    echo "⏳ LoadBalancer IP still provisioning..."
    echo "Run: kubectl get svc bookstore-demo -n bookstore -w"
fi