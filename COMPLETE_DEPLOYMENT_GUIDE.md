# BookStoreApp Microservices - Complete Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the complete BookStoreApp microservices e-commerce application from scratch. The application includes a React frontend with AI-powered chat, Spring Boot microservices, MySQL database, and monitoring stack.

### Architecture

**Core Services:**
- **bookstore-account-service** (port 4001): Authentication, OAuth2, JWT tokens, user management
- **bookstore-catalog-service** (port 6001): Product inventory, book data
- **bookstore-order-service** (port 7001): Order processing, shopping cart
- **bookstore-billing-service** (port 5001): Invoice generation, billing
- **bookstore-payment-service** (port 8001): Payment processing
- **bookstore-api-gateway-service** (port 8765): Zuul API gateway, service routing

**Infrastructure:**
- **MySQL Database** (port 3306): Shared database for all services
- **Consul Service Discovery** (port 8500): Service registration and discovery
- **Eureka Discovery Service**: Alternative service discovery (not used in Docker)
- **Zipkin** (port 9411): Distributed tracing
- **React Frontend** (port 3000): Web UI with AI chat functionality

**Monitoring Stack:**
- **InfluxDB** (port 8086): Time-series database
- **Prometheus** (port 9090): Metrics collection
- **Telegraf** (port 8125 UDP): System metrics agent
- **Grafana** (port 3030): Dashboards (admin/admin)
- **Chronograf** (port 8888): InfluxDB web UI

## Prerequisites

### System Requirements
- **Docker**: 28.5.1 or later
- **Docker Compose**: v2.40.0 or later
- **Git**: For cloning the repository
- **Minimum Resources**: 4GB RAM, 10GB disk space

### Environment Setup
```bash
# Verify Docker installation
docker --version
docker-compose --version

# Ensure Docker daemon is running
docker info
```

## Step 1: Clone and Prepare the Repository

```bash
# Clone the repository
git clone https://github.com/DatPhan06/BookStoreApp-Microservice-App.git
cd BookStoreApp-Microservice-App

# Build all microservices (this may take several minutes)
mvn clean install -DskipTests
```

## Step 2: Environment Configuration

### Frontend Configuration
The frontend is already configured to use the correct local development URLs. No changes needed.

### Docker Compose Configuration
The `docker-compose.yml` file is pre-configured with all necessary services and environment variables.

**Key Environment Variables:**
- `REACT_APP_API_URL=http://bookstore-zuul-api-gateway-server:8765` - Frontend API gateway URL
- `REACT_APP_TOGETHER_API_KEY` - AI service API key (optional)

## Step 3: Database Setup

The MySQL database will be automatically initialized with Flyway migrations when containers start. Each service has its own migration scripts in `src/main/resources/db/migration/`.

**Default Database Configuration:**
- Database: `bookstore_db`
- Username: `root`
- Password: `root`
- Port: `3306`

## Step 4: Deploy the Application

### Option A: Full System Deployment (Recommended)
```bash
# Start all services (this will take several minutes for initial build)
docker-compose up -d --build

# Monitor startup logs
docker-compose logs -f
```

### Option B: Step-by-Step Startup (For Troubleshooting)

If you encounter issues with the full deployment, use this step-by-step approach to identify and resolve problems incrementally:

#### Step 1: Start Infrastructure First
```bash
# Start only the core infrastructure services
docker-compose up -d mysql consul zipkin

# Wait 2-3 minutes for services to be ready
sleep 180

# Verify infrastructure is running
docker-compose ps mysql consul zipkin
```

#### Step 2: Start Monitoring Stack
```bash
# Add monitoring services
docker-compose up -d influxdb prometheus telegraf grafana chronograf

# Wait for monitoring services to initialize
sleep 60

# Verify monitoring services
curl -I http://localhost:3030  # Grafana
curl -I http://localhost:9090  # Prometheus
```

#### Step 3: Start Microservices One by One
```bash
# Start account service first (handles authentication)
docker-compose up -d bookstore-account-service
sleep 30

# Verify account service
curl -I http://localhost:4001/health

# Start catalog service
docker-compose up -d bookstore-catalog-service
sleep 30

# Verify catalog service and data
curl http://localhost:6001/products | jq '.content | length'

# Start remaining services
docker-compose up -d bookstore-order-service bookstore-billing-service bookstore-payment-service
sleep 60

# Verify all microservices
docker-compose ps | grep -E "(account|catalog|order|billing|payment)"
```

#### Step 4: Start API Gateway
```bash
# Start the API gateway last
docker-compose up -d bookstore-zuul-api-gateway-server
sleep 30

# Test API gateway routes
curl http://localhost:8765/routes
curl http://localhost:8765/api/catalog/products | jq '.page.totalElements'
```

#### Step 5: Start Frontend
```bash
# Finally start the React frontend
docker-compose up -d bookstore-frontend

# Verify frontend
curl -I http://localhost:3000
curl -I http://localhost:3000/register
```

