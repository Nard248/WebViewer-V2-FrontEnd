import { FC, useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControlLabel,
    Checkbox,
    Button
} from '@mui/material';
import { Client, ClientCreate } from '../../types';

interface Props {
    open: boolean;
    client: Client | null;
    onCancel: () => void;
    onSubmit: (id: number, data: ClientCreate) => void | Promise<void>;
}

const ClientUpsertDialog: FC<Props> = ({ open, client, onCancel, onSubmit }) => {
    const [formData, setFormData] = useState<ClientCreate>({
        name: '',
        contact_email: '',
        contact_phone: '',
        is_active: false,
    });

    useEffect(() => {
        if (client) {
            setFormData({
                name: client.name,
                contact_email: client.contact_email,
                contact_phone: client.contact_phone,
                is_active: client.is_active,
            });
        } else if (open){
            setFormData({
                name: '',
                contact_email: '',
                contact_phone: '',
                is_active: false,
            });
        }
    }, [client, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = () => {
        if (client) {
            onSubmit(client.id, formData);
        } else {
            onSubmit(0, formData);
        }
    };

    return (
        <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
            <DialogTitle>{client ? 'Edit Client' : 'Create Client'}</DialogTitle>
            <DialogContent>
                <TextField
                    sx={{ mb: 3.5 }}
                    margin="dense"
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    fullWidth
                />
                <TextField
                    sx={{ mb: 3.5 }}
                    margin="dense"
                    label="Email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    fullWidth
                />
                <TextField
                    sx={{ mb: 3.5 }}
                    margin="dense"
                    label="Phone"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    fullWidth
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={formData.is_active}
                            onChange={handleCheckboxChange}
                            name="is_active"
                        />
                    }
                    label="Active"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit} color="primary">
                    {client ? 'Update' : 'Create'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ClientUpsertDialog;
