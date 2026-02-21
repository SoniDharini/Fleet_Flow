from odoo import models, fields

class FuelLog(models.Model):
    _name = 'fleetflow.fuel_log'
    _description = 'Fuel Log'

    vehicle_id = fields.Many2one('fleetflow.vehicle', required=True)
    date = fields.Date(required=True, default=fields.Date.context_today)
    liters = fields.Float(required=True)
    cost = fields.Float(required=True)
    odometer_at_fill = fields.Float(required=True)
