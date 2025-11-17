# BookStoreApp Microservices - AI Coding Agent Instructions

## System Architecture Overview

**BookStoreApp** is a distributed e-commerce microservices application using:
- **Backend:** Spring Boot microservices (Java 8+), Spring Cloud, Zuul API Gateway, Consul/Eureka service discovery
- **Frontend:** React.js with AI Chatbot (TogetherAI/Llama 3)
- **Database:** MySQL (shared single instance)
- **Deployment:** Docker Compose (local) or Kubernetes (production)
- **Monitoring:** Zipkin (distributed tracing), Prometheus + Grafana (metrics), TICK Stack (InfluxDB/Telegraf/Chronograf/Kapacitor)

### Core Services (5 microservices + 2 infrastructure)
- **bookstore-account-service** (port 4001): Authentication, OAuth2, JWT tokens, user/role management
- **bookstore-catalog-service** (port 6001): Book inventory, product data
- **bookstore-order-service** (port 7001): Order processing, shopping cart
- **bookstore-billing-service** (port 5001): Invoice generation, billing
- **bookstore-payment-service** (port 8001): Payment processing
- **bookstore-api-gateway-service** (port 8765): Zuul gateway, route definitions, request filtering
- **bookstore-eureka-discovery-service**: Service registry (alternative to Consul)

### Shared Modules
- **bookstore-commons**: Shared DTOs, domain models, utilities
- **bookstore-feign**: Feign client interfaces for inter-service communication

### Communication Flow (Kubernetes/Docker)
```
Client → API Gateway (Zuul:8765) → Consul Discovery → Target Microservice → MySQL
  ↓
All services → Zipkin (9411) for distributed tracing
All services → Prometheus metrics endpoint
```

---

## Critical Developer Workflows

### Build & Test
```bash
# From root directory - builds all modules (including commons/feign)
mvn clean install

# Build single service only
cd bookstore-account-service && mvn clean install -DskipTests

# Run tests for all services
mvn test

# Build Docker images (Maven + Dockerfile per service)
mvn clean install -DskipTests  # Prerequisites
```

### Local Development (Docker Compose - Recommended)
```bash
# Build all JARs first
mvn clean install -DskipTests

# Start all services with docker-compose
docker-compose up --build

# Stop services
docker-compose down

# View service logs
docker logs bookstore-account-service
```

### Kubernetes Deployment
```bash
# Build and push images (modify DOCKER_HUB_PREFIX in script first)
chmod +x build_and_push.sh
./build_and_push.sh docker-hub

# Deploy to cluster
kubectl create namespace bookstore
kubectl apply -f k8s/ -n bookstore

# Debug pods
kubectl logs <pod-name> -n bookstore
kubectl exec -it <pod-name> -n bookstore -- /bin/sh
```

### Service Access (Ports)
| Service | Local Docker | Kubernetes NodePort |
|---------|-------------|---------------------|
| API Gateway (Zuul) | 8765 | 30003 |
| Account Service | 4001 | 30004 |
| Catalog Service | 6001 | 30006 |
| Consul Discovery | 8500 | 30002 |
| Zipkin | 9411 | 30009 |
| Grafana | 3030 | 30011 |

---

## Project-Specific Conventions & Patterns

### Service Structure
Every microservice follows this structure:
```
bookstore-<service>-service/
├── src/main/java/com/devd/spring/bookstore<service>service/
│   ├── controller/          # @RestController endpoints
│   ├── service/impl/        # @Service business logic
│   ├── repository/          # @Repository (Spring Data JPA)
│   ├── config/
│   │   ├── SwaggerConfig    # Swagger/Springfox configuration
│   │   └── SecurityConfig   # OAuth2/JWT security
│   ├── exception/           # Custom exception handlers
│   └── <ServiceName>Application.java
├── src/main/resources/
│   └── application.yml      # Profiles: local (H2), mysql, docker
├── Dockerfile              # Multi-stage build using JAR_FILE build arg
└── dockerize               # Binary for wait-for service startup
```

### Configuration Profiles
- **local**: H2 in-memory DB, for development in IDE
- **mysql**: Remote MySQL (localhost:3306)
- **docker**: Docker Compose environment (connects via service hostname)

Set via `SPRING_PROFILES_ACTIVE` env var (see `application.yml` in each service).

### Service Discovery & Routing
- **Consul**: Used in Docker Compose and Kubernetes (preferred) - services auto-register
- **Eureka**: Used for local IDE development (less preferred)
- **Zuul Routes** defined in `bookstore-api-gateway-service/src/main/resources/application.yml`:
  ```yaml
  zuul:
    routes:
      billing:
        path: /api/billing/**
        serviceId: bookstore-billing-service
  ```

