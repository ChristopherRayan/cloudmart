# Cloudmart

Campus delivery e-commerce web app (Docker-based local setup).

## 1) Run The App

### Prerequisites
- Docker Desktop (or Docker Engine + Docker Compose)
- Available ports: `80`, `3000`, `3306`, `6379`

### Start
```bash
cd /home/chris/projects/CLOUDMART
docker compose up -d
```

### Access URLs
- Frontend: `http://localhost:3000`
- API (via nginx): `http://localhost/api`

### Service Checks
```bash
docker compose ps
docker compose logs --tail=80 frontend
docker compose logs --tail=80 app
```

### Stop
```bash
docker compose down
```

## 2) Testing Credentials (Development Only)

### Admin
- Email: `admin@cloudimart.mw`
- Password: `password123`

### Delivery Staff
- Email: `del@gmail.mw`
- Password: `password123`

## 3) Role Behavior

- `admin` users are routed to: `/admin`
- `delivery_staff` users are routed to: `/delivery/dashboard`
- Delivery staff are restricted to delivery flow and are not expected to use the customer home/shopping flow.

## 4) Delivery Flow Notes

- Delivery dashboard loads assigned tasks with customer/location data and ordered item details.
- Delivery confirmation uses the customer order delivery code.
- Order status progression supports assignment, out-for-delivery, and delivered updates.

## 5) Troubleshooting

- If browser shows stale Next chunk errors (for example old `main.js`/`react-refresh.js` paths), do a hard refresh: `Ctrl+Shift+R`.
- If needed, clear site data for `localhost` and reload.
- Frontend container startup now clears stale `.next` cache automatically before `next dev`.

---
These credentials and instructions are for development/testing handover only.
