FROM node:22-alpine AS development

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY src ./src

EXPOSE 3000

CMD ["npm", "run", "dev"]

FROM node:22-alpine AS production
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node src ./src
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
