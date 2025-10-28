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
cd /Users/trandinhquangminh/Codespace/BookStoreApp-Microservice-App
docker-compose up --build
```

This will:
- Pull base Docker images for all services
- Build Docker images for all microservices (using pre-built JARs)
- Start all containers in the correct order

### Step 2: Wait for Services to Initialize
Expected startup time: **2-3 minutes**

Monitor progress with (in another terminal):
```bash
docker ps -a
docker logs -f bookstore-mysql-db  # Database initialization
docker logs -f bookstore-consul-discovery  # Service registry
```

### Step 3: Verify Services Are Running
Once Docker Compose is ready, access these UIs:

| Service | URL | Purpose |
|---------|-----|---------|
| API Gateway (Zuul) | http://localhost:8765 | Main entry point for API calls |
| Consul UI | http://localhost:8500 | Service registry and health check |
| Zipkin | http://localhost:9411 | Distributed tracing |
| Prometheus | http://localhost:9090 | Metrics collection |
| Grafana | http://localhost:3030 | Metrics visualization |
| Chronograf | http://localhost:8888 | Alternative metrics UI |

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

## 💡 Troubleshooting

### If Docker Compose fails to start:
```bash
# Clean up old containers
docker-compose down -v

# Remove old images (if needed)
docker rmi bookstore-*

# Try again
docker-compose up --build
```

### If MySQL fails to initialize:
```bash
# Check MySQL logs
docker logs bookstore-mysql-db

# MySQL 8.0 might need root password setup on first run
```

### If services can't connect to each other:
- Check Consul UI at http://localhost:8500
- Ensure all services are registered
- Verify network connectivity between containers: `docker network ls`

---

## 📚 References

- **Architecture Details**: See `.github/copilot-instructions.md`
- **Full Documentation**: See `README.md`
- **API Testing**: Use `Postman/BookStoreApp.postman_collection.json`

