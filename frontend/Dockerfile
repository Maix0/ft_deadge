FROM node:22-alpine AS pnpm_base
RUN npm install --global pnpm@10;

FROM pnpm_base AS deps

COPY ./package.json ./pnpm-lock.yaml ./pnpm-workspace.yaml /src/
WORKDIR /src
RUN pnpm install --frozen-lockfile;

FROM pnpm_base AS builder

WORKDIR /src
COPY --from=deps /src/node_modules /src/node_modules
COPY . /src

RUN pnpm run build;

FROM pnpm_base

COPY  --from=builder /src/dist /dist
COPY ./run.sh /bin/run.sh

RUN chmod +x /bin/run.sh

CMD [ "/bin/run.sh" ]
