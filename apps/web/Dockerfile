FROM node:20-alpine AS base
WORKDIR /app

COPY package.json ./
COPY tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN npm install

COPY packages ./packages
COPY apps/web ./apps/web

ARG VITE_API_BASE_URL=http://localhost:4000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build --workspace packages/shared && npm run build --workspace apps/web

ENV NODE_ENV=production
EXPOSE 5173

CMD ["npm", "run", "preview", "--workspace", "apps/web", "--", "--host", "0.0.0.0", "--port", "5173"]
