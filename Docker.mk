.PHONY: logs

# TODO: REMOVE THIS BEFORE LAUNCH
# this allows the us to only start the non-monitoring sercices
DOCKER_SERVICE=        \
			  auth     \
			  chat     \
			  tic-tac-toe \
			  nginx    \
			  user     \
			  

all: build
	docker compose up -d $(DOCKER_SERVICE)

logs:
	docker compose logs -f

down:
	docker compose down

build:
	docker compose build $(DOCKER_SERVICE)

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
