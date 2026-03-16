SHELL := /bin/sh

REGISTRY      ?= 192.168.88.199:6800
IMAGE_NAME    ?= student-accommodation-manager
TAG           ?= latest
FULL_IMAGE     = $(REGISTRY)/$(IMAGE_NAME):$(TAG)
CONTAINER_NAME ?= student-accommodation-manager

ENV_FILE      ?= .env
ENV_FILE_ARG   =
ifneq ("$(wildcard $(ENV_FILE))","")
	ENV_FILE_ARG = --env-file $(ENV_FILE)
endif

.PHONY: help print-config \
	install dev backend frontend build-frontend test lint \
	docker-build docker-run docker-stop docker-rm docker-logs \
	docker-push release

help:
	@echo "Available targets:"
	@echo "  make install        - Install backend and client dependencies with pnpm"
	@echo "  make dev            - Run backend and frontend dev servers (npm run dev:full)"
	@echo "  make backend        - Run backend dev server with nodemon (npm run dev)"
	@echo "  make frontend       - Run frontend dev server (npm run client)"
	@echo "  make build-frontend - Build frontend for production (npm run build)"
	@echo "  make test           - Run Jest test suite (npm test)"
	@echo "  make lint           - Run ESLint on server/**/*.js (npm run lint)"
	@echo "  make print-config   - Show registry/image/tag used for Docker builds"
	@echo "  make docker-build   - Build Docker image $(FULL_IMAGE)"
	@echo "  make docker-run     - Run container from $(FULL_IMAGE) on port 5000"
	@echo "  make docker-stop    - Stop running container $(CONTAINER_NAME)"
	@echo "  make docker-rm      - Remove container $(CONTAINER_NAME)"
	@echo "  make docker-logs    - Tail logs from container $(CONTAINER_NAME)"
	@echo "  make docker-push    - Push image $(FULL_IMAGE) to registry"
	@echo "  make release        - Build and push image to registry"

print-config:
	@echo "REGISTRY     = $(REGISTRY)"
	@echo "IMAGE_NAME   = $(IMAGE_NAME)"
	@echo "TAG          = $(TAG)"
	@echo "FULL_IMAGE   = $(FULL_IMAGE)"
	@echo "CONTAINER    = $(CONTAINER_NAME)"
	@echo "ENV_FILE     = $(ENV_FILE)"

install:
	pnpm install
	cd client && pnpm install

dev:
	npm run dev:full

backend:
	npm run dev

frontend:
	npm run client

build-frontend:
	npm run build

test:
	npm test

lint:
	npm run lint

docker-build:
	docker build -t $(FULL_IMAGE) .

docker-run:
	docker run --rm -d \
		--name $(CONTAINER_NAME) \
		-p 5000:5000 \
		$(ENV_FILE_ARG) \
		$(FULL_IMAGE)

docker-stop:
	- docker stop $(CONTAINER_NAME)

docker-rm:
	- docker rm $(CONTAINER_NAME)

docker-logs:
	docker logs -f $(CONTAINER_NAME)

docker-push:
	docker push $(FULL_IMAGE)

release: docker-build docker-push

