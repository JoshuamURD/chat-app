# Build stage for the Go backend
FROM golang:1.24.1-alpine AS backend-builder

WORKDIR /app/backend

# Copy go mod and sum files
COPY backend/go.mod backend/go.sum ./

# Download all dependencies
RUN go mod download

# Copy the source code
COPY backend/ .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

# Build stage for the React frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package.json and package-lock.json
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code
COPY frontend/ .

# Build the frontend with verbose output
RUN npm run build || (echo "Build failed" && exit 1)

# Verify build directory exists
RUN ls -la /app/frontend/build || (echo "Build directory not found" && exit 1)

# Final stage
FROM alpine:latest

WORKDIR /app

# Install necessary packages
RUN apk --no-cache add ca-certificates

# Copy the backend binary from the builder stage
COPY --from=backend-builder /app/backend/server .

# Copy the frontend build from the builder stage
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
CMD ["./server"] 