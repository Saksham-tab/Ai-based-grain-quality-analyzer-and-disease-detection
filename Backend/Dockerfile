FROM node:20-bullseye

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
  && ln -s /usr/bin/python3 /usr/local/bin/python \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY requirements.txt ./
RUN python3 -m pip install --no-cache-dir -r requirements.txt

COPY . .

ENV NODE_ENV=production
ENV PYTHONUNBUFFERED=1

EXPOSE 5000

CMD ["node", "src/server.js"]
