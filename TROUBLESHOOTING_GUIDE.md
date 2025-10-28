# BookStore Microservices - Troubleshooting Guide

## Overview
This guide documents common issues encountered during BookStore deployment and their solutions. Refer here before investigating new problems.

---

## Issue 1: JPA Transaction Rollback in Billing Service

### Error Message
```
javax.persistence.RollbackException: Error while committing the transaction
ConstraintViolationException: Validation failed for classes [AddressDao] 
during persist time for groups [javax.validation.groups.Default, ]
ConstraintViolationImpl{interpolatedMessage='2-letter ISO country code required', 
propertyPath=country, rootBeanClass=class AddressDao, messageTemplate='2-letter ISO country code required'}
```

### Root Cause
The country code validation in address entities was too strict, only accepting uppercase 2-letter codes. This caused validation failures when processing addresses, resulting in transaction rollback.

### Files Affected
- `bookstore-billing-service/src/main/java/com/devd/spring/bookstorebillingservice/repository/dao/AddressDao.java`
- `bookstore-billing-service/src/main/java/com/devd/spring/bookstorebillingservice/web/CreateAddressRequest.java`

### Solution Applied
Updated the regex pattern in both files to accept both uppercase and lowercase letters:

**Before:**
```java
@Pattern(regexp = "[A-Z]{2}", message = "2-letter ISO country code required")
@NonNull
private String country;
```

**After:**
```java
@Pattern(regexp = "[A-Za-z]{2}", message = "2-letter ISO country code required")
@NonNull
private String country;
```

### Rebuild Steps
```bash
# 1. Rebuild the billing service
cd bookstore-billing-service
mvn clean package -DskipTests

# 2. Rebuild Docker image
docker-compose up -d --build bookstore-billing-service

# 3. Verify the service is healthy
curl http://localhost:5001/actuator/health
```

### Testing
```bash
# After fix, address creation should work with valid country codes
curl -X POST "http://localhost:8765/api/billing/address" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "addressLine1": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94102",
    "country": "US",
    "phone": "4155551234"
  }'
```

### Prevention
- Always make validation patterns case-insensitive unless there's a specific reason not to
- Test address creation with various country code formats
- Use lowercase letters when testing: `us`, `gb`, `ca`, etc.

---

## Issue 2: Payment Customer Setup Error

### Error Message
```
ERROR: Error while setting up payment customer.
com.devd.spring.bookstorecommons.exception.RunTimeExceptionPlaceHolder: Error while setting up payment customer.
```

### Root Cause
The error lacked detail about the actual Stripe API problem. The real issue was a missing or invalid Stripe API key. The application was using the placeholder value `sk_test_your_stripe_test_key_here` instead of a real Stripe test API key.

### Files Affected
- `bookstore-payment-service/src/main/java/com/devd/spring/bookstorepaymentservice/BookstorePaymentServiceApplication.java`
- `bookstore-payment-service/src/main/java/com/devd/spring/bookstorepaymentservice/service/impl/PaymentMethodServiceImpl.java`

### Solution Applied

#### 1. Added Startup Validation (`BookstorePaymentServiceApplication.java`)
```java
public static void main(String[] args) {
    SpringApplication.run(BookstorePaymentServiceApplication.class, args);
    
    String stripeApiKey = System.getenv("STRIPE_API_KEY");
    if (stripeApiKey == null || stripeApiKey.isEmpty() || stripeApiKey.contains("your_stripe")) {
        System.err.println("WARNING: STRIPE_API_KEY is not properly configured. Payment functionality will not work.");
        System.err.println("Please set a valid Stripe test API key in the .env file.");
        System.err.println("Get a test key from: https://dashboard.stripe.com/test/apikeys");
        Stripe.apiKey = null;
    } else {
        Stripe.apiKey = stripeApiKey;
        System.out.println("Stripe API key configured successfully.");
    }
}
```

