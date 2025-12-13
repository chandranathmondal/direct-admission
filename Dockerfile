# ==========================================
# Stage 1: Build the React Frontend
# ==========================================
FROM node:20-alpine AS build

# Accept build arguments
ARG REACT_APP_GOOGLE_CLIENT_ID

# Export as env variable inside the container
ENV REACT_APP_GOOGLE_CLIENT_ID=$REACT_APP_GOOGLE_CLIENT_ID

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first
# This allows Docker to cache dependencies if these files haven't changed
COPY package*.json ./

# Install ALL dependencies (including 'devDependencies' like react-scripts needed for building)
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the React application
# This creates the optimized production build in the /app/build directory
RUN npm run build
    
# Remove dev dependencies to keep node_modules small before copying to final image
RUN npm prune --production

# ==========================================
# Stage 2: Setup the Production Server
# ==========================================
FROM node:20-alpine

WORKDIR /app

# Copy package.json (metadata) and reuse installed node_modules from the build stage
# We avoid re-resolving deps in the final stage (prevents peer dependency resolution issues)
COPY package*.json ./

# Reuse node_modules installed in the build stage and remove dev dependencies there
COPY --from=build /app/node_modules ./node_modules

# Copy the built frontend assets from the previous 'build' stage
COPY --from=build /app/build ./build

# Copy the backend server code
COPY server.js ./

# Expose port 8080 (Default for Google Cloud Run)
EXPOSE 8080

# Start the Node.js server
CMD ["node", "server.js"]