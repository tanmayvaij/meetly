.PHONY: install dev dev-backend dev-frontend

# Install dependencies for both backend and frontend
install:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

# Run the backend server
dev-backend:
	@echo "Starting backend..."
	cd backend && npm run dev

# Run the frontend server
dev-frontend:
	@echo "Starting frontend..."
	cd frontend && npm run dev

# Run both backend and frontend concurrently
dev:
	@echo "Starting both backend and frontend..."
	make -j2 dev-backend dev-frontend
