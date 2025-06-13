import { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Divider, Switch,FormControlLabel, Stack, Paper, } from '@mui/material';
import { getUserProfile, updateUserProfile, changePassword, type UserProfile } from '../../api/user';

export default function SettingsPage() {
  // Profilo utente
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  // Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Notifiche
  const [notifySync, setNotifySync] = useState(false);
  const [notifyErrors, setNotifyErrors] = useState(false);

  // Tema
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const profile: UserProfile & { nomeUtente?: string } = await getUserProfile();
        // Se il backend restituisce solo email/etc, potresti dover adattare per ottenere nomeUtente
        setUsername((profile as any).nomeUtente || '');
        setEmail(profile.email);
        setNotifySync(profile.notifySync);
        setNotifyErrors(profile.notifyErrors);
        setDarkMode(profile.darkMode);
      } catch (err) {
        console.error('Errore caricamento profilo:', err);
      }
    }
    load();
  }, []);

  const handleSaveProfile = async () => {
    try {
      await updateUserProfile({ nomeUtente: username, email, notifySync, notifyErrors, darkMode });
      alert('Profilo aggiornato!');
    } catch (err) {
      console.error(err);
      alert('Errore nell\'aggiornamento del profilo');
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      alert('Inserisci password attuale e nuova password');
      return;
    }
    const success = await changePassword(oldPassword, newPassword);
    if (success) {
      alert('Password aggiornata!');
      setOldPassword('');
      setNewPassword('');
    } else {
      alert('Errore nella modifica della password');
    }
  };

  return (
    <Box p={3} maxWidth={600} mx="auto">
      <Typography variant="h4" mb={2}>Impostazioni</Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Profilo</Typography>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Nome Utente"
            value={username}
            onChange={e => setUsername(e.target.value)}
            fullWidth
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            fullWidth
          />
          <FormControlLabel
            control={
              <Switch
                checked={notifySync}
                onChange={e => setNotifySync(e.target.checked)}
              />
            }
            label="Notifica sincronizzazione"
          />
          <FormControlLabel
            control={
              <Switch
                checked={notifyErrors}
                onChange={e => setNotifyErrors(e.target.checked)}
              />
            }
            label="Notifica errori"
          />
          <FormControlLabel
            control={
              <Switch
                checked={darkMode}
                onChange={e => setDarkMode(e.target.checked)}
              />
            }
            label="Dark Mode"
          />
          <Button variant="contained" onClick={handleSaveProfile}>
            Aggiorna Profilo
          </Button>
        </Stack>
      </Paper>

      <Divider sx={{ mb: 3 }} />

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">Password</Typography>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Password attuale"
            type="password"
            value={oldPassword}
            onChange={e => setOldPassword(e.target.value)}
            fullWidth
          />
          <TextField
            label="Nuova password"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            fullWidth
          />
          <Button variant="contained" onClick={handleChangePassword}>
            Cambia Password
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
