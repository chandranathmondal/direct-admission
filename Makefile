# Makefile for common development tasks (Unix-like systems)

.PHONY: npm-install npm-build npm-start npm-dev docker-build compose-up compose-down npm-e2e npm-clean

# Load variables from .env if it exists
ifneq (,$(wildcard .env))
    include .env
    export $(shell sed 's/=.*//' .env)
endif

npm-install:
	npm install

npm-build:
	npm run build

npm-start: build
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