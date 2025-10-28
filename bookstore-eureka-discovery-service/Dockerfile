FROM openjdk:8-jdk-alpine

VOLUME /tmp



COPY target/*.jar eureka-app.jar

ENTRYPOINT ["java","-Djava.security.egd=file:/dev/./urandom","-jar","/eureka-app.jar"]