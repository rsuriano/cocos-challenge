# Cocos Challenge

NestJS + TypeORM + PostgreSQL.

## Setup local

```bash
cp .env.example .env
npm install
npm run env:up       # Postgres en Docker (puerto 5433)
npm run start:dev
```

- Health (liveness, para ALB/ECS): http://localhost:3000/health
- Health de la DB: http://localhost:3000/health/db
- Swagger: http://localhost:3000/docs

## Migraciones

```bash
npm run migration:generate   # genera una migración a partir de las entidades
npm run migration:run
npm run migration:revert
```

## Producción

```bash
docker build -t cocos-challenge .
# migraciones como paso separado, antes de levantar la app
docker run --rm --env-file .env cocos-challenge npm run migration:run:prod
docker run -p 3000:3000 --env-file .env cocos-challenge
```

## Tests

```bash
npm test
npm run test:e2e     # requiere `npm run env:up`
```
