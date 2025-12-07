# Makefile for common development tasks (Unix-like systems)

.PHONY: npm-install npm-build npm-start npm-dev docker-build compose-up compose-down npm-e2e npm-clean change-summary show-changes merge-changes

# Load variables from .env if it exists
ifneq (,$(wildcard .env))
    include .env
    export $(shell sed 's/=.*//' .env)
endif

npm-install:
	npm install

npm-build: npm-install
	npm run build

npm-start: npm-build
	node server.js

dev-frontend:
	npm run dev

dev-backend:
	npm run dev:backend

npm-dev:
	@echo "Starting frontend and backend together (runs concurrently)"
	@echo "If you prefer separate terminals run `make dev-frontend` and `make dev-backend`"
	npm run dev:full"

docker-build:
	docker build \
		--build-arg REACT_APP_INITIAL_ADMIN_EMAIL="$(REACT_APP_INITIAL_ADMIN_EMAIL)" \
		--build-arg REACT_APP_GOOGLE_CLIENT_ID="$(REACT_APP_GOOGLE_CLIENT_ID)" \
		-t direct-admission:local .

docker-run:
	docker run --name direct-admission --rm -d -p 8080:8080 \
		-e GEMINI_API_KEY="$(GEMINI_API_KEY)" \
		-e GOOGLE_SHEET_ID="$(GOOGLE_SHEET_ID)" \
		-e GOOGLE_SERVICE_ACCOUNT_EMAIL="$(GOOGLE_SERVICE_ACCOUNT_EMAIL)" \
		-e GOOGLE_PRIVATE_KEY="$(GOOGLE_PRIVATE_KEY)" \
		direct-admission:local

docker-stop:
	docker stop direct-admission

compose-up:
	docker compose up --build -d

compose-down:
	docker compose down

npm-e2e:
	npm run test:e2e

npm-clean:
	rm -rf node_modules build

# Automatically detect current branch
CURRENT_BRANCH := $(shell git rev-parse --abbrev-ref HEAD)

# Show changed files only (PR-style 3-dot diff with --stat)
change-summary:
	@git fetch origin release
	@echo "📌 Current branch: $(shell git rev-parse --abbrev-ref HEAD)"
	@echo "📄 Showing changed files (3-dot diff):"
	@git diff --stat origin/release...$(shell git rev-parse --abbrev-ref HEAD)
	@echo "✅ Done."

# Show PR-style 3-dot diff exactly like GitHub
show-changes:
	@git fetch origin
	@echo "📌 Current branch: $(CURRENT_BRANCH)"
	@echo "📌 Updating release..."
	@git fetch origin release

	@echo ""
	@echo "📄 Showing PR-style diff (release...currentBranch):"
	@git diff origin/release...$(CURRENT_BRANCH)

	@echo ""
	@echo "✅ Done. No changes made to your working copy."

# Perform an actual merge into release but do NOT create a commit
merge-changes:
	@CURRENT_BRANCH=$$(git rev-parse --abbrev-ref HEAD); \
	echo "📌 Merging $$CURRENT_BRANCH → release (NO COMMIT)"; \
	git fetch origin; \
	echo "🔄 Switching to release..."; \
	git checkout release; \
	git pull origin release; \
	echo "🔗 Applying merge (no commit, no fast-forward)..."; \
	git merge $$CURRENT_BRANCH --no-commit --no-ff || { \
		echo ""; \
		echo "❌ Merge conflicts detected. Resolve manually."; \
		exit 1; \
	}; \
	echo ""; \
	echo "✅ Merge applied to working tree."; \
	echo "🛑 No commit created. Review changes before committing."
