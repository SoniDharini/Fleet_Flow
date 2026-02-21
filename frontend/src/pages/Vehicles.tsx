import { useQuery } from '@tanstack/react-query';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Typography } from '@mui/material';
import axios from 'axios';

const fetchVehicles = async () => {
  const { data } = await axios.get('/api/vehicles');
  return data;
};

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'name', headerName: 'Model', width: 150 },
  { field: 'license_plate', headerName: 'Plate', width: 150 },
  { field: 'status', headerName: 'Status', width: 150 },
  { field: 'vehicle_type', headerName: 'Type', width: 130 },
  { field: 'max_load_capacity', headerName: 'Max Load', width: 130 },
];

export default function Vehicles() {
  const { data, isLoading } = useQuery({ queryKey: ['vehicles'], queryFn: fetchVehicles });

  if (isLoading) return <Typography>Loading...</Typography>;

  return (
    <Box sx={{ height: 600, width: '100%', bgcolor: 'white', p: 1, borderRadius: 1 }}>
      <Typography variant="h6" mb={2}>Vehicle Registry</Typography>
      <DataGrid
        rows={data || []}
        columns={columns}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
        }}
        pageSizeOptions={[10, 25, 50]}
      />
    </Box>
  );
}
