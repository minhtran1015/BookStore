FROM amazoncorretto:8-alpine-jre

VOLUME /tmp

# Create Logs directory for logback
RUN mkdir -p /Logs

COPY target/*.jar catalog-service.jar

#Using Dokerize to check whether db is up, if it is then start this service.
COPY dockerize dockerize

COPY ./images /images

CMD ./dockerize -wait tcp://bookstore-mysql-db:3306 -timeout 15m java -Djava.security.egd=file:/dev/./urandom -jar /catalog-service.jar