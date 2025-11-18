# BookStore Grafana Monitoring Setup

## Overview

This document describes the comprehensive monitoring and visualization setup for the BookStore microservices application using Grafana with auto-loading dashboards.

## Architecture

The monitoring stack includes:
- **Grafana**: Visualization and alerting platform
- **Prometheus**: Metrics collection and storage
- **MySQL**: Business data source for analytics
- **InfluxDB**: Time-series database for detailed metrics
- **Spring Boot Actuator**: Application metrics endpoints

## Dashboard Suite

### 1. BookStore Microservices Overview (`bookstore-microservices-overview.json`)
**Purpose**: Main operational dashboard providing high-level health and performance metrics

**Key Panels**:
- Service Health Status (up/down indicators)
- Request Rate per Service (requests/second)
- Average Response Time trends
- Error Rate percentage by service
- JVM Memory Usage (heap utilization)
- Database Connection Pool status
- CPU Usage by service

**Data Sources**: Prometheus
**Refresh**: 5 seconds
**Time Range**: Last 1 hour (configurable)

### 2. BookStore Performance Deep Dive (`bookstore-performance-deep-dive.json`)
**Purpose**: Detailed performance analysis with service templating

**Key Features**:
- Service selection template variable
- Individual service drill-down capability
- Performance trend analysis

**Key Panels**:
- Service Uptime tracking
- Request Distribution (GET/POST/PUT/DELETE)
- Response Time Heatmaps
- 95th Percentile Response Times
- JVM Detailed Metrics (heap, non-heap, metaspace)
- Garbage Collection analysis
- Thread Pool utilization
- HTTP Status Code distribution

**Data Sources**: Prometheus
**Refresh**: 10 seconds
**Time Range**: Last 6 hours

### 3. BookStore Business Analytics (`bookstore-business-analytics.json`)
**Purpose**: Business intelligence and KPI tracking

**Key Panels**:
- Total User Registrations
- Daily Order Count
- Revenue Statistics (daily, weekly, monthly)
- Order Status Distribution (pending, completed, cancelled)
- Top Selling Books (by quantity and revenue)
- User Activity Trends
- Average Order Value
- Customer Acquisition metrics

**Data Sources**: MySQL
**Refresh**: 1 minute
**Time Range**: Last 30 days

### 4. BookStore Infrastructure (`bookstore-infrastructure.json`)
**Purpose**: System and container infrastructure monitoring

**Key Panels**:
- Docker Container Status
- System CPU Usage
- System Memory Usage
- Container Resource Usage (CPU/Memory per container)
- Network I/O statistics
- Disk Usage monitoring
- Container Health Checks
- Service Discovery status (Consul/Eureka)

**Data Sources**: Prometheus, Docker metrics
**Refresh**: 30 seconds
**Time Range**: Last 2 hours

## Auto-Loading Configuration

### Dockerfile Setup
```dockerfile
FROM grafana/grafana:latest

# Dashboard files copied to provisioning directory
COPY *.json /var/lib/grafana/dashboards/
COPY datasource.yml /etc/grafana/provisioning/datasources/
COPY dashboard.yml /etc/grafana/provisioning/dashboards/
COPY alert-rules.yml /etc/grafana/provisioning/alerting/
COPY alerting.yml /etc/grafana/provisioning/alerting/

# Environment variables for auto-provisioning
ENV GF_DASHBOARDS_DEFAULT_HOME_DASHBOARD_PATH=/var/lib/grafana/dashboards/bookstore-microservices-overview.json
ENV GF_PROVISIONING_PATH=/etc/grafana/provisioning
```

### Dashboard Provisioning (`dashboard.yml`)
- Organizes dashboards into logical folders
- Enables auto-loading on container startup
- Allows UI updates while maintaining version control
- 10-second update interval for changes

### Data Source Configuration (`datasource.yml`)
**Prometheus**:
- URL: `http://prometheus:9090`
- Access: Server (default)
- Scrape interval: 15s

**MySQL**:
- URL: `mysql:3306`
- Database: `bookstoreDB`
- User: `bookstoreuser`