#### 2. Improved Error Messages (`PaymentMethodServiceImpl.java`)
```java
private String createCustomerAtStripe() {
    // Check if Stripe API key is configured
    if (Stripe.apiKey == null || Stripe.apiKey.isEmpty() || Stripe.apiKey.contains("your_stripe")) {
        throw new RunTimeExceptionPlaceHolder("Stripe API key is not configured. Please set STRIPE_API_KEY in your environment variables.");
    }

    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String userIdFromToken = getUserIdFromToken(authentication);
    Map<String, Object> params = new HashMap<>();
    params.put("description", "Creating Customer Account for UserId : " + userIdFromToken);

    try {
        return Customer.create(params).getId();
    } catch (StripeException e) {
        log.error("Stripe API error while creating customer: {}", e.getMessage());
        throw new RunTimeExceptionPlaceHolder("Error while setting up payment customer: " + e.getMessage());
    }
}
```

### Fix Steps

#### Option 1: Get Real Stripe Test Key (Recommended)
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Sign up for a free Stripe account (if needed)
3. Copy your **test secret key** (starts with `sk_test_`)
4. Update `.env` file:
   ```bash
   STRIPE_API_KEY=sk_test_your_actual_stripe_key_here
   ```
5. Restart the payment service:
   ```bash
   docker-compose up -d bookstore-payment-service
   ```

#### Option 2: For Demo/Development (Limited Functionality)
- Keep current setup for browsing products
- Payment features will show clear error messages
- No payment processing will work

### Verification
Check startup logs:
```bash
docker-compose logs bookstore-payment-service | grep -i "stripe"
# Should see: "Stripe API key configured successfully." (if key is set)
# Or: "WARNING: STRIPE_API_KEY is not properly configured" (if not set)
```

### Testing Payment Features
```bash
# Will fail gracefully if Stripe key is not set
curl -X POST "http://localhost:8765/api/payment/paymentMethod" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "card": {
      "cardNumber": "4111111111111111",
      "expirationMonth": 12,
      "expirationYear": 2025,
      "cvv": "123"
    }
  }'
```

### Prevention
- Always validate external service credentials at application startup
- Provide clear configuration instructions in error messages
- Never silently fail when external service keys are invalid
- Test payment flows with both valid and invalid keys

---

## Issue 3: Service Discovery Timing Issues

### Error Message
```
com.netflix.zuul.exception.ZuulException: Error while forwarding the request
Or: 404 Not Found when calling service through API Gateway
```

### Root Cause
The API Gateway (Zuul) tries to route requests before services are fully registered with Consul. Service discovery registration takes time after a service starts.

### Service Registration Timeline
- Service container starts: ~2 seconds
- Service initializes and connects to MySQL: ~3-5 seconds
- Service registers with Consul: ~5-10 seconds
- Consul health check passes: ~15-20 seconds total

### Solution
Add delays when testing:
```bash
# Wait for all services to be registered
sleep 15

# Verify services are registered in Consul
curl http://localhost:8500/v1/catalog/services | jq .

# Then test API Gateway routing
curl "http://localhost:8765/api/catalog/products"
```

### Monitoring Service Registration
```bash
# Watch services register in real-time
watch -n 2 "curl -s http://localhost:8500/v1/catalog/services | jq '.'"

# Check specific service
curl http://localhost:8500/v1/catalog/service/bookstore-catalog-service | jq .

# Monitor Zuul routing
docker-compose logs -f bookstore-zuul-api-gateway-server | grep -i "route\|forward"
```

### Debug Commands
```bash
# Check if catalog service is registered
curl "http://localhost:8500/v1/catalog/service/bookstore-catalog-service" | jq .
# Response should show ServiceAddress and ServicePort

# Try direct service call (bypass gateway)
curl "http://localhost:6001/products?page=0&size=5"

# If direct works but gateway doesn't, it's a routing issue
# Check Zuul configuration and Consul connectivity
docker-compose logs bookstore-zuul-api-gateway-server | grep -i "ribbon\|consul\|error"
```

### Prevention
- Always wait for all services to register before testing
- Use health checks before running end-to-end tests
- Monitor Consul UI during startup: http://localhost:8500/ui
- Check service registration logs: `docker-compose logs bookstore-<service>`

---

## Issue 4: InfluxDB Authorization Errors

### Error Message
```
ERROR: unable to create database 'bookstore_influxdb_monitoring_metrics': 
{"code":"unauthorized","message":"unauthorized access"}

ERROR: failed to send metrics to influx: 
{"code":"unauthorized","message":"unauthorized access"}
```

### Root Cause
InfluxDB authentication credentials are not properly configured in the Docker Compose environment. Metrics publisher is trying to write metrics but failing due to authentication.

### Severity
**Low - These are warnings only.** Services continue to function normally. Only metrics collection fails.

### Solution
This is a non-critical issue. Services work fine without metrics export. If you want to fix it:

#### Option 1: Disable Metrics Export (Simplest)
Edit `bookstore-payment-service/src/main/resources/bootstrap.yml`:
```yaml
management:
  metrics:
    export:
      influx:
        enabled: false  # Set to false
```

#### Option 2: Configure InfluxDB Credentials
Edit `docker-compose.yml` InfluxDB section:
```yaml
bookstore-influxdb:
  image: influxdb:1.8
  environment:
    INFLUXDB_ADMIN_USER: admin
    INFLUXDB_ADMIN_PASSWORD: admin
    INFLUXDB_DB: bookstore_influxdb_monitoring_metrics
```

Then update service configurations with credentials.

### Verify Services Still Work
```bash
# These should all return UP despite InfluxDB errors
curl http://localhost:4001/actuator/health  # Account Service
curl http://localhost:5001/actuator/health  # Billing Service
curl http://localhost:6001/actuator/health  # Catalog Service
curl http://localhost:7001/actuator/health  # Order Service
curl http://localhost:8001/actuator/health  # Payment Service
```

### Prevention
- This is informational - not critical for functionality
- Monitor the warnings but don't investigate unless metrics are needed
- Set up proper InfluxDB credentials during production deployment

---

## General Debugging Checklist

### Before Investigating an Issue
- [ ] Check if all containers are running: `docker-compose ps`
- [ ] Wait at least 30 seconds after starting services
- [ ] Check Consul UI: http://localhost:8500/ui
- [ ] Verify service health: `curl http://localhost:<port>/actuator/health`
- [ ] Check logs for the specific service

### Common Commands
```bash
# View all containers
docker-compose ps

# View service-specific logs
docker-compose logs <service-name>

# Follow logs in real-time
docker-compose logs -f <service-name>

# Check service registration
curl http://localhost:8500/v1/catalog/services | jq .

# Test service health
curl http://localhost:<port>/actuator/health

# Test API Gateway
curl http://localhost:8765/api/<service>/<endpoint>

# View error logs only
docker-compose logs <service-name> | grep -i "error\|exception"
```

### Log Search Patterns
```bash
# JPA/Database errors
docker-compose logs | grep -i "rollback\|transaction\|jpa"

# Stripe/Payment errors
docker-compose logs | grep -i "stripe\|payment\|customer"

# Service discovery errors
docker-compose logs | grep -i "consul\|discovery\|register"

# Gateway routing errors
docker-compose logs bookstore-zuul-api-gateway-server | grep -i "zuul\|route"
```

---

## Environment Variables

### Required Variables (.env file)
```bash
# Stripe Payment Service
STRIPE_API_KEY=sk_test_your_actual_stripe_key_here
# Get from: https://dashboard.stripe.com/test/apikeys

# AI Chatbot (Optional)
REACT_APP_TOGETHER_API_KEY=your_together_ai_key_here
# Get from: https://www.together.ai/
```

### Validation Command
```bash
# Check if variables are set
env | grep STRIPE
env | grep REACT_APP

# Or inside Docker
docker exec bookstore-payment-service env | grep STRIPE_API_KEY
```

---

## Contact & Support

When reporting issues, include:
1. Error message (exact text)
2. Service affected
3. Steps to reproduce
4. Docker logs (docker-compose logs --tail=100 > logs.txt)
5. Environment variables set (without secrets)
6. Timestamps from when error occurred
