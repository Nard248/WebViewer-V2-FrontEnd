import { FC } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
} from '@mui/material';
import { Client } from '../../types';

interface Props {
    open: boolean;
    client: Client | null;
    onCancel: () => void;
    onConfirm: () => void;
}

const DeleteClientDialog: FC<Props> = ({ open, client, onCancel, onConfirm }) => {
    return (
        <Dialog
            open={open}
            onClose={onCancel}
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
        >
            <DialogTitle id="delete-dialog-title">Confirm Deletion</DialogTitle>
            <DialogContent>
                <DialogContentText id="delete-dialog-description">
                    Are you sure you want to delete the client <strong>{client?.name}</strong>?
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>No</Button>
                <Button onClick={onConfirm} color="error" variant="contained" autoFocus>
                    Yes
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteClientDialog;
