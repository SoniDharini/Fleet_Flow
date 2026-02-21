import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Typography, Fab, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, CircularProgress, Paper, Grid } from '@mui/material';
import { Add as AddIcon, EvStation as FuelIcon, LocalAtm as MoneyIcon } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const fetchFuel = async () => (await axios.get('/api/fuel')).data;
const fetchVehicles = async () => (await axios.get('/api/vehicles')).data;

export default function Fuel() {
    const queryClient = useQueryClient();
    const { data: logs, isLoading: loadingLogs } = useQuery({ queryKey: ['fuel'], queryFn: fetchFuel });
    const { data: vehicles } = useQuery({ queryKey: ['vehicles'], queryFn: fetchVehicles });

    const [open, setOpen] = useState(false);
    const [newLog, setNewLog] = useState({ vehicle_id: '', liters: '', cost: '', odometer_at_fill: '' });

    const mutation = useMutation({
        mutationFn: (newBody: any) => axios.post('/api/fuel/new', newBody),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fuel'] });
            setOpen(false);
            setNewLog({ vehicle_id: '', liters: '', cost: '', odometer_at_fill: '' });
        }
    });

    const columns: GridColDef[] = [
        { field: 'date', headerName: 'Date', width: 140 },
        { field: 'vehicle_name', headerName: 'Vehicle', flex: 1 },
        { field: 'liters', headerName: 'Liters', width: 130, type: 'number', align: 'left', headerAlign: 'left' },
        { field: 'cost', headerName: 'Cost ($)', width: 130, type: 'number', align: 'left', headerAlign: 'left' },
        { field: 'odometer_at_fill', headerName: 'Odometer (km)', width: 150, type: 'number', align: 'left', headerAlign: 'left' },
    ];

    if (loadingLogs) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress sx={{ color: '#10B981' }} /></Box>;

    const totalFuelCost = (logs || []).reduce((acc: number, log: any) => acc + (log.cost || 0), 0);
    const totalLiters = (logs || []).reduce((acc: number, log: any) => acc + (log.liters || 0), 0);

    // Group by vehicle for bar chart
    const costByVehicle = (logs || []).reduce((acc: any, log: any) => {
        acc[log.vehicle_name] = (acc[log.vehicle_name] || 0) + log.cost;
        return acc;
    }, {});

    const chartData = Object.keys(costByVehicle).map(name => ({
        name,
        cost: costByVehicle[name]
    })).slice(0, 10); // Top 10

    return (
        <Box sx={{ position: 'relative', height: '100%' }}>
            <Typography variant="h4" fontWeight="bold" mb={4}>Fuel & Expenses</Typography>

            <Grid container spacing={4} mb={4}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{
                        p: 3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        background: 'rgba(30, 41, 59, 0.6)',
                        backdropFilter: 'blur(16px)',
                        border: `1px solid rgba(16, 185, 129, 0.4)`,
                    }}>
                        <Box sx={{ p: 1.5, borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', display: 'flex' }}>
                            <FuelIcon fontSize="large" />
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary" fontWeight="600">Total Fuel Logged</Typography>
                            <Typography variant="h4" fontWeight="bold" sx={{ color: '#fff' }}>{totalLiters.toFixed(1)} L</Typography>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{
                        p: 3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        background: 'rgba(30, 41, 59, 0.6)',
                        backdropFilter: 'blur(16px)',
                        border: `1px solid rgba(239, 68, 68, 0.4)`,
                    }}>
                        <Box sx={{ p: 1.5, borderRadius: '12px', background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', display: 'flex' }}>
                            <MoneyIcon fontSize="large" />
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary" fontWeight="600">Total Fuel Cost</Typography>
                            <Typography variant="h4" fontWeight="bold" sx={{ color: '#fff' }}>${totalFuelCost.toFixed(2)}</Typography>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.05)', height: '100%' }}>
                        <Typography variant="body2" color="text.secondary" fontWeight="600" mb={1}>Cost Distribution (Top 10)</Typography>
                        <Box sx={{ height: 80, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1E293B', borderColor: '#3B82F6' }} />
                                    <Bar dataKey="cost" fill="#10B981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <Box sx={{
                height: 'calc(100vh - 350px)',
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
                        '& .MuiDataGrid-row:hover': { background: 'rgba(16, 185, 129, 0.05)' }
                    }}
                />
            </Box>

            <Fab
                sx={{
                    position: 'fixed',
                    bottom: 40,
                    right: 40,
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#fff',
                }}
                onClick={() => setOpen(true)}
            >
                <AddIcon />
            </Fab>

            <Dialog open={open} onClose={() => setOpen(false)} PaperProps={{
                sx: { background: 'rgba(30, 41, 59, 0.9)', backdropFilter: 'blur(20px)', border: '1px solid #10B981', borderRadius: 3 }
            }}>
                <DialogTitle variant="h5" fontWeight="bold">Log Fuel Entry</DialogTitle>
                <DialogContent sx={{ minWidth: 400, mt: 1 }}>
                    <TextField select fullWidth margin="dense" label="Vehicle" value={newLog.vehicle_id} onChange={(e) => setNewLog({ ...newLog, vehicle_id: e.target.value })} sx={{ mb: 2 }}>
                        {(vehicles || []).map((v: any) => (
                            <MenuItem key={v.id} value={v.id}>{v.name} ({v.license_plate})</MenuItem>
                        ))}
                    </TextField>
                    <TextField fullWidth margin="dense" label="Liters" type="number" value={newLog.liters} onChange={(e) => setNewLog({ ...newLog, liters: e.target.value })} sx={{ mb: 2 }} />
                    <TextField fullWidth margin="dense" label="Cost ($)" type="number" value={newLog.cost} onChange={(e) => setNewLog({ ...newLog, cost: e.target.value })} sx={{ mb: 2 }} />
                    <TextField fullWidth margin="dense" label="Odometer at Fill (km)" type="number" value={newLog.odometer_at_fill} onChange={(e) => setNewLog({ ...newLog, odometer_at_fill: e.target.value })} sx={{ mb: 2 }} />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpen(false)} sx={{ color: '#94A3B8' }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={() => mutation.mutate({
                            ...newLog,
                            liters: parseFloat(newLog.liters),
                            cost: parseFloat(newLog.cost),
                            odometer_at_fill: parseFloat(newLog.odometer_at_fill)
                        })}
                        disabled={mutation.isPending || !newLog.vehicle_id || !newLog.liters || !newLog.cost || !newLog.odometer_at_fill}
                        sx={{ px: 4, background: '#10B981' }}
                    >
                        {mutation.isPending ? 'Saving...' : 'Save Log'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