#### Troubleshooting Checks at Each Step

**After Infrastructure Startup:**
```bash
# Check MySQL is ready
docker-compose exec mysql mysql -u root -proot -e "SHOW DATABASES;"

# Check Consul service discovery
curl http://localhost:8500/v1/catalog/services | jq '.'

# Check Zipkin
curl -I http://localhost:9411
```

**After Each Microservice:**
```bash
# Check service health
docker-compose logs [service-name] | tail -20

# Check service registration in Consul
curl http://localhost:8500/v1/health/service/[service-name]

# Test service-specific endpoints
# Account: curl http://localhost:4001/health
# Catalog: curl http://localhost:6001/products?page=0&size=1
# Order: curl http://localhost:7001/health
# Billing: curl http://localhost:5001/health
# Payment: curl http://localhost:8001/health
```

**If Services Fail to Start:**
```bash
# Check for port conflicts
netstat -tulpn | grep -E "(4001|6001|7001|5001|8001|8765|3306|8500)"

# Check Docker resources
docker system df

# Clean up and retry
docker-compose down
docker system prune -f
docker-compose up -d --build [service-name]
```

### Service Startup Order
The services will start in the correct dependency order due to Docker Compose configuration:

1. **Infrastructure**: MySQL, Consul, Zipkin
2. **Monitoring**: InfluxDB, Prometheus, Telegraf, Grafana, Chronograf
3. **Microservices**: Account, Catalog, Order, Billing, Payment, API Gateway
4. **Frontend**: React application

### Expected Startup Time
- Initial build: 10-15 minutes
- Container startup: 2-3 minutes
- Service registration: 1-2 minutes
- **Total time**: ~15-20 minutes

## Step 5: Verify Deployment

### Check Service Status
```bash
# Verify all containers are running
docker-compose ps

# Expected output should show all services as "Up"
```

### Test API Gateway
```bash
# Test API gateway health
curl -s http://localhost:8765/health

# Test catalog service
curl -s http://localhost:8765/api/catalog/products | jq '.page.content[0].productName'
```

### Test Frontend
```bash
# Test frontend accessibility
curl -I http://localhost:3000

# Test registration page (SPA routing)
curl -I http://localhost:3000/register
```

### Test User Registration
```bash
# Test signup API directly
curl -X POST http://localhost:8765/api/account/signup \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "testuser",
    "firstName": "Test",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test Authentication
```bash
# Get access token
curl -u 93ed453e-b7ac-4192-a6d4-c45fae0d99ac:client.devd123 \
  http://localhost:4001/oauth/token \
  -d grant_type=password \
  -d username=admin.admin \
  -d password=admin.devd123
```

### Test Monitoring Stack
```bash
# Grafana (admin/admin)
curl -I http://localhost:3030

# Prometheus
curl -I http://localhost:9090

# Zipkin
curl -I http://localhost:9411

# Consul
curl -I http://localhost:8500
```

## Step 6: Access the Application

### Web Interface
- **Frontend**: http://localhost:3000
- **Admin Login**: username: `admin.admin`, password: `admin.devd123`

### Service Endpoints
| Service | URL | Description |
|---------|-----|-------------|
| API Gateway | http://localhost:8765 | Main entry point |
| Account Service | http://localhost:4001 | Authentication |
| Catalog Service | http://localhost:6001 | Products |
| Order Service | http://localhost:7001 | Shopping cart |
| Billing Service | http://localhost:5001 | Invoices |
| Payment Service | http://localhost:8001 | Payments |

### Monitoring Dashboards
| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana | http://localhost:3030 | admin/admin |
| Prometheus | http://localhost:9090 | - |
| Chronograf | http://localhost:8888 | - |
| Zipkin | http://localhost:9411 | - |
| Consul | http://localhost:8500 | - |

## Step 7: Troubleshooting

### Common Issues and Solutions

#### Services Not Starting
```bash
# Check container logs
docker-compose logs [service-name]

# Restart specific service
docker-compose restart [service-name]

# Rebuild and restart
docker-compose up -d --build [service-name]
```

#### Database Connection Issues
```bash
# Check MySQL container
docker-compose logs mysql

# Verify database is accessible
docker-compose exec mysql mysql -u root -proot -e "SHOW DATABASES;"
```

#### Service Discovery Problems
```bash
# Check Consul UI
open http://localhost:8500

# Verify service registration
curl http://localhost:8500/v1/catalog/services
```

#### Frontend Not Loading
```bash
# Check frontend container logs
docker-compose logs bookstore-frontend

# Test nginx configuration
docker-compose exec bookstore-frontend nginx -t

# Rebuild frontend
docker-compose up -d --build bookstore-frontend
```

#### API Gateway Issues
```bash
# Test direct service access
curl http://localhost:4001/health