**InfluxDB**:
- URL: `http://influxdb:8086`
- Database: `bookstore_metrics`

## Alerting Rules

### Service Down Alert
- **Trigger**: Service unavailable for > 1 minute
- **Severity**: Critical
- **Notification**: Immediate

### High Error Rate Alert
- **Trigger**: Error rate > 5% for > 2 minutes
- **Severity**: Warning
- **Notification**: Standard

### High Response Time Alert
- **Trigger**: 95th percentile > 2 seconds for > 3 minutes
- **Severity**: Warning
- **Notification**: Standard

### High Memory Usage Alert
- **Trigger**: JVM heap usage > 85% for > 5 minutes
- **Severity**: Warning
- **Notification**: Standard

## Deployment Instructions

### Using Docker Compose
```bash
# Build the enhanced Grafana image
cd bookstore-graphana
docker build -t bookstore-grafana:latest .

# Start the monitoring stack
cd ..
docker-compose up -d grafana prometheus mysql
```

### Using Kubernetes
```bash
# Apply the Grafana deployment
kubectl apply -f k8s/grafana.yaml

# Verify dashboards are loaded
kubectl logs deployment/grafana -n bookstore
```

## Access Information

### URLs (Docker Compose)
- **Grafana**: http://localhost:3000
- **Prometheus**: http://localhost:9090
- **API Gateway**: http://localhost:8765

### URLs (Kubernetes)
- **Grafana**: http://localhost:30011 (NodePort)
- **Prometheus**: http://localhost:30010 (NodePort)

### Default Credentials
- **Username**: admin
- **Password**: admin (change on first login)

## Dashboard Navigation

1. **Home Dashboard**: BookStore Microservices Overview loads automatically
2. **Browse**: Use folder navigation (BookStore Dashboards, Business Intelligence, Infrastructure)
3. **Search**: Use dashboard search functionality
4. **Templating**: Use service selection dropdown in Performance Deep Dive
5. **Time Range**: Adjust using time picker (top right)

## Customization

### Adding New Panels
1. Edit the appropriate JSON dashboard file
2. Rebuild the Docker image
3. Redeploy the container

### Adding New Dashboards
1. Create new JSON dashboard file
2. Add to Dockerfile COPY commands
3. Update `dashboard.yml` if needed
4. Rebuild and redeploy

### Custom Metrics
- Add new Prometheus metrics in Spring Boot applications
- Update dashboard queries to include new metrics
- Consider alert rules for critical new metrics

## Troubleshooting

### Dashboards Not Loading
- Check Grafana logs: `docker logs bookstore-grafana`
- Verify provisioning files are in correct locations
- Check file permissions and JSON syntax

### Data Source Connection Issues
- Verify service URLs in `datasource.yml`
- Check network connectivity between containers
- Validate credentials and database access

### Missing Metrics
- Verify Prometheus is scraping services
- Check Spring Boot Actuator endpoints are exposed
- Validate Prometheus configuration

### Alert Not Triggering
- Check alert rule syntax in `alert-rules.yml`
- Verify contact point configuration
- Test notification channels manually

## Performance Considerations

- **Dashboard Refresh**: Balance between real-time data and performance
- **Time Range**: Longer ranges require more resources
- **Panel Queries**: Optimize PromQL queries for efficiency
- **Data Retention**: Configure appropriate retention policies

## Security Notes

- Change default Grafana credentials
- Configure LDAP/OAuth integration if needed
- Restrict dashboard editing permissions
- Use secure connections (HTTPS) in production
- Regularly update Grafana version for security patches

## Monitoring Best Practices

1. **Golden Signals**: Focus on latency, traffic, errors, and saturation
2. **Service Level Objectives (SLOs)**: Define and monitor key SLOs
3. **Alert Fatigue**: Tune alerts to reduce false positives
4. **Documentation**: Keep runbooks for common issues
5. **Regular Reviews**: Periodically review and update dashboards

## Future Enhancements

- Custom notification channels (Slack, Teams, PagerDuty)
- Advanced alerting with machine learning
- Cross-service correlation analysis
- A/B testing metrics integration
- Business process monitoring
- Synthetic monitoring capabilities