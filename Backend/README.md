# Grain Quality Analyzer - Backend Service

This repository contains the backend service for the Grain Quality Analyzer application. The backend is built on Node.js/Express and provides a REST API, WebSocket connections for real-time sensor data, and sub-process execution for AI models (Python).

## Architecture

The backend consists of several architectural layers:

- **Express Server (`src/server.js`)**: Entry point for REST APIs, handling CORS, rate limiting, and request routing.
- **Controllers (`src/controllers/`)**: Logic execution for specific business use cases (Reports, Chat).
- **Services (`src/services/`)**: Core application logic and external integrations:
  - `aiService`: Integrates with AI/ML models.
  - `mqttService`: Connects to IoT devices via MQTT for hardware communication.
  - `socketService`: WebSocket server for real-time frontend updates.
  - `pdfService`: Generates downloadable PDF reports.
  - `validationService`: Handles data structure validation and sanitization.
- **Agents (`agents/`)**: Python-based AI agents (e.g., Llama-3, Advisory Engines) operating via sub-process integration.

## Prerequisites

- Node.js (v18 or higher recommended)
- Python 3.10+ (for local AI agents)
- MongoDB instance (Local or Atlas)
- Redis instance (for caching/queuing)
- MQTT Broker

## Environment Variables

Create a `.env` file in the root directory following the `.env.example` structure.

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/grain_quality
REDIS_URL=redis://localhost:6379
MQTT_URL=mqtt://localhost:1883
HUGGINGFACEHUB_API_TOKEN=<your_token>
```

## Installation and execution

### 1. Install Node Dependencies
```bash
npm install
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```
*(Ensure this is executed in a virtual environment if required by your deployment strategy)*

### 3. Start Development Server
```bash
npm run dev
```

### 4. Start Production Server
```bash
npm start
```

## AI Agent Integration

The backend leverages Python subprocesses for AI inference. The Express server spawns these processes dynamically:
- `chatbot.py`: Handles contextual advisory and general queries.
- `price_agent.py`: Aggregates and forecasts market pricing based on grain quality.
- `shelf_life_agent.py`: Calculates safe storage duration parameters.

Ensure all Python scripts are executable within their host environment and have access to the appropriate model binaries or API tokens (defined in `agents/.env`).