### Inter-Service Communication
- Use **Feign clients** from `bookstore-feign` module (see `*FeignClient.java`)
- Example: `@FeignClient("bookstore-account-service")` uses Consul/Eureka to locate service
- All Feign clients inherit from `bookstore-commons` module

### Data & ORM Patterns
- All services use **Spring Data JPA** with Hibernate
- Single MySQL database shared across all services
- **Flyway migrations** for schema versioning (table prefix per service)
  - Account Service: `account_service_flyway_history` table
  - Each service has migrations in `src/main/resources/db/migration/`
- **Entity mappings:** Dozer library used for DTO/Entity conversions

### Security & Authentication
- **Account Service** handles OAuth2 and JWT token generation
- **Example credentials:**
  - Admin: `admin.admin` / `admin.devd123`
  - User: `devd.cores` / `cores.devd123`
- **Get token** (Docker): 
  ```bash
  curl -u 93ed453e-b7ac-4192-a6d4-c45fae0d99ac:client.devd123 \
    http://localhost:4001/oauth/token \
    -d grant_type=password \
    -d username=admin.admin \
    -d password=admin.devd123
  ```

### Monitoring & Observability
- **Distributed Tracing:** Sleuth + Zipkin sends trace IDs in response headers
- **Metrics:** Micrometer configured with Prometheus registry
- **Log Format:** Logstash-encoded logs for ELK stack compatibility
- Every service has trace probability = 1.0 (100% sampling)

---

## Integration Points & External Dependencies

### Key Gradle/Maven Dependencies (in `pom.xml`)
- `spring-boot-starter-web`: REST endpoints
- `spring-cloud-starter-netflix-eureka-client`: Service discovery
- `spring-cloud-starter-sleuth` + `spring-cloud-starter-zipkin`: Distributed tracing
- `spring-security-oauth2` + `jjwt`: OAuth2 + JWT authentication
- `spring-boot-starter-data-jpa`: Database access
- `springfox-swagger2` + `springfox-swagger-ui`: API documentation (v3.0.0)
- `mysql-connector-java`: MySQL driver
- `flyway-core`: Database migrations
- `micrometer-registry-prometheus`: Prometheus metrics
- `spring-cloud-openfeign`: Inter-service HTTP calls

### Docker Build Context
- Each service has `Dockerfile` in root with: `FROM eclipse-temurin:8-jre` (optimal choice - JRE only, no JDK tools needed for production)
- Expects JAR at `target/<service>-0.0.1-SNAPSHOT.jar` (built by Maven)
- `dockerize` binary waits for MySQL availability before starting service
- **Note:** Use `eclipse-temurin:8-jre` instead of `openjdk:8-jdk-alpine` (deprecated) or `eclipse-temurin:8-jdk` (unnecessarily large for production)

### React Frontend Integration
- Located in `bookstore-frontend-react-app/`
- Connects to API Gateway at `http://localhost:8765` (configurable via `REACT_APP_API_URL`)
- Includes AI Chatbot with TogetherAI API key via `REACT_APP_TOGETHER_API_KEY`
- Uses Axios for HTTP calls to backend

---

## When Modifying Services

### Adding New Endpoints
1. Create controller in `bookstore-<service>/src/main/java/.../controller/`
2. Add business logic in `service/impl/`
3. Update Swagger config if adding new API version
4. If inter-service call needed: add method to corresponding `*FeignClient` in `bookstore-feign`

### Changing Database Schema
1. Create migration file: `bookstore-<service>/src/main/resources/db/migration/V<version>__<description>.sql`
2. Set `flyway.baseline-version` in `application.yml` if needed
3. All migrations prefix with service name (e.g., `account_service_` table prefix)

### Debugging Issues
- **Service can't connect to Consul:** Check `SPRING_PROFILES_ACTIVE=docker` is set in docker-compose.yml
- **Service timeout:** Check `ribbon.ConnectTimeout` and `hystrix.command.default.execution.isolation.thread.timeoutInMilliseconds` in gateway
- **JWT issues:** Verify `JWTKeystore.p12` and passwords in Account Service security config
- **Database migration fails:** Check `flyway.baseline-on-migrate: true` in profiles

---

## References
- **Root README:** `/README.md` - Full deployment and troubleshooting guide
- **Build Script:** `build_and_push.sh` - Docker image building for all services (modify DOCKER_HUB_PREFIX)
- **Kubernetes:** `k8s/` directory - YAML manifests for cluster deployment
- **Postman:** `Postman/BookStoreApp.postman_collection.json` - API requests and environment setup
