# DoneTick Docker Deployment

Self-hosted DoneTick chore management application using Docker Compose.

## Overview

This directory contains the Docker Compose configuration for running DoneTick v0.1.64, a self-hosted household chore management system with SQLite database persistence.

## Quick Start

### 1. Configure JWT Secret

**IMPORTANT**: Before starting, edit `docker-compose.yaml` and change the `DT_JWT_SECRET` environment variable:

```bash
# Generate a secure random secret
openssl rand -base64 32
```

Then update the value in `docker-compose.yaml`:
```yaml
DT_JWT_SECRET: "your-generated-secret-here"
```

This secret is critical for JWT token signing and authentication security.

### 2. Start the Service

```bash
docker compose up -d
```

### 3. Access DoneTick

Open your browser to: http://localhost:2021

### 4. Create Your Account

On first access, create an admin account through the DoneTick web interface.

## Configuration

### Docker Compose Services

#### donetick
- **Image**: `donetick/donetick:v0.1.64`
- **Ports**: 2021:2021 (remove if using reverse proxy)
- **Restart Policy**: unless-stopped
- **Networks**: proxy (external), default

### Volumes

The following persistent volumes are created:

- `donetick_data` - SQLite database storage
- `donetick_config` - Application configuration files
- `donetick_uploads` - User uploaded files

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `DT_ENV` | Yes | Environment mode | `selfhosted` |
| `DT_SQLITE_PATH` | Yes | SQLite database file path | `/donetick-data/donetick.db` |
| `DT_JWT_SECRET` | **Required** | JWT signing secret - MUST be changed! | `CHANGE_ME_TO_A_LONG_RANDOM_STRING` |
| `DT_ROOT_URL` | No | Base URL when using HTTPS reverse proxy | - |

### Network Configuration

The service is configured with two networks:

1. **default** - Internal Docker network for container communication
2. **proxy** (external) - For reverse proxy integration (e.g., Traefik, Nginx)

**Note**: If you don't use a reverse proxy, you can remove the `proxy` network section from `docker-compose.yaml` or ensure the network exists:

```bash
docker network create proxy
```

## Reverse Proxy Setup

### With Traefik

```yaml
services:
  donetick:
    # ... existing config ...
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.donetick.rule=Host(`donetick.example.com`)"
      - "traefik.http.routers.donetick.entrypoints=websecure"
      - "traefik.http.routers.donetick.tls=true"
      - "traefik.http.services.donetick.loadbalancer.server.port=2021"
    environment:
      DT_ROOT_URL: "https://donetick.example.com"
    # Remove the ports section when using proxy
```

### With Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name donetick.example.com;

    location / {
        proxy_pass http://donetick:2021;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then set `DT_ROOT_URL=https://donetick.example.com` in your environment.

## Usage

### Start the service
```bash
docker compose up -d
```

### View logs
```bash
docker compose logs -f
```

### Stop the service
```bash
docker compose down
```

### Update to latest version
```bash
docker compose pull
docker compose up -d
```

### Restart the service
```bash
docker compose restart
```

## Data Management

### Backup Database

```bash
# Copy SQLite database from volume
docker compose exec donetick cat /donetick-data/donetick.db > donetick-backup-$(date +%Y%m%d).db
```

Or backup the entire volume:

```bash
docker run --rm \
  -v donetick_donetick_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/donetick-data-$(date +%Y%m%d).tar.gz /data
```

### Restore Database

```bash
# Stop the service
docker compose down

# Restore from backup
docker run --rm \
  -v donetick_donetick_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/donetick-data-YYYYMMDD.tar.gz -C /

# Start the service
docker compose up -d
```

## Troubleshooting

### Service won't start

Check logs:
```bash
docker compose logs
```

Common issues:
- Port 2021 already in use - change port mapping or stop conflicting service
- JWT secret not set - set `DT_JWT_SECRET` in environment
- External proxy network doesn't exist - create it or remove from config

### Cannot access UI

1. Verify service is running: `docker compose ps`
2. Check port is accessible: `curl http://localhost:2021`
3. Review firewall rules
4. Check logs for errors: `docker compose logs donetick`

### Database corruption

1. Stop the service: `docker compose down`
2. Restore from backup (see Data Management above)
3. If no backup, check SQLite integrity:
   ```bash
   docker compose exec donetick sqlite3 /donetick-data/donetick.db "PRAGMA integrity_check;"
   ```

## Security Considerations

1. **JWT Secret**: Always set `DT_JWT_SECRET` to a strong random value
2. **Reverse Proxy**: Use HTTPS in production via reverse proxy
3. **Network Isolation**: Consider removing port exposure and use proxy only
4. **Regular Backups**: Automate database backups
5. **Updates**: Keep the Docker image updated for security patches

## API Access

DoneTick provides an API for external integrations. See the [DoneTick API documentation](https://docs.donetick.com/advance-settings/api/) for details.

To generate an API key:
1. Log into DoneTick web UI
2. Navigate to Settings → API
3. Generate a new access token

Use with the [donetick-reporting](../donetick-reporting/README.md) library:

```bash
export DONETICK_URL="http://localhost:2021"
export DONETICK_ACCESS_TOKEN="your-api-key"
```

## Upgrading

### Version Updates

Check the [DoneTick releases](https://github.com/donetick/donetick/releases) for breaking changes.

To upgrade:

1. Update the image version in `docker-compose.yaml`
2. Pull the new image: `docker compose pull`
3. Backup your data (see Data Management)
4. Restart: `docker compose up -d`

### Migration from v0.1.x to v0.2.x

Check official migration guides when upgrading major versions.

## Resources

- [DoneTick Official Documentation](https://docs.donetick.com/)
- [DoneTick API Reference](https://docs.donetick.com/advance-settings/api/)
- [DoneTick GitHub](https://github.com/donetick/donetick)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## Support

For DoneTick-specific issues, consult the official documentation or open an issue on the DoneTick GitHub repository.
