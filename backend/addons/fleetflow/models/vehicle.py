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
