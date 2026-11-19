# ==============================================================================
# Student Management System (SMS) - Developer Automation Makefile
# ==============================================================================
.DEFAULT_GOAL := help
SHELL := /bin/bash

# Configuration variables
COMPOSE_PROD := docker compose -f docker-compose.yml
COMPOSE_DEV  := docker compose -f docker-compose.dev.yml

# Colors for terminal output
BLUE   := \033[36m
GREEN  := \033[32m
YELLOW := \033[33m
RESET  := \033[0m

##@ 🚀 Docker Lifecycle
dev: ## Start development stack with live reload (Django + Vite HMR + Postgres)
	@echo -e "$(GREEN)Starting development stack with hot-reloading...$(RESET)"
	$(COMPOSE_DEV) up

dev-build: ## Build and start development stack
	@echo -e "$(GREEN)Building and starting development stack...$(RESET)"
	$(COMPOSE_DEV) up --build

prod: ## Start production stack in background (Gunicorn + Nginx + Postgres)
	@echo -e "$(GREEN)Starting production stack in daemon mode...$(RESET)"
	$(COMPOSE_PROD) up -d --build

down: ## Stop all active containers and remove network
	@echo -e "$(YELLOW)Stopping development and production containers...$(RESET)"
	$(COMPOSE_DEV) down --remove-orphans || true
	$(COMPOSE_PROD) down --remove-orphans || true

down-volumes: ## Stop containers and remove persistent database volumes (destructive!)
	@echo -e "$(YELLOW)Removing containers and persistent volumes...$(RESET)"
	$(COMPOSE_DEV) down -v --remove-orphans || true
	$(COMPOSE_PROD) down -v --remove-orphans || true

ps: ## List running SMS containers and their status
	@echo -e "$(BLUE)Active container status:$(RESET)"
	docker ps --filter "name=sms-"

logs: ## Follow logs from development stack
	$(COMPOSE_DEV) logs -f

logs-backend: ## Follow logs specifically from backend container
	$(COMPOSE_DEV) logs -f backend

logs-frontend: ## Follow logs specifically from frontend container
	$(COMPOSE_DEV) logs -f frontend

##@ ℹ️ General
help: ## Display this help dialog
	@echo -e "$(BLUE)Student Management System - Developer Commands$(RESET)"
	@echo -e "Usage: make $(GREEN)<target>$(RESET)\n"
	@awk 'BEGIN {FS = ":.*##"; printf ""} \
		/^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-18s$(RESET) %s\n", $$1, $$2 } \
		/^##@/ { printf "\n$(YELLOW)%s$(RESET)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
