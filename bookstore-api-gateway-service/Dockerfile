FROM openjdk:8-jdk-alpine

VOLUME /tmp



COPY target/*.jar gateway-server.jar

ENTRYPOINT ["java","-Djava.security.egd=file:/dev/./urandom","-jar","/gateway-server.jar"]