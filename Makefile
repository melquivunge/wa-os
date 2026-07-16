.PHONY: setup infra-up infra-down dev api web test lint typecheck

setup:
	composer install --working-dir=apps/api
	npm install --prefix apps/web
	cp -n apps/api/.env.example apps/api/.env || true
	php apps/api/artisan key:generate

infra-up:
	docker compose up -d postgres redis

infra-down:
	docker compose down

dev:
	docker compose up --build

api:
	php apps/api/artisan serve

web:
	npm run dev --prefix apps/web

test:
	php apps/api/artisan test
	npm run test --prefix apps/web --if-present

lint:
	npm run lint --prefix apps/web

typecheck:
	npm run typecheck --prefix apps/web
