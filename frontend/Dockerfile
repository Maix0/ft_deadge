FROM pnpm_base AS deps

COPY ./package.json ./pnpm-lock.yaml ./pnpm-workspace.yaml /src/
WORKDIR /src
RUN pnpm install -q --frozen-lockfile;

FROM pnpm_base AS builder

WORKDIR /src
COPY --from=deps /src/node_modules /src/node_modules
COPY . /src

RUN pnpm run build;
