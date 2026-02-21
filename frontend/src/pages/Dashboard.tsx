import React, { useState } from 'react';
import { Grid, Paper, Typography, Box, Select, MenuItem, FormControl, InputLabel, CircularProgress, Chip, Divider } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  LocalShipping as TruckIcon,
  Build as WrenchIcon,
  Speed as UtilizationIcon,
  WarningAmber as PendingIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const fetchDashboard = async ({ queryKey }: any) => {
  const [_key, params] = queryKey;
  const { data } = await axios.get('/api/dashboard', { params });
  return data;
};

const activityData = [
  { time: '08:00', trips: 12, alerts: 1 },
  { time: '10:00', trips: 19, alerts: 2 },
  { time: '12:00', trips: 15, alerts: 2 },
  { time: '14:00', trips: 28, alerts: 4 },
  { time: '16:00', trips: 22, alerts: 3 },
  { time: '18:00', trips: 10, alerts: 1 },
];

export default function Dashboard() {
  const [regionFilter, setRegionFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', { region: regionFilter, type: typeFilter, status: statusFilter }],
    queryFn: fetchDashboard
  });

  if (isLoading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress sx={{ color: '#22D3EE' }} /></Box>;

  const StatCard = ({ title, value, icon, color, glow }: any) => (
    <Paper sx={{
      p: 3,
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      background: 'rgba(30, 41, 59, 0.6)',
      backdropFilter: 'blur(16px)',
      border: `1px solid ${color}40`,
      boxShadow: `0 4px 20px 0 ${glow}`,
      transition: 'transform 0.2s',
      '&:hover': { transform: 'translateY(-4px)' }
    }}>
      <Box sx={{
        p: 1.5,
        borderRadius: '12px',
        background: `${color}20`,
        color: color,
        display: 'flex'
      }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary" fontWeight="600">{title}</Typography>
        <Typography variant="h4" fontWeight="bold" sx={{ color: '#fff' }}>{value}</Typography>
      </Box>
    </Paper>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">Command Center</Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel id="type-filter-label" sx={{ color: '#94A3B8' }}>Vehicle</InputLabel>
            <Select
              labelId="type-filter-label"
              value={typeFilter}
              label="Vehicle"
              onChange={(e) => setTypeFilter(e.target.value)}
              sx={{
                color: '#fff',
                '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' }
              }}
            >
              <MenuItem value="all">Any Type</MenuItem>
              <MenuItem value="truck">Trucks</MenuItem>
              <MenuItem value="van">Vans</MenuItem>
              <MenuItem value="car">Cars</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel id="status-filter-label" sx={{ color: '#94A3B8' }}>Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{
                color: '#fff',
                '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' }
              }}
            >
              <MenuItem value="all">Any Status</MenuItem>
              <MenuItem value="Available">Ready</MenuItem>
              <MenuItem value="On Trip">Busy</MenuItem>
              <MenuItem value="In Shop">In Shop</MenuItem>
              <MenuItem value="Retired">Retired</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="region-filter-label" sx={{ color: '#94A3B8' }}>Region</InputLabel>
            <Select
              labelId="region-filter-label"
              value={regionFilter}
              label="Region"
              onChange={(e) => setRegionFilter(e.target.value)}
              sx={{
                color: '#fff',
                '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' }
              }}
            >
              <MenuItem value="all">All Regions</MenuItem>
              <MenuItem value="north">North India</MenuItem>
              <MenuItem value="south">South India</MenuItem>
              <MenuItem value="west">West India</MenuItem>
              <MenuItem value="east">East India</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Grid container spacing={4} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Fleet"
            value={data?.active_fleet || 0}
            icon={<TruckIcon fontSize="large" />}
            color="#3B82F6"
            glow="rgba(59, 130, 246, 0.2)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="In Shop"
            value={data?.maintenance_alerts || 0}
            icon={<WrenchIcon fontSize="large" />}
            color="#F59E0B"
            glow="rgba(245, 158, 11, 0.2)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Utilization Rate"
            value={`${Math.round(data?.utilization_rate || 0)}%`}
            icon={<UtilizationIcon fontSize="large" />}
            color="#10B981"
            glow="rgba(16, 185, 129, 0.2)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Cargo"
            value={data?.pending_trips || 0}
            icon={<PendingIcon fontSize="large" />}
            color="#EF4444"
            glow="rgba(239, 68, 68, 0.2)"
          />
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" mb={3} color="#22D3EE">Fleet Activity Timeline</Typography>
            <Box sx={{ height: 300, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(59,130,246,0.3)', color: '#fff' }}
                    itemStyle={{ color: '#22D3EE' }}
                  />
                  <Area type="monotone" dataKey="trips" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorTrips)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>Live Overview</Typography>
            <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.05)' }} />

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography color="text.secondary">Total Vehicles</Typography>
              <Typography fontWeight="bold">{data?.total_vehicles || 0}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography color="text.secondary">System Status</Typography>
              <Chip label="Optimal" size="small" sx={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', fontWeight: 'bold' }} />
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography color="text.secondary">Network Load</Typography>
              <Typography fontWeight="bold" color="#22D3EE">34%</Typography>
            </Box>

            <Box mt={4} p={2} sx={{ background: 'rgba(239, 68, 68, 0.1)', borderRadius: 2, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <Typography variant="body2" color="#FCA5A5" fontWeight="bold" mb={0.5}>Critical Alert</Typography>
              <Typography variant="body2" color="#EF4444">Vehicle T-404 requires immediate maintenance. Engine temp critical.</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
