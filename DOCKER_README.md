# Full Stack Application - Docker Setup

This project contains a FastAPI backend and React (Vite) frontend with Docker containerization.

## Project Structure

```
├── backend/                 # FastAPI backend
├── frontend/               # React + Vite frontend
├── DockerFile             # Multi-stage Dockerfile
├── docker-compose.yml     # Development environment
├── docker-compose.prod.yml # Production environment
├── nginx.conf             # Nginx configuration for production
└── init-mongo.js          # MongoDB initialization script
```

## Quick Start (Development)

### Prerequisites
- Docker and Docker Compose installed
- Ports 5173 (frontend), 8000 (backend), and 27017 (MongoDB) available

### Run the application
```bash
# Clone and navigate to the project
git clone <your-repo>
cd "A Full Stack Boiler Plate"

# Start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### Access the application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/v1/docs
- **MongoDB**: localhost:27017

### Stop the application
```bash
docker-compose down

# To also remove volumes (database data)
docker-compose down -v
```

## Production Deployment

### Environment Variables
Create a `.env` file in the root directory:
```env
MONGO_ROOT_PASSWORD=your-secure-mongo-password
SECRET_KEY=your-super-secret-jwt-key
```

### Deploy to production
```bash
# Build and run production containers
docker-compose -f docker-compose.prod.yml up --build -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop production
docker-compose -f docker-compose.prod.yml down
```

### Production Access
- **Application**: http://localhost (port 80)
- **API**: http://localhost/api/v1/

## Individual Service Management

### Backend Only
```bash
# Build backend image
docker build -t fastapi-backend --target backend .

# Run backend container
docker run -d \
  --name backend \
  -p 8000:8000 \
  -e MONGODB_URI=mongodb://localhost:27017 \
  fastapi-backend
```

### Frontend Only (Development)
```bash
# Build and run frontend for development
docker build -t react-frontend -f frontend/Dockerfile.dev frontend/
docker run -d --name frontend -p 5173:5173 -v $(pwd)/frontend:/app react-frontend
```

### Frontend Only (Production Build)
```bash
# Build production frontend
docker build -t react-frontend-prod --target production .
docker run -d --name frontend-prod -p 80:80 react-frontend-prod
```

## Database Management

### MongoDB Access
```bash
# Connect to MongoDB container
docker exec -it fullstack_mongodb mongo

# Or using MongoDB Compass
# Connection String: mongodb://admin:password123@localhost:27017
```

### Backup Database
```bash
# Create backup
docker exec fullstack_mongodb mongodump --out /data/backup

# Copy backup to host
docker cp fullstack_mongodb:/data/backup ./mongodb-backup
```

## Development Workflow

### Backend Development
```bash
# Install dependencies locally (optional, for IDE support)
cd backend
pip install -r requirements.txt

# The backend container will auto-reload on file changes
# Edit files in ./backend/ and changes will be reflected immediately
```

### Frontend Development
```bash
# Install dependencies locally (optional, for IDE support)
cd frontend
npm install

# The frontend container will auto-reload on file changes
# Edit files in ./frontend/src/ and changes will be reflected immediately
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 5173, 8000, and 27017 are available
2. **Build failures**: Run `docker system prune` to clean up old images
3. **Permission issues**: On Linux, you might need to run Docker commands with `sudo`

### Useful Commands
```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View logs for a specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb

# Rebuild specific service
docker-compose build backend
docker-compose up backend

# Shell into a container
docker exec -it fullstack_backend bash
docker exec -it fullstack_frontend sh

# Clean up everything
docker-compose down -v --rmi all
docker system prune -a
```

### Performance Optimization

1. **Multi-stage builds**: The Dockerfile uses multi-stage builds to minimize image size
2. **Layer caching**: Dependencies are installed before copying source code for better cache utilization
3. **Nginx serving**: In production, Nginx serves static files and proxies API requests
4. **Gzip compression**: Enabled in Nginx for better performance

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to version control
2. **MongoDB**: Use strong passwords and consider authentication
3. **CORS**: Configure appropriate CORS origins for production
4. **SSL/TLS**: Add SSL certificates for HTTPS in production
5. **Network**: Use Docker networks to isolate services

## Monitoring and Logging

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# With timestamps
docker-compose logs -f -t backend
```

### Health Checks
- Backend health: http://localhost:8000/api/v1/health
- Frontend: Check if http://localhost:5173 loads
- MongoDB: `docker exec fullstack_mongodb mongo --eval "db.adminCommand('ismaster')"`
