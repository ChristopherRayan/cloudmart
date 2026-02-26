# Cloudmart

Campus delivery e-commerce web app.

## Run The App (Docker)

### Prerequisites
- Docker Desktop (or Docker Engine + Docker Compose)
- Ports available: `80`, `3000`, `3306`, `6379`

### Start
```bash
cd /home/chris/projects/CLOUDMART
docker compose up -d
```

### Open
- Frontend: `http://localhost:3000`
- API (via nginx): `http://localhost/api`

### Check Services
```bash
docker compose ps
docker compose logs --tail=80 frontend
docker compose logs --tail=80 app
```

### Stop
```bash
docker compose down
```

## Testing Credentials (Development)

### Admin
- Email: `admin@cloudimart.mw`
- Password: `password123`

### Delivery Staff
- Email: `del@gmail.mw`
- Password: `password123`

> These accounts are for development/testing use.
