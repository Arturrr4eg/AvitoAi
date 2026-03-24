FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=http://localhost:8080
ARG VITE_OPENROUTER_API_KEY=
ARG VITE_OPENROUTER_MODEL=openai/gpt-4o-mini
ARG VITE_LLM_PROXY_URL=

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_OPENROUTER_API_KEY=$VITE_OPENROUTER_API_KEY
ENV VITE_OPENROUTER_MODEL=$VITE_OPENROUTER_MODEL
ENV VITE_LLM_PROXY_URL=$VITE_LLM_PROXY_URL

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf


EXPOSE 80
