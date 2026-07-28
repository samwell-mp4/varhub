FROM node:20-alpine

RUN apk add --no-cache ffmpeg font-dejavu wget unzip \
  && wget -qO /tmp/geist.zip https://github.com/vercel/geist-font/releases/download/v1.7.2/geist-font-v1.7.2.zip \
  && mkdir -p /usr/share/fonts/geist \
  && unzip -j /tmp/geist.zip "*/ttf/*.ttf" -d /usr/share/fonts/geist \
  && rm /tmp/geist.zip \
  && apk del wget unzip \
  && rm -rf /var/cache/apk/*

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY server.js render.js ./

EXPOSE 3001

ENV RENDER_SECRET=changeme
ENV FFMPEG_PATH=ffmpeg

CMD ["node", "server.js"]
