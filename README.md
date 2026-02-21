# FleetFlow: Modular Fleet & Logistics Management System

## Architecture
- **Backend:** Odoo 17 + PostgreSQL
- **Frontend:** React (Vite) + TypeScript + MUI + React Query
- **System:** Docker Compose

## Quick Start (docker-compose up)
1. Run `docker-compose up --build -d`
2. Backend will initialize database `fleet_flow` and install the `fleetflow` addon which loads demo data. Wait about 30 seconds.
3. Access Frontend at http://localhost:5173
4. Access Backend (Odoo interface) at http://localhost:8069

## Demo Script
1. Open http://localhost:5173
2. Login with email: `admin` / password: `admin` (or use demo users from odoo)
3. Dashboard: View KPIs for Active Fleet, Maintenance, Revenues.
4. Vehicles: Filter cars by status, create a new vehicle.
5. Trips: Dispatch a new trip, verify capacity and driver availability logic.
6. Check backend validation blocking overload constraints.
