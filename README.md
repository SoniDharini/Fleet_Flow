# FleetFlow: Modular Fleet & Logistics Management System

## Architecture
- **Backend:** Odoo 17 + PostgreSQL
- **Frontend:** React (Vite) + TypeScript + MUI + React Query
- **System:** Docker Compose

## Quick Start (Docker - Recommended)
1. Run `docker-compose up --build -d`
2. Backend will initialize database `fleet_flow` and install the `fleetflow` addon which loads demo data. Wait about 30 seconds.
3. Access Frontend at http://localhost:5173
4. Access Backend (Odoo interface) at http://localhost:8069

## How to Run Backend and Frontend (Directly)

### Frontend (React/Vite)
1. Open a terminal and navigate to the frontend folder: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. The frontend will be available at http://localhost:5173

### Backend (Odoo)
*Note: The backend requires PostgreSQL and Odoo 17 to be installed.*
1. Ensure PostgreSQL is running.
2. In your Odoo environment, configure the `addons_path` to include the `backend/addons` directory.
3. Start the Odoo server with the `fleetflow` module:
   ```bash
   odoo -d fleet_flow -i fleetflow --without-demo=False --dev=all
   ```
4. The backend API and Odoo UI will be available at http://localhost:8069

## Demo Script
1. Open http://localhost:5173
2. Login with email: `admin` / password: `admin` (or use demo users from odoo)
3. Dashboard: View KPIs for Active Fleet, Maintenance, Revenues.
4. Vehicles: Filter cars by status, create a new vehicle.
5. Trips: Dispatch a new trip, verify capacity and driver availability logic.
6. Check backend validation blocking overload constraints.
