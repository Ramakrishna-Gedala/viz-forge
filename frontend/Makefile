# =============================================================================
# Frontend Makefile — Data Processing Learning Platform
# =============================================================================
# Usage:
#   make help          Show all available commands
#   make setup         Full first-time environment setup
#   make dev           Start development server
# =============================================================================

NPM     := npm
VITE    := npx vite
PORT    := 5173

.DEFAULT_GOAL := help

# ── Colours ──────────────────────────────────────────────────────────────────
CYAN  := \033[36m
GREEN := \033[32m
YELLOW:= \033[33m
RED   := \033[31m
RESET := \033[0m

# =============================================================================
# HELP
# =============================================================================
.PHONY: help
help: ## Show this help message
	@echo ""
	@echo "  $(CYAN)Data Processing Platform — Frontend$(RESET)"
	@echo ""
	@echo "  $(YELLOW)Setup$(RESET)"
	@echo "    make setup          Full first-time setup (install + verify)"
	@echo "    make install        Install all npm dependencies"
	@echo "    make install-clean  Clean install (removes node_modules first)"
	@echo ""
	@echo "  $(YELLOW)Development$(RESET)"
	@echo "    make dev            Start Vite dev server on http://localhost:$(PORT)"
	@echo "    make dev-host       Start dev server on all network interfaces"
	@echo "    make preview        Preview the production build locally"
	@echo ""
	@echo "  $(YELLOW)Build$(RESET)"
	@echo "    make build          Type-check + production build to dist/"
	@echo "    make build-only     Build without TypeScript check"
	@echo "    make typecheck      Run tsc type checker only"
	@echo ""
	@echo "  $(YELLOW)Code Quality$(RESET)"
	@echo "    make lint           Run ESLint on all source files"
	@echo "    make lint-fix       Run ESLint and auto-fix issues"
	@echo "    make format         Format with Prettier (if installed)"
	@echo "    make check          Run lint + typecheck together"
	@echo ""
	@echo "  $(YELLOW)shadcn/ui$(RESET)"
	@echo "    make shadcn-add c=<name>  Add a shadcn component (e.g. make shadcn-add c=dialog)"
	@echo "    make shadcn-list          List all available shadcn components"
	@echo ""
	@echo "  $(YELLOW)Maintenance$(RESET)"
	@echo "    make clean          Remove dist/ build output"
	@echo "    make clean-modules  Remove node_modules/"
	@echo "    make clean-all      Remove dist/ + node_modules/"
	@echo "    make deps           Show installed dependency tree (top level)"
	@echo "    make audit          Run npm security audit"
	@echo "    make update         Check for outdated packages"
	@echo ""

# =============================================================================
# SETUP
# =============================================================================
.PHONY: setup
setup: install ## Full first-time setup
	@echo ""
	@echo "  $(GREEN)Frontend setup complete!$(RESET)"
	@echo "  Run 'make dev' to start the development server."
	@echo "  Make sure the backend is also running: cd ../backend && make dev"
	@echo ""

.PHONY: install
install: ## Install all npm dependencies
	@echo "$(CYAN)Installing npm dependencies ...$(RESET)"
	$(NPM) install
	@echo "$(GREEN)Dependencies installed.$(RESET)"

.PHONY: install-clean
install-clean: clean-modules install ## Remove node_modules then install fresh
	@echo "$(GREEN)Clean install complete.$(RESET)"

# =============================================================================
# DEVELOPMENT
# =============================================================================
.PHONY: dev
dev: ## Start Vite dev server with HMR on http://localhost:5173
	@echo "$(CYAN)Starting frontend dev server on http://localhost:$(PORT) ...$(RESET)"
	@echo "$(YELLOW)Backend must be running on http://localhost:8000$(RESET)"
	$(NPM) run dev

.PHONY: dev-host
dev-host: ## Start Vite dev server accessible on all network interfaces
	@echo "$(CYAN)Starting frontend on all interfaces (port $(PORT)) ...$(RESET)"
	$(NPM) run dev -- --host

.PHONY: preview
preview: build ## Build then preview the production output locally
	@echo "$(CYAN)Starting preview server ...$(RESET)"
	$(NPM) run preview

# =============================================================================
# BUILD
# =============================================================================
.PHONY: build
build: ## Type-check + Vite production build (outputs to dist/)
	@echo "$(CYAN)Building production bundle ...$(RESET)"
	$(NPM) run build
	@echo "$(GREEN)Build complete! Output: dist/$(RESET)"

.PHONY: build-only
build-only: ## Vite build without TypeScript type-check
	@echo "$(CYAN)Building (skip typecheck) ...$(RESET)"
	$(NPM) exec -- vite build

.PHONY: typecheck
typecheck: ## Run TypeScript compiler check (no emit)
	@echo "$(CYAN)Running TypeScript type check ...$(RESET)"
	$(NPM) exec -- tsc -b --noEmit 2>/dev/null || $(NPM) exec -- tsc --noEmit
	@echo "$(GREEN)TypeScript check passed.$(RESET)"

# =============================================================================
# CODE QUALITY
# =============================================================================
.PHONY: lint
lint: ## Run ESLint on all source files
	@echo "$(CYAN)Running ESLint ...$(RESET)"
	$(NPM) run lint

.PHONY: lint-fix
lint-fix: ## Run ESLint and auto-fix fixable issues
	@echo "$(CYAN)Running ESLint with --fix ...$(RESET)"
	$(NPM) exec -- eslint src --fix

.PHONY: format
format: ## Format source files with Prettier (install separately if needed)
	@echo "$(CYAN)Formatting with Prettier ...$(RESET)"
	$(NPM) exec --yes -- prettier --write "src/**/*.{ts,tsx,css,json}" 2>/dev/null || \
		echo "$(YELLOW)Prettier not installed. Run: npm install -D prettier$(RESET)"

.PHONY: check
check: lint typecheck ## Run lint + typecheck together

# =============================================================================
# SHADCN/UI
# =============================================================================
.PHONY: shadcn-add
shadcn-add: ## Add a shadcn component: make shadcn-add c=dialog
	@if [ -z "$(c)" ]; then \
		echo "$(RED)Error: specify a component name, e.g. make shadcn-add c=dialog$(RESET)"; \
		exit 1; \
	fi
	@echo "$(CYAN)Adding shadcn component: $(c) ...$(RESET)"
	$(NPM) exec -- shadcn@latest add $(c)

.PHONY: shadcn-list
shadcn-list: ## List all available shadcn components
	@echo "$(CYAN)Available shadcn components:$(RESET)"
	$(NPM) exec -- shadcn@latest list

# =============================================================================
# MAINTENANCE
# =============================================================================
.PHONY: clean
clean: ## Remove dist/ build output
	@echo "$(CYAN)Removing dist/ ...$(RESET)"
	rm -rf dist/
	@echo "$(GREEN)Build output removed.$(RESET)"

.PHONY: clean-modules
clean-modules: ## Remove node_modules/ (re-run make install to restore)
	@echo "$(YELLOW)Removing node_modules/ ...$(RESET)"
	rm -rf node_modules/
	@echo "$(GREEN)node_modules removed.$(RESET)"

.PHONY: clean-all
clean-all: clean clean-modules ## Remove dist/ and node_modules/
	@echo "$(GREEN)Full clean complete.$(RESET)"

.PHONY: deps
deps: ## Show top-level installed dependencies
	@echo "$(CYAN)Installed packages (top level):$(RESET)"
	$(NPM) list --depth=0

.PHONY: audit
audit: ## Run npm security audit
	@echo "$(CYAN)Running security audit ...$(RESET)"
	$(NPM) audit

.PHONY: update
update: ## Check for outdated packages
	@echo "$(CYAN)Checking for outdated packages ...$(RESET)"
	$(NPM) outdated || true
