import React, { useState } from 'react';
import { Box, Drawer, List, ListItemText, AppBar, Toolbar, Typography, Button, IconButton, Badge, Avatar, ListItemButton, ListItemIcon, Popover, Divider, Chip } from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Dashboard as DashboardIcon,
  LocalShipping as TruckIcon,
  Route as RouteIcon,
  Build as WrenchIcon,
  EvStation as FuelIcon,
  Security as ShieldIcon,
  Analytics as AnalyticsIcon,
  ExitToApp as LogoutIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const drawerWidth = 260;

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => (await axios.get('/api/auth/me')).data
  });
  const userName = user?.name || 'Loading...';
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : '';

  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => (await axios.get('/api/alerts')).data,
    refetchInterval: 10000
  });

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleAlertsClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleAlertsClose = () => setAnchorEl(null);
  const openAlerts = Boolean(anchorEl);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (e) { }
    navigate('/login');
  };

  const activeRole = localStorage.getItem('activeRole') || 'manager';

  const dashboardPaths: Record<string, string> = {
    'manager': '/manager/dashboard',
    'dispatcher': '/dispatcher/dashboard',
    'safety': '/safety/dashboard',
    'finance': '/finance/dashboard'
  };

  const navItems = [
    { text: 'Command Center', icon: <DashboardIcon sx={{ color: '#22D3EE' }} />, path: dashboardPaths[activeRole] || '/dashboard', roles: ['manager', 'dispatcher', 'safety', 'finance'] },
    { text: 'Vehicle Registry', icon: <TruckIcon sx={{ color: '#3B82F6' }} />, path: '/vehicles', roles: ['manager', 'dispatcher', 'safety', 'finance'] },
    { text: 'Trip Dispatcher', icon: <RouteIcon sx={{ color: '#8B5CF6' }} />, path: '/trips', roles: ['manager', 'dispatcher', 'safety', 'finance'] },
    { text: 'Service Logs', icon: <WrenchIcon sx={{ color: '#F59E0B' }} />, path: '/maintenance', roles: ['manager', 'finance'] },
    { text: 'Fuel & Expenses', icon: <FuelIcon sx={{ color: '#10B981' }} />, path: '/fuel', roles: ['manager', 'finance'] },
    { text: 'Driver Profiles', icon: <ShieldIcon sx={{ color: '#F87171' }} />, path: '/drivers', roles: ['manager', 'dispatcher', 'safety', 'finance'] },
    { text: 'Analytics & ROI', icon: <AnalyticsIcon sx={{ color: '#A78BFA' }} />, path: '/analytics', roles: ['manager', 'finance'] },
  ].filter(item => item.roles.includes(activeRole));

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ my: 2, display: 'flex', justifyContent: 'center' }}>
        <Typography variant="h5" fontWeight="bold" sx={{
          background: 'linear-gradient(90deg, #3B82F6 0%, #22D3EE 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '1px'
        }}>
          FLEETFLOW
        </Typography>
      </Toolbar>
      <List sx={{ px: 2, flexGrow: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <ListItemButton
              key={item.text}
              onClick={() => navigate(item.path)}
              sx={{
                mb: 1,
                borderRadius: '12px',
                background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                transition: 'all 0.2s',
                '&:hover': {
                  background: 'rgba(59, 130, 246, 0.2)',
                  transform: 'translateX(4px)'
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, dropShadow: isActive ? '0 0 8px rgba(34, 211, 238, 0.8)' : 'none' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#fff' : '#94A3B8'
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ borderRadius: '12px', borderColor: 'rgba(239, 68, 68, 0.3)' }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton color="inherit" onClick={handleAlertsClick} sx={{ mr: 2 }}>
            <Badge badgeContent={alerts?.length || 0} color="error">
              <NotificationsIcon sx={{ color: '#94A3B8' }} />
            </Badge>
          </IconButton>
          <Popover
            open={openAlerts}
            anchorEl={anchorEl}
            onClose={handleAlertsClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { width: 360, background: 'rgba(30, 41, 59, 1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', mt: 1.5, borderRadius: 2 } }}
          >
            <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight="bold">Notification Center</Typography>
              <Chip size="small" label={`${alerts?.length || 0} Alerts`} color="error" />
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
              {(alerts || []).length === 0 ? (
                <Box p={3} textAlign="center"><Typography variant="body2" color="text.secondary">All systems normal. No active alerts.</Typography></Box>
              ) : (alerts || []).map((alert: any) => (
                <Box key={alert.id}>
                  <ListItemButton sx={{ '&:hover': { background: 'rgba(255,255,255,0.05)' }, px: 2, py: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {alert.type === 'error' ? <ErrorIcon color="error" /> : alert.type === 'warning' ? <WarningIcon color="warning" /> : <InfoIcon color="info" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant="body2" fontWeight="bold" color={alert.type === 'error' ? '#EF4444' : alert.type === 'warning' ? '#F59E0B' : '#3B82F6'}>{alert.title}</Typography>}
                      secondary={<Typography variant="caption" color="#94A3B8" sx={{ display: 'block', mt: 0.5, lineHeight: 1.2 }}>{alert.message}</Typography>}
                    />
                  </ListItemButton>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
                </Box>
              ))}
            </List>
          </Popover>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, background: 'rgba(30, 41, 59, 0.5)', p: 0.5, pr: 2, borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#3B82F6' }}>{userInitial}</Avatar>
            <Typography variant="body2" fontWeight="500">{userName}</Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(255,255,255,0.05)' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: 4, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
