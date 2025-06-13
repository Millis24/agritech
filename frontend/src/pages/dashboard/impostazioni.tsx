import { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Divider, Switch,FormControlLabel, Stack, Paper, InputAdornment, IconButton } from '@mui/material';
import { getUserProfile, updateUserProfile, changePassword, type UserProfile } from '../../api/user';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Swal from 'sweetalert2';

export default function SettingsPage() {
  // Profilo utente
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  // Password
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const toggleShowOld = () => setShowOldPassword(show => !show);
  const toggleShowNew = () => setShowNewPassword(show => !show);
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
      await Swal.fire({
        icon: 'success',
        title: 'Profilo aggiornato!',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error(err);
      await Swal.fire({
        icon: 'error',
        title: 'Errore',
        text: 'Errore nell\'aggiornamento del profilo'
      });
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      await Swal.fire({
        icon: 'warning',
        title: 'Campi mancanti',
        text: 'Inserisci password attuale e nuova password'
      });
      return;
    }
    const success = await changePassword(oldPassword, newPassword);
    if (success) {
      await Swal.fire({
        icon: 'success',
        title: 'Password aggiornata!',
        timer: 1500,
        showConfirmButton: false
      });
      setOldPassword('');
      setNewPassword('');
    } else {
      await Swal.fire({
        icon: 'error',
        title: 'Errore',
        text: 'Errore nella modifica della password',
      });
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
          {/* <FormControlLabel
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
          /> */}
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
            type={showOldPassword ? 'text' : 'password'}
            value={oldPassword}
            onChange={e => setOldPassword(e.target.value)}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={toggleShowOld}
                    edge="end"
                    aria-label={showOldPassword ? 'Nascondi password' : 'Mostra password'}
                  >
                    {showOldPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <TextField
            label="Nuova password"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={toggleShowNew}
                    edge="end"
                    aria-label={showNewPassword ? 'Nascondi password' : 'Mostra password'}
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Button variant="contained" onClick={handleChangePassword}>
            Cambia Password
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
