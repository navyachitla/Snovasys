# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Spring Boot Backend
FROM eclipse-adoptium:21-jdk-jammy AS backend-builder
WORKDIR /app/backend
COPY backend/pom.xml backend/mvnw ./
COPY backend/.mvn ./.mvn
RUN chmod +x ./mvnw && ./mvnw dependency:go-offline -B || true
COPY backend/src ./src
# Copy compiled frontend into Spring Boot static resources
COPY --from=frontend-builder /app/frontend/dist/ ./src/main/resources/static/
RUN ./mvnw clean package -DskipTests

# Stage 3: Lightweight Production JRE Runtime
FROM eclipse-adoptium:21-jre-jammy
WORKDIR /app
COPY --from=backend-builder /app/backend/target/*.jar app.jar
ENV SPRING_PROFILES_ACTIVE=dev
ENV PORT=9090
EXPOSE 9090
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
