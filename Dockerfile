# Runs the whole suite (api + ui + integration) in the official Playwright image
# (Chromium + OS dependencies preinstalled).
# The tag must match the exact @playwright/test version pinned in package.json.
#
#   docker build -t demowebshop-tests .
#   docker run --rm -v "$(pwd)/playwright-report:/usr/src/app/playwright-report" demowebshop-tests
FROM mcr.microsoft.com/playwright:v1.64.1-noble
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
ENV CI=true
CMD ["npx", "playwright", "test"]
