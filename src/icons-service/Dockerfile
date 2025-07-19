# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Dockerfile                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: maiboyer <maiboyer@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/06/16 14:57:11 by maiboyer          #+#    #+#              #
#    Updated: 2025/07/19 15:26:15 by maiboyer         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

# PLEASE DO NOT TOUCH THIS :)
# vvvvvvvvvvvvvvvvvvvvvvvvvv

FROM node:24-alpine as utils-builder

WORKDIR /app
COPY ./src/utils /app
RUN apk add python3;
RUN set -x && npm install && npm run build:ts && mkdir /out && cp -r package*.json dist/ /out;

# ^^^^^^^^^^^^^^^^^^^^^^^^^^
# PLEASE DO NOT TOUCH THIS :)

FROM node:24-alpine AS builder

# Don't forget to edit the .dockerignore if needed
COPY ./src/icons-service       /src/app
COPY --from=utils-builder /out /src/utils

WORKDIR /src/app
RUN npm install && npm run build:ts;

FROM node:24-alpine

WORKDIR /src/app
COPY --from=utils-builder /out /src/utils
COPY --from=builder /src/app/dist          ./dist
COPY --from=builder /src/app/package*.json .

RUN npm ci --omit=dev;
# Start the app
CMD ["node", "/src/app/dist/run.js"]

