FROM node:18-bullseye

# Install LibreOffice
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-calc \
    fonts-dejavu \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all project files
COPY . .

# Create folders if missing
RUN mkdir -p uploads output

# Expose app port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
