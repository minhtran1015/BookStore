# 🧪 BookStoreApp - Isolated Container Testing Guide

## 🎯 Testing Strategy Overview

Since your microservices have dependencies, we'll test them in **isolation phases**:

### Phase 1: Infrastructure Testing
### Phase 2: Individual Service Testing
### Phase 3: Integration Testing

---

## 🏗️ Phase 1: Infrastructure Testing

Start only the core infrastructure services that everything depends on:

```bash
# Start infrastructure only
docker-compose up -d bookstore-mysql-db bookstore-consul-discovery bookstore-zipkin

# Wait for MySQL to be ready (check logs)
docker logs -f bookstore-mysql-db
# Look for: "ready for connections"

# Test infrastructure health
curl -s http://localhost:8500/v1/status/leader  # Consul leader
curl -s http://localhost:9411/zipkin/          # Zipkin UI
```

**Expected Results:**
- ✅ MySQL: Port 3306 accessible
- ✅ Consul: Returns leader information
- ✅ Zipkin: Returns HTML page

---

## 🔬 Phase 2: Individual Service Testing

Test each microservice **one at a time** with minimal dependencies:

### 2.1 Account Service (Most Independent)
```bash
# Start only account service
docker-compose up -d bookstore-account-service

# Wait for startup (check logs)
docker logs -f bookstore-account-service
# Look for: "Started BookstoreAccountServiceApplication"

# Test account service directly
curl -s http://localhost:4001/actuator/health
# Expected: {"status":"UP"}

# Test OAuth token generation
curl -s -u 93ed453e-b7ac-4192-a6d4-c45fae0d99ac:client.devd123 \
  http://localhost:4001/oauth/token \
  -d grant_type=password \
  -d username=admin.admin \
  -d password=admin.devd123
# Expected: JWT access_token in response
```

### 2.2 Catalog Service (Database Dependent)
```bash
# Start only catalog service
docker-compose up -d bookstore-catalog-service

# Wait for startup (may take 3-5 minutes due to Flyway migrations)
docker logs -f bookstore-catalog-service
# Look for: "Started BookstoreCatalogServiceApplication"

# Test catalog service health
curl -s http://localhost:6001/actuator/health
# Expected: {"status":"UP"}
```

### 2.3 Billing Service
```bash
# Start only billing service
docker-compose up -d bookstore-billing-service

# Test billing service
curl -s http://localhost:5001/actuator/health
# Expected: {"status":"UP"}
```

### 2.4 Order Service
```bash
# Start only order service
docker-compose up -d bookstore-order-service

# Test order service
curl -s http://localhost:7001/actuator/health
# Expected: {"status":"UP"}
```

### 2.5 Payment Service
```bash
# Start only payment service
docker-compose up -d bookstore-payment-service

# Test payment service
curl -s http://localhost:8001/actuator/health
# Expected: {"status":"UP"}
```

### 2.6 API Gateway (Service Discovery Dependent)
```bash
# Start API gateway (needs all services registered in Consul)
docker-compose up -d bookstore-zuul-api-gateway-server

# Test gateway health
curl -s http://localhost:8765/actuator/health
# Expected: {"status":"UP"}
```

---

## 🔗 Phase 3: Integration Testing

Once all services are tested individually, test the full system:

```bash
# Start all services
docker-compose up -d

# Test service discovery
curl -s http://localhost:8500/v1/catalog/services | jq .
# Expected: All 5 microservices + consul listed

# Test API gateway routing
curl -s http://localhost:8765/routes
# Expected: Route definitions for all services

# Test end-to-end flow
# 1. Get auth token
TOKEN=$(curl -s -u 93ed453e-b7ac-4192-a6d4-c45fae0d99ac:client.devd123 \
  http://localhost:4001/oauth/token \
  -d grant_type=password \
  -d username=admin.admin \
  -d password=admin.devd123 | jq -r .access_token)

# 2. Test API through gateway
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8765/api/catalog/books
# Expected: Book catalog data
```

---

## 🛠️ Testing Tools & Commands

### Quick Health Check All Services
```bash
# Check all running containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Health check script
for port in 4001 5001 6001 7001 8001 8765; do
  echo "Testing port $port:"
  curl -s http://localhost:$port/actuator/health | jq .status 2>/dev/null || echo "Not responding"
  echo "---"
done
```

### Service Logs Monitoring
```bash
# Monitor all service logs
docker-compose logs -f

# Monitor specific service
docker logs -f bookstore-account-service

# Check for errors across all services
docker-compose logs | grep -i error
```

### Database Testing
```bash
# Connect to MySQL directly
docker exec -it bookstore-mysql-db mysql -u bookstoreDBA -pPaSSworD bookstore_db

# Check if tables exist
docker exec bookstore-mysql-db mysql -u bookstoreDBA -pPaSSworD bookstore_db \
  -e "SHOW TABLES;"
```

### Consul Service Discovery Testing
```bash
# List all registered services
curl -s http://localhost:8500/v1/catalog/services | jq .

# Check specific service health
curl -s http://localhost:8500/v1/health/service/bookstore-account-service | jq .

# Check service discovery from a container
docker exec bookstore-account-service curl -s consul:8500/v1/catalog/services
```

---

## 🚨 Troubleshooting Failed Tests

### Service Won't Start
```bash
# Check service logs
docker logs <service-name>

# Check if dependencies are running
docker ps | grep <dependency-name>

# Restart specific service
docker-compose restart <service-name>
```

