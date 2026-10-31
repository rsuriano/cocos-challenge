# Decisiones de diseño

Este documento justifica los cambios al esquema provisto y resume las decisiones de diseño. El [README](../README.md) explica cómo correr el proyecto.

## Cambios al esquema

El esquema provisto se mantiene. Ninguna migración cambia una columna existente. Los enums (`side`, `type`, `status`) son enums de TypeScript sobre las columnas `varchar` originales.

La migración base (`1793160000000-baseline.ts`) crea las tablas con `CREATE TABLE IF NOT EXISTS`. Contra la base provista no hace nada. Contra una base vacía recrea el esquema. Las demás migraciones, en `src/infrastructure/db/postgres/migrations/`, agregan lo siguiente:

| Cambio                                                                                       | Migración                                     | Motivo                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claves foráneas `marketdata → instruments`, `orders → instruments`, `orders → users`         | `1793166185603-migration.ts`                  | La base garantiza la integridad aunque la aplicación tenga un bug. `NO ACTION` impide borrar un instrumento o un usuario con datos asociados. Antes de aplicarlas se verificó que no hubiera filas huérfanas. |
| Índice `orders (userid, instrumentid)`                                                       | `1793168055996-migration.ts`                  | El portfolio y la validación de órdenes agregan todas las órdenes de un usuario, agrupadas por instrumento. El índice cubre el filtro y el `GROUP BY`.                                                        |
| Índice `marketdata (instrumentid, date)`                                                     | `1793168055996-migration.ts`                  | El último precio de cada instrumento se obtiene con `DISTINCT ON (instrumentid) ORDER BY instrumentid, date DESC`. El índice resuelve ese orden sin ordenar en memoria.                                       |
| Extensión `pg_trgm` e índices GIN en `instruments.ticker` y `instruments.name`               | `1793262000000-instruments-trigram-search.ts` | La búsqueda por similitud de trigramas tolera errores de tipeo. Los índices GIN aceleran el `ILIKE` y los operadores de similitud. Neon soporta la extensión.                                                 |
| Columna `orders.idempotencykey` (`uuid`, nullable) e índice único `(userid, idempotencykey)` | `1793263174083-migration.ts`                  | Un reintento del cliente con la misma key devuelve la misma orden. El índice único hace que la garantía la dé la base, no el código.                                                                          |
| Columna `orders.rejectionreason` (`varchar`, nullable)                                       | `1793263174083-migration.ts`                  | Una orden `REJECTED` guarda el motivo. Sin esta columna, el estado no explica nada.                                                                                                                           |

Las migraciones corren como paso separado, antes de levantar la aplicación.

## Decisiones

- **Los saldos se derivan de `orders`.** No hay una tabla de saldos. El efectivo es la suma de los movimientos `FILLED` y la cantidad de un instrumento es compras menos ventas `FILLED`. Las órdenes `NEW` reservan efectivo o acciones. Así no existe un saldo guardado que pueda desincronizarse de las órdenes.
- **Una sola query para posiciones y efectivo.** `SUM(...) FILTER (WHERE ...)` agrupado por instrumento. Una query ve una foto consistente de la tabla; dos queries separadas podrían ver estados distintos. Los cálculos se hacen en memoria con `decimal.js`, sin floats.
- **El costo de una posición es el promedio ponderado de todas sus compras `FILLED`.** Las ventas restan cantidad y no modifican el promedio. Límite conocido: si el usuario vende toda la posición y después recompra a otro precio, el promedio sigue incluyendo las compras viejas y el rendimiento se mide contra un costo que no es el de las acciones actuales. Corregirlo exige recorrer las órdenes en orden cronológico, y eso ya no es un `SUM`.
- **Búsqueda con `word_similarity`**, umbral 0.4 y prefijo `ILIKE` sobre el ticker para búsquedas de una o dos letras. Orden: ticker exacto, tickers que empiezan con la búsqueda, resto por similitud. Máximo 10 resultados.
- **Creación de órdenes en una transacción con `SELECT ... FOR UPDATE` sobre la fila del usuario.** Las órdenes de un mismo usuario se procesan una a la vez: la segunda espera y lee los saldos que dejó la primera. Sin el lock, dos ventas concurrentes leen el mismo saldo y las dos pasan. Usuarios distintos no se bloquean entre sí. Dentro de la transacción va solo la sección crítica: lock, idempotencia, saldos, validación e inserción.
- **Idempotencia por header `Idempotency-Key`** (UUID obligatorio). La key se guarda en el mismo `INSERT` que la orden. Un reintento con la misma key devuelve la orden original, sin comparar el body.
- **Una orden que no cumple las reglas de saldo se guarda como `REJECTED` y responde `201`** con el motivo: `INSUFFICIENT_FUNDS`, `INSUFFICIENT_SHARES`, `NO_MARKET_PRICE` o `AMOUNT_BELOW_PRICE`. Un request mal formado responde `400` o `404` y no guarda nada.
- **El body se valida con `zod`** en el value object `OrderRequest`, incluidos los límites de las columnas (`integer`, `numeric(10,2)`), para que un valor fuera de rango responda `400` y no `500`.
- **Cancelación con `POST /orders/:id/cancel`.** `NEW` pasa a `CANCELLED`. Cancelar una `CANCELLED` responde `200` sin cambios. `FILLED` y `REJECTED` responden `409`. No toma lock: sin motor de matching, una `NEW` nunca pasa a `FILLED` por sí sola.

## Supuestos

- **No hay autenticación.** El `userId` viaja en el body o en la ruta. En producción sale del token.
- **`CASH_IN` y `CASH_OUT` no se crean por la API.** Son movimientos internos que confirma otro sistema. La API solo crea `BUY` y `SELL`.
- **Datos provistos.** El usuario 1 tiene 20 acciones compradas y 30 vendidas de `BMA`, las dos `FILLED`. La posición queda en −10 y el portfolio no la muestra. Con la validación de esta API, esa venta habría quedado `REJECTED`.
