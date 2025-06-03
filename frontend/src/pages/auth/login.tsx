import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography } from '@mui/material';

export default function Login() {
  const [nomeUtente, setNomeUtente] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
    <Box maxWidth={400} mx="auto" mt={10}>
      <Typography variant="h5" mb={2}>Login</Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Nome Utente"
          value={nomeUtente}
          onChange={(e) => setNomeUtente(e.target.value)}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
        />
        <Button type="submit" variant="contained" fullWidth>Login</Button>
      </form>
    </Box>
  );
}