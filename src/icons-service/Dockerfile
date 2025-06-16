# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Dockerfile                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: maiboyer <maiboyer@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/06/16 14:57:11 by maiboyer          #+#    #+#              #
#    Updated: 2025/06/16 15:28:33 by maiboyer         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

FROM node:24-alpine AS builder

# Don't forget to edit the .dockerignore if needed
COPY . /app

WORKDIR /app
RUN npm install && npm run build:ts;

FROM node:24-alpine

WORKDIR /app

COPY --from=builder /app/dist          ./dist
COPY --from=builder /app/package*.json .

RUN npm ci --omit=dev;
# Start the app
CMD ["node", "dist/run.js"]

