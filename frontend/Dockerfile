FROM node:20-bullseye AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

ARG VITE_API_URL=http://localhost:5000/api
ARG VITE_SOCKET_URL=http://localhost:5000
ARG VITE_MQTT_BROKER_URL=ws://localhost:9001
ARG VITE_MQTT_TOPIC_STATUS=grain/camera/status
ARG VITE_MQTT_TOPIC_IMAGE=grain/camera/image
ARG VITE_MQTT_TOPIC_RESULT=grain/quality/result

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV VITE_MQTT_BROKER_URL=$VITE_MQTT_BROKER_URL
ENV VITE_MQTT_TOPIC_STATUS=$VITE_MQTT_TOPIC_STATUS
ENV VITE_MQTT_TOPIC_IMAGE=$VITE_MQTT_TOPIC_IMAGE
ENV VITE_MQTT_TOPIC_RESULT=$VITE_MQTT_TOPIC_RESULT
ENV NODE_ENV=production

RUN npm run build

FROM node:20-bullseye-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=5173

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 5173

CMD ["node", "dist/index.cjs"]
