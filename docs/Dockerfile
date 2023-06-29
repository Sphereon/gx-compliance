FROM node:16.14 AS builder
WORKDIR /usr/src/app

COPY . .
RUN npm install
RUN npm run build

FROM httpd

WORKDIR /var/www/htdocs
COPY --from=builder /usr/src/app/src/.vuepress/dist/ /usr/local/apache2/htdocs/
