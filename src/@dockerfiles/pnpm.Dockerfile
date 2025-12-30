FROM node:22-alpine AS pnpm_base
RUN npm install --global pnpm@10 --no-fund -q;
RUN apk add make python3 gcc clang build-base musl-dev curl;
