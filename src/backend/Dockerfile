# Backend SignLight — build nhiều tầng để ảnh chạy không mang theo Maven và mã nguồn.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Tách bước tải phụ thuộc để đổi mã nguồn không phải tải lại toàn bộ.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -q clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S signlight && adduser -S -G signlight signlight \
    && apk add --no-cache curl
COPY --from=build /build/target/signlight-api-*.jar app.jar
USER signlight

EXPOSE 8080
ENV JAVA_TOOL_OPTIONS="-XX:+UseSerialGC -XX:MaxRAMPercentage=60.0 -Xss256k -XX:+ExitOnOutOfMemoryError"
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
