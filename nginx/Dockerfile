# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Dockerfile                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: maiboyer <maiboyer@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/06/12 16:42:38 by maiboyer          #+#    #+#              #
#    Updated: 2025/06/16 21:21:16 by maiboyer         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

FROM nginx:stable-alpine

RUN \
	mkdir -p /volumes/ &&                               \
	mkdir -p /etc/nginx/ &&                             \
	mkdir -p /etc/ssl/certs &&                          \
	mkdir -p /etc/ssl/private &&                        \
	apk add openssl &&                                  \
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout /etc/ssl/private/nginx-selfsigned.key   \
		-out /etc/ssl/certs/nginx-selfsigned.crt        \
		-subj "/C=FR/OU=student/CN=${NGINX_DOMAIN}"
COPY ./15-local-resolvers.envsh  /docker-entrypoint.d/
COPY ./17-add-template-prefix.sh /docker-entrypoint.d/
COPY ./conf /etc/nginx/templates
