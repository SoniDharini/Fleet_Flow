import os
import json

base_dir = r"c:\Users\Ayushi Soni\Desktop\Fleet_Flow"

def create_file(path, content):
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')

files = {}

files['docker-compose.yml'] = """
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=postgres
      - POSTGRES_PASSWORD=odoo
      - POSTGRES_USER=odoo
    volumes:
      - odoo-db-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  odoo:
    image: odoo:17.0
    depends_on:
      - db
    ports:
      - "8069:8069"
    volumes:
      - ./backend/addons:/mnt/extra-addons
      - ./backend/odoo.conf:/etc/odoo/odoo.conf
      - odoo-web-data:/var/lib/odoo
    environment:
      - HOST=db
      - USER=odoo
      - PASSWORD=odoo
    command: ["odoo", "-d", "fleet_flow", "-i", "fleetflow", "--without-demo=False", "--dev=all"]

  frontend:
    image: node:20-alpine
    working_dir: /app
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "5173:5173"
    environment:
      - CHOKIDAR_USEPOLLING=true
      - VITE_API_BASE_URL=http://localhost:8069
    command: sh -c "npm install && npm run dev -- --host 0.0.0.0"

volumes:
  odoo-db-data:
  odoo-web-data:
"""

files['.gitignore'] = """
node_modules/
__pycache__/
*.pyc
.env
dist/
.odoo/
"""

files['README.md'] = """
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
"""

files['backend/odoo.conf'] = """
[options]
admin_passwd = admin
db_host = db
db_port = 5432
db_user = odoo
db_password = odoo
addons_path = /mnt/extra-addons
data_dir = /var/lib/odoo
cors_origins = *
log_level = info
"""

files['backend/addons/fleetflow/__init__.py'] = """
from . import models
from . import controllers
"""

files['backend/addons/fleetflow/__manifest__.py'] = """
{
    'name': 'FleetFlow',
    'version': '1.0',
    'category': 'Logistics',
    'summary': 'Modular Fleet & Logistics Management System',
    'depends': ['base', 'mail'],
    'data': [
        'security/security.xml',
        'security/ir.model.access.csv',
        'data/demo_data.xml',
    ],
    'demo': [],
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}
"""

files['backend/addons/fleetflow/models/__init__.py'] = """
from . import vehicle
from . import driver
from . import trip
from . import maintenance
from . import fuel
"""

files['backend/addons/fleetflow/models/vehicle.py'] = """
from odoo import models, fields, api
from odoo.exceptions import ValidationError

class Vehicle(models.Model):
    _name = 'fleetflow.vehicle'
    _description = 'Fleet Vehicle'

    name = fields.Char(string='Model', required=True)
    license_plate = fields.Char(required=True)
    vehicle_type = fields.Selection([
        ('car', 'Car'),
        ('truck', 'Truck'),
        ('van', 'Van')
    ], required=True)
    region = fields.Char(required=True)
    max_load_capacity = fields.Float(required=True, help="In kg")
    odometer = fields.Float(default=0)
    acquisition_cost = fields.Float()
    status = fields.Selection([
        ('Available', 'Available'),
        ('On Trip', 'On Trip'),
        ('In Shop', 'In Shop'),
        ('Retired', 'Retired')
    ], default='Available', required=True)

    fuel_log_ids = fields.One2many('fleetflow.fuel_log', 'vehicle_id')
    maintenance_log_ids = fields.One2many('fleetflow.maintenance_log', 'vehicle_id')
    trip_ids = fields.One2many('fleetflow.trip', 'vehicle_id')

    total_fuel_cost = fields.Float(compute='_compute_costs', store=True)
    total_maintenance_cost = fields.Float(compute='_compute_costs', store=True)
    total_operational_cost = fields.Float(compute='_compute_costs', store=True)
    fuel_efficiency = fields.Float(compute='_compute_efficiency', store=True)

    _sql_constraints = [
        ('unique_license_plate', 'unique(license_plate)', 'License plate must be unique!')
    ]

    @api.depends('fuel_log_ids.cost', 'maintenance_log_ids.cost')
    def _compute_costs(self):
        for rec in self:
            rec.total_fuel_cost = sum(rec.fuel_log_ids.mapped('cost'))
            rec.total_maintenance_cost = sum(rec.maintenance_log_ids.mapped('cost'))
            rec.total_operational_cost = rec.total_fuel_cost + rec.total_maintenance_cost

    @api.depends('fuel_log_ids.liters', 'odometer')
    def _compute_efficiency(self):
        for rec in self:
            total_liters = sum(rec.fuel_log_ids.mapped('liters'))
            rec.fuel_efficiency = (rec.odometer / total_liters) if total_liters > 0 else 0
"""

files['backend/addons/fleetflow/models/driver.py'] = """
from odoo import models, fields, api
from datetime import date

class Driver(models.Model):
    _name = 'fleetflow.driver'
    _description = 'Fleet Driver'

    name = fields.Char(required=True)
    license_number = fields.Char(required=True)
    license_expiry_date = fields.Date(required=True)
    status = fields.Selection([
        ('On Duty', 'On Duty'),
        ('Off Duty', 'Off Duty'),
        ('Suspended', 'Suspended'),
        ('On Trip', 'On Trip')
    ], default='On Duty', required=True)
    safety_score = fields.Integer(default=100)
    
    trip_ids = fields.One2many('fleetflow.trip', 'driver_id')
    completion_rate = fields.Float(compute='_compute_completion', store=True)

    @api.depends('trip_ids.state')
    def _compute_completion(self):
        for rec in self:
            completed_trips = len(rec.trip_ids.filtered(lambda t: t.state == 'Completed'))
            total_trips = len(rec.trip_ids)
            rec.completion_rate = (completed_trips / total_trips * 100) if total_trips > 0 else 100
"""

files['backend/addons/fleetflow/models/trip.py'] = """
from odoo import models, fields, api
from odoo.exceptions import ValidationError
from datetime import date

class Trip(models.Model):
    _name = 'fleetflow.trip'
    _description = 'Trip Dispatch'

    name = fields.Char(string='Reference', required=True, copy=False, readonly=True, default='New')
    vehicle_id = fields.Many2one('fleetflow.vehicle', required=True)
    driver_id = fields.Many2one('fleetflow.driver', required=True)
    source = fields.Char(required=True)
    destination = fields.Char(required=True)
    planned_start_date = fields.Datetime(required=True)
    cargo_weight = fields.Float(required=True)
    distance_km = fields.Float(required=True)
    revenue = fields.Float(required=True)
    state = fields.Selection([
        ('Draft', 'Draft'),
        ('Dispatched', 'Dispatched'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled')
    ], default='Draft', required=True)

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('name', 'New') == 'New':
                vals['name'] = self.env['ir.sequence'].next_by_code('fleetflow.trip') or 'New'
        return super().create(vals_list)

    @api.constrains('cargo_weight', 'vehicle_id')
    def _check_weight(self):
        for rec in self:
            if rec.cargo_weight > rec.vehicle_id.max_load_capacity:
                raise ValidationError(f"Cargo weight {rec.cargo_weight} exceeds vehicle capacity {rec.vehicle_id.max_load_capacity}")

    @api.constrains('vehicle_id')
    def _check_vehicle_status(self):
        for rec in self:
            if rec.state == 'Draft' and rec.vehicle_id.status in ['In Shop', 'Retired']:
                raise ValidationError("Selected vehicle is not available.")

    @api.constrains('driver_id')
    def _check_driver_status(self):
        for rec in self:
            if rec.driver_id.license_expiry_date and rec.driver_id.license_expiry_date < date.today():
                raise ValidationError("Driver license is expired!")
            if rec.driver_id.status in ['Off Duty', 'Suspended']:
                raise ValidationError("Driver is not available for dispatch.")

    def action_dispatch(self):
        for rec in self:
            rec.state = 'Dispatched'
            rec.vehicle_id.status = 'On Trip'
            rec.driver_id.status = 'On Trip'

    def action_complete(self):
        for rec in self:
            rec.state = 'Completed'
            rec.vehicle_id.status = 'Available'
            rec.vehicle_id.odometer += rec.distance_km
            rec.driver_id.status = 'On Duty'

    def action_cancel(self):
        for rec in self:
            rec.state = 'Cancelled'
            rec.vehicle_id.status = 'Available'
            rec.driver_id.status = 'On Duty'
"""

files['backend/addons/fleetflow/models/maintenance.py'] = """
from odoo import models, fields, api

class MaintenanceLog(models.Model):
    _name = 'fleetflow.maintenance_log'
    _description = 'Maintenance Log'

    vehicle_id = fields.Many2one('fleetflow.vehicle', required=True)
    date = fields.Date(required=True, default=fields.Date.context_today)
    service_type = fields.Char(required=True)
    notes = fields.Text()
    cost = fields.Float(required=True)
    state = fields.Selection([('Open', 'Open'), ('Done', 'Done')], default='Open', required=True)

    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        for rec in records:
            if rec.state == 'Open':
                rec.vehicle_id.status = 'In Shop'
        return records

    def action_done(self):
        for rec in self:
            rec.state = 'Done'
            if rec.vehicle_id.status != 'Retired':
                rec.vehicle_id.status = 'Available'
"""