# Check gateway routes
curl http://localhost:8765/routes
```

#### Memory Issues
```bash
# Check system resources
docker system df

# Clean up unused containers/images
docker system prune -f
```

### Performance Optimization

#### Resource Allocation
```yaml
# In docker-compose.yml, adjust service resources
services:
  mysql:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

#### Scaling Services
```bash
# Scale a service
docker-compose up -d --scale bookstore-catalog-service=3
```

## Step 8: Development Workflow

### Local Development Setup
```bash
# Run only infrastructure services
docker-compose up -d mysql consul zipkin

# Run specific microservice locally
cd bookstore-account-service
mvn spring-boot:run

# Run frontend locally (if needed)
cd bookstore-frontend-react-app
npm start
```

### Code Changes
```bash
# Rebuild after code changes
mvn clean install -DskipTests
docker-compose up -d --build

# Update specific service
docker-compose up -d --build bookstore-account-service
```

### Database Migrations
```bash
# Add new migration file
# bookstore-[service]-service/src/main/resources/db/migration/V[version]__[description].sql

# Apply migrations
docker-compose restart [service-name]
```

## Step 9: Backup and Recovery

### Database Backup
```bash
# Backup MySQL data
docker-compose exec mysql mysqldump -u root -proot bookstore_db > backup.sql

# Backup volumes
docker run --rm -v bookstoreapp_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_backup.tar.gz -C /data .
```

### Configuration Backup
```bash
# Backup docker-compose.yml and configurations
cp docker-compose.yml docker-compose.yml.backup
cp bookstore-frontend-react-app/nginx.conf nginx.conf.backup
```

## Step 10: Production Deployment

### Environment Variables
```bash
# Set production environment variables
export REACT_APP_API_URL=https://api.yourdomain.com
export REACT_APP_TOGETHER_API_KEY=your_production_api_key
```

### Security Considerations
- Change default passwords
- Use environment variables for secrets
- Configure HTTPS/TLS
- Set up proper firewall rules
- Implement rate limiting

### Scaling for Production
```yaml
# Production docker-compose.yml adjustments
services:
  bookstore-api-gateway-service:
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
```

## Appendix A: Service Details

### Account Service
- **Port**: 4001
- **Database**: account_service_ tables
- **Endpoints**:
  - `POST /oauth/token` - Get access token
  - `POST /api/account/signup` - User registration
  - `GET /api/account/userInfo` - Get user info

### Catalog Service
- **Port**: 6001
- **Database**: catalog_service_ tables
- **Features**: Product inventory, reviews, categories
- **Sample Data**: 25 pre-loaded books

### Order Service
- **Port**: 7001
- **Database**: order_service_ tables
- **Features**: Shopping cart, order management

### API Gateway (Zuul)
- **Port**: 8765
- **Routes**:
  - `/api/account/**` → Account Service
  - `/api/catalog/**` → Catalog Service
  - `/api/order/**` → Order Service
  - `/api/billing/**` → Billing Service
  - `/api/payment/**` → Payment Service

## Appendix B: Monitoring Setup

### Grafana Dashboards
Pre-configured dashboards for:
- Service health monitoring
- Database performance
- API response times
- Error rates

### Prometheus Metrics
Collected metrics:
- JVM metrics (heap, GC, threads)
- HTTP request metrics
- Database connection pools
- Custom business metrics

### Zipkin Tracing
Distributed tracing for:
- Service-to-service calls
- Database queries
- External API calls

## Appendix C: AI Chat Integration

### Google Gemini Setup
The frontend includes AI-powered book recommendations using Google Generative AI.

**Configuration**:
- API Key: Set in `REACT_APP_TOGETHER_API_KEY` environment variable
- Model: Gemini 1.5 Flash
- Features: Multilingual support, inventory-based recommendations

**Usage**:
- Chat interface available on product pages
- Recommends only books available in inventory
- Supports multiple languages

## Quick Start Commands

```bash
# One-command deployment
git clone https://github.com/DatPhan06/BookStoreApp-Microservice-App.git
cd BookStoreApp-Microservice-App
mvn clean install -DskipTests
docker-compose up -d --build

# Verification
curl -I http://localhost:3000  # Frontend
curl -I http://localhost:8765  # API Gateway
curl -I http://localhost:3030  # Grafana

# Access application
open http://localhost:3000
```

## Support and Documentation

- **Frontend Setup Guide**: `FRONTEND_SETUP_GUIDE.md`
- **API Documentation**: Available via Swagger at `/swagger-ui.html` on each service
- **Logs**: `docker-compose logs -f [service-name]`
- **Health Checks**: `docker-compose ps`

---

**Last Updated**: October 28, 2025
**Version**: 1.0
**Status**: ✅ Fully tested and verified</content>
<filePath">/Users/trandinhquangminh/Codespace/BookStoreApp-Microservice-App/COMPLETE_DEPLOYMENT_GUIDE.md