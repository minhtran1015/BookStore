# BookStoreApp Microservices - Setup Progress

## ✅ Successfully Completed

### 1. **Fixed Java 21 + Lombok Compatibility Issues**
   - **Problem**: Project was targeting Java 1.8, but local system has Java 21 (ARM64 Apple Silicon)
   - **Error**: `IllegalAccessError` with Lombok annotation processor accessing javac internals
   - **Solution Applied**:
     - Updated Lombok to version 1.18.30 in all service pom.xml files
     - Added Maven Compiler Plugin 3.11.0 with JVM flags to open javac modules:
       ```xml
       <compilerArgs>
           <arg>-J--add-opens=jdk.compiler/com.sun.tools.javac.processing=ALL-UNNAMED</arg>
           <arg>-J--add-opens=jdk.compiler/com.sun.tools.javac.util=ALL-UNNAMED</arg>
       </compilerArgs>
       ```
   - **Files Modified**: 9 service pom.xml files + root pom.xml

### 2. **Built All Maven Modules** ✓ SUCCESS
   ```
   mvn clean install -DskipTests
   ```
   - **Build Time**: 12.19 seconds
   - **Result**: All 10 modules built successfully
   - **Modules**:
     - ✓ bookstore-commons
     - ✓ bookstore-feign
     - ✓ bookstore-application-parent
     - ✓ bookstore-api-gateway-service
     - ✓ bookstore-eureka-discovery-service
     - ✓ bookstore-account-service
     - ✓ bookstore-billing-service
     - ✓ bookstore-catalog-service
     - ✓ bookstore-order-service
     - ✓ bookstore-payment-service

### 3. **Fixed Docker Compatibility Issues**
   - **Problem**: MySQL 5.7 doesn't have ARM64 build for Apple Silicon
   - **Solution**: Updated `docker-compose.yml` to use MySQL 8.0 (ARM64 compatible)
   - **Change**: `image: mysql:5.7` → `image: mysql:8.0`

---

## 🚀 Next Steps to Get Services Running

### Step 1: Start Docker Compose
```bash
cd /Users/trandinhquangminh/Codespace/BookStore
docker-compose up --build
```

This will:
- Pull base Docker images for all services
- Build Docker images for all microservices (using pre-built JARs)
- Start all containers in the correct order

### Step 2: Configure Environment Variables
Before running, ensure your `.env` file has:
```bash
# Stripe API Key for Payment Service
STRIPE_API_KEY=sk_test_your_actual_stripe_key_here
# Get a real key from: https://dashboard.stripe.com/test/apikeys

# AI Chat Service API Key (optional)
REACT_APP_TOGETHER_API_KEY=your_together_ai_key_here
```

### Step 3: Wait for Services to Initialize
Expected startup time: **2-3 minutes**

Monitor progress with (in another terminal):
```bash
docker ps -a
docker logs -f bookstore-mysql-db  # Database initialization
docker logs -f bookstore-consul-discovery  # Service registry
```

### Step 4: Verify Services Are Running
Once Docker Compose is ready, access these UIs:

| Service | URL | Purpose |
|---------|-----|---------|
| API Gateway (Zuul) | http://localhost:8765 | Main entry point for API calls |
| Consul UI | http://localhost:8500 | Service registry and health check |
| React Frontend | http://localhost:3000 | Web application with AI chatbot |
| Zipkin | http://localhost:9411 | Distributed tracing |
| Prometheus | http://localhost:9090 | Metrics collection |
| Grafana | http://localhost:3030 | Metrics visualization (admin/admin) |

---

## 📊 Service Information

### Core Microservices (Running on ports 4001-8001)
- **Account Service** (4001): Authentication, OAuth2, JWT
- **Catalog Service** (6001): Book inventory, product data
- **Order Service** (7001): Order processing, shopping cart
- **Billing Service** (5001): Invoice generation
- **Payment Service** (8001): Payment processing
- **API Gateway** (8765): Zuul gateway, route definitions

