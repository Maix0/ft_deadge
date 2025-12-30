FROM pnpm_base AS deps
WORKDIR /build

COPY package.json  pnpm-workspace.yaml pnpm-lock.yaml /build/


# You need to list all services here...
COPY @shared/package.json  /build/@shared/package.json
COPY auth/package.json  /build/auth/package.json
COPY chat/package.json  /build/chat/package.json
COPY tic-tac-toe/package.json  /build/tic-tac-toe/package.json
COPY user/package.json  /build/user/package.json

RUN pnpm install -q --frozen-lockfile;
