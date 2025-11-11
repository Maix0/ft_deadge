FROM node:22-alpine AS pnpm_base
RUN npm install --global pnpm@10;

FROM pnpm_base AS builder

COPY . /src
WORKDIR /src
RUN pnpm install --frozen-lockfile && pnpm run build;

FROM node:22-alpine

COPY --from=builder /src/dist /dist
COPY ./run.sh /bin/run.sh

RUN chmod +x /bin/run.sh

CMD [ "/bin/run.sh" ]
