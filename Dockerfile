# ── Stage 1: Build React frontend ──────────────────────────────────────────────
FROM node:20-alpine AS frontend
WORKDIR /app/web
COPY web/package.json web/package-lock.json* ./
RUN npm install --legacy-peer-deps react-is prop-types
COPY web/ ./
ENV VITE_GOOGLE_MAPS_API_KEY=AIzaSyDZPBLh2NRgbIaud-FQjw7Fbi1f4Pb01PU
RUN npm run build

# ── Stage 2: Python backend + static frontend ─────────────────────────────────
FROM python:3.12-slim
WORKDIR /app

# Install Python deps
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Copy data files
COPY data/ ./data/

# Copy frontend build from stage 1
COPY --from=frontend /app/web/dist ./static

# Cloud Run provides PORT env var (default 8080)
ENV PORT=8080
EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
