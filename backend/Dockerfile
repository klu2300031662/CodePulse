FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

COPY . .

RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

# Install python3, python-is-python3 (to link python command to python3), nodejs, gcc, g++
RUN apt-get update && apt-get install -y python3 python-is-python3 nodejs gcc g++ && rm -rf /var/lib/apt/lists/*

EXPOSE 8080

ENTRYPOINT ["java","-jar","app.jar","--spring.profiles.active=prod"]