### Infrastructure Services
- **Consul** (8500): Service discovery and health checks
- **MySQL** (3306): Shared database (changed from 5.7 to 8.0)
- **Zipkin** (9411): Distributed request tracing
- **Prometheus** (9090): Metrics collection
- **Grafana** (3030): Dashboard and visualization
- **InfluxDB** (8086): Time-series database
- **Chronograf** (8888): Alternative metrics UI
- **Telegraf**: Metrics collection agent
- **Kapacitor** (9092): Alerts and anomaly detection

---

## 🔧 Testing the Setup

### Get Access Token (after services are running)
```bash
curl -u 93ed453e-b7ac-4192-a6d4-c45fae0d99ac:client.devd123 \
  http://localhost:4001/oauth/token \
  -d grant_type=password \
  -d username=admin.admin \
  -d password=admin.devd123
```

### Call API Through Gateway
```bash
# List books (requires valid token)
curl -H "Authorization: Bearer <your-token>" \
  http://localhost:8765/api/catalog/books
```

---

## 📝 Files Modified

### Maven POM Files (Java build configuration)
- `/pom.xml` (root)
- `bookstore-account-service/pom.xml`
- `bookstore-api-gateway-service/pom.xml`
- `bookstore-billing-service/pom.xml`
- `bookstore-catalog-service/pom.xml`
- `bookstore-order-service/pom.xml`
- `bookstore-payment-service/pom.xml`
- `bookstore-eureka-discovery-service/pom.xml`
- `bookstore-feign/pom.xml`
- `bookstore-commons/pom.xml`

### Docker Configuration
- `docker-compose.yml` (MySQL version update)

### Generated Files
- `.github/copilot-instructions.md` (AI agent instructions)

---

## 🎯 Build Artifacts Location
All JARs are built and ready in: `/Users/trandinhquangminh/.m2/repository/com/devd/spring/`

JAR files location for Docker:
- `bookstore-account-service/target/bookstore-account-service-0.0.1-SNAPSHOT.jar`
- `bookstore-catalog-service/target/bookstore-catalog-service-0.0.1-SNAPSHOT.jar`
- etc.

Docker Compose will use these JARs to create Docker images.

---

## ⚠️ Important Notes

1. **Maven Compiler Configuration**: The compiler plugin configuration is critical for Java 21 compatibility with Lombok. Do not remove the `-J--add-opens` arguments.

2. **MySQL 8.0 vs 5.7**: MySQL 8.0 is fully compatible with the application code. No schema changes were needed.

3. **Database Initialization**: The first time MySQL starts, it will create the `bookstore_db` database and run Flyway migrations for each service (using table prefixes like `account_service_flyway_history`).

4. **Port Availability**: Ensure ports 3306, 4001, 5001, 6001, 7001, 8001, 8500, 8765, 8888, 9090, 9411, 3030 are available on your machine.

---

## � Common Issues & Solutions

### Issue 1: JPA Transaction Rollback in Billing Service
**Error**: `javax.persistence.RollbackException: Error while committing the transaction`

**Root Cause**: Strict country code validation rejecting valid ISO codes

**Solution Applied**: Updated address validation regex in:
- `bookstore-billing-service/src/main/java/com/devd/spring/bookstorebillingservice/repository/dao/AddressDao.java`
- `bookstore-billing-service/src/main/java/com/devd/spring/bookstorebillingservice/web/CreateAddressRequest.java`

**Change**:
```java
// Before (too strict - only uppercase)
@Pattern(regexp = "[A-Z]{2}", message = "2-letter ISO country code required")

// After (accepts both cases)
@Pattern(regexp = "[A-Za-z]{2}", message = "2-letter ISO country code required")
```

**Prevention**: Country codes should be case-insensitive in validation.

---

### Issue 2: Payment Customer Setup Error in Payment Service
**Error**: `Error while setting up payment customer` (without detailed cause)

**Root Cause**: Missing or invalid Stripe API key configuration

**Solution Applied**: 
1. Added startup validation in `BookstorePaymentServiceApplication.java`:
   ```java
   String stripeApiKey = System.getenv("STRIPE_API_KEY");
   if (stripeApiKey == null || stripeApiKey.isEmpty() || stripeApiKey.contains("your_stripe")) {
       System.err.println("WARNING: STRIPE_API_KEY is not properly configured. Payment functionality will not work.");
       System.err.println("Get a test key from: https://dashboard.stripe.com/test/apikeys");
       Stripe.apiKey = null; // Don't set invalid key
   } else {
       Stripe.apiKey = stripeApiKey;
       System.out.println("Stripe API key configured successfully.");
   }
   ```

