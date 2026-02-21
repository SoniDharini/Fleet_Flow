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
