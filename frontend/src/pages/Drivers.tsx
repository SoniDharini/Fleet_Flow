import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Grid, Paper, Chip, Avatar, CircularProgress, LinearProgress } from '@mui/material';
import { Security as ShieldIcon, Warning as WarningIcon, LocalShipping as TruckIcon } from '@mui/icons-material';
import axios from 'axios';

const fetchDrivers = async () => (await axios.get('/api/drivers')).data;

export default function Drivers() {
    const { data: drivers, isLoading } = useQuery({ queryKey: ['drivers'], queryFn: fetchDrivers });

    if (isLoading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress sx={{ color: '#F87171' }} /></Box>;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'On Duty': return { bg: 'rgba(16, 185, 129, 0.2)', color: '#10B981', border: '#10B981' };
            case 'On Trip': return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6', border: '#3B82F6' };
            case 'Off Duty': return { bg: 'rgba(148, 163, 184, 0.2)', color: '#94A3B8', border: '#94A3B8' };
            case 'Suspended': return { bg: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', border: '#EF4444' };
            default: return { bg: 'rgba(148, 163, 184, 0.2)', color: '#94A3B8', border: '#94A3B8' };
        }
    };

    const getSafetyColor = (score: number) => {
        if (score >= 90) return '#10B981';
        if (score >= 75) return '#F59E0B';
        return '#EF4444';
    };

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" mb={4}>Driver Profiles</Typography>

            <Grid container spacing={4}>
                {(drivers || []).map((driver: any) => {
                    const sColor = getStatusColor(driver.status);
                    const safetyColor = getSafetyColor(driver.safety_score);

                    // Calculate days to expiry
                    const expiryDate = new Date(driver.license_expiry_date);
                    const daysToExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                    const isExpiringSoon = daysToExpiry <= 30 && daysToExpiry > 0;
                    const isExpired = daysToExpiry <= 0;

                    return (
                        <Grid item xs={12} sm={6} md={4} xl={3} key={driver.id}>
                            <Paper sx={{
                                p: 3,
                                position: 'relative',
                                background: 'rgba(30, 41, 59, 0.6)',
                                backdropFilter: 'blur(16px)',
                                border: `1px solid ${driver.status === 'Suspended' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.05)'}`,
                                borderRadius: 4,
                                overflow: 'hidden'
                            }}>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Avatar sx={{ width: 56, height: 56, bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6', border: `1px solid ${sColor.border}` }}>
                                            {driver.name.charAt(0)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h6" fontWeight="bold">{driver.name}</Typography>
                                            <Typography variant="body2" color="text.secondary">{driver.license_number}</Typography>
                                        </Box>
                                    </Box>
                                    <Chip
                                        label={driver.status}
                                        size="small"
                                        sx={{ backgroundColor: sColor.bg, color: sColor.color, fontWeight: 'bold' }}
                                    />
                                </Box>

                                {driver.status === 'Suspended' && (
                                    <Box mb={2} p={1} sx={{ background: 'rgba(239, 68, 68, 0.2)', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <WarningIcon color="error" fontSize="small" />
                                        <Typography variant="body2" color="#FCA5A5" fontWeight="bold">Driver Suspended</Typography>
                                    </Box>
                                )}

                                <Box mb={2}>
                                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                                        <Typography variant="body2" color="text.secondary">Safety Score</Typography>
                                        <Typography variant="body2" fontWeight="bold" color={safetyColor}>{driver.safety_score}/100</Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={driver.safety_score}
                                        sx={{
                                            height: 8,
                                            borderRadius: 4,
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                            '& .MuiLinearProgress-bar': { backgroundColor: safetyColor }
                                        }}
                                    />
                                </Box>

                                <Box mb={2}>
                                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                                        <Typography variant="body2" color="text.secondary">Trip Completion Rate</Typography>
                                        <Typography variant="body2" fontWeight="bold">{Math.round(driver.completion_rate)}%</Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={driver.completion_rate}
                                        sx={{
                                            height: 8,
                                            borderRadius: 4,
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                            '& .MuiLinearProgress-bar': { backgroundColor: '#3B82F6' }
                                        }}
                                    />
                                </Box>

                                <Box mt={3} pt={2} sx={{ borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ShieldIcon fontSize="small" color={isExpired ? 'error' : isExpiringSoon ? 'warning' : 'success'} />
                                    <Typography variant="body2" color={isExpired ? '#EF4444' : isExpiringSoon ? '#F59E0B' : 'text.secondary'}>
                                        {isExpired ? 'License Expired!' : isExpiringSoon ? `License expires in ${daysToExpiry} days` : 'Licensing Compliant'}
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
}
