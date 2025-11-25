FROM amazoncorretto:8-alpine-jre

VOLUME /tmp

# Add non-root user for security
RUN addgroup -g 1001 -S appuser && adduser -u 1001 -S appuser -G appuser

COPY target/*.jar account-service.jar
COPY dockerize dockerize

# Change ownership to non-root user
RUN chown -R appuser:appuser /account-service.jar /dockerize
USER appuser

# Use exec form and optimize JVM settings for containers
CMD ["sh", "-c", "./dockerize -wait tcp://bookstore-mysql-db:3306 -timeout 15m java -XX:+UnlockExperimentalVMOptions -XX:+UseCGroupMemoryLimitForHeap -XX:MaxRAMFraction=2 -Djava.security.egd=file:/dev/./urandom -jar /account-service.jar"]