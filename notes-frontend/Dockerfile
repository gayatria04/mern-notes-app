FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]




# # Build React app
# FROM node:18-alpine as build

# WORKDIR /app

# ARG REACT_APP_BACKEND_URL
# ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

# COPY package*.json ./
# RUN npm install

# COPY . .
# RUN npm run build

# # Serve build with nginx
# FROM nginx:alpine
# COPY --from=build /app/build /usr/share/nginx/html
# COPY nginx.conf /etc/nginx/conf.d/default.conf
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]
