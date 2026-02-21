import { Grid, Paper, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const fetchDashboard = async () => {
  const { data } = await axios.get('/api/dashboard');
  return data;
};

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard });

  if (isLoading) return <Typography>Loading...</Typography>;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Active Fleet</Typography>
          <Typography variant="h4">{data?.active_fleet || 0}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Maintenance Alerts</Typography>
          <Typography variant="h4">{data?.maintenance_alerts || 0}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Utilization Rate</Typography>
          <Typography variant="h4">{Math.round(data?.utilization_rate || 0)}%</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Pending Trips</Typography>
          <Typography variant="h4">{data?.pending_trips || 0}</Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}
