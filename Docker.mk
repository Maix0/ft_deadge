# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Docker.mk                                          :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: maiboyer <maiboyer@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/06/11 18:10:26 by maiboyer          #+#    #+#              #
#    Updated: 2025/11/19 13:52:55 by nrobinso         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

.PHONY: logs

all: build
	docker compose up -d

logs:
	docker compose logs -f chat auth icons nginx

down:
	docker compose down

build:
	docker compose build

re:
	$(MAKE) -f ./Docker.mk clean
	$(MAKE) -f ./Docker.mk all

clean:
	docker compose down

prune: clean
	-if ! [ -z $(shell docker ps -a -q) ] ; then \
		docker stop    $(shell docker ps -a -q); \
		docker rm      $(shell docker ps -a -q); \
	fi
	-docker image   prune -a
	-docker volume  prune
	-docker network prune
	-docker system  prune -a

ES_URL     ?= http://local.maix.me:9200
KIBANA_URL ?= http://local.maix.me:5601

logs-setup:
	@until curl -s "$(ES_URL)" > /dev/null 2>&1; do sleep 1; done;

	@curl -s -X PUT "$(ES_URL)/_ilm/policy/docker-logs-policy" \
	  -H "Content-Type: application/json" \
	  -d '{"policy":{"phases":{"hot":{"actions":{}},"delete":{"min_age":"7d","actions":{"delete":{}}}}}}' > /dev/null

	@curl -s -X PUT "$(ES_URL)/_template/docker-logs-template" \
	  -H "Content-Type: application/json" \
	  -d '{"index_patterns":["docker-*"],"settings":{"index.lifecycle.name":"docker-logs-policy"}}' > /dev/null

	@until curl -s "$(KIBANA_URL)/api/status" > /dev/null 2>&1; do sleep 1; done;

	@curl -s -X POST "$(KIBANA_URL)/api/saved_objects/index-pattern/docker-logs" \
	  -H "kbn-xsrf: true" \
	  -H "Content-Type: application/json" \
	  -d '{"attributes":{"title":"docker-*","timeFieldName":"@timestamp"}}' > /dev/null
