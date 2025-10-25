FROM node:22-alpine AS pnpm_base
RUN npm install --global pnpm@10 --no-fund -q;
RUN apk add make python3 gcc clang build-base musl-dev;

FROM pnpm_base AS builder

ARG SERVICE

WORKDIR /build
COPY package.json 										   /build/
COPY @shared/package.json                                  /build/@shared/
COPY ${SERVICE}/                                           /build/${SERVICE}
COPY tsconfig.base.json pnpm-workspace.yaml pnpm-lock.yaml /build/
COPY ${SERVICE}/entrypoint.sh                              /build/

RUN pnpm install --frozen-lockfile;

COPY @shared/    /build/@shared/
COPY ${SERVICE}/ /build/${SERVICE}/

RUN cd /build/${SERVICE}                                          && \
	pnpm run build:prod                                           && \
	mkdir -p /dist/@shared             /dist/${SERVICE}           && \
	cp /build/pnpm-workspace.yaml      /dist/pnpm-workspace.yaml  && \
	cp /build/pnpm-lock.yaml           /dist/pnpm-lock.yaml       && \
	cp /build/@shared/package.json     /dist/@shared/             && \
	cp /build/${SERVICE}/package.json  /dist/${SERVICE}/          && \
	cp /build/entrypoint.sh            /dist/                     && \
	chmod +x /dist/entrypoint.sh;


FROM pnpm_base

WORKDIR /src

ARG EXTRA_FILES=empty
COPY --from=builder /dist /src
RUN pnpm install --prod --frozen-lockfile;
COPY ${EXTRA_FILES}       /extra
ENTRYPOINT [ "/src/entrypoint.sh" ]

CMD ["node", "/src/run.cjs"]

