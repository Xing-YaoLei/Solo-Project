FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=development
ENV HOST=0.0.0.0
ENV PORT=3000

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
