FROM node:20-alpine AS base
WORKDIR /app

COPY package.json ./
COPY tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN npm install

COPY packages ./packages
COPY apps/api ./apps/api

RUN npm run build --workspace packages/shared && npm run build --workspace apps/api

ENV NODE_ENV=production
ENV API_PORT=4000
EXPOSE 4000

CMD ["sh", "-c", "npm run db:push --workspace apps/api && npm run start --workspace apps/api"]