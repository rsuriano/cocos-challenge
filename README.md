# Cocos Challenge

API REST para consultar el portfolio de un usuario, buscar instrumentos y operar órdenes.

Stack: NestJS 12, TypeORM, PostgreSQL.

Las decisiones de diseño y la justificación de los cambios al esquema están en [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Requisitos

- Node.js 24 o superior
- Docker con Docker Compose, solo para la base de datos local opcional

## Setup

1. Copiar la configuración de ejemplo y completar la conexión a la base de datos provista con el challenge:

   ```bash
   cp .env.example .env
   ```

   En `.env`, poner la URL de Neon en `POSTGRES_URL` y `POSTGRES_SSL=true`. Las migraciones ya están aplicadas en esa base.

2. Instalar las dependencias:

   ```bash
   npm install
   ```

3. Levantar la API:

   ```bash
   npm run start:dev
   ```

La API escucha en `http://localhost:3000`.

### Base de datos local (opcional)

Para desarrollar o correr los tests e2e sin tocar la base provista:

1. Levantar PostgreSQL en Docker (puerto 5433):

   ```bash
   npm run env:up
   ```

2. En `.env`, dejar `POSTGRES_URL` y `POSTGRES_SSL` con los valores de `.env.example`.

3. Correr las migraciones. Crean las tablas, las claves foráneas, los índices y la extensión `pg_trgm`:

   ```bash
   npm run migration:run
   ```

La base local arranca vacía. Para apagarla: `npm run env:down`. Los datos quedan en un volumen de Docker.

## Endpoints

| Método | Ruta                      | Descripción                                     |
| ------ | ------------------------- | ----------------------------------------------- |
| GET    | `/portfolio/:userId`      | Valor total de la cuenta, efectivo y posiciones |
| GET    | `/instruments?search=...` | Búsqueda de instrumentos por ticker o nombre    |
| POST   | `/orders`                 | Envío de una orden de compra o venta            |
| POST   | `/orders/:id/cancel`      | Cancelación de una orden pendiente              |
| GET    | `/health`                 | Liveness. No consulta la base de datos          |
| GET    | `/health/db`              | Estado de la conexión a la base de datos        |

- Swagger: `http://localhost:3000/docs`
- Colección de Insomnia: [`docs/cocos-challenge.insomnia.json`](docs/cocos-challenge.insomnia.json). Importarla desde `Application > Import > From File`. Las variables `base_url`, `user_id`, `instrument_id` y `order_id` están en el environment de la colección.

### GET /portfolio/:userId

Devuelve el estado de la cuenta del usuario.

```json
{
  "userId": 1,
  "totalValue": "904784.00",
  "cash": {
    "total": "753000.00",
    "available": "627500.00",
    "reserved": "125500.00"
  },
  "assets": [
    {
      "instrumentId": 47,
      "ticker": "PAMP",
      "name": "Pampa Holding S.A.",
      "quantity": "40",
      "reservedQuantity": "0",
      "marketValue": "37034.00",
      "totalReturn": "-0.45",
      "dailyReturn": "0.44"
    }
  ]
}
```

- `totalValue`: `cash.total` más el `marketValue` de todas las posiciones.
- `cash.reserved`: pesos comprometidos en órdenes de compra pendientes (`BUY` en estado `NEW`).
- `cash.available`: `cash.total` menos `cash.reserved`. Es el máximo que una nueva compra puede gastar.
- `quantity`: acciones en cartera. Se calcula con las órdenes en estado `FILLED`.
- `reservedQuantity`: acciones comprometidas en órdenes de venta pendientes (`SELL` en estado `NEW`).
- `marketValue`: `quantity` por el último precio de cierre.
- `totalReturn`: rendimiento en porcentaje contra el costo promedio ponderado de compra.
- `dailyReturn`: rendimiento en porcentaje del último cierre contra el cierre anterior.
- Si un instrumento no tiene precio, `marketValue` y los rendimientos son `null`, y la posición no suma a `totalValue`.

Responde `404` si el usuario no existe.

### GET /instruments?search=...

Busca por ticker o por nombre y tolera errores de tipeo. Devuelve hasta 10 resultados, ordenados por relevancia: primero el ticker exacto, después los tickers que empiezan con la búsqueda, después el resto por similitud.

```
GET /instruments?search=galisia
```

```json
[{ "id": 34, "ticker": "GGAL", "name": "Grupo Financiero Galicia", "type": "ACCIONES" }]
```

Responde `400` si `search` está vacío.

### POST /orders

Envía una orden de compra o venta.

Header obligatorio: `Idempotency-Key`, un UUID generado por el cliente. Si el cliente reintenta con la misma key, la API devuelve la misma orden y no crea otra.

Body:

| Campo          | Tipo                | Descripción                                                      |
| -------------- | ------------------- | ---------------------------------------------------------------- |
| `userId`       | number              | Usuario que opera                                                |
| `instrumentId` | number              | Instrumento. Tiene que ser de tipo `ACCIONES`                    |
| `side`         | `BUY` \| `SELL`     | Compra o venta                                                   |
| `type`         | `MARKET` \| `LIMIT` | Ejecución al precio de mercado o a un precio fijado              |
| `size`         | number              | Cantidad de acciones. Entero positivo                            |
| `amount`       | string \| number    | Monto en pesos. La API compra la cantidad máxima entera          |
| `price`        | string \| number    | Precio por acción. Obligatorio en `LIMIT`, prohibido en `MARKET` |

Enviar `size` o `amount`, no los dos.

```json
{
  "userId": 1,
  "instrumentId": 47,
  "side": "BUY",
  "type": "MARKET",
  "amount": "5000"
}
```

Respuesta `201`:

```json
{
  "id": 12,
  "userId": 1,
  "instrumentId": 47,
  "side": "BUY",
  "type": "MARKET",
  "size": 5,
  "price": "925.85",
  "status": "FILLED",
  "rejectionReason": null,
  "datetime": "2026-10-30T22:45:52.322Z"
}
```

Reglas:

- Una orden `MARKET` se ejecuta al último precio de cierre y queda en estado `FILLED`.
- Una orden `LIMIT` queda en estado `NEW` hasta que se cancele.
- Si la orden no cumple las validaciones de saldo, la API la guarda en estado `REJECTED` y responde `201` con el motivo en `rejectionReason`:

| `rejectionReason`     | Motivo                                                   |
| --------------------- | -------------------------------------------------------- |
| `INSUFFICIENT_FUNDS`  | Compra por más que el efectivo disponible                |
| `INSUFFICIENT_SHARES` | Venta por más acciones que las disponibles               |
| `NO_MARKET_PRICE`     | Orden `MARKET` sobre un instrumento sin precio de cierre |
| `AMOUNT_BELOW_PRICE`  | El monto no alcanza para una acción                      |

Errores:

- `400`: body inválido, instrumento que no es `ACCIONES`, o header `Idempotency-Key` ausente o inválido.
- `404`: usuario o instrumento inexistente.

### POST /orders/:id/cancel

Cancela una orden en estado `NEW` y responde `200` con la orden en estado `CANCELLED`. Cancelar una orden ya cancelada responde `200` con la misma orden.

- `404`: la orden no existe.
- `409`: la orden está en estado `FILLED` o `REJECTED`.

## Tests

```bash
npm test          # unitarios
npm run test:e2e  # requiere la base local levantada y migrada
```

Los tests e2e crean sus propios datos y los borran al terminar.

## Producción

La imagen corre como usuario sin privilegios y no incluye dependencias de desarrollo.

```bash
docker build -t cocos-challenge .

# Las migraciones corren como paso separado, antes de levantar la API.
docker run --rm --env-file .env cocos-challenge npm run migration:run:prod
docker run -p 3000:3000 --env-file .env cocos-challenge
```

Variables de entorno:

| Variable       | Descripción                                               |
| -------------- | --------------------------------------------------------- |
| `NODE_ENV`     | `production` activa logs en JSON                          |
| `PORT`         | Puerto de la API. Default `3000`                          |
| `LOG_LEVEL`    | Nivel de log de pino. Default `info`                      |
| `TZ`           | `UTC`. `orders.datetime` es `timestamp without time zone` |
| `POSTGRES_URL` | URL de conexión                                           |
| `POSTGRES_SSL` | `true` para Neon o RDS                                    |

## Otros scripts

```bash
npm run lint                 # oxlint
npm run format               # prettier
npm run migration:generate   # genera una migración a partir de las entidades
npm run migration:revert     # revierte la última migración
```
