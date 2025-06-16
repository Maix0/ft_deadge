# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Dockerfile                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: maiboyer <maiboyer@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/06/16 14:57:11 by maiboyer          #+#    #+#              #
#    Updated: 2025/06/16 23:32:17 by maiboyer         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

FROM localhost/utils-builder AS utils-builder
FROM node:24-alpine AS builder

# Don't forget to edit the .dockerignore if needed
COPY . /src/app
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

