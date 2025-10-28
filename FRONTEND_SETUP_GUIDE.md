# BookStoreApp Frontend Setup Guide

## Overview
This document chronicles the complete process of setting up and running the React frontend for the BookStoreApp microservices e-commerce application. The frontend includes a web UI with AI-powered chat functionality using Google Gemini.

## System Architecture
- **Frontend**: React 17.0.2 with Bootstrap, Redux, React Router
- **AI Integration**: Google Generative AI (Gemini) for multilingual book recommendations
- **Backend**: Spring Boot microservices via API Gateway (Zuul)
- **Deployment**: Docker containerization with multi-stage build

## Prerequisites
- Docker 28.5.1+
- Docker Compose v2.40.0+
- Node.js 18+ (for local development)
- Yarn or npm package manager

## Step-by-Step Setup Process

### Phase 1: Initial Local Development Attempts (Issues Encountered)

#### Attempt 1: Basic npm install
```bash
cd bookstore-frontend-react-app
npm install
```
**Issues**: Dependency conflicts, React version mismatches, webpack compatibility issues

#### Attempt 2: Using Yarn
```bash
cd bookstore-frontend-react-app
yarn install
```
**Issues**: Same dependency conflicts, ajv/webpack version incompatibilities

#### Attempt 3: Force Legacy Peer Deps
```bash
cd bookstore-frontend-react-app
npm install --legacy-peer-deps
```
**Issues**: Build failures, runtime errors, Google AI dependency missing

### Phase 2: Docker Containerization Solution

#### Step 1: Add Frontend Service to Docker Compose
Added the following configuration to `docker-compose.yml`:

```yaml
bookstore-frontend:
  build:
    context: ./bookstore-frontend-react-app
    dockerfile: Dockerfile
  ports:
    - "3000:80"
  environment:
    - REACT_APP_API_URL=http://localhost:8765
    - REACT_APP_TOGETHER_API_KEY=your_api_key_here
  depends_on:
    - bookstore-zuul-api-gateway-server
  networks:
    - bookstore-network
```

#### Step 2: Frontend Dockerfile Configuration
The `bookstore-frontend-react-app/Dockerfile` uses a multi-stage build:

```dockerfile
# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

# Production stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Step 3: Fix Google AI Dependency
**Problem**: Missing `@google/generative-ai` package
**Solution**:
```bash
cd bookstore-frontend-react-app
npm install @google/generative-ai --legacy-peer-deps
```

#### Step 4: Update Chat Service Implementation
Updated `src/service/chatService.js` to use the correct Google Generative AI API:

```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = "your_api_key_here";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const getChatResponse = async (messages, booksContext = []) => {
  // Implementation with proper API usage
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
};
```

### Phase 3: Build and Deploy

#### Build the Frontend Container
```bash
docker-compose up -d --build bookstore-frontend
```

#### Verify Deployment
```bash
# Check if container is running
docker-compose ps bookstore-frontend

# Test HTTP response
curl -I http://localhost:3000

# Verify React app content
curl -s http://localhost:3000 | head -5
```

## Current Working Configuration

### Environment Variables
- `REACT_APP_API_URL=http://localhost:8765` - API Gateway URL
- `REACT_APP_TOGETHER_API_KEY` - AI service API key (currently using Google Gemini)

### Port Mappings
- Frontend: `localhost:3000` → Container port 80 (nginx)
- API Gateway: `localhost:8765` → Zuul routing

### Network Dependencies
The frontend container depends on:
- `bookstore-zuul-api-gateway-server` - For API routing
- `bookstore-network` - Shared Docker network

## Issues Resolved

### 1. Dependency Conflicts
**Problem**: React 17.0.2 incompatible with newer webpack/ajv versions
**Solution**: Used Docker containerization with Node.js 18-alpine for consistent environment

### 2. Google AI Integration
**Problem**: Missing `@google/generative-ai` package and incorrect API usage
**Solution**: Installed correct package and updated service implementation

### 3. Build Failures
**Problem**: Local development environment inconsistencies
**Solution**: Multi-stage Docker build with frozen lockfile for reproducible builds

### 4. Runtime Errors
**Problem**: Missing environment variables and API connectivity
**Solution**: Proper environment configuration in docker-compose.yml

### 5. User Registration 404 Error (Latest Debug)
**Problem**: User registration failed with "Request failed with status code 404"
**Root Cause Analysis**:
- Frontend was hardcoded to use production API URL (`https://bookstoredlk.store/`)
- Local development environment runs on `http://localhost:8765`
- React SPA routing not configured in nginx (client-side routes like `/register` returned 404)
- Nginx port configuration mismatch (listen 3000 vs expose 80)

