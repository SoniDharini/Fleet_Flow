import json
from odoo import http
from odoo.http import request

class FleetFlowAPI(http.Controller):

    def _auth_check(self):
        user = request.env.user
        if not user or user.id == request.env.ref('base.public_user').id:
            return False
        return True

    def _get_roles(self):
        user = request.env.user
        roles = []
        if user.has_group('fleetflow.group_fleet_manager'): roles.append('manager')
        if user.has_group('fleetflow.group_dispatcher'): roles.append('dispatcher')
        if user.has_group('fleetflow.group_safety_officer'): roles.append('safety')
        if user.has_group('fleetflow.group_financial_analyst'): roles.append('finance')
        return roles

    def _has_role(self, *allowed_roles):
        roles = self._get_roles()
        if 'manager' in roles: return True
        for r in allowed_roles:
            if r in roles: return True
        return False

    def _response(self, data, status=200):
        if status != 200 and 'error' in data:
            data = {'code': status, 'message': data['error'], 'details': data.get('details', '')}
        return request.make_response(
            json.dumps(data),
            headers=[('Content-Type', 'application/json')],
            status=status
        )

    @http.route('/api/auth/me', type='http', auth='public', methods=['GET'], cors='*', csrf=False)
    def auth_me(self):
        if not self._auth_check():
            return self._response({'error': 'Unauthorized'}, 401)
        return self._response({
            'id': request.env.user.id,
            'name': request.env.user.name,
            'email': request.env.user.login,
            'roles': self._get_roles()
        })

    @http.route('/api/auth/login', type='http', auth='public', methods=['POST'], cors='*', csrf=False)
    def auth_login(self):
        params = json.loads(request.httprequest.data)
        db = request.env.registry.db_name or 'fleet_flow'
        login = params.get('email') or params.get('login')
        password = params.get('password')
        try:
            uid = request.session.authenticate(db, login, password)
            if uid:
                roles = self._get_roles()
                return self._response({'status': 'ok', 'uid': uid, 'roles': roles, 'name': request.env.user.name})
        except Exception as e:
            return self._response({'error': 'Invalid credentials'}, 401)
        return self._response({'error': 'Invalid credentials'}, 401)

    @http.route('/api/auth/register', type='http', auth='public', methods=['POST'], cors='*', csrf=False)
    def auth_register(self):
        params = json.loads(request.httprequest.data)
        name = params.get('name')
        email = params.get('email')
        password = params.get('password')
        role_key = params.get('role')

        role_map = {
            'FLEET_MANAGER': 'fleetflow.group_fleet_manager',
            'DISPATCHER': 'fleetflow.group_dispatcher',
            'SAFETY_OFFICER': 'fleetflow.group_safety_officer',
            'FINANCIAL_ANALYST': 'fleetflow.group_financial_analyst',
            'STANDARD_USER': 'base.group_user'
        }
        
        if not name or not email or not password or not role_key:
            return self._response({'error': 'Missing required fields'}, 400)
            
        group_xml_id = role_map.get(role_key, 'base.group_user')
        
        try:
            request.env.cr.execute("SAVEPOINT register_user")
            
            existing = request.env['res.users'].sudo().search([('login', '=', email)])
            if existing:
                return self._response({'error': 'Email is already registered'}, 400)

            group_ref = request.env.ref(group_xml_id)
            base_group = request.env.ref('base.group_user')
            
            groups_id = [(6, 0, [base_group.id, group_ref.id])] if group_ref else [(6, 0, [base_group.id])]

            new_user = request.env['res.users'].sudo().create({
                'name': name,
                'login': email,
                'password': password,
                'groups_id': groups_id,
                'sel_groups_1_8_9': 8 # internal user magic field in Odoo if necessary, typically group_user handles it, but safe to just use groups_id
            })
            request.env.cr.execute("RELEASE SAVEPOINT register_user")
            return self._response({'status': 'success', 'id': new_user.id, 'name': new_user.name, 'email': new_user.login})
        except Exception as e:
            request.env.cr.execute("ROLLBACK TO SAVEPOINT register_user")
            return self._response({'error': str(e)}, 400)

    @http.route('/api/auth/logout', type='http', auth='public', methods=['POST'], cors='*', csrf=False)
    def auth_logout(self):
        request.session.logout()
        return self._response({'status': 'ok'})

    @http.route('/api/dashboard', type='http', auth='public', methods=['GET'], cors='*', csrf=False)
    def get_dashboard(self, **kw):
        if not self._auth_check(): return self._response({'error': 'Unauthorized'}, 401)
        v_env = request.env['fleetflow.vehicle'].sudo()
        t_env = request.env['fleetflow.trip'].sudo()
        
        v_domain = []
        region = kw.get('region')
        if region and region != 'all':
            region_map = {'north': 'North India', 'south': 'South India', 'east': 'East India', 'west': 'West India'}
            if region in region_map:
                v_domain.append(('region', '=', region_map[region]))
                
        v_type = kw.get('type')
        if v_type and v_type != 'all':
            v_domain.append(('vehicle_type', '=', v_type))
            
        status = kw.get('status')
        if status and status != 'all':
            v_domain.append(('status', '=', status))
            
        vehicles = v_env.search(v_domain)
        total = len(vehicles)
        active_fleet = len(vehicles.filtered(lambda v: v.status == 'On Trip'))
        in_shop = len(vehicles.filtered(lambda v: v.status == 'In Shop'))
        
        t_domain = [('state', '=', 'Draft')]
        if v_domain:
            if not vehicles:
                t_domain.append(('id', '=', 0))
            else:
                t_domain.append(('vehicle_id', 'in', vehicles.ids))

        pending_trips = t_env.search_count(t_domain)
        util_rate = (active_fleet / total * 100) if total > 0 else 0
        
        return self._response({
            'active_fleet': active_fleet,
            'maintenance_alerts': in_shop,
            'utilization_rate': util_rate,
            'pending_trips': pending_trips,
            'total_vehicles': total
        })

    @http.route('/api/vehicles', type='http', auth='public', methods=['GET'], cors='*', csrf=False)
    def get_vehicles(self):
        if not self._auth_check(): return self._response({'error': 'Unauthorized'}, 401)
        if not self._has_role('dispatcher', 'safety', 'finance'): return self._response({'error': 'Forbidden'}, 403)
        vehicles = request.env['fleetflow.vehicle'].sudo().search_read([], ['id', 'name', 'license_plate', 'status', 'vehicle_type', 'max_load_capacity', 'odometer', 'total_fuel_cost', 'total_maintenance_cost', 'total_operational_cost'])
        return self._response(vehicles)

    @http.route('/api/vehicles/new', type='http', auth='public', methods=['POST'], cors='*', csrf=False)
    def create_vehicle(self):
        if not self._auth_check(): return self._response({'error': 'Unauthorized'}, 401)
        if not self._has_role(): return self._response({'error': 'Forbidden'}, 403) # Only manager
        params = json.loads(request.httprequest.data)
        try:
            vehicle = request.env['fleetflow.vehicle'].sudo().create(params)
            return self._response({'id': vehicle.id})
        except Exception as e:
            return self._response({'error': str(e)}, 400)

    @http.route('/api/vehicles/action', type='http', auth='public', methods=['POST'], cors='*', csrf=False)
    def update_vehicle(self):
        if not self._auth_check(): return self._response({'error': 'Unauthorized'}, 401)
        if not self._has_role('manager'): return self._response({'error': 'Forbidden'}, 403)
        params = json.loads(request.httprequest.data)
        vehicle_id = params.get('vehicle_id')
        new_status = params.get('status')
        vehicle = request.env['fleetflow.vehicle'].sudo().browse(vehicle_id)
        if vehicle:
            if new_status:
                vehicle.status = new_status
            return self._response({'status': 'ok'})
        return self._response({'error': 'Not found'}, 404)

    @http.route('/api/vehicles/update', type='http', auth='public', methods=['POST'], cors='*', csrf=False)
    def update_vehicle_details(self):
        if not self._auth_check(): return self._response({'error': 'Unauthorized'}, 401)
        if not self._has_role('manager'): return self._response({'error': 'Forbidden'}, 403)
        params = json.loads(request.httprequest.data)
        vehicle_id = params.get('id')
        vehicle = request.env['fleetflow.vehicle'].sudo().browse(vehicle_id)
        if vehicle:
            try:
                update_vals = {}
                for k in ['name', 'license_plate', 'max_load_capacity', 'odometer', 'vehicle_type', 'region', 'status']:
                    if k in params:
                        update_vals[k] = params[k]
                if update_vals:
                    vehicle.write(update_vals)
                return self._response({'status': 'ok'})
            except Exception as e:
                return self._response({'error': str(e)}, 400)
        return self._response({'error': 'Not found'}, 404)

    @http.route('/api/vehicles/delete', type='http', auth='public', methods=['POST'], cors='*', csrf=False)
    def delete_vehicle(self):
        if not self._auth_check(): return self._response({'error': 'Unauthorized'}, 401)
        if not self._has_role('manager'): return self._response({'error': 'Forbidden'}, 403)
        params = json.loads(request.httprequest.data)
        vehicle_id = params.get('id')
        vehicle = request.env['fleetflow.vehicle'].sudo().browse(vehicle_id)
        if vehicle:
            try:
                vehicle.unlink()
                return self._response({'status': 'ok'})
            except Exception as e:
                return self._response({'error': str(e)}, 400)
        return self._response({'error': 'Not found'}, 404)

    @http.route('/api/trips', type='http', auth='public', methods=['GET'], cors='*', csrf=False)
    def get_trips(self):
        if not self._auth_check(): return self._response({'error': 'Unauthorized'}, 401)
        if not self._has_role('dispatcher', 'safety', 'finance'): return self._response({'error': 'Forbidden'}, 403)
        trips = request.env['fleetflow.trip'].sudo().search_read([], ['id', 'name', 'vehicle_id', 'driver_id', 'state', 'revenue', 'distance_km', 'source', 'destination', 'cargo_weight', 'planned_start_date'])
        for t in trips:
            t['vehicle_name'] = t['vehicle_id'][1] if t['vehicle_id'] else ''
            t['driver_name'] = t['driver_id'][1] if t['driver_id'] else ''
            if t.get('planned_start_date'): t['planned_start_date'] = str(t['planned_start_date'])
        return self._response(trips)

    @http.route('/api/trips/dispatch', type='http', auth='public', methods=['POST'], cors='*', csrf=False)
    def dispatch_trip(self):
        if not self._auth_check(): return self._response({'error': 'Unauthorized'}, 401)
        if not self._has_role('dispatcher'): return self._response({'error': 'Forbidden'}, 403)
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

    @http.route('/api/trips/action', type='http', auth='public', methods=['POST'], cors='*', csrf=False)
    def trip_action(self):
        if not self._auth_check(): return self._response({'error': 'Unauthorized'}, 401)
        if not self._has_role('dispatcher'): return self._response({'error': 'Forbidden'}, 403)
        params = json.loads(request.httprequest.data)
        trip_id = params.get('trip_id')
        action = params.get('action')
        trip = request.env['fleetflow.trip'].sudo().browse(trip_id)
        if trip:
            try:
                if action == 'complete':
                    trip.action_complete()
                elif action == 'cancel':
                    trip.action_cancel()
                return self._response({'status': 'ok'})
            except Exception as e:
                return self._response({'error': str(e)}, 400)
        return self._response({'error': 'Not found'}, 404)
    
    @http.route('/api/trips/new', type='http', auth='public', methods=['POST'], cors='*', csrf=False)
    def create_trip(self):
        if not self._auth_check(): return self._response({'error': 'Unauthorized'}, 401)
        if not self._has_role('dispatcher'): return self._response({'error': 'Forbidden'}, 403)
        params = json.loads(request.httprequest.data)
        try:
            trip = request.env['fleetflow.trip'].sudo().create(params)
            return self._response({'id': trip.id})
        except Exception as e:
            return self._response({'error': str(e)}, 400)

    @http.route('/api/drivers', type='http', auth='public', methods=['GET'], cors='*', csrf=False)
    def get_drivers(self):
        if not self._auth_check(): return self._response({'error': 'Unauthorized'}, 401)
        if not self._has_role('dispatcher', 'safety', 'finance'): return self._response({'error': 'Forbidden'}, 403)
        records = request.env['fleetflow.driver'].sudo().search([])
        res = []
        for r in records:
            res.append({
                'id': r.id,
                'name': r.name,
                'license_number': r.license_number,
                'license_expiry_date': str(r.license_expiry_date),
                'status': r.status,
                'safety_score': r.safety_score,
                'completion_rate': r.completion_rate
            })
        return self._response(res)
    
    @http.route('/api/drivers/action', type='http', auth='public', methods=['POST'], cors='*', csrf=False)
    def update_driver(self):
        if not self._auth_check(): return self._response({'error': 'Unauthorized'}, 401)
        if not self._has_role('safety'): return self._response({'error': 'Forbidden'}, 403)
        params = json.loads(request.httprequest.data)
        driver_id = params.get('driver_id')
        new_status = params.get('status')
        new_score = params.get('safety_score')
        d = request.env['fleetflow.driver'].sudo().browse(driver_id)
        if d:
            if new_status: d.status = new_status
            if new_score: d.safety_score = new_score
            return self._response({'status': 'ok'})
        return self._response({'error': 'Not found'}, 404)

    @http.route('/api/maintenance', type='http', auth='public', methods=['GET'], cors='*', csrf=False)
    def get_maintenance(self):
        if not self._auth_check(): return self._response({'error': 'Unauthorized'}, 401)
        if not self._has_role('dispatcher', 'safety', 'finance'): return self._response({'error': 'Forbidden'}, 403)
        logs = request.env['fleetflow.maintenance_log'].sudo().search_read([], ['id', 'vehicle_id', 'date', 'service_type', 'cost', 'state'])
        for l in logs:
            l['vehicle_name'] = l['vehicle_id'][1] if l['vehicle_id'] else ''
            if l.get('date'): l['date'] = str(l['date'])
        return self._response(logs)

    @http.route('/api/maintenance/new', type='http', auth='public', methods=['POST'], cors='*', csrf=False)
    def create_maintenance(self):
        if not self._auth_check(): return self._response({'error': 'Unauthorized'}, 401)
        if not self._has_role('finance', 'manager'): return self._response({'error': 'Forbidden'}, 403)
        params = json.loads(request.httprequest.data)
        try:
            log = request.env['fleetflow.maintenance_log'].sudo().create(params)
            return self._response({'id': log.id})
        except Exception as e:
            return self._response({'error': str(e)}, 400)

    @http.route('/api/maintenance/action', type='http', auth='public', methods=['POST'], cors='*', csrf=False)
    def update_maintenance(self):
        if not self._auth_check(): return self._response({'error': 'Unauthorized'}, 401)
        if not self._has_role('finance', 'manager'): return self._response({'error': 'Forbidden'}, 403)
        params = json.loads(request.httprequest.data)
        log_id = params.get('log_id')
        log = request.env['fleetflow.maintenance_log'].sudo().browse(log_id)
        if log:
            log.action_done()
            return self._response({'status': 'ok'})
        return self._response({'error': 'Not found'}, 404)

    @http.route('/api/fuel', type='http', auth='public', methods=['GET'], cors='*', csrf=False)
    def get_fuel(self):
        if not self._auth_check(): return self._response({'error': 'Unauthorized'}, 401)
        if not self._has_role('dispatcher', 'safety', 'finance'): return self._response({'error': 'Forbidden'}, 403)
        logs = request.env['fleetflow.fuel_log'].sudo().search_read([], ['id', 'vehicle_id', 'date', 'liters', 'cost', 'odometer_at_fill'])
        for l in logs:
            l['vehicle_name'] = l['vehicle_id'][1] if l['vehicle_id'] else ''
            if l.get('date'): l['date'] = str(l['date'])
        return self._response(logs)

    @http.route('/api/fuel/new', type='http', auth='public', methods=['POST'], cors='*', csrf=False)
    def create_fuel(self):
        if not self._auth_check(): return self._response({'error': 'Unauthorized'}, 401)
        if not self._has_role('finance'): return self._response({'error': 'Forbidden'}, 403)
        params = json.loads(request.httprequest.data)
        try:
            log = request.env['fleetflow.fuel_log'].sudo().create(params)
            return self._response({'id': log.id})
        except Exception as e:
            return self._response({'error': str(e)}, 400)

    @http.route('/api/analytics', type='http', auth='public', methods=['GET'], cors='*', csrf=False)
    def get_analytics(self):
        if not self._auth_check(): return self._response({'error': 'Unauthorized'}, 401)
        if not self._has_role('finance'): return self._response({'error': 'Forbidden'}, 403)
        v_env = request.env['fleetflow.vehicle'].sudo()
        vehicles = v_env.search([])
        res = []
        total_revenue = sum(request.env['fleetflow.trip'].sudo().search([]).mapped('revenue'))
        total_fuel_cost = sum(vehicles.mapped('total_fuel_cost'))
        total_maintenance_cost = sum(vehicles.mapped('total_maintenance_cost'))
        for v in vehicles:
            res.append({
                'id': v.id,
                'name': v.name,
                'license_plate': v.license_plate,
                'status': v.status,
                'acquisition_cost': v.acquisition_cost,
                'total_operational_cost': v.total_operational_cost,
                'total_fuel_cost': v.total_fuel_cost,
                'total_maintenance_cost': v.total_maintenance_cost,
                'fuel_efficiency': v.fuel_efficiency,
                'vehicle_revenue': sum(v.trip_ids.mapped('revenue'))
            })
        return self._response({
            'total_revenue': total_revenue,
            'total_fuel_cost': total_fuel_cost,
            'total_maintenance_cost': total_maintenance_cost,
            'vehicle_stats': res
        })
