import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, TextField, Button, Link, Stack, InputAdornment, IconButton } from '@mui/material';
import decorativeSvg from '../../assets/head.svg';
import logoCCDD from '../../assets/CAMILLACINODESIGN&DEV_b.svg';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export default function Login() {
  const [nomeUtente, setNomeUtente] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const toggleShowPassword = () => setShowPassword(show => !show);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: chiamata API di login
    // es: const { token } = await login(username, password);
    // localStorage.setItem('token', token);
    navigate('/dashboard');

    const res = await fetch('http://localhost:4000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nomeUtente, password }),
    });

    if (res.ok) {
      const { token } = await res.json();
      localStorage.setItem('token', token);
      navigate('/dashboard');
    } else {
      alert('Credenziali non valide');
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2
      }}
    >

       {/* SVG decorativo in cima */}
      <Box
        component="img"
        src={decorativeSvg}
        alt="Decorazione"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          maxHeight: 400,
          objectFit: 'cover',
          pointerEvents: 'none',
          zIndex: '0'
        }}
      />

      <Card sx={{ maxWidth: 400, width: '100%', mt: 10, zIndex: '1' }} elevation={3}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h4" align="center" sx={{fontWeight: 'bold'}}>
              Login
            </Typography>

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={4}>
                <TextField
                  label="Username"
                  value={nomeUtente}
                  onChange={(e) => setNomeUtente(e.target.value)}
                  fullWidth
                  required
                  className='input-tondi'
                />
                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  required
                  className='input-tondi'
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={toggleShowPassword}
                          edge="end"
                          aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                <Button type="submit" variant="text" disableElevation disableRipple className='btn-save'>
                  Login
                </Button>
              </Stack>
            </Box>

            <Link href='#' underline="hover" variant="body2" align="center">
              Hai dimenticato la password? Contatta l'amministratore.
            </Link>
          </Stack>
        </CardContent>
        <Box sx={{ p: 1 }} className='logo-login-ccdd'>
          <Link href='https://www.camillacinodesigndev.it/' target='_blank' variant="caption" display="block" align="center" sx={{color: 'rgba(0, 0, 0, 0.87) !important'}}>
            powered by <Box
            component="img"
            src={logoCCDD}
            alt="CamillaCino Design & Dev"
            sx={{ height: 40, mx: 'auto' }}
          />
          </Link>
        </Box>
      </Card>
    </Box>
  );
}