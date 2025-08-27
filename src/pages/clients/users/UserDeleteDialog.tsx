// src/pages/users/DeleteUserDialog.tsx
import { FC } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography
} from '@mui/material';
import { User } from '../../../types';

interface Props {
  open: boolean;
  user: User | null;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteUserDialog: FC<Props> = ({ open, user, onCancel, onConfirm }) => {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>Delete User</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete user{' '}
          <strong>{user?.full_name}</strong>?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteUserDialog;
