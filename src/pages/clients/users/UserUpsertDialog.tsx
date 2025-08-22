// src/pages/users/UserUpsertDialog.tsx
import { FC, useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, FormControlLabel, Switch
} from '@mui/material';
import { User } from '../../../types';
import { UserCreate, UserCreatePayload, UserUpdate } from '../../../types/client-users.types';

interface Props {
  open: boolean;
  user: User | null;
  onCancel: () => void;
  onSubmit: (id: number | null, data: UserUpdate | UserCreate) => void;
}

const UserUpsertDialog: FC<Props> = ({ open, user, onCancel, onSubmit }) => {
    const [form, setForm] = useState<{
        username: string;
        full_name: string;
        email: string;
        is_active: boolean;
        password: string;
      }>({
        username: '',
        full_name: '',
        email: '',
        is_active: true,
        password: '',
      });
      

  useEffect(() => {
    if (user) {
      // Editing: don't include password
      setForm({
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        is_active: user.is_active,
        password: '',
      });
    } else {
      // Creating: blank form
      setForm({
        username: '',
        full_name: '',
        email: '',
        is_active: true,
        password: '',
      });
    }
  }, [user]);

  const handleChange =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm({ ...form, [field]: e.target.value });
    };

  const handleToggle =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm({ ...form, [field]: e.target.checked });
    };

  const handleSubmit = () => {
    if (!user && !form.password) {
      alert('Password is required for new users.');
      return;
    }      

    if (!user) {
      // Creation payload
      const payload: UserCreatePayload = {
        username: form.username,
        full_name: form.full_name,
        email: form.email,
        password: form.password!,
      };
      onSubmit(null, payload);
    } else {
      // Edit payload
      onSubmit(user.id, {
        username: form.username,
        full_name: form.full_name,
        email: form.email,
        is_active: form.is_active,
      });
    }
  };

  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="sm">
      <DialogTitle>{user ? 'Edit User' : 'Create User'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Username"
            value={form.username}
            onChange={handleChange('username')}
            fullWidth
          />
          <TextField
            label="Full Name"
            value={form.full_name}
            onChange={handleChange('full_name')}
            fullWidth
          />
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={handleChange('email')}
            fullWidth
          />
          {!user && (
            <TextField
              label="Password"
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              fullWidth
            />
          )}
          <FormControlLabel
            control={
              <Switch
                checked={form.is_active}
                onChange={handleToggle('is_active')}
              />
            }
            label="Active"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          {user ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserUpsertDialog;
