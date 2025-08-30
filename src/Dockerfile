FROM node:22-alpine as pnpm_base
RUN npm install --global pnpm@10.14.0;

FROM pnpm_base as builder

ARG SERVICE

WORKDIR /build
COPY @shared/package.json                                /build/@shared/
COPY ${SERVICE}/package.json                             /build/service/
COPY tsconfig.base.json pnpm-workspace.yaml package.json /build/
COPY ${SERVICE}/entrypoint.sh                            /build/

RUN	pnpm install;

COPY @shared/    /build/@shared/
COPY ${SERVICE}/ /build/service/

RUN cd /build/service                                          && \
	pnpm run build:prod                                        && \
	mkdir -p /dist/@shared /dist/service                       && \
	cp /build/pnpm-workspace.yaml   /dist/pnpm-workspace.yaml  && \
	cp /build/@shared/package.json  /dist/@shared/             && \
	cp /build/service/package.json  /dist/service/             && \
	cp /build/package.json          /dist/                     && \
	cp /build/pnpm-lock.yaml        /dist/                     && \
	cp /build/entrypoint.sh         /dist/                     && \
	chmod +x /dist/entrypoint.sh;


FROM pnpm_base

WORKDIR /src

ARG EXTRA_FILES=empty
COPY --from=builder /dist /src
RUN pnpm install --prod --frozen-lockfile;
COPY ${EXTRA_FILES}       /extra
ENTRYPOINT [ "/src/entrypoint.sh" ]

CMD ["node", "/src/run.cjs"]

