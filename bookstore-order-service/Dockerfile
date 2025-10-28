FROM openjdk:8-jdk-alpine

VOLUME /tmp



COPY target/*.jar order-service.jar

#Using Dokerize to check whether db is up, if it is then start this service.
COPY dockerize dockerize

CMD ./dockerize -wait tcp://bookstore-mysql-db:3306 -timeout 15m java -Djava.security.egd=file:/dev/./urandom -jar /order-service.jar