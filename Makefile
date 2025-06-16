# **************************************************************************** #make
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: rparodi <rparodi@student.42.fr>            +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2023/11/12 11:05:05 by rparodi           #+#    #+#              #
#    Updated: 2025/06/16 15:36:58 by maiboyer         ###   ########.fr        #
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

BASE_PATH=$(shell realpath .)
ECHO = /usr/bin/env echo

all:
	@$(MAKE) --no-print-directory header
	@$(MAKE) --no-print-directory -f ./Docker.mk
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

#	phony
.PHONY: all clean fclean re header footer
