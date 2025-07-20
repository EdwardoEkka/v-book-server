FROM node:current

WORKDIR /app

# Copy only package files to leverage Docker caching
COPY package*.json ./

# 🔥 Copy prisma folder before npm install so prisma can generate
COPY prisma ./prisma

# Install dependencies (triggers `postinstall` if defined)
RUN npm install

# Now copy the rest of the source code
COPY . .

# Expose the app port (must match what your app uses)
EXPOSE 8080

# Start the app (change if needed)
CMD ["node", "src/index.js"]