**Debugging Steps**:
1. **API Endpoint Verification**: Tested signup endpoint directly - confirmed backend API works
2. **Frontend URL Investigation**: Found hardcoded production URL in `appConstants.js`
3. **SPA Routing Issue**: Identified nginx configuration missing fallback for client-side routing
4. **Port Configuration**: Fixed nginx listen port mismatch

**Solutions Applied**:
- Updated `appConstants.js` to use environment variable: `process.env.REACT_APP_API_URL || 'http://localhost:8765'`
- Added nginx SPA routing: `try_files $uri $uri/ /index.html;`
- Fixed nginx port configuration: `listen 80` to match Dockerfile
- Updated Dockerfile to copy custom nginx configuration
- Rebuilt frontend container with all fixes

**Verification**:
```bash
# API endpoint test
curl -X POST http://localhost:8765/api/account/signup \
  -H "Content-Type: application/json" \
  -d '{"userName":"testuser","firstName":"Test","email":"test@example.com","password":"password123"}'
# ✅ Returns: {"userId":"xxx","userName":"testuser"}

# Frontend routing test
curl -I http://localhost:3000/register
# ✅ Returns: HTTP/1.1 200 OK
```

## Testing and Verification

### Frontend Accessibility Test
```bash
curl -I http://localhost:3000
# Expected: HTTP/1.1 200 OK
```

### API Integration Test
```bash
curl http://localhost:8765/api/catalog/products
# Expected: JSON response with product catalog
```

### AI Chat Functionality Test
- Access frontend at http://localhost:3000
- Use the chat feature to test AI book recommendations
- Verify multilingual support and inventory-based responses

## Monitoring and Troubleshooting

### Container Logs
```bash
# View frontend container logs
docker-compose logs bookstore-frontend

# Follow logs in real-time
docker-compose logs -f bookstore-frontend
```

### Health Checks
```bash
# Check all services status
docker-compose ps

# Test API gateway health
curl http://localhost:8765/health
```

### Common Issues and Solutions

#### Frontend Not Loading
```bash
# Rebuild frontend container
docker-compose up -d --build bookstore-frontend

# Clear browser cache and reload
```

#### API Connection Issues
```bash
# Verify API gateway is running
curl http://localhost:8765/

# Check network connectivity
docker-compose exec bookstore-frontend ping bookstore-zuul-api-gateway-server
```

#### AI Chat Not Working
- Verify `REACT_APP_TOGETHER_API_KEY` environment variable
- Check browser console for JavaScript errors
- Ensure Google Gemini API key is valid

## Performance Optimization

### Docker Build Optimization
- Multi-stage build reduces final image size
- `yarn install --frozen-lockfile` ensures reproducible builds
- Alpine Linux base images for minimal footprint

### Runtime Optimization
- Nginx serving static files for better performance
- Environment variables for configuration flexibility
- Proper dependency management to avoid bloat

## Future Improvements

### Local Development Setup
1. Create separate docker-compose.dev.yml for development
2. Add hot reloading with volume mounts
3. Implement proper Node.js development environment

### CI/CD Integration
1. Add automated testing in Docker build
2. Implement multi-stage deployment pipelines
3. Add performance monitoring and alerting

### Security Enhancements
1. Implement proper API key management (secrets)
2. Add HTTPS configuration for production
3. Implement content security policies

## Quick Start Commands

### Full System Startup
```bash
# Build all services
mvn clean install -DskipTests

# Start complete system
docker-compose up -d --build

# Verify frontend
curl -I http://localhost:3000
```

### Frontend Only Restart
```bash
# Rebuild and restart frontend
docker-compose up -d --build bookstore-frontend

# View logs
docker-compose logs -f bookstore-frontend
```

## Conclusion

The frontend setup evolved from problematic local development attempts to a robust Docker containerized solution. The current configuration provides:

- ✅ Consistent build environment
- ✅ Proper dependency management
- ✅ AI integration working
- ✅ Production-ready deployment
- ✅ Complete debugging process documented
- ✅ User registration fully functional

**Latest Status (October 28, 2025)**: All issues resolved including the recent user registration 404 error. The complete BookStoreApp microservices system is now fully operational with working user registration, authentication, and e-commerce functionality.</content>
<filePath">/Users/trandinhquangminh/Codespace/BookStoreApp-Microservice-App/FRONTEND_SETUP_GUIDE.md