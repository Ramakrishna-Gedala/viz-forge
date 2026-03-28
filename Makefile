# =============================================================================
# Root Makefile — Data Processing Learning Platform
# =============================================================================
# This Makefile orchestrates both the backend (FastAPI) and frontend (React).
#
# Quick start:
#   make setup       Install everything and generate data (run once)
#   make dev         Start both backend + frontend in parallel
#
# Individual control:
#   make backend     Backend-only commands  →  cd backend && make <cmd>
#   make frontend    Frontend-only commands →  cd frontend && make <cmd>
# =============================================================================

.DEFAULT_GOAL := help

BACKEND_DIR  := backend
FRONTEND_DIR := frontend

# ── Colours ──────────────────────────────────────────────────────────────────
CYAN  := \033[36m
GREEN := \033[32m
YELLOW:= \033[33m
BOLD  := \033[1m
RESET := \033[0m

# =============================================================================
# HELP
# =============================================================================
.PHONY: help
help: ## Show all available root commands
	@echo ""
	@echo "  $(BOLD)$(CYAN)Data Processing Learning Platform$(RESET)"
	@echo "  Python data tools: Matplotlib · Seaborn · Plotly · Pandas"
	@echo "                     Bokeh · Altair · PySpark · NumPy"
	@echo ""
	@echo "  $(YELLOW)Quick Start$(RESET)"
	@echo "    make setup              Full first-time setup (both backend + frontend)"
	@echo "    make dev                Start backend + frontend in parallel"
	@echo ""
	@echo "  $(YELLOW)Individual Services$(RESET)"
	@echo "    make dev-backend        Backend only (FastAPI on port 8000)"
	@echo "    make dev-frontend       Frontend only (Vite on port 5173)"
	@echo ""
	@echo "  $(YELLOW)Setup Steps$(RESET)"
	@echo "    make setup-backend      Backend venv + pip install + generate CSVs"
	@echo "    make setup-frontend     Frontend npm install"
	@echo "    make generate-data      Regenerate all CSV datasets"
	@echo ""
	@echo "  $(YELLOW)Build$(RESET)"
	@echo "    make build              Build production frontend bundle"
	@echo ""
	@echo "  $(YELLOW)Code Quality$(RESET)"
	@echo "    make lint               Lint backend (ruff) + frontend (eslint)"
	@echo "    make check              Lint + type-check both"
	@echo ""
	@echo "  $(YELLOW)Testing$(RESET)"
	@echo "    make test               Run backend tests"
	@echo "    make test-api           Smoke-test all API endpoints"
	@echo ""
	@echo "  $(YELLOW)Maintenance$(RESET)"
	@echo "    make clean              Clean build artifacts (both)"
	@echo "    make clean-all          Remove venv + node_modules + CSVs"
	@echo ""
	@echo "  $(YELLOW)Delegation$(RESET)"
	@echo "    make backend CMD=<cmd>  Run any backend make target, e.g. make backend CMD=install"
	@echo "    make frontend CMD=<cmd> Run any frontend make target, e.g. make frontend CMD=build"
	@echo ""
	@echo "  Run 'cd backend && make help' or 'cd frontend && make help' for full command lists."
	@echo ""

# =============================================================================
# FIRST-TIME SETUP
# =============================================================================
.PHONY: setup
setup: setup-backend setup-frontend ## Full first-time setup (creates venv, installs deps, generates data)
	@echo ""
	@echo "  $(GREEN)$(BOLD)Setup complete!$(RESET)"
	@echo ""
	@echo "  Start both services with:  $(CYAN)make dev$(RESET)"
	@echo "  Backend only:              $(CYAN)make dev-backend$(RESET)"
	@echo "  Frontend only:             $(CYAN)make dev-frontend$(RESET)"
	@echo ""
	@echo "  URLs:"
	@echo "    Frontend  →  http://localhost:5173"
	@echo "    API docs  →  http://localhost:8000/docs"
	@echo "    Health    →  http://localhost:8000/health"
	@echo ""

.PHONY: setup-backend
setup-backend: ## Setup backend: create venv, install packages, generate CSV data
	@echo "$(CYAN)Setting up backend ...$(RESET)"
	$(MAKE) -C $(BACKEND_DIR) setup

.PHONY: setup-frontend
setup-frontend: ## Setup frontend: install npm dependencies
	@echo "$(CYAN)Setting up frontend ...$(RESET)"
	$(MAKE) -C $(FRONTEND_DIR) install

.PHONY: generate-data
generate-data: ## Regenerate all 7 CSV datasets
	$(MAKE) -C $(BACKEND_DIR) generate-data

# =============================================================================
# DEVELOPMENT
# =============================================================================
.PHONY: dev
dev: ## Start BOTH backend and frontend in separate background processes
	@echo "$(CYAN)Starting backend and frontend ...$(RESET)"
	@echo ""
	@echo "  Backend  →  http://localhost:8000"
	@echo "  API docs →  http://localhost:8000/docs"
	@echo "  Frontend →  http://localhost:5173"
	@echo ""
	@echo "$(YELLOW)Press Ctrl+C to stop both services.$(RESET)"
	@echo ""
	@$(MAKE) -C $(BACKEND_DIR) dev &  \
	 $(MAKE) -C $(FRONTEND_DIR) dev & \
	 wait

.PHONY: dev-backend
dev-backend: ## Start FastAPI backend only (port 8000, hot-reload)
	$(MAKE) -C $(BACKEND_DIR) dev

.PHONY: dev-frontend
dev-frontend: ## Start Vite frontend only (port 5173, HMR)
	$(MAKE) -C $(FRONTEND_DIR) dev

# =============================================================================
# BUILD
# =============================================================================
.PHONY: build
build: ## Build production frontend bundle (output: frontend/dist/)
	$(MAKE) -C $(FRONTEND_DIR) build

# =============================================================================
# CODE QUALITY
# =============================================================================
.PHONY: lint
lint: ## Lint both backend (ruff) and frontend (eslint)
	@echo "$(CYAN)Linting backend ...$(RESET)"
	-$(MAKE) -C $(BACKEND_DIR) lint
	@echo "$(CYAN)Linting frontend ...$(RESET)"
	-$(MAKE) -C $(FRONTEND_DIR) lint

.PHONY: check
check: ## Type-check + lint both services
	-$(MAKE) -C $(BACKEND_DIR) check
	-$(MAKE) -C $(FRONTEND_DIR) check

# =============================================================================
# TESTING
# =============================================================================
.PHONY: test
test: ## Run backend pytest tests
	$(MAKE) -C $(BACKEND_DIR) test

.PHONY: test-api
test-api: ## Smoke-test all API endpoints (backend must be running)
	$(MAKE) -C $(BACKEND_DIR) test-api

# =============================================================================
# MAINTENANCE
# =============================================================================
.PHONY: clean
clean: ## Remove build artifacts from both services
	$(MAKE) -C $(BACKEND_DIR) clean
	$(MAKE) -C $(FRONTEND_DIR) clean

.PHONY: clean-all
clean-all: ## Full clean: remove venv, node_modules, CSVs, caches
	$(MAKE) -C $(BACKEND_DIR) clean-all
	$(MAKE) -C $(FRONTEND_DIR) clean-all

# =============================================================================
# DELEGATION — run any sub-make target
# =============================================================================
.PHONY: backend
backend: ## Delegate to backend Makefile: make backend CMD=<target>
	@if [ -z "$(CMD)" ]; then $(MAKE) -C $(BACKEND_DIR) help; \
	else $(MAKE) -C $(BACKEND_DIR) $(CMD); fi

.PHONY: frontend
frontend: ## Delegate to frontend Makefile: make frontend CMD=<target>
	@if [ -z "$(CMD)" ]; then $(MAKE) -C $(FRONTEND_DIR) help; \
	else $(MAKE) -C $(FRONTEND_DIR) $(CMD); fi