### Database Connection Issues
```bash
# Check MySQL logs
docker logs bookstore-mysql-db

# Test MySQL connectivity
docker exec bookstore-mysql-db mysqladmin ping -u bookstoreDBA -pPaSSworD

# Reset database if needed
docker-compose down -v  # WARNING: Deletes all data
docker-compose up -d bookstore-mysql-db
```

### Service Discovery Issues
```bash
# Check Consul logs
docker logs bookstore-consul-discovery

# Force service re-registration
docker-compose restart <service-name>

# Check network connectivity
docker exec <service-name> ping consul
```

---

## 📊 Testing Checklist

- [ ] Infrastructure services running (MySQL, Consul, Zipkin)
- [ ] Account service OAuth working
- [ ] Catalog service database connectivity
- [ ] All microservices health endpoints responding
- [ ] API Gateway routing functional
- [ ] Service discovery registration complete
- [ ] End-to-end API flow working
- [ ] Monitoring dashboards accessible

---

## 📊 Phase 4: Monitoring Stack Testing

Test the complete observability stack for metrics collection and visualization:

### 4.1 Start Monitoring Services
```bash
# Start monitoring infrastructure
docker-compose up -d bookstore-influxdb bookstore-prometheus bookstore-telegraf bookstore-grafana

# Wait for services to initialize (30-60 seconds)
sleep 30
```

### 4.2 Test Monitoring Components

**InfluxDB (Time-series Database):**
```bash
# Health check
curl -s http://localhost:8086/health
# Expected: {"status":"pass"}

# Access UI: http://localhost:8086
# Default login: admin / 12345678 (if prompted)
```

**Prometheus (Metrics Collection):**
```bash
# Readiness check
curl -s http://localhost:9090/-/ready
# Expected: "Prometheus Server is Ready."

# Access UI: http://localhost:9090
# Query metrics: http://localhost:9090/graph
```

**Telegraf (Metrics Agent):**
```bash
# Check if running
docker ps | grep telegraf
# Should show: bookstore-telegraf

# View recent logs
docker logs bookstore-telegraf 2>&1 | tail -5
# Should show metrics collection without errors
```

**Grafana (Dashboards):**
```bash
# Health check
curl -s http://localhost:3030/api/health | jq .
# Expected: {"database":"ok","version":"12.2.1",...}

# Access UI: http://localhost:3030
# Default login: admin / admin
```

**Chronograf (InfluxDB UI):**
```bash
# Health check
curl -s http://localhost:8888/chronograf/v1/ | jq .
# Expected: JSON response with API endpoints

# Access UI: http://localhost:8888
# Connect to InfluxDB v2 with:
# - URL: http://bookstore-influxdb:8086
# - Organization: bookstore
# - Token: BT2PIaHO3q9CyBZ7AT5yB1F_Vd-XqZVIx9J3zVAyHClvc0crtLUHviiUncoH97QnIaZi2ytMwTdtIG7uzeg-pA==
```

### 4.3 Configure Grafana Dashboards

1. **Add InfluxDB Data Source:**
   - Go to: http://localhost:3030 → Configuration → Data Sources → Add data source
   - Select: InfluxDB
   - URL: `http://bookstore-influxdb:8086`
   - Organization: `bookstore`
   - Token: `BT2PIaHO3q9CyBZ7AT5yB1F_Vd-XqZVIx9J3zVAyHClvc0crtLUHviiUncoH97QnIaZi2ytMwTdtIG7uzeg-pA==`
   - Bucket: `telegraf`
   - Save & Test

2. **Add Prometheus Data Source:**
   - Add another data source
   - Select: Prometheus
   - URL: `http://bookstore-prometheus:9090`
   - Save & Test

3. **Import Dashboards:**
   - Dashboards → Import
   - Use dashboard IDs: `1860` (Docker), `1443` (System), `3662` (Prometheus)

### 4.4 Verify Metrics Collection

**Check InfluxDB for Telegraf Data:**
```bash
# Query recent metrics
curl -s "http://localhost:8086/api/v2/query?org=bookstore" \
  -H "Authorization: Token BT2PIaHO3q9CyBZ7AT5yB1F_Vd-XqZVIx9J3zVAyHClvc0crtLUHviiUncoH97QnIaZi2ytMwTdtIG7uzeg-pA==" \
  -H "Content-Type: application/vnd.flux" \
  -d 'from(bucket: "telegraf") |> range(start: -5m) |> limit(n: 5)' | jq .
```

**Check Prometheus Targets:**
```bash
# View configured targets
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'
```

### 4.5 Monitoring Checklist
- [ ] InfluxDB accessible and healthy
- [ ] Prometheus collecting metrics
- [ ] Telegraf sending system metrics
- [ ] Grafana dashboards configured
- [ ] Chronograf connected to InfluxDB
- [ ] Data sources connected successfully
- [ ] Metrics visible in dashboards

**Note:** Kapacitor (alerting) is not compatible with InfluxDB v2 and has been excluded from the monitoring stack.

---

## 🎯 Quick Test Commands

```bash
# One-liner health check
for svc in account billing catalog order payment; do
  echo "Testing $svc-service:"
  curl -s http://localhost:$((${svc:0:1}000+1))/actuator/health | jq .status
done

# Full system test
echo "System Health Check:"
curl -s http://localhost:8500/v1/catalog/services | jq 'keys | length' | xargs echo "Services registered:"
curl -s http://localhost:8765/actuator/health | jq .status | xargs echo "Gateway status:"
```

This approach allows you to **catch issues early** and **test incrementally** rather than debugging a complex system all at once! 🧪✨