FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app /app

EXPOSE 4000
CMD ["npm", "start"]




# # Use Node LTS
# FROM node:18-alpine

# WORKDIR /app

# COPY package*.json ./
# RUN npm install --production

# COPY . .

# EXPOSE 4000

# CMD ["node", "index.js"]