2. Improved error messages in `PaymentMethodServiceImpl.java`:
   ```java
   private String createCustomerAtStripe() {
       // Check if Stripe API key is configured
       if (Stripe.apiKey == null || Stripe.apiKey.isEmpty() || Stripe.apiKey.contains("your_stripe")) {
           throw new RunTimeExceptionPlaceHolder("Stripe API key is not configured. Please set STRIPE_API_KEY in your environment variables.");
       }
       // ... rest of the method with better error logging
   }
   ```

**Fix Steps**:
1. Get a real Stripe test key from: https://dashboard.stripe.com/test/apikeys
2. Update `.env` file:
   ```bash
   STRIPE_API_KEY=sk_test_your_actual_stripe_key_here
   ```
3. Restart the payment service: `docker-compose up -d bookstore-payment-service`

**Prevention**: Always validate external service credentials at startup.

---

### Issue 3: Service Discovery Timing Issues
**Error**: `ZuulException` or 404 when calling services through API Gateway

**Root Cause**: Service discovery (Consul) needs time to register all services

**Solution**: Add small delays between service startup and testing:
```bash
# Wait for all services to be registered
sleep 10
curl http://localhost:8500/v1/catalog/services | jq .

# Then test API Gateway routing
curl http://localhost:8765/api/catalog/products
```

---

### Issue 4: InfluxDB Authorization Errors
**Error**: `InfluxDB: unauthorized access` when metrics publisher tries to write

**Root Cause**: InfluxDB credentials not properly configured (non-critical)

**Status**: These are warnings only and don't affect core functionality. Services continue to work normally.

**Note**: Can be fixed by:
1. Setting InfluxDB username/password in docker-compose.yml
2. Or disabling metrics export in application-docker.yml if not needed

---

## 💡 Debugging Commands

### View All Running Services
```bash
docker-compose ps
```

### Check Service Health
```bash
# API Gateway
curl http://localhost:8765/actuator/health

# Catalog Service
curl http://localhost:6001/actuator/health

# All services registered in Consul
curl http://localhost:8500/v1/catalog/services | jq .
```

### View Service-Specific Logs
```bash
# Billing Service (transaction errors)
docker-compose logs bookstore-billing-service | grep -i "rollback\|transaction\|error"

# Payment Service (Stripe errors)
docker-compose logs bookstore-payment-service | grep -i "stripe\|payment\|customer"

# API Gateway (routing errors)
docker-compose logs bookstore-zuul-api-gateway-server | grep -i "error\|exception"
```

### Test API Through Gateway
```bash
# List products
curl "http://localhost:8765/api/catalog/products?page=0&size=5"

# Test authentication (replace with real token)
curl -H "Authorization: Bearer <your-token>" \
  "http://localhost:8765/api/order/orders"
```

### Check Service Registration Timing
```bash
# Check when services register in Consul
watch -n 2 "curl -s http://localhost:8500/v1/catalog/services | jq '.'"
```

---

## 📋 Testing Checklist

- [ ] All services report `{"status":"UP"}` on health endpoints
- [ ] All services show in Consul service discovery
- [ ] API Gateway can route requests to individual services
- [ ] Database migrations completed (check MySQL logs)
- [ ] Frontend loads at http://localhost:3000
- [ ] Can get OAuth token from account service
- [ ] Can browse products through API Gateway
- [ ] Zipkin shows traces (optional, for monitoring)
- [ ] Grafana shows metrics (optional, for monitoring)



---

## 📚 References

- **Quick Start Guide**: See [QUICK_START.md](./QUICK_START.md) for 30-second setup
- **Troubleshooting Guide**: See [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md) for known issues
- **Architecture Details**: See `.github/copilot-instructions.md`
- **Full Documentation**: See `README.md`
- **API Testing**: Use `Postman/BookStoreApp.postman_collection.json`

