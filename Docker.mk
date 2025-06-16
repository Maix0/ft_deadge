# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Docker.mk                                          :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: maiboyer <maiboyer@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/06/11 18:10:26 by maiboyer          #+#    #+#              #
#    Updated: 2025/06/16 15:37:20 by maiboyer         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

all:
	docker compose build
	docker compose up -d

logs:
	docker compose logs -f

down:
	docker compose down

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

