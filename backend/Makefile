# =============================================================================
# Backend Makefile — Data Processing Learning Platform
# =============================================================================
# Usage:
#   make help          Show all available commands
#   make setup         Full first-time environment setup
#   make dev           Start development server
# =============================================================================

PYTHON      := python
VENV        := .venv
PIP         := $(VENV)/Scripts/pip
UVICORN     := $(VENV)/Scripts/uvicorn
PY          := $(VENV)/Scripts/python
PORT        := 8000
HOST        := 127.0.0.1

.DEFAULT_GOAL := help

# ── Colours ──────────────────────────────────────────────────────────────────
CYAN  := \033[36m
GREEN := \033[32m
YELLOW:= \033[33m
RESET := \033[0m

# =============================================================================
# HELP
# =============================================================================
.PHONY: help
help: ## Show this help message
	@echo ""
	@echo "  $(CYAN)Data Processing Platform — Backend$(RESET)"
	@echo ""
	@echo "  $(YELLOW)Setup$(RESET)"
	@echo "    make setup          Full first-time setup (venv + deps + data)"
	@echo "    make venv           Create Python virtual environment only"
	@echo "    make install        Install Python dependencies into venv"
	@echo "    make install-dev    Install dependencies + dev/test extras"
	@echo "    make generate-data  Generate all 7 CSV datasets"
	@echo ""
	@echo "  $(YELLOW)Development$(RESET)"
	@echo "    make dev            Start uvicorn with hot-reload (port $(PORT))"
	@echo "    make dev-host       Start uvicorn accessible on all interfaces"
	@echo "    make start          Start uvicorn without hot-reload (production-like)"
	@echo ""
	@echo "  $(YELLOW)Code Quality$(RESET)"
	@echo "    make lint           Run ruff linter"
	@echo "    make format         Auto-format with ruff"
	@echo "    make typecheck      Run mypy type checker"
	@echo "    make check          Run lint + typecheck together"
	@echo ""
	@echo "  $(YELLOW)Testing$(RESET)"
	@echo "    make test           Run pytest"
	@echo "    make test-cov       Run pytest with coverage report"
	@echo "    make test-api       Smoke-test all API endpoints (curl)"
	@echo ""
	@echo "  $(YELLOW)Maintenance$(RESET)"
	@echo "    make clean          Remove __pycache__ and .pyc files"
	@echo "    make clean-data     Remove generated CSV files"
	@echo "    make clean-venv     Remove the virtual environment"
	@echo "    make clean-all      Remove everything (venv + cache + data)"
	@echo "    make freeze         Output current installed packages"
	@echo ""

# =============================================================================
# SETUP
# =============================================================================
.PHONY: setup
setup: venv install generate-data ## Full first-time setup (venv + deps + data)
	@echo ""
	@echo "  $(GREEN)Setup complete!$(RESET)"
	@echo "  Run 'make dev' to start the server."
	@echo ""

.PHONY: venv
venv: ## Create Python virtual environment at backend/.venv (skips if already exists)
	@$(PYTHON) -c "import os, sys; sys.exit(0) if os.path.exists('.venv/pyvenv.cfg') else sys.exit(1)" && echo "$(GREEN)Virtual environment already exists, skipping.$(RESET)" || (echo "$(CYAN)Creating virtual environment at backend/.venv ...$(RESET)" && $(PYTHON) -m venv .venv && echo "$(GREEN)Virtual environment created.$(RESET)")

.PHONY: install
install: ## Install Python dependencies from requirements.txt
	@echo "$(CYAN)Installing Python dependencies ...$(RESET)"
	$(PY) -m pip install --upgrade pip --quiet
	$(PIP) install -r requirements.txt
	@echo "$(GREEN)Dependencies installed.$(RESET)"

.PHONY: install-dev
install-dev: install ## Install dependencies + dev extras (ruff, mypy, pytest)
	@echo "$(CYAN)Installing dev dependencies ...$(RESET)"
	$(PIP) install ruff mypy pytest pytest-cov httpx --quiet
	@echo "$(GREEN)Dev dependencies installed.$(RESET)"

.PHONY: generate-data
generate-data: ## Generate all 7 CSV datasets (run once, ~10 seconds)
	@echo "$(CYAN)Generating CSV datasets ...$(RESET)"
	$(PY) scripts/generate_data.py
	@echo "$(GREEN)Datasets generated in backend/data/$(RESET)"

# =============================================================================
# DEVELOPMENT
# =============================================================================
.PHONY: dev
dev: ## Start FastAPI dev server with hot-reload on http://localhost:8000
	@echo "$(CYAN)Starting backend dev server on http://$(HOST):$(PORT) ...$(RESET)"
	@echo "$(YELLOW)API docs: http://$(HOST):$(PORT)/docs$(RESET)"
	$(UVICORN) main:app --reload --host $(HOST) --port $(PORT)

.PHONY: dev-host
dev-host: ## Start FastAPI dev server accessible on all network interfaces
	@echo "$(CYAN)Starting backend on 0.0.0.0:$(PORT) (all interfaces) ...$(RESET)"
	$(UVICORN) main:app --reload --host 0.0.0.0 --port $(PORT)

.PHONY: start
start: ## Start FastAPI without hot-reload (production-like)
	@echo "$(CYAN)Starting backend server (no reload) on $(HOST):$(PORT) ...$(RESET)"
	$(UVICORN) main:app --host $(HOST) --port $(PORT) --workers 1

# =============================================================================
# CODE QUALITY
# =============================================================================
.PHONY: lint
lint: ## Run ruff linter on all Python files
	@echo "$(CYAN)Running ruff linter ...$(RESET)"
	$(PY) -m ruff check .

.PHONY: format
format: ## Auto-format code with ruff
	@echo "$(CYAN)Formatting code with ruff ...$(RESET)"
	$(PY) -m ruff format .
	$(PY) -m ruff check --fix .

.PHONY: typecheck
typecheck: ## Run mypy type checker
	@echo "$(CYAN)Running mypy type checker ...$(RESET)"
	$(PY) -m mypy main.py routers/ utils/ --ignore-missing-imports

.PHONY: check
check: lint typecheck ## Run lint + typecheck

# =============================================================================
# TESTING
# =============================================================================
.PHONY: test
test: ## Run pytest
	@echo "$(CYAN)Running tests ...$(RESET)"
	$(PY) -m pytest tests/ -v

.PHONY: test-cov
test-cov: ## Run pytest with HTML coverage report
	@echo "$(CYAN)Running tests with coverage ...$(RESET)"
	$(PY) -m pytest tests/ -v --cov=. --cov-report=html --cov-report=term-missing
	@echo "$(GREEN)Coverage report: htmlcov/index.html$(RESET)"

.PHONY: test-api
test-api: ## Smoke-test all API endpoints (requires running server on port 8000)
	@echo "$(CYAN)Smoke-testing API endpoints ...$(RESET)"
	@curl -sf http://$(HOST):$(PORT)/health              > /dev/null && echo "  [OK] /health" || echo "  [FAIL] /health"
	@curl -sf http://$(HOST):$(PORT)/matplotlib/bar-chart > /dev/null && echo "  [OK] /matplotlib/bar-chart" || echo "  [FAIL] /matplotlib/bar-chart"
	@curl -sf http://$(HOST):$(PORT)/seaborn/heatmap      > /dev/null && echo "  [OK] /seaborn/heatmap" || echo "  [FAIL] /seaborn/heatmap"
	@curl -sf http://$(HOST):$(PORT)/plotly/candlestick   > /dev/null && echo "  [OK] /plotly/candlestick" || echo "  [FAIL] /plotly/candlestick"
	@curl -sf http://$(HOST):$(PORT)/pandas/histogram     > /dev/null && echo "  [OK] /pandas/histogram" || echo "  [FAIL] /pandas/histogram"
	@curl -sf http://$(HOST):$(PORT)/bokeh/dashboard      > /dev/null && echo "  [OK] /bokeh/dashboard" || echo "  [FAIL] /bokeh/dashboard"
	@curl -sf http://$(HOST):$(PORT)/altair/layered       > /dev/null && echo "  [OK] /altair/layered" || echo "  [FAIL] /altair/layered"
	@curl -sf "http://$(HOST):$(PORT)/spark/schema"       > /dev/null && echo "  [OK] /spark/schema" || echo "  [FAIL] /spark/schema"
	@curl -sf http://$(HOST):$(PORT)/numpy/statistics     > /dev/null && echo "  [OK] /numpy/statistics" || echo "  [FAIL] /numpy/statistics"
	@echo "$(GREEN)Smoke tests complete.$(RESET)"

# =============================================================================
# MAINTENANCE
# =============================================================================
.PHONY: clean
clean: ## Remove __pycache__ and .pyc files
	@echo "$(CYAN)Cleaning Python cache files ...$(RESET)"
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
	find . -name "*.pyo" -delete 2>/dev/null || true
	find . -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	@echo "$(GREEN)Cache cleaned.$(RESET)"

.PHONY: clean-data
clean-data: ## Remove generated CSV files (re-run make generate-data to restore)
	@echo "$(YELLOW)Removing generated CSV files ...$(RESET)"
	rm -f data/*.csv
	@echo "$(GREEN)CSV files removed.$(RESET)"

.PHONY: clean-venv
clean-venv: ## Remove the virtual environment
	@echo "$(YELLOW)Removing virtual environment ...$(RESET)"
	rm -rf .venv
	@echo "$(GREEN)Virtual environment removed.$(RESET)"

.PHONY: clean-all
clean-all: clean clean-data clean-venv ## Remove everything (cache + data + venv)
	@echo "$(GREEN)Full clean complete.$(RESET)"

.PHONY: freeze
freeze: ## Output currently installed packages (for updating requirements.txt)
	@echo "$(CYAN)Installed packages:$(RESET)"
	$(PIP) list

.PHONY: show-data
show-data: ## Show CSV file sizes and row counts
	@echo "$(CYAN)CSV dataset sizes:$(RESET)"
	@for f in data/*.csv; do \
		lines=$$(wc -l < "$$f"); \
		size=$$(du -sh "$$f" | cut -f1); \
		echo "  $$size  $$(basename $$f)  ($$lines rows)"; \
	done
