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
