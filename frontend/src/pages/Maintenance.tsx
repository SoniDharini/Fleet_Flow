import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Box, Typography, Chip, Fab, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, CircularProgress, Paper, Grid } from '@mui/material';
import { Add as AddIcon, Build as WrenchIcon } from '@mui/icons-material';
import axios from 'axios';

const fetchMaintenance = async () => (await axios.get('/api/maintenance')).data;
const fetchVehicles = async () => (await axios.get('/api/vehicles')).data;

export default function Maintenance() {
    const queryClient = useQueryClient();
    const { data: logs, isLoading: loadingLogs } = useQuery({ queryKey: ['maintenance'], queryFn: fetchMaintenance });
    const { data: vehicles } = useQuery({ queryKey: ['vehicles'], queryFn: fetchVehicles });

    const [open, setOpen] = useState(false);
    const [newLog, setNewLog] = useState({ vehicle_id: '', service_type: '', cost: '', notes: '' });

    const mutation = useMutation({
        mutationFn: (newBody: any) => axios.post('/api/maintenance/new', newBody),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance'] });
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            setOpen(false);
            setNewLog({ vehicle_id: '', service_type: '', cost: '', notes: '' });
        }
    });

    const columns: GridColDef[] = [
        { field: 'date', headerName: 'Service Date', width: 140 },
        { field: 'vehicle_name', headerName: 'Vehicle', flex: 1, minWidth: 150 },
        { field: 'service_type', headerName: 'Service Type', flex: 1, minWidth: 150 },
        { field: 'cost', headerName: 'Cost (₹)', width: 130, type: 'number', align: 'left', headerAlign: 'left' },
        {
            field: 'state',
            headerName: 'Status',
            width: 140,
            renderCell: (params: GridRenderCellParams) => (
                <Chip
                    label={params.value}
                    size="small"
                    sx={{
                        backgroundColor: params.value === 'Open' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: params.value === 'Open' ? '#F59E0B' : '#10B981',
                        fontWeight: 'bold',
                        borderRadius: '8px'
                    }}
                />
            )
        },
        {
            field: 'action',
            headerName: 'Resolve',
            width: 150,
            renderCell: (params: GridRenderCellParams) => {
                if (params.row.state === 'Done') return null;
                const canManage = ['manager', 'finance'].includes(localStorage.getItem('activeRole') || '');
                if (!canManage) return null;
                return (
                    <Button
                        size="small"
                        color="success"
                        variant="outlined"
                        onClick={async () => {
                            await axios.post('/api/maintenance/action', { log_id: params.row.id });
                            queryClient.invalidateQueries({ queryKey: ['maintenance'] });
                            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
                        }}
                    >
                        Complete
                    </Button>
                );
            }
        },
    ];

    if (loadingLogs) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress sx={{ color: '#F59E0B' }} /></Box>;

    const totalCost = (logs || []).reduce((acc: number, log: any) => acc + (log.cost || 0), 0);

    return (
        <Box sx={{ position: 'relative', height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" fontWeight="bold">Service & Maintenance</Typography>
            </Box>

            <Grid container spacing={4} mb={4}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{
                        p: 3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        background: 'rgba(30, 41, 59, 0.6)',
                        backdropFilter: 'blur(16px)',
                        border: `1px solid rgba(245, 158, 11, 0.4)`,
                        boxShadow: `0 4px 20px 0 rgba(245, 158, 11, 0.1)`
                    }}>
                        <Box sx={{ p: 1.5, borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B', display: 'flex' }}>
                            <WrenchIcon fontSize="large" />
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary" fontWeight="600">Total Maintenance Cost</Typography>
                            <Typography variant="h4" fontWeight="bold" sx={{ color: '#fff' }}>₹{totalCost.toFixed(2)}</Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <Box sx={{
                height: 'calc(100vh - 300px)',
                width: '100%',
                background: 'rgba(30, 41, 59, 0.7)',
                backdropFilter: 'blur(16px)',
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.05)',
                p: 1
            }}>
                <DataGrid
                    rows={logs || []}
                    columns={columns}
                    initialState={{ pagination: { paginationModel: { pageSize: 15 } } }}
                    pageSizeOptions={[15, 30, 50]}
                    disableRowSelectionOnClick
                    sx={{
                        border: 'none',
                        '& .MuiDataGrid-cell': { borderColor: 'rgba(255,255,255,0.05)' },
                        '& .MuiDataGrid-columnHeaders': {
                            background: 'rgba(15, 23, 42, 0.5)',
                            borderColor: 'rgba(255,255,255,0.05)',
                            borderBottom: '1px solid rgba(255,255,255,0.1)'
                        },
                        '& .MuiDataGrid-row:hover': { background: 'rgba(245, 158, 11, 0.05)' }
                    }}
                />
            </Box>

            {['manager', 'finance'].includes(localStorage.getItem('activeRole') || '') && (
                <Fab
                    sx={{
                        position: 'fixed',
                        bottom: 40,
                        right: 40,
                        background: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)',
                        color: '#fff',
                        boxShadow: '0 4px 20px rgba(245, 158, 11, 0.5)'
                    }}
                    aria-label="add"
                    onClick={() => setOpen(true)}
                >
                    <AddIcon />
                </Fab>
            )}

            <Dialog open={open} onClose={() => setOpen(false)} PaperProps={{
                sx: { background: 'rgba(30, 41, 59, 0.9)', backdropFilter: 'blur(20px)', border: '1px solid #F59E0B', borderRadius: 3 }
            }}>
                <DialogTitle variant="h5" fontWeight="bold">Add Service Log</DialogTitle>
                <DialogContent sx={{ minWidth: 400, mt: 1 }}>
                    <TextField select fullWidth margin="dense" label="Vehicle" value={newLog.vehicle_id} onChange={(e) => setNewLog({ ...newLog, vehicle_id: e.target.value })} sx={{ mb: 2 }}>
                        {(vehicles || []).map((v: any) => (
                            <MenuItem key={v.id} value={v.id}>{v.name} ({v.license_plate}) - Status: {v.status}</MenuItem>
                        ))}
                    </TextField>
                    <TextField fullWidth margin="dense" label="Service Type" value={newLog.service_type} onChange={(e) => setNewLog({ ...newLog, service_type: e.target.value })} sx={{ mb: 2 }} />
                    <TextField fullWidth margin="dense" label="Cost (₹)" type="number" value={newLog.cost} onChange={(e) => setNewLog({ ...newLog, cost: e.target.value })} sx={{ mb: 2 }} />
                    <TextField fullWidth margin="dense" label="Notes" multiline rows={3} value={newLog.notes} onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })} />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpen(false)} sx={{ color: '#94A3B8' }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={() => mutation.mutate({ ...newLog, cost: parseFloat(newLog.cost) })}
                        disabled={mutation.isPending || !newLog.vehicle_id || !newLog.service_type || !newLog.cost}
                        sx={{ px: 4, background: '#F59E0B' }}
                    >
                        {mutation.isPending ? 'Saving...' : 'Save Log'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
