# Stage 1: Build the React application with optimized caching
FROM node:18-alpine AS build
WORKDIR /app

# Install dependencies first for better caching
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false \
    && yarn cache clean

# Copy source and build
COPY . .
RUN yarn build

# Stage 2: Serve with minimal nginx
FROM nginx:alpine

# Remove default nginx config and add non-root user
RUN rm -rf /usr/share/nginx/html/* \
    && addgroup -g 1001 -S appuser \
    && adduser -u 1001 -S appuser -G appuser

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build output
COPY --from=build /app/build /usr/share/nginx/html

# Set proper permissions
RUN chown -R appuser:appuser /usr/share/nginx/html

EXPOSE 80

# Use non-root user
USER appuser
CMD ["nginx", "-g", "daemon off;"] 