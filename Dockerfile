# ==========================================
# Stage 1: Build the React Frontend
# ==========================================
FROM node:18-alpine as build

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

# ==========================================
# Stage 2: Setup the Production Server
# ==========================================
FROM node:18-alpine

WORKDIR /app

# Copy package.json again to install only runtime dependencies
COPY package*.json ./

# Install ONLY production dependencies (skips react-scripts, typescript, testing libs)
# This keeps the final image small and secure
RUN npm install --omit=dev

# Copy the built frontend assets from the previous 'build' stage
COPY --from=build /app/build ./build

# Copy the backend server code
COPY server.js ./

# Expose port 8080 (Default for Google Cloud Run)
EXPOSE 8080

# Start the Node.js server
CMD ["node", "server.js"]