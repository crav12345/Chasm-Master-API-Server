# Build Image
FROM node:18.15.0-bullseye AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# App Image
FROM node:18.15.0-alpine3.17
WORKDIR /app

RUN mkdir -p /var/lib/chasm-master && chown node:node /var/lib/chasm-master

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY --from=build --chown=node:node /app .
RUN npm pkg delete scripts.prepare && npm ci

EXPOSE 8000
# USER node

ENTRYPOINT ["npm", "run"]
CMD ["start"]