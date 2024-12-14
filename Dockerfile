FROM node:16

# Install dependencies untuk Chromium dan Playwright
RUN apt-get update && apt-get install -y \
  chromium \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libgbm1 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  && rm -rf /var/lib/apt/lists/*

# Install project dependencies
WORKDIR /app
COPY . .
RUN npm install

# Tentukan port yang akan digunakan
EXPOSE 3000

# Jalankan aplikasi
CMD ["node", "index.js"]
