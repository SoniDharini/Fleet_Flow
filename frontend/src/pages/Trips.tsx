import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Typography, Grid, Paper, TextField, Button, MenuItem, Select, FormControl, InputLabel, Chip, Autocomplete, Stepper, Step, StepLabel, IconButton } from '@mui/material';
import { WarningAmber as WarningIcon, LocalShipping as TruckIcon, Person as PersonIcon, Route as RouteIcon, Check as CheckIcon, Cancel as CancelIcon } from '@mui/icons-material';
import axios from 'axios';

const fetchTrips = async () => (await axios.get('/api/trips')).data;
const fetchVehicles = async () => (await axios.get('/api/vehicles')).data;
const fetchDrivers = async () => (await axios.get('/api/drivers')).data;

export default function Trips() {
    const queryClient = useQueryClient();
    const { data: trips } = useQuery({ queryKey: ['trips'], queryFn: fetchTrips });
    const { data: vehicles } = useQuery({ queryKey: ['vehicles'], queryFn: fetchVehicles });
    const { data: drivers } = useQuery({ queryKey: ['drivers'], queryFn: fetchDrivers });

    const [newTrip, setNewTrip] = useState({
        vehicle_id: null as any,
        driver_id: null as any,
        source: '',
        destination: '',
        planned_start_date: '',
        cargo_weight: '',
        distance_km: '',
        revenue: ''
    });

    const createMutation = useMutation({
        mutationFn: (newBody: any) => axios.post('/api/trips/new', newBody),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            setNewTrip({ vehicle_id: null, driver_id: null, source: '', destination: '', planned_start_date: '', cargo_weight: '', distance_km: '', revenue: '' });
        },
        onError: (err: any) => alert(err.response?.data?.message || err.response?.data?.error || "Error creating trip")
    });

    const dispatchMutation = useMutation({
        mutationFn: (trip_id: number) => axios.post('/api/trips/dispatch', { trip_id }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
        onError: (err: any) => alert(err.response?.data?.message || err.response?.data?.error || "Error dispatching trip")
    });

    const actionMutation = useMutation({
        mutationFn: (params: any) => axios.post('/api/trips/action', params),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
        onError: (err: any) => alert(err.response?.data?.message || err.response?.data?.error || "Error updating trip status")
    });

    const availableVehicles = (vehicles || []).filter((v: any) => v.status === 'Available');
    const availableDrivers = (drivers || []).filter((d: any) => d.status === 'On Duty');

    const selectedVehicleObj = vehicles?.find((v: any) => v.id === newTrip.vehicle_id);
    const isOverweight = selectedVehicleObj && newTrip.cargo_weight && parseFloat(newTrip.cargo_weight) > selectedVehicleObj.max_load_capacity;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Draft': return { bg: 'rgba(148, 163, 184, 0.2)', color: '#94A3B8' };
            case 'Dispatched': return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6' };
            case 'Completed': return { bg: 'rgba(16, 185, 129, 0.2)', color: '#10B981' };
            case 'Cancelled': return { bg: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' };
            default: return { bg: 'rgba(148, 163, 184, 0.2)', color: '#94A3B8' };
        }
    };

    const steps = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];

    const getStepActive = (state: string) => {
        if (state === 'Draft') return 0;
        if (state === 'Dispatched') return 1;
        if (state === 'Completed' || state === 'Cancelled') return 2;
        return 0;
    };

    const activeRole = localStorage.getItem('activeRole') || 'manager';
    const canManageTrips = activeRole === 'manager' || activeRole === 'dispatcher';

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" mb={3}>Trip Dispatcher</Typography>

            <Grid container spacing={3}>
                {/* Left: Trip creation form */}
                {canManageTrips && (
                    <Grid item xs={12} md={7}>
                        <Paper sx={{
                            p: 3,
                            background: 'rgba(30, 41, 59, 0.7)',
                            backdropFilter: 'blur(16px)',
                            border: `1px solid ${isOverweight ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.05)'}`,
                            boxShadow: isOverweight ? '0 0 20px rgba(239, 68, 68, 0.2)' : '0 8px 32px rgba(0,0,0,0.3)',
                            transition: 'all 0.3s'
                        }}>
                            <Typography variant="h6" fontWeight="bold" mb={3} color="#22D3EE">Create New Dispatch</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Source" value={newTrip.source} onChange={e => setNewTrip({ ...newTrip, source: e.target.value })} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Destination" value={newTrip.destination} onChange={e => setNewTrip({ ...newTrip, destination: e.target.value })} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel id="select-vehicle-label">Assign Vehicle</InputLabel>
                                        <Select labelId="select-vehicle-label" label="Assign Vehicle" value={newTrip.vehicle_id || ''} onChange={e => setNewTrip({ ...newTrip, vehicle_id: e.target.value })}>
                                            {availableVehicles.map((v: any) => (
                                                <MenuItem key={v.id} value={v.id}>{v.name} ({v.license_plate}) - Max {v.max_load_capacity}kg</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel id="select-driver-label">Assign Driver</InputLabel>
                                        <Select labelId="select-driver-label" label="Assign Driver" value={newTrip.driver_id || ''} onChange={e => setNewTrip({ ...newTrip, driver_id: e.target.value })}>
                                            {availableDrivers.map((d: any) => (
                                                <MenuItem key={d.id} value={d.id}>{d.name} (Score: {d.safety_score})</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        label="Cargo Weight (kg)"
                                        type="number"
                                        value={newTrip.cargo_weight}
                                        onChange={e => setNewTrip({ ...newTrip, cargo_weight: e.target.value })}
                                        error={!!isOverweight}
                                        helperText={isOverweight ? 'Too heavy!' : ''}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth label="Distance (km)" type="number" value={newTrip.distance_km} onChange={e => setNewTrip({ ...newTrip, distance_km: e.target.value })} />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth label="Revenue (₹)" type="number" value={newTrip.revenue} onChange={e => setNewTrip({ ...newTrip, revenue: e.target.value })} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Planned Start Date" type="datetime-local" InputLabelProps={{ shrink: true }} value={newTrip.planned_start_date} onChange={e => setNewTrip({ ...newTrip, planned_start_date: e.target.value })} />
                                </Grid>

                                <Grid item xs={12}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        disabled={!!isOverweight || !newTrip.vehicle_id || !newTrip.driver_id || createMutation.isPending}
                                        onClick={() => createMutation.mutate({
                                            ...newTrip,
                                            cargo_weight: parseFloat(newTrip.cargo_weight),
                                            distance_km: parseFloat(newTrip.distance_km),
                                            revenue: parseFloat(newTrip.revenue)
                                        })}
                                        sx={{
                                            mt: 2,
                                            background: isOverweight ? '#475569' : 'linear-gradient(90deg, #8B5CF6 0%, #3B82F6 100%)'
                                        }}
                                    >
                                        Create Draft Trip
                                    </Button>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                )}

                {/* Right: Available Vehicles & Drivers */}
                <Grid item xs={12} md={canManageTrips ? 5 : 12}>
                    <Paper sx={{ p: 3, background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.05)', height: '100%' }}>
                        <Typography variant="h6" fontWeight="bold" mb={2} color="#10B981">Available Resources</Typography>

                        <Typography variant="body2" color="#94A3B8" mb={1} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TruckIcon fontSize="small" /> Vehicles ({availableVehicles.length})
                        </Typography>
                        <Box sx={{ maxHeight: 150, overflow: 'auto', mb: 3 }}>
                            {availableVehicles.map((v: any) => (
                                <Chip key={v.id} label={`${v.name} - ${v.max_load_capacity}kg`} size="small" sx={{ m: 0.5, bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }} />
                            ))}
                        </Box>

                        <Typography variant="body2" color="#94A3B8" mb={1} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon fontSize="small" /> Drivers ({availableDrivers.length})
                        </Typography>
                        <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
                            {availableDrivers.map((d: any) => (
                                <Chip key={d.id} label={`${d.name} (Score: ${d.safety_score})`} size="small" sx={{ m: 0.5, bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }} />
                            ))}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Trip Management List */}
            <Box mt={4}>
                <Typography variant="h5" fontWeight="bold" mb={2}>Active & Past Trips</Typography>
                <Grid container spacing={2}>
                    {(trips || []).map((trip: any) => {
                        const statusColor = getStatusColor(trip.state);
                        return (
                            <Grid item xs={12} key={trip.id}>
                                <Paper sx={{ p: 2, background: 'rgba(30, 41, 59, 0.5)', border: `1px solid ${statusColor.bg}`, display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Box sx={{ minWidth: 100 }}>
                                        <Typography fontWeight="bold" color="#F8FAFC">{trip.name}</Typography>
                                        <Chip label={trip.state} size="small" sx={{ mt: 1, backgroundColor: statusColor.bg, color: statusColor.color, fontWeight: 'bold' }} />
                                    </Box>

                                    <Box sx={{ flexGrow: 1, px: 2 }}>
                                        <Stepper activeStep={getStepActive(trip.state)} alternativeLabel>
                                            {steps.slice(0, 3).map((label, idx) => {
                                                const isError = label === 'Cancelled' || (idx === 2 && trip.state === 'Cancelled');
                                                return (
                                                    <Step key={label}>
                                                        <StepLabel error={isError}>
                                                            {idx === 2 && trip.state === 'Cancelled' ? 'Cancelled' : label}
                                                        </StepLabel>
                                                    </Step>
                                                )
                                            })}
                                        </Stepper>
                                    </Box>

                                    <Box sx={{ minWidth: 200 }}>
                                        <Typography variant="body2"><strong>Route:</strong> {trip.source} → {trip.destination}</Typography>
                                        <Typography variant="body2"><strong>Driver:</strong> {trip.driver_name}</Typography>
                                        <Typography variant="body2"><strong>Vehicle:</strong> {trip.vehicle_name}</Typography>
                                    </Box>

                                    {canManageTrips && (
                                        <Box display="flex" flexDirection="column" gap={1}>
                                            {trip.state === 'Draft' && (
                                                <Button variant="contained" size="small" onClick={() => dispatchMutation.mutate(trip.id)}>Dispatch</Button>
                                            )}
                                            {trip.state === 'Dispatched' && (
                                                <Box display="flex" gap={1}>
                                                    <IconButton color="success" size="small" onClick={() => actionMutation.mutate({ trip_id: trip.id, action: 'complete' })}><CheckIcon /></IconButton>
                                                    <IconButton color="error" size="small" onClick={() => actionMutation.mutate({ trip_id: trip.id, action: 'cancel' })}><CancelIcon /></IconButton>
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                </Paper>
                            </Grid>
                        )
                    })}
                </Grid>
            </Box>
        </Box>
    );
}
