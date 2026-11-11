# Build stage
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /app
COPY pom.xml mvnw ./
COPY .mvn .mvn
RUN chmod +x ./mvnw && ./mvnw dependency:go-offline -B || true
COPY src ./src
RUN ./mvnw clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 9090
ENTRYPOINT ["java", "-jar", "app.jar"]
