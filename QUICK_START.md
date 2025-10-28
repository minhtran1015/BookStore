# BookStore Microservices - Quick Start Guide

## 30-Second Setup

```bash
# 1. Configure environment
echo "STRIPE_API_KEY=sk_test_your_stripe_key_here" > .env
echo "REACT_APP_TOGETHER_API_KEY=dummy_key_for_development" >> .env

# 2. Start services
docker-compose up -d

# 3. Wait for startup
sleep 30

# 4. Access application
open http://localhost:3000
```

---

## Common Tasks

### View Service Status
```bash
docker-compose ps
curl http://localhost:8500/ui  # Consul UI
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f bookstore-catalog-service

# Search for errors
docker-compose logs | grep -i error
```

### Test API
```bash
# Through Gateway
curl http://localhost:8765/api/catalog/products

# Direct service
curl http://localhost:6001/products
```

### Restart Service
```bash
docker-compose restart bookstore-billing-service
# or rebuild with changes
docker-compose up -d --build bookstore-billing-service
```

### Stop Everything
```bash
docker-compose down
```

---

## Key URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API Gateway | http://localhost:8765 |
| Consul | http://localhost:8500/ui |
| Grafana | http://localhost:3030 (admin/admin) |
| Zipkin | http://localhost:9411 |

---

## Known Issues & Quick Fixes

### Issue: Services not registering
**Fix**: Wait 30 seconds and check Consul UI

### Issue: JPA Transaction Rollback
**Fix**: See TROUBLESHOOTING_GUIDE.md - Issue 1

### Issue: Payment Customer Error
**Fix**: Add valid STRIPE_API_KEY to .env, see TROUBLESHOOTING_GUIDE.md - Issue 2

### Issue: API Gateway returns 404
**Fix**: Check service registration in Consul, wait for all services to be UP

---

## First Time Setup

1. Clone repo
2. Create `.env` file with:
   ```
   STRIPE_API_KEY=sk_test_xxxx
   REACT_APP_TOGETHER_API_KEY=xxxx
   ```
3. Run `docker-compose up -d`
4. Wait 30 seconds
5. Open http://localhost:3000

---

## Troubleshooting

All issues documented in `TROUBLESHOOTING_GUIDE.md`. Quick reference:

- **Database errors**: See Issue 1 (Country Code Validation)
- **Payment errors**: See Issue 2 (Stripe Configuration)
- **404 errors**: See Issue 3 (Service Discovery Timing)
- **Metrics warnings**: See Issue 4 (InfluxDB - non-critical)

---

## Performance Notes

- First startup: 2-3 minutes (building services, DB migrations)
- Subsequent startups: 30-60 seconds
- Service registration: 15-20 seconds after each restart
- Full health check: 25-30 seconds
