#!/bin/bash

# Set up color for outputs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Xác định prefix cho Docker Hub repository (thay thế bằng username của bạn)
DOCKER_HUB_PREFIX="datfan06"

# Chọn mode: local (chỉ build), minikube (build và load), docker-hub (build và push)
MODE=${1:-"docker-hub"}
# Lấy Git SHA từ đối số thứ hai, fallback về short HEAD hoặc "latest"
GIT_SHA_TAG=${2:-$(git rev-parse --short HEAD 2>/dev/null || echo "latest")}

echo -e "${GREEN}Building images in $MODE mode with tag: $GIT_SHA_TAG ${NC}"

# Danh sách các service cần build bằng Maven
MAVEN_SERVICES=(
    "bookstore-commons"
    "bookstore-feign"
    "bookstore-account-service"
    "bookstore-billing-service"
    "bookstore-catalog-service"
    "bookstore-order-service"
    "bookstore-payment-service"
    "bookstore-api-gateway-service"
    "bookstore-eureka-discovery-service"
)

# Build các Maven service
for service in "${MAVEN_SERVICES[@]}"; do
    echo -e "${YELLOW}Building $service with Maven...${NC}"
    cd $service
    mvn clean install -DskipTests
    # Check for build failure
    if [ $? -ne 0 ]; then
        echo -e "\033[0;31mERROR: Maven build failed for $service ${NC}"
        exit 1 # Exit script if Maven build fails
    fi
    cd ..
done

# Danh sách tất cả các service cần build Docker image
SERVICES=(
    # Java services (dùng Dockerfile trong thư mục tương ứng)
    "bookstore-account-service:bookstore-account-service:bookstore-account-service-0.0.1-SNAPSHOT.jar"
    "bookstore-billing-service:bookstore-billing-service:bookstore-billing-service-0.0.1-SNAPSHOT.jar"
    "bookstore-catalog-service:bookstore-catalog-service:bookstore-catalog-service-0.0.1-SNAPSHOT.jar"
    "bookstore-order-service:bookstore-order-service:bookstore-order-service-0.0.1-SNAPSHOT.jar"
    "bookstore-payment-service:bookstore-payment-service:bookstore-payment-service-0.0.1-SNAPSHOT.jar"
    "bookstore-api-gateway-service:bookstore-zuul-api-gateway-server:bookstore-api-gateway-service-0.0.1-SNAPSHOT.jar"
    "bookstore-eureka-discovery-service:bookstore-eureka-discovery-service:bookstore-eureka-discovery-service-0.0.1-SNAPSHOT.jar"
    
    # Các service không cần build Maven (chỉ có Dockerfile)
    "bookstore-prometheus:bookstore-prometheus:"
    "bookstore-graphana:graphana:"
    "bookstore-telegraph:bookstore-telegraf:"
    "bookstore-frontend-react-app:bookstore-frontend-react-app:"
)

# Build và load/push Docker images
for service_info in "${SERVICES[@]}"; do
    # Phân tách thông tin: thư_mục:tên_image:jar_file
    IFS=':' read -r directory image_name jar_file <<< "$service_info"
    
    # Tạo tên image đầy đủ trên Docker Hub
    HUB_IMAGE_NAME="$DOCKER_HUB_PREFIX/$image_name"

    echo -e "${YELLOW}Building Docker image $HUB_IMAGE_NAME:$GIT_SHA_TAG ...${NC}"
    
    # Build Docker image với tag SHA
    if [ -n "$jar_file" ]; then
        docker build -t "$HUB_IMAGE_NAME:$GIT_SHA_TAG" ./$directory -f ./$directory/Dockerfile --build-arg JAR_FILE=$jar_file
    else
        docker build -t "$HUB_IMAGE_NAME:$GIT_SHA_TAG" ./$directory -f ./$directory/Dockerfile
    fi

    # Build và tag "latest" nếu muốn (tùy chọn)
    echo -e "${YELLOW}Tagging $HUB_IMAGE_NAME:$GIT_SHA_TAG as $HUB_IMAGE_NAME:latest ...${NC}"
    docker tag "$HUB_IMAGE_NAME:$GIT_SHA_TAG" "$HUB_IMAGE_NAME:latest"
    
    # Xử lý theo mode
    if [ "$MODE" == "minikube" ]; then
        echo -e "${YELLOW}Loading $HUB_IMAGE_NAME:$GIT_SHA_TAG into minikube...${NC}"
        minikube image load "$HUB_IMAGE_NAME:$GIT_SHA_TAG"
        echo -e "${YELLOW}Loading $HUB_IMAGE_NAME:latest into minikube...${NC}"
        minikube image load "$HUB_IMAGE_NAME:latest"
    elif [ "$MODE" == "docker-hub" ]; then
        echo -e "${YELLOW}Pushing $HUB_IMAGE_NAME:$GIT_SHA_TAG to Docker Hub...${NC}"
        docker push "$HUB_IMAGE_NAME:$GIT_SHA_TAG"
        echo -e "${YELLOW}Pushing $HUB_IMAGE_NAME:latest to Docker Hub...${NC}"
        docker push "$HUB_IMAGE_NAME:latest" # Push cả tag latest nếu muốn
    fi
    
    echo -e "${GREEN}Successfully processed $image_name${NC}"
done

echo -e "${GREEN}All services have been built and processed successfully in $MODE mode with tag $GIT_SHA_TAG!${NC}" 