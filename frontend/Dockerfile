# Use the official Node.js Alpine image for a small footprint
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy dependency definitions first to leverage Docker cache
COPY package.json package-lock.json* ./

# Install project dependencies, ignoring potential peer dependency conflicts
RUN npm install --legacy-peer-deps

# Copy the remaining frontend source code
COPY . .

# Expose the default Next.js development port
EXPOSE 3000

# Start the Next.js development server
CMD ["npm", "run", "dev"]