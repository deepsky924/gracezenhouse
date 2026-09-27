FROM node:24-alpine AS build
WORKDIR /app
COPY build.mjs ./
COPY src ./src
RUN node build.mjs

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
