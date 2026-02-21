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
                open_logs = self.search_count([
                    ('vehicle_id', '=', rec.vehicle_id.id),
                    ('state', '=', 'Open'),
                    ('id', '!=', rec.id)
                ])
                if open_logs == 0:
                    rec.vehicle_id.status = 'Available'
