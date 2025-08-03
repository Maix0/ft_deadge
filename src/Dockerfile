FROM guergeiro/pnpm:22-10-slim as builder

ARG SERVICE

WORKDIR /build
COPY ./@shared/package.json    /build/@shared/package.json
COPY ./${SERVICE}/package.json /build/service/package.json
COPY ./${SERVICE}/package.json /build/package.json
COPY ./tsconfig.base.json      /build/tsconfig.base.json
COPY ./pnpm-workspace.yaml     /build/pnpm-workspace.yaml

RUN pnpm install;

COPY ./@shared/    /build/@shared/
COPY ./${SERVICE}/ /build/service/

RUN cd /build/service                                                              && \
	pnpm run build:prod                                                            && \
	node /build/@shared/scripts/merge.js /build/*/package.json >/dist/package.json && \
	cp /build/pnpm-workspace.yaml  /dist/pnpm-workspace.yaml;


FROM guergeiro/pnpm:22-10-alpine

WORKDIR /src

COPY --from=builder /dist /src

RUN pnpm install --prod;
CMD ["node", "/src/run.cjs"]

