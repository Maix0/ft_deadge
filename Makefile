# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: rparodi <rparodi@student.42.fr>            +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2023/11/12 11:05:05 by rparodi           #+#    #+#              #
#    Updated: 2025/11/14 17:40:57 by maiboyer         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

# Colors
GREEN     = \033[32m
BLACK     = \033[30m
CYAN      = \033[36m
GREY      = \033[0;90m
RED       = \033[0;31m
GOLD      = \033[38;5;220m
BROWN     = \033[38;2;100;65;23m
WHITE     = \033[38;2;255;255;255m
END       = \033[0m
BOLD      = \033[1m
ITALIC    = \033[3m
UNDERLINE = \033[4m

PROJECT = ft_transcendence
BASE_PATH=$(shell realpath .)
ECHO = /usr/bin/env echo


all:
	@$(MAKE) --no-print-directory header
	@$(MAKE) --no-print-directory -f ./Docker.mk
	@$(MAKE) --no-print-directory footer

build:
	@$(MAKE) --no-print-directory header
	@$(MAKE) --no-print-directory -f ./Docker.mk build
	@$(MAKE) --no-print-directory footer

down:
	@$(MAKE) --no-print-directory header
	@$(MAKE) --no-print-directory -f ./Docker.mk down
	@$(MAKE) --no-print-directory footer

clean:
	@$(MAKE) --no-print-directory header
	@$(MAKE) --no-print-directory -f ./Docker.mk clean
	@$(MAKE) --no-print-directory footer

prune:
	@$(MAKE) --no-print-directory header
	@$(MAKE) --no-print-directory -f ./Docker.mk prune
	@$(MAKE) --no-print-directory footer

logs:
	@$(MAKE) --no-print-directory -f ./Docker.mk logs

#	Header
header:
	@$(ECHO) -e ''
	@$(ECHO) -e '$(GOLD)            *******     ****** ******* $(END)'
	@$(ECHO) -e '$(GOLD)          ******        ***    ******* $(END)'
	@$(ECHO) -e '$(GOLD)      *******           *      ******* $(END)'
	@$(ECHO) -e '$(GOLD)     ******                  *******   $(END)'
	@$(ECHO) -e '$(GOLD)  *******                  *******     $(END)'
	@$(ECHO) -e '$(GOLD) *******************    *******      * $(END)'
	@$(ECHO) -e '$(GOLD) *******************    *******    *** $(END)'
	@$(ECHO) -e '$(GOLD)              ******    ******* ****** $(END)'
	@$(ECHO) -e '$(GOLD)              ******                   $(END)'
	@$(ECHO) -e '$(GOLD)              ******                   $(END)'
	@$(ECHO) -e '$(GREY)            Made by maiboyerlpb x bebou$(END)'
	@$(ECHO) -e '$(GREY)                    minou x dumbaless  $(END)'
	@$(ECHO) -e -n $(MSG);

PROJECT__NAME = $(CYAN)$(BOLD)$(UNDERLINE)FT_TRANSCENDENCE$(END)$(GOLD)
#	Footer
footer:
	@$(ECHO) -e '$(GREEN)                                      $(END)'
	@$(ECHO) -e '$(GREEN)          ,     \\    /      ,         $(END)'
	@$(ECHO) -e '$(GREEN)         / \\    )\\__/(     / \\        $(END)'
	@$(ECHO) -e '$(GREEN)        /   \\  (_\\  /_)   /   \\       $(END)'
	@$(ECHO) -e '$(BROWN)   ____$(GREEN)/$(BROWN)_____$(GREEN)\\$(BROWN)__$(GREEN)\\$(WHITE)@  @$(GREEN)/$(BROWN)___$(GREEN)/$(BROWN)_____$(GREEN)\\$(BROWN)____  $(END)'
	@$(ECHO) -e '$(BROWN)  |             $(GREEN)|\\../|             $(BROWN) | $(END)'
	@$(ECHO) -e '$(BROWN)  |             $(GREEN) \\$(RED)vv$(GREEN)/              $(BROWN) | $(END)'
	@$(ECHO) -e '$(BROWN)  |        $(PROJECT__NAME)$(BROWN)         | $(END)'
	@$(ECHO) -e '$(BROWN)  |_________________________________| $(END)'
	@$(ECHO) -e '$(GREEN)   |   _/\\ /      \\\\      \\ / \\_   |  $(END)'
	@$(ECHO) -e '$(GREEN)   | _/   V        ))      V    \\_ |  $(END)'
	@$(ECHO) -e '$(GREEN)   |/     `       //       `      \\|  $(END)'
	@$(ECHO) -e '$(GREEN)   `              V                `  $(END)'
	@$(ECHO) -e '$(BROWN)                                      $(END)'
	@$(ECHO) -e '$(GREY)            The compilation is $(END)$(GOLD)finished$(END)'
	@$(ECHO) -e '$(GREY)                 Have a good $(END)$(GOLD)correction$(END)'

# Restart (make re)
re: 
	@$(MAKE) --no-print-directory clean
	@$(MAKE) --no-print-directory all

tokei:
	@/bin/sh -c 'tokei'

npm@: npm;
npm:
	@$(ECHO) "commands: "
	@$(ECHO) "  npm@install: install all dependencies"
	@$(ECHO) "  npm@fclean:  clean every \`dist\` directory"
	@$(ECHO) "  npm@clean:   clean \`node_modules\` directory"
	@$(ECHO) "  npm@build:   build subprojects"
	@$(ECHO) "  npm@eslint:  run eslint"

npm@eslint:
	(cd ./src/ && npx pnpm run eslint)

npm@install:
	(cd ./src/ && npx pnpm install)

npm@build:
	(cd ./src/ && npx pnpm run build)

npm@update:
	(cd ./src/ && rm -rf ./src/node_modules/ && npx pnpm update -r --workspace)

npm@openapi: openapi.jar
	@(cd ./src/ && npx pnpm run --if-present -r build:openapi)
	@rm -f ./src/openapi.json
	@(cd ./src/ && npx pnpm exec redocly join --without-x-tag-groups)
	@(cd ./src/ && java -jar ../openapi.jar generate -t ../openapi-template -g typescript-fetch -i openapi.json  -o ../frontend/src/api/generated);

openapi.jar:
	wget https://repo1.maven.org/maven2/org/openapitools/openapi-generator-cli/7.15.0/openapi-generator-cli-7.15.0.jar -O ./openapi.jar

# this convert the .dbml file to an actual sql file that SQLite can handle :)
sql:
	@echo "if the command isn't found, contact maieul :)"
	dbml_sqlite -t -f -w ./src/@shared/src/database/init.sql ./src/@shared/src/database/init.dbml

tmux:
	@tmux new-session -d -s $(PROJECT)
	@tmux send-keys -t $(PROJECT):0 'vim' C-m
	@tmux split-window -h -t $(PROJECT):0
	@tmux resize-pane -t $(PROJECT):0.0 -x 70
	@tmux new-window -t $(PROJECT):1 -n 'lazygit'
	@tmux send-keys -t $(PROJECT):1 'lazygit' C-m
	@tmux select-window -t $(PROJECT):0
	@tmux attach-session -t $(PROJECT)

nginx-dev/nginx-selfsigned.crt nginx-dev/nginx-selfsigned.key &:
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./nginx-dev/nginx-selfsigned.key -out ./nginx-dev/nginx-selfsigned.crt -subj "/C=FR/OU=student/CN=local.maix.me";

fnginx: nginx-dev/nginx-selfsigned.crt nginx-dev/nginx-selfsigned.key
	nginx -p ./nginx-dev -c nginx.conf -e /dev/stderr &
	-(cd ./frontend && pnpm exec tsc --noEmit --watch --preserveWatchOutput) &
	-(cd ./frontend && pnpm exec vite --clearScreen false)
	wait

#	phony
.PHONY: all clean fclean re header footer npm@install npm@clean npm@fclean npm@build sql tmux logs
