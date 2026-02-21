import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Select, MenuItem, InputLabel, FormControl, CircularProgress, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('STANDARD_USER');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const { data } = await axios.post('/api/auth/register', { name, email, password, role });
            if (data.status === 'success' || data.id) {
                // Auto login user after successful registration
                const loginRes = await axios.post('/api/auth/login', { login: email, password });
                const roles = loginRes.data.roles || [];
                if (roles.length > 0) {
                    localStorage.setItem('allowedRoles', JSON.stringify(roles));
                    localStorage.setItem('activeRole', roles[0]);

                    let route = '/dashboard';
                    if (roles[0] === 'manager') route = '/manager/dashboard';
                    else if (roles[0] === 'dispatcher') route = '/dispatcher/dashboard';
                    else if (roles[0] === 'safety') route = '/safety/dashboard';
                    else if (roles[0] === 'finance') route = '/finance/dashboard';

                    navigate(route);
                } else {
                    alert("Registration successful! Please log in.");
                    navigate('/login');
                }
            } else {
                alert(data.error || "Registration failed");
            }
        } catch (err: any) {
            alert(err.response?.data?.error || err.response?.data?.message || err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
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
                    FleetFlow Join
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    Register an Account
                </Typography>

                <form onSubmit={handleRegister}>
                    <TextField
                        fullWidth label="Full Name" margin="normal" variant="outlined"
                        value={name} onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <TextField
                        fullWidth label="Email" type="email" margin="normal" variant="outlined"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <FormControl fullWidth margin="normal" required sx={{ textAlign: 'left' }}>
                        <InputLabel id="role-select">Role</InputLabel>
                        <Select
                            labelId="role-select"
                            value={role}
                            label="Role"
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <MenuItem value="STANDARD_USER">Standard User</MenuItem>
                            <MenuItem value="DISPATCHER">Dispatcher</MenuItem>
                            <MenuItem value="SAFETY_OFFICER">Safety Officer</MenuItem>
                            <MenuItem value="FINANCIAL_ANALYST">Financial Analyst</MenuItem>
                            <MenuItem value="FLEET_MANAGER">Fleet Manager</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth label="Password" type={showPassword ? 'text' : 'password'} margin="normal" variant="outlined"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        required
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
                    <TextField
                        fullWidth label="Confirm Password" type={showConfirmPassword ? 'text' : 'password'} margin="normal" variant="outlined"
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        sx={{ mb: 3 }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        edge="end"
                                        sx={{ color: '#94A3B8' }}
                                    >
                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
                        disabled={loading}
                        sx={{
                            py: 1.5,
                            mb: 2,
                            fontSize: '1rem',
                            background: 'linear-gradient(90deg, #3B82F6 0%, #22D3EE 100%)',
                            boxShadow: '0 0 15px rgba(34, 211, 238, 0.4)',
                            '&:hover': { boxShadow: '0 0 25px rgba(34, 211, 238, 0.6)' }
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
                    </Button>

                    <Typography variant="body2" color="text.secondary">
                        Already have an account? <Link to="/login" style={{ color: '#3B82F6', textDecoration: 'none' }}>Login here</Link>
                    </Typography>
                </form>
            </Paper>
        </Box>
    );
}
