FROM node:20-alpine

RUN apk add --no-cache ffmpeg font-dejavu \
  && rm -rf /var/cache/apk/*

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY server.js render.js ./

EXPOSE 3001

ENV RENDER_SECRET=changeme
ENV FFMPEG_PATH=ffmpeg

CMD ["node", "server.js"]
