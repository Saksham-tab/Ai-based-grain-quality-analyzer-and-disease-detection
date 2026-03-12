# Grain Quality Analyzer - Frontend Application

This repository contains the frontend client for the Grain Quality Analyzer. It is a React-based Single Page Application (SPA) designed to interface with the Grain Quality backend services, IoT hardware feeds, and AI advisories.

## Technology Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: Wouter
- **State Management & Data Fetching**: React Query (@tanstack/react-query)
- **Styling**: Tailwind CSS, Class Variance Authority (CVA), standard CSS
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Component Architecture**: Built using highly reusable and accessible components (inspired by Radix UI/shadcn).

## Project Structure

```text
frontend/
├── client/
│   ├── src/
│   │   ├── components/       # Reusable UI components (buttons, badges)
│   │   ├── hooks/            # Custom React hooks (useGrainData)
│   │   ├── lib/              # Utility functions, API abstractions
│   │   ├── pages/            # View components (PurityDashboard, RealTimeAnalysis)
│   │   ├── services/         # State providers and service singletons (MqttProvider, apiService)
│   │   ├── types/            # TypeScript definitions and domain models
│   │   ├── App.tsx           # Application router
│   │   ├── index.css         # Global styles and Tailwind configuration
│   │   └── main.tsx          # Application entry point
├── server/                   # (If applicable, proxy or local dev server tools)
├── public/                   # Static assets
└── package.json              # Dependency configuration
```

## Key Features

1. **Real-Time Analysis**: Displays live metrics (moisture, purity, temperature) transmitted via WebSocket/MQTT from the analysis hardware.
2. **Purity Dashboard**: Consolidates impurity breakdowns, calculated quality grades, and market price predictions.
3. **Kisan Sahayak (Agricultural Assistant)**: A dedicated, full-page AI chat interface allowing operators to query disease conditions (supporting image context) within local vernacular via the backend LLM service. History is persisted iteratively.
4. **Report Generation**: Historical data lookup with PDF export capabilities.

## Environment Variables

Create a `.env` file in the `frontend` root.

```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
```

## Installation and Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
The application will be accessible at `http://localhost:5173`.

### 3. Build for Production
```bash
npm run build
```
This generates the optimized static assets in the `dist` directory, ready to be served by any static file server or integrated into the backend's static directory.
