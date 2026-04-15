FROM mcr.microsoft.com/playwright:v1.45.0-jammy
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
ENV BASE_URL=https://teste-colmeia-qa.colmeia-corp.com
CMD ["npx", "playwright", "test"]
