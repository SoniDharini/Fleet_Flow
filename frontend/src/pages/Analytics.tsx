import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Grid, Paper, Divider, Button, CircularProgress } from '@mui/material';
import { Download as DownloadIcon, LocalAtm as RevenueIcon, SettingsSuggest as OperationIcon, Commute as FuelIcon } from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';

const fetchAnalytics = async () => (await axios.get('/api/analytics')).data;

export default function Analytics() {
    const { data, isLoading } = useQuery({ queryKey: ['analytics'], queryFn: fetchAnalytics });

    if (isLoading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress sx={{ color: '#A78BFA' }} /></Box>;

    const vehicleStats = data?.vehicle_stats || [];

    // Transforming data for charts
    const roiData = vehicleStats.map((v: any) => ({
        name: v.license_plate,
        roi: v.acquisition_cost > 0 ? (((v.vehicle_revenue - v.total_operational_cost) / v.acquisition_cost) * 100).toFixed(1) : 0,
        revenue: v.vehicle_revenue,
        cost: v.total_operational_cost
    })).sort((a: any, b: any) => b.roi - a.roi);

    const efficiencyData = vehicleStats.map((v: any) => ({
        name: v.license_plate,
        efficiency: v.fuel_efficiency.toFixed(2)
    })).sort((a: any, b: any) => b.efficiency - a.efficiency);

    const netProfit = (data?.total_revenue || 0) - (data?.total_fuel_cost || 0) - (data?.total_maintenance_cost || 0);

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" fontWeight="bold">Operational Analytics</Typography>
                <Box>
                    <Button variant="outlined" startIcon={<DownloadIcon />} sx={{ mr: 2, borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>CSV</Button>
                    <Button variant="contained" startIcon={<DownloadIcon />} sx={{ background: 'linear-gradient(90deg, #8B5CF6 0%, #A78BFA 100%)' }}>PDF Report</Button>
                </Box>
            </Box>

            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(139, 92, 246, 0.3)', boxShadow: '0 4px 20px rgba(139, 92, 246, 0.1)' }}>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                            <Box p={1} borderRadius={2} bgcolor="rgba(16, 185, 129, 0.2)" color="#10B981"><RevenueIcon /></Box>
                            <Typography variant="h6" color="text.secondary">Total Revenue</Typography>
                        </Box>
                        <Typography variant="h3" fontWeight="bold" color="#fff">${data?.total_revenue?.toFixed(2) || '0.00'}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(239, 68, 68, 0.3)', boxShadow: '0 4px 20px rgba(239, 68, 68, 0.1)' }}>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                            <Box p={1} borderRadius={2} bgcolor="rgba(239, 68, 68, 0.2)" color="#EF4444"><OperationIcon /></Box>
                            <Typography variant="h6" color="text.secondary">Operational Costs</Typography>
                        </Box>
                        <Typography variant="h3" fontWeight="bold" color="#fff">${((data?.total_fuel_cost || 0) + (data?.total_maintenance_cost || 0)).toFixed(2)}</Typography>
                        <Typography variant="body2" color="#FCA5A5" mt={1}>Fuel: ${data?.total_fuel_cost?.toFixed(2)} | Maint: ${data?.total_maintenance_cost?.toFixed(2)}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(16px)', border: `1px solid ${netProfit >= 0 ? 'rgba(52, 211, 153, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`, boxShadow: `0 4px 20px ${netProfit >= 0 ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)'}` }}>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                            <Box p={1} borderRadius={2} bgcolor="rgba(59, 130, 246, 0.2)" color="#3B82F6"><OperationIcon /></Box>
                            <Typography variant="h6" color="text.secondary">Net Fleet Profit</Typography>
                        </Box>
                        <Typography variant="h3" fontWeight="bold" color={netProfit >= 0 ? '#10B981' : '#EF4444'}>${Math.abs(netProfit).toFixed(2)}</Typography>
                    </Paper>
                </Grid>
            </Grid>

            <Grid container spacing={4}>
                <Grid item xs={12} lg={6}>
                    <Paper sx={{ p: 3, background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.05)', height: 400 }}>
                        <Typography variant="h6" fontWeight="bold" mb={3} color="#22D3EE">Vehicle ROI Calculation (%)</Typography>
                        <Typography variant="body2" color="text.secondary" mb={3}>(Revenue - Configured Cost) / Acquisition Cost</Typography>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={roiData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                <XAxis type="number" stroke="#94A3B8" />
                                <YAxis dataKey="name" type="category" stroke="#94A3B8" width={80} />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1E293B', borderColor: '#8B5CF6' }} />
                                <Bar dataKey="roi" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                <Grid item xs={12} lg={6}>
                    <Paper sx={{ p: 3, background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.05)', height: 400 }}>
                        <Typography variant="h6" fontWeight="bold" mb={3} color="#10B981">Fuel Efficiency Trends (km/L)</Typography>
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={efficiencyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="#94A3B8" />
                                <YAxis stroke="#94A3B8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#10B981' }} />
                                <Legend />
                                <Line type="monotone" dataKey="efficiency" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
