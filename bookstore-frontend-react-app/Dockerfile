# Stage 1: Build the React application
FROM node:18-alpine AS build
WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false && yarn cache clean

# Copy source code
COPY . .

# Build the application
# The .env file will be picked up automatically since it's copied in the previous step
RUN yarn build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Remove default nginx config
RUN rm -rf /usr/share/nginx/html/*

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build output from the build stage
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]