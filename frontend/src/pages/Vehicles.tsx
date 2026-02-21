import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Box, Typography, Chip, Fab, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Switch, FormControlLabel, CircularProgress, IconButton } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';

const fetchVehicles = async () => {
  const { data } = await axios.get('/api/vehicles');
  return data;
};

export default function Vehicles() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['vehicles'], queryFn: fetchVehicles });
  const [open, setOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ name: '', license_plate: '', vehicle_type: 'car', max_load_capacity: '', region: 'North India' });
  const [searchTerm, setSearchTerm] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: (newBody: any) => axios.post('/api/vehicles/new', newBody),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setOpen(false);
      setNewVehicle({ name: '', license_plate: '', vehicle_type: 'car', max_load_capacity: '', region: 'North India' });
    }
  });

  const editMutation = useMutation({
    mutationFn: (body: any) => axios.post('/api/vehicles/update', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setEditOpen(false);
      setEditVehicle(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axios.post('/api/vehicles/delete', { id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
    onError: (err: any) => alert(err.response?.data?.error || 'Failed to delete vehicle')
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return { bg: 'rgba(16, 185, 129, 0.2)', color: '#10B981' };
      case 'On Trip': return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6' };
      case 'In Shop': return { bg: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B' };
      case 'Retired': return { bg: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' };
      default: return { bg: 'rgba(148, 163, 184, 0.2)', color: '#94A3B8' };
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Vehicle Model', flex: 1, minWidth: 150 },
    { field: 'license_plate', headerName: 'License Plate (ID)', flex: 1, minWidth: 150 },
    {
      field: 'vehicle_type', headerName: 'Type', width: 120, renderCell: (params: GridRenderCellParams) => (
        <Typography sx={{ textTransform: 'capitalize' }}>{params.value}</Typography>
      )
    },
    { field: 'max_load_capacity', headerName: 'Max Load (kg)', width: 140, type: 'number', align: 'left', headerAlign: 'left' },
    { field: 'odometer', headerName: 'Odometer (km)', width: 140, type: 'number', align: 'left', headerAlign: 'left' },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: (params: GridRenderCellParams) => {
        const colors = getStatusColor(params.value);
        return (
          <Chip
            label={params.value}
            size="small"
            sx={{
              backgroundColor: colors.bg,
              color: colors.color,
              fontWeight: 'bold',
              borderRadius: '8px'
            }}
          />
        );
      }
    },
    {
      field: 'service',
      headerName: 'Service Toggle',
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const isOut = params.row.status === 'Retired' || params.row.status === 'In Shop';
        const isDisabled = params.row.status === 'In Shop' || localStorage.getItem('activeRole') !== 'manager';
        return (
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={isOut}
                color="error"
                disabled={isDisabled}
                onChange={async (e) => {
                  const newStatus = e.target.checked ? 'Retired' : 'Available';
                  await axios.post('/api/vehicles/action', { vehicle_id: params.row.id, status: newStatus });
                  queryClient.invalidateQueries({ queryKey: ['vehicles'] });
                }}
              />
            }
            label={params.row.status === 'In Shop' ? "In Shop" : "Out of Service"}
            componentsProps={{ typography: { variant: 'body2' } }}
          />
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const isManager = localStorage.getItem('activeRole') === 'manager';
        return (
          <Box display="flex" gap={1}>
            <IconButton
              size="small"
              color="primary"
              disabled={!isManager}
              onClick={() => {
                setEditVehicle({ ...params.row });
                setEditOpen(true);
              }}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              disabled={!isManager}
              onClick={() => {
                if (window.confirm('Are you sure you want to remove this vehicle?')) {
                  deleteMutation.mutate(params.row.id);
                }
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        );
      }
    }
  ];

  if (isLoading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress sx={{ color: '#22D3EE' }} /></Box>;

  const filteredData = (data || []).filter((v: any) =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.license_plate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">Vehicle Registry</Typography>
        <TextField
          variant="outlined"
          placeholder="Search vehicles..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            width: 300,
            '.MuiOutlinedInput-root': {
              background: 'rgba(30, 41, 59, 0.4)',
              backdropFilter: 'blur(10px)',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }
            }
          }}
        />
      </Box>

      <Box sx={{
        height: 'calc(100vh - 200px)',
        width: '100%',
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(16px)',
        borderRadius: 3,
        border: '1px solid rgba(255, 255, 255, 0.05)',
        p: 1
      }}>
        <DataGrid
          rows={filteredData}
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
            '& .MuiDataGrid-row:hover': { background: 'rgba(59, 130, 246, 0.05)' }
          }}
        />
      </Box>

      {localStorage.getItem('activeRole') === 'manager' && (
        <Fab
          sx={{
            position: 'fixed',
            bottom: 40,
            right: 40,
            background: 'linear-gradient(135deg, #3B82F6 0%, #22D3EE 100%)',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(34, 211, 238, 0.5)'
          }}
          aria-label="add"
          onClick={() => setOpen(true)}
        >
          <AddIcon />
        </Fab>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} PaperProps={{
        sx: {
          background: 'rgba(30, 41, 59, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid #3B82F6',
          borderRadius: 3
        }
      }}>
        <DialogTitle variant="h5" fontWeight="bold">Register New Vehicle</DialogTitle>
        <DialogContent sx={{ minWidth: 400, mt: 1 }}>
          <TextField fullWidth margin="dense" label="Model / Name" value={newVehicle.name} onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth margin="dense" label="License Plate" value={newVehicle.license_plate} onChange={(e) => setNewVehicle({ ...newVehicle, license_plate: e.target.value })} sx={{ mb: 2 }} />
          <TextField select fullWidth margin="dense" label="Vehicle Type" value={newVehicle.vehicle_type} onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_type: e.target.value })} sx={{ mb: 2 }}>
            <MenuItem value="car">Car</MenuItem>
            <MenuItem value="truck">Truck</MenuItem>
            <MenuItem value="van">Van</MenuItem>
          </TextField>
          <TextField fullWidth margin="dense" label="Max Load Capacity (kg)" type="number" value={newVehicle.max_load_capacity} onChange={(e) => setNewVehicle({ ...newVehicle, max_load_capacity: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth margin="dense" label="Region" value={newVehicle.region} onChange={(e) => setNewVehicle({ ...newVehicle, region: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: '#94A3B8' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => mutation.mutate({ ...newVehicle, max_load_capacity: parseFloat(newVehicle.max_load_capacity) })}
            disabled={mutation.isPending}
            sx={{ px: 4 }}
          >
            {mutation.isPending ? 'Registering...' : 'Register'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} PaperProps={{
        sx: {
          background: 'rgba(30, 41, 59, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid #3B82F6',
          borderRadius: 3
        }
      }}>
        <DialogTitle variant="h5" fontWeight="bold">Edit Vehicle</DialogTitle>
        <DialogContent sx={{ minWidth: 400, mt: 1 }}>
          {editVehicle && (
            <>
              <TextField fullWidth margin="dense" label="Model / Name" value={editVehicle.name} onChange={(e) => setEditVehicle({ ...editVehicle, name: e.target.value })} sx={{ mb: 2 }} />
              <TextField fullWidth margin="dense" label="License Plate" value={editVehicle.license_plate} onChange={(e) => setEditVehicle({ ...editVehicle, license_plate: e.target.value })} sx={{ mb: 2 }} />
              <TextField select fullWidth margin="dense" label="Vehicle Type" value={editVehicle.vehicle_type} onChange={(e) => setEditVehicle({ ...editVehicle, vehicle_type: e.target.value })} sx={{ mb: 2 }}>
                <MenuItem value="car">Car</MenuItem>
                <MenuItem value="truck">Truck</MenuItem>
                <MenuItem value="van">Van</MenuItem>
              </TextField>
              <TextField fullWidth margin="dense" label="Max Load Capacity (kg)" type="number" value={editVehicle.max_load_capacity} onChange={(e) => setEditVehicle({ ...editVehicle, max_load_capacity: e.target.value })} sx={{ mb: 2 }} />
              <TextField fullWidth margin="dense" label="Odometer (km)" type="number" value={editVehicle.odometer} onChange={(e) => setEditVehicle({ ...editVehicle, odometer: e.target.value })} sx={{ mb: 2 }} />
              <TextField select fullWidth margin="dense" label="Status" value={editVehicle.status} onChange={(e) => setEditVehicle({ ...editVehicle, status: e.target.value })} sx={{ mb: 2 }}>
                <MenuItem value="Available">Available</MenuItem>
                <MenuItem value="On Trip">On Trip</MenuItem>
                <MenuItem value="In Shop">In Shop</MenuItem>
                <MenuItem value="Retired">Retired</MenuItem>
              </TextField>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditOpen(false)} sx={{ color: '#94A3B8' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              const body = {
                ...editVehicle,
                max_load_capacity: parseFloat(editVehicle.max_load_capacity),
                odometer: parseFloat(editVehicle.odometer)
              };
              editMutation.mutate(body);
            }}
            disabled={editMutation.isPending}
            sx={{ px: 4 }}
          >
            {editMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
