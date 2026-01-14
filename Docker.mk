.PHONY: logs

# Set DEV only if it is not already set and .dev file exists
IS_CI=n
IS_DEV=n

REDUCED_SET=n
DOCKER_SERVICE=

ifndef DEV
ifeq "$(wildcard .dev)" ".dev"
	IS_DEV := y
	REDUCED_SET := y
endif
endif


ifeq "$(DEV)" "y"
	IS_DEV := y
	REDUCED_SET := y
endif

ifeq "$(CI)" "y"
	IS_CI := y
	REDUCED_SET := y
endif

# TODO: REMOVE THIS BEFORE LAUNCH
# this allows the us to only start the non-monitoring sercices
ifeq "$(REDUCED_SET)" "y"
	DOCKER_SERVICE :=       \
				auth        \
				chat        \
				tic-tac-toe \
				nginx       \
				user        \
				pong
endif

all: build
	@[ $(REDUCED_SET) = y ] && echo -e "\x1b[31mUSING REDUCED SET OF DOCKER CONTAINER\x1b[0m" || true
	@[ $(IS_DEV) = y ] && echo -e "\x1b[31mUsing dev mode => remove .dev if needed\x1b[0m" || true
	@[ $(IS_CI) = y ] && echo -e "\x1b[31mUsing CI mode => Check env if needed\x1b[0m" || true
	docker compose up -d $(DOCKER_SERVICE)

logs:
	docker compose logs -f

down:
	docker compose down

build: .env
	@[ $(REDUCED_SET) = y ] && echo -e "\x1b[31mUSING REDUCED SET OF DOCKER CONTAINER\x1b[0m" || true
	@[ $(IS_DEV) = y ] && echo -e "\x1b[31mUsing dev mode => remove .dev if needed\x1b[0m" || true
	@[ $(IS_CI) = y ] && echo -e "\x1b[31mUsing CI mode => Check env if needed\x1b[0m" || true
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

.env:
	@echo "edit the env.example file and use the \`make jwt_secret\` to create a valid jwt secret"
	@echo "write the stuff to .env"
	exit 1
