# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Dockerfile                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: maiboyer <maiboyer@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/06/16 22:41:22 by maiboyer          #+#    #+#              #
#    Updated: 2025/06/16 23:24:54 by maiboyer         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

FROM node:24-alpine

WORKDIR /app
COPY . /app
RUN set -x && npm install && npm run build:ts && mkdir /out && cp -r package*.json dist/ /out
CMD [ "/bin/true" ]
