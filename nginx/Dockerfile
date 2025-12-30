FROM frontend AS frontend-files

FROM nginx:stable-alpine

ENV NGINX_DOMAIN "local.maix.me"

RUN \
	mkdir -p /volumes/ &&                               \
	mkdir -p /etc/nginx/ &&                             \
	mkdir -p /etc/ssl/certs &&                          \
	mkdir -p /etc/ssl/private &&                        \
	apk add openssl &&                                  \
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout /etc/ssl/private/nginx-selfsigned.key   \
		-out /etc/ssl/certs/nginx-selfsigned.crt        \
		-subj "/C=FR/OU=student/CN=${NGINX_DOMAIN}";

COPY ./15-local-resolvers.envsh       /docker-entrypoint.d/
COPY ./17-add-template-prefix.sh      /docker-entrypoint.d/
COPY ./conf                           /etc/nginx/templates

COPY ./monitoring.index.html          /var/share/www/monitoring/
COPY --from=frontend-files /src/dist  /var/share/www/static/

RUN chmod -R +r /var/share/www/monitoring/; 
RUN chmod -R +r /var/share/www/static/; 

HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f -s http://localhost:8080/ok?docker || exit 1;
