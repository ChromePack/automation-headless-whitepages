FROM node:18

# Install system dependencies including Xvfb and Chrome
RUN apt-get update && apt-get install -y \
    xvfb \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Set environment variable for virtual display
ENV DISPLAY=:99

# Start Xvfb and run the application
CMD Xvfb :99 -screen 0 1920x1080x24 & node server.js 