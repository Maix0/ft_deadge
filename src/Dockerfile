FROM node:24-alpine as builder

ARG SERVICE

RUN apk add jq python3 musl-dev gcc g++ make;

WORKDIR /build
COPY ./@shared/package.json    /build/@shared/package.json
COPY ./${SERVICE}/package.json /build/service/package.json
COPY ./tsconfig.base.json      /build/tsconfig.base.json

RUN echo "{\"name\":\"workspace\", \"workspaces\": [\"@shared\", \"${SERVICE}\" ]}"  | jq . >/build/package.json;
RUN npm install && npm install --prefix=/build/service;

COPY ./@shared/    /build/@shared/
COPY ./${SERVICE}/ /build/service/

RUN (cd /build/service && npm run build:prod) \
	&& jq -s '.[0] * .[1]' /build/@shared/package.json /build/service/package.json >/dist/package.json;

FROM node:24

WORKDIR /src

COPY --from=builder /dist /src

RUN npm install;
CMD ["node", "/src/run.cjs"]

