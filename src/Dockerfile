# lets include the pnpm_deps as an named image (raw_deps)
FROM pnpm_deps AS raw_deps

# lets make a `raw_builder` as an image -> this only include the deps and the metadata files
FROM pnpm_base AS raw_builder

WORKDIR /build

COPY --from=raw_deps /build/node_modules                   /build/node_modules
ARG SERVICE
COPY package.json                                          /build/
COPY @shared/package.json                                  /build/@shared/
COPY ${SERVICE}/package.json                               /build/${SERVICE}/
COPY tsconfig.base.json pnpm-workspace.yaml pnpm-lock.yaml /build/


# lets actually build our stuff
FROM raw_builder AS builder
WORKDIR /build

COPY @shared/                 /build/@shared/
COPY ${SERVICE}/              /build/${SERVICE}/

RUN cd /build/${SERVICE}                                          && \
	pnpm run build:prod                                           && \
	mkdir -p /dist/@shared             /dist/${SERVICE}           && \
	cp /build/pnpm-workspace.yaml      /dist/pnpm-workspace.yaml  && \
	cp /build/pnpm-lock.yaml           /dist/pnpm-lock.yaml       && \
	cp /build/@shared/package.json     /dist/@shared/             && \
	cp /build/${SERVICE}/package.json  /dist/${SERVICE}/;

# this is our actual running container :D
FROM pnpm_base
WORKDIR /src

COPY --from=builder        /dist                /src
COPY --from=raw_builder    /build/node_modules  /src/node_modules

CMD ["node", "/src/run.cjs"]

HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f -s http://localhost/monitoring?docker || exit 1
