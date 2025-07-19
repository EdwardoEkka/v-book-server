FROM node:18

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Expose the port Cloud Run uses
EXPOSE 8080

# Start the app from src/index.js
CMD ["node", "src/index.js"]
