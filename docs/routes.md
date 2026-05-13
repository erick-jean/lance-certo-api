# Rotas do produto

## Subscription

| Método | Rota | Permissão |
| ------ | ---- | --------- |
| GET | `/subscription/usage` | Authenticated |

## Vehicles

| Método | Rota | Permissão |
| ------ | ---- | --------- |
| PATCH | `/vehicles/:vehicleId/purchase` | Premium, Owner/Admin |
| PATCH | `/vehicles/:vehicleId/sale` | Premium, Owner/Admin |
| GET | `/vehicles/:vehicleId/financial-summary` | Premium, Owner/Admin |

## Dashboard

| Método | Rota | Permissão |
| ------ | ---- | --------- |
| GET | `/dashboard/summary` | Authenticated |
| GET | `/dashboard/financial` | Premium |

## Reports

| Método | Rota | Permissão |
| ------ | ---- | --------- |
| GET | `/reports/vehicles/:vehicleId` | Premium, Owner/Admin |