files['backend/addons/fleetflow/models/fuel.py'] = """
from odoo import models, fields

class FuelLog(models.Model):
    _name = 'fleetflow.fuel_log'
    _description = 'Fuel Log'

    vehicle_id = fields.Many2one('fleetflow.vehicle', required=True)
    date = fields.Date(required=True, default=fields.Date.context_today)
    liters = fields.Float(required=True)
    cost = fields.Float(required=True)
    odometer_at_fill = fields.Float(required=True)
"""

files['backend/addons/fleetflow/security/security.xml'] = """
<odoo>
    <data noupdate="1">
        <record id="module_category_fleetflow" model="ir.module.category">
            <field name="name">FleetFlow</field>
            <field name="description">FleetFlow Access Rights</field>
            <field name="sequence">10</field>
        </record>
        
        <record id="group_fleet_dispatcher" model="res.groups">
            <field name="name">Dispatcher</field>
            <field name="category_id" ref="module_category_fleetflow"/>
        </record>
        
        <record id="group_fleet_manager" model="res.groups">
            <field name="name">Fleet Manager</field>
            <field name="category_id" ref="module_category_fleetflow"/>
            <field name="implied_ids" eval="[(4, ref('group_fleet_dispatcher'))]"/>
        </record>

        <record id="group_fleet_safety" model="res.groups">
            <field name="name">Safety Officer</field>
            <field name="category_id" ref="module_category_fleetflow"/>
        </record>
        
        <record id="group_fleet_finance" model="res.groups">
            <field name="name">Financial Analyst</field>
            <field name="category_id" ref="module_category_fleetflow"/>
        </record>
    </data>
</odoo>
"""

files['backend/addons/fleetflow/security/ir.model.access.csv'] = """
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_vehicle_manager,vehicle_manager,model_fleetflow_vehicle,group_fleet_manager,1,1,1,1
access_vehicle_dispatcher,vehicle_dispatcher,model_fleetflow_vehicle,group_fleet_dispatcher,1,0,0,0
access_vehicle_finance,vehicle_finance,model_fleetflow_vehicle,group_fleet_finance,1,0,0,0

access_driver_manager,driver_manager,model_fleetflow_driver,group_fleet_manager,1,1,1,1
access_driver_dispatcher,driver_dispatcher,model_fleetflow_driver,group_fleet_dispatcher,1,0,0,0
access_driver_safety,driver_safety,model_fleetflow_driver,group_fleet_safety,1,1,0,0

access_trip_manager,trip_manager,model_fleetflow_trip,group_fleet_manager,1,1,1,1
access_trip_dispatcher,trip_dispatcher,model_fleetflow_trip,group_fleet_dispatcher,1,1,1,0

access_maintenance_manager,maintenance_manager,model_fleetflow_maintenance_log,group_fleet_manager,1,1,1,1

access_fuel_manager,fuel_manager,model_fleetflow_fuel_log,group_fleet_manager,1,1,1,1
access_fuel_finance,fuel_finance,model_fleetflow_fuel_log,group_fleet_finance,1,0,0,0
"""

files['backend/addons/fleetflow/data/demo_data.xml'] = """
<odoo>
    <data noupdate="1">
        <record id="seq_fleetflow_trip" model="ir.sequence">
            <field name="name">Trips Sequence</field>
            <field name="code">fleetflow.trip</field>
            <field name="prefix">TRP</field>
            <field name="padding">5</field>
        </record>

        <record id="vehicle_1" model="fleetflow.vehicle">
            <field name="name">Ford Transit</field>
            <field name="license_plate">XYZ-1234</field>
            <field name="vehicle_type">van</field>
            <field name="region">North</field>
            <field name="max_load_capacity">1500</field>
            <field name="acquisition_cost">35000</field>
            <field name="odometer">12540</field>
        </record>
        <record id="vehicle_2" model="fleetflow.vehicle">
            <field name="name">Volvo FH16</field>
            <field name="license_plate">TRK-9988</field>
            <field name="vehicle_type">truck</field>
            <field name="region">South</field>
            <field name="max_load_capacity">25000</field>
            <field name="acquisition_cost">120000</field>
            <field name="odometer">56000</field>
        </record>

        <record id="driver_1" model="fleetflow.driver">
            <field name="name">John Doe</field>
            <field name="license_number">DL-123456</field>
            <field name="license_expiry_date">2030-12-31</field>
            <field name="safety_score">95</field>
        </record>

        <record id="trip_1" model="fleetflow.trip">
            <field name="vehicle_id" ref="vehicle_1"/>
            <field name="driver_id" ref="driver_1"/>
            <field name="source">Warehouse A</field>
            <field name="destination">Store B</field>
            <field name="planned_start_date">2026-02-22 08:00:00</field>
            <field name="cargo_weight">1000</field>
            <field name="distance_km">250</field>
            <field name="revenue">500</field>
            <field name="state">Dispatched</field>
        </record>
    </data>
</odoo>
"""

files['backend/addons/fleetflow/controllers/__init__.py'] = """
from . import api
"""

files['backend/addons/fleetflow/controllers/api.py'] = """
import json
from odoo import http
from odoo.http import request

class FleetFlowAPI(http.Controller):

    def _auth_check(self):
        user = request.env.user
        if not user or user.id == request.env.ref('base.public_user').id:
            return False
        return True

    def _response(self, data, status=200):
        return request.make_response(
            json.dumps(data),
            headers=[('Content-Type', 'application/json')],
            status=status
        )

    @http.route('/api/auth/me', type='http', auth='none', methods=['GET'], cors='*', csrf=False)
    def auth_me(self):
        if not self._auth_check():
            return self._response({'error': 'Unauthorized'}, 401)
        return self._response({'uid': request.env.user.id, 'name': request.env.user.name})

    @http.route('/api/auth/login', type='http', auth='none', methods=['POST'], cors='*', csrf=False)
    def auth_login(self):
        params = json.loads(request.httprequest.data)
        db = request.env.registry.db_name or 'fleet_flow'
        uid = request.session.authenticate(db, params.get('login'), params.get('password'))
        if uid:
            return self._response({'status': 'ok', 'uid': uid})
        return self._response({'error': 'Invalid credentials'}, 401)

    @http.route('/api/auth/logout', type='http', auth='none', methods=['POST'], cors='*', csrf=False)
    def auth_logout(self):
        request.session.logout()
        return self._response({'status': 'ok'})

    @http.route('/api/dashboard', type='http', auth='user', methods=['GET'], cors='*', csrf=False)
    def get_dashboard(self):
        v_env = request.env['fleetflow.vehicle'].sudo()
        t_env = request.env['fleetflow.trip'].sudo()
        active_fleet = v_env.search_count([('status', '=', 'On Trip')])
        in_shop = v_env.search_count([('status', '=', 'In Shop')])
        total = v_env.search_count([])
        pending_trips = t_env.search_count([('state', '=', 'Draft')])
        util_rate = (active_fleet / total * 100) if total > 0 else 0
        return self._response({
            'active_fleet': active_fleet,
            'maintenance_alerts': in_shop,
            'utilization_rate': util_rate,
            'pending_trips': pending_trips
        })

    @http.route('/api/vehicles', type='http', auth='user', methods=['GET'], cors='*', csrf=False)
    def get_vehicles(self):
        vehicles = request.env['fleetflow.vehicle'].sudo().search_read([], ['id', 'name', 'license_plate', 'status', 'vehicle_type', 'max_load_capacity'])
        return self._response(vehicles)

    @http.route('/api/trips', type='http', auth='user', methods=['GET'], cors='*', csrf=False)
    def get_trips(self):
        trips = request.env['fleetflow.trip'].sudo().search_read([], ['id', 'name', 'vehicle_id', 'driver_id', 'state', 'revenue', 'distance_km'])
        for t in trips:
            t['vehicle_name'] = t['vehicle_id'][1] if t['vehicle_id'] else ''
            t['driver_name'] = t['driver_id'][1] if t['driver_id'] else ''
        return self._response(trips)

    @http.route('/api/trips/dispatch', type='http', auth='user', methods=['POST'], cors='*', csrf=False)
    def dispatch_trip(self):
        params = json.loads(request.httprequest.data)
        trip_id = params.get('trip_id')
        trip = request.env['fleetflow.trip'].sudo().browse(trip_id)
        if trip:
            try:
                trip.action_dispatch()
                return self._response({'status': 'ok'})
            except Exception as e:
                return self._response({'error': str(e)}, 400)
        return self._response({'error': 'Not found'}, 404)
    
    @http.route('/api/trips/new', type='http', auth='user', methods=['POST'], cors='*', csrf=False)
    def create_trip(self):
        params = json.loads(request.httprequest.data)
        try:
            trip = request.env['fleetflow.trip'].sudo().create(params)
            return self._response({'id': trip.id})
        except Exception as e:
            return self._response({'error': str(e)}, 400)
"""

files['frontend/package.json'] = """
{
  "name": "fleetflow-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@emotion/react": "^11.11.4",
    "@emotion/styled": "^11.11.5",
    "@mui/material": "^5.15.15",
    "@mui/icons-material": "^5.15.15",
    "@mui/x-data-grid": "^7.1.1",
    "@tanstack/react-query": "^5.29.2",
    "axios": "^1.6.8",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.3",
    "recharts": "^2.12.5"
  },
  "devDependencies": {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.2.2",
    "vite": "^5.2.0"
  }
}
"""

files['frontend/index.html'] = """
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FleetFlow Dashboard</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
"""

files['frontend/vite.config.ts'] = """
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://odoo:8069',
        changeOrigin: true
      }
    }
  }
})
"""

files['frontend/tsconfig.json'] = """
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
"""

files['frontend/tsconfig.node.json'] = """
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
"""

files['frontend/src/main.tsx'] = """
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#f50057' },
    background: { default: '#f4f6f8' }
  },
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
"""

files['frontend/src/App.tsx'] = """
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}
export default App;
"""

files['frontend/src/components/Layout.tsx'] = """
import { Box, Drawer, List, ListItem, ListItemText, AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';

const drawerWidth = 240;

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await axios.post('/api/auth/logout');
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            FleetFlow
          </Typography>
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItem button onClick={() => navigate('/dashboard')}>
              <ListItemText primary="Dashboard" />
            </ListItem>
            <ListItem button onClick={() => navigate('/vehicles')}>
              <ListItemText primary="Vehicles" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
"""

files['frontend/src/pages/Login.tsx'] = """
import { useState } from 'react';
import { Box, Button, TextField, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: any) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/login', { login: email, password });
      navigate('/dashboard');
    } catch (err) {
      alert("Invalid credentials");
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <Paper sx={{ p: 4, width: 400 }}>
        <Typography variant="h5" mb={2}>Login to FleetFlow</Typography>
        <form onSubmit={handleLogin}>
          <TextField fullWidth label="Email/Login" margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField fullWidth label="Password" type="password" margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button fullWidth variant="contained" type="submit" sx={{ mt: 2 }}>Login</Button>
        </form>
      </Paper>
    </Box>
  );
}
"""

files['frontend/src/pages/Dashboard.tsx'] = """
import { Grid, Paper, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const fetchDashboard = async () => {
  const { data } = await axios.get('/api/dashboard');
  return data;
};

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard });

  if (isLoading) return <Typography>Loading...</Typography>;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Active Fleet</Typography>
          <Typography variant="h4">{data?.active_fleet || 0}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Maintenance Alerts</Typography>
          <Typography variant="h4">{data?.maintenance_alerts || 0}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Utilization Rate</Typography>
          <Typography variant="h4">{Math.round(data?.utilization_rate || 0)}%</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Pending Trips</Typography>
          <Typography variant="h4">{data?.pending_trips || 0}</Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}
"""

files['frontend/src/pages/Vehicles.tsx'] = """
import { useQuery } from '@tanstack/react-query';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Typography } from '@mui/material';
import axios from 'axios';

const fetchVehicles = async () => {
  const { data } = await axios.get('/api/vehicles');
  return data;
};

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'name', headerName: 'Model', width: 150 },
  { field: 'license_plate', headerName: 'Plate', width: 150 },
  { field: 'status', headerName: 'Status', width: 150 },
  { field: 'vehicle_type', headerName: 'Type', width: 130 },
  { field: 'max_load_capacity', headerName: 'Max Load', width: 130 },
];

export default function Vehicles() {
  const { data, isLoading } = useQuery({ queryKey: ['vehicles'], queryFn: fetchVehicles });

  if (isLoading) return <Typography>Loading...</Typography>;

  return (
    <Box sx={{ height: 600, width: '100%', bgcolor: 'white', p: 1, borderRadius: 1 }}>
      <Typography variant="h6" mb={2}>Vehicle Registry</Typography>
      <DataGrid
        rows={data || []}
        columns={columns}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
        }}
        pageSizeOptions={[10, 25, 50]}
      />
    </Box>
  );
}
"""

for k, v in files.items():
    create_file(k, v)
print("Files generated!")
