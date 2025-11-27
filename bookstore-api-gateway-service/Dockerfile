FROM amazoncorretto:8-alpine-jre

VOLUME /tmp

# Create Logs directory for logback
RUN mkdir -p /Logs

COPY target/*.jar gateway-server.jar

ENTRYPOINT ["java","-Djava.security.egd=file:/dev/./urandom","-jar","/gateway-server.jar"]