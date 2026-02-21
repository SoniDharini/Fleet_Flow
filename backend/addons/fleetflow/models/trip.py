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
