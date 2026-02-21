import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Link, Select, MenuItem, InputLabel, FormControl, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const getDashboardRoute = (role: string) => {
    if (role === 'manager') return '/manager/dashboard';
    if (role === 'dispatcher') return '/dispatcher/dashboard';
    if (role === 'safety') return '/safety/dashboard';
    if (role === 'finance') return '/finance/dashboard';
    return '/dashboard';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/auth/login', { login: email, password });
      const roles = data.roles || [];
      if (roles.length === 0) {
        alert("You have no assigned roles.");
        return;
      }
      localStorage.setItem('allowedRoles', JSON.stringify(roles));

      if (roles.length === 1) {
        localStorage.setItem('activeRole', roles[0]);
        navigate(getDashboardRoute(roles[0]));
      } else {
        setAvailableRoles(roles);
        setSelectedRole(roles[0]);
        setStep(2);
      }
    } catch (err) {
      alert("Invalid credentials / Server offline");
    }
  };

  const handleSelectRole = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('activeRole', selectedRole);
    navigate(getDashboardRoute(selectedRole));
  };

  const roleNameMap: Record<string, string> = {
    'manager': 'Fleet Manager',
    'dispatcher': 'Dispatcher',
    'safety': 'Safety Officer',
    'finance': 'Financial Analyst'
  };

  return (
    <Box sx={{
      display: 'flex',
      height: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0F172A 0%, #172554 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Abstract Logistics Network Lines Background */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, pointerEvents: 'none' }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#22D3EE" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <circle cx="20%" cy="30%" r="4" fill="#3B82F6" />
          <circle cx="80%" cy="70%" r="6" fill="#22D3EE" />
          <path d="M 20% 30% L 80% 70%" stroke="#3B82F6" strokeWidth="2" strokeDasharray="5,5" fill="none" />
        </svg>
      </Box>

      <Paper elevation={24} sx={{
        p: 5,
        width: { xs: '90%', sm: 450 },
        borderRadius: '24px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        background: 'rgba(30, 41, 59, 0.45)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)'
      }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, background: 'linear-gradient(90deg, #3B82F6 0%, #22D3EE 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          FleetFlow
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Logistics Management System
        </Typography>

        {step === 1 ? (
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email/Username"
              margin="normal"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              margin="normal"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: '#94A3B8' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Button
              fullWidth
              variant="contained"
              type="submit"
              size="large"
              sx={{
                py: 1.5,
                mb: 2,
                fontSize: '1rem',
                background: 'linear-gradient(90deg, #3B82F6 0%, #22D3EE 100%)',
                boxShadow: '0 0 15px rgba(34, 211, 238, 0.4)',
                '&:hover': { boxShadow: '0 0 25px rgba(34, 211, 238, 0.6)' }
              }}
            >
              Access System
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Link href="/register" underline="hover" color="inherit">
                Don't have an account? Register here
              </Link>
              <Link href="#" underline="hover" color="inherit">
                Forgot Password?
              </Link>
            </Typography>
          </form>
        ) : (
          <form onSubmit={handleSelectRole}>
            <Typography variant="h6" color="#F8FAFC" mb={2}>Select Workspace</Typography>
            <FormControl fullWidth sx={{ mb: 4, textAlign: 'left' }}>
              <InputLabel id="role-label">Role Workspace</InputLabel>
              <Select
                labelId="role-label"
                value={selectedRole}
                label="Role Workspace"
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                {availableRoles.map(r => (
                  <MenuItem key={r} value={r}>{roleNameMap[r] || r}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              fullWidth
              variant="contained"
              type="submit"
              size="large"
              sx={{
                py: 1.5,
                fontSize: '1rem',
                background: 'linear-gradient(90deg, #10B981 0%, #34D399 100%)',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
                '&:hover': { boxShadow: '0 0 25px rgba(16, 185, 129, 0.6)' }
              }}
            >
              Enter Workspace
            </Button>
          </form>
        )}
      </Paper>
    </Box>
  );
}
