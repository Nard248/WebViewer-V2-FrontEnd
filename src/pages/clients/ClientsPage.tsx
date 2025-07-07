import { FC, useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

import { getClients, deleteClient, updateClient, createClient } from '../../services/clientService';
import ClientsTable from './ClientsTable';
import DeleteClientDialog from './DeleteClientDialog';
import ClientUpsertDialog from './ClientUpsertDialog';
import { Client, ClientCreate, ClientUpdate } from '../../types';

const ClientsPage: FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Client; direction: 'asc' | 'desc' } | null>(null);

    // Delete state
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

    // Edit state
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

    const [openCreateDialog, setOpenCreateDialog] = useState(false);

    useEffect(() => {
        getClients()
            .then((res) => setClients(res.results))
            .catch((err) => console.error('Error fetching clients:', err));
    }, []);

    const handleSort = (key: keyof Client) => {
        setSortConfig((prev) =>
            prev?.key === key
                ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                : { key, direction: 'asc' }
        );
    };

    const sortedClients = [...clients].sort((a, b) => {
        if (!sortConfig) return 0;
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        return typeof aVal === 'string' && typeof bVal === 'string'
            ? sortConfig.direction === 'asc'
                ? aVal.localeCompare(bVal)
                : bVal.localeCompare(aVal)
            : 0;
    });

    const handleCreateClient = () => {
        setOpenCreateDialog(true);
    };


    const handleDeleteClick = (client: Client) => {
        setClientToDelete(client);
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!clientToDelete) return;
        try {
            await deleteClient(clientToDelete.id);
            setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete client.');
        } finally {
            setOpenDeleteDialog(false);
            setClientToDelete(null);
        }
    };

    const handleEditClient = (id: number) => {
        const client = clients.find((c) => c.id === id);
        if (client) {
            setClientToEdit(client);
            setOpenEditDialog(true);
        }
    };

    const handleUpdateClient = async (id: number, data: ClientUpdate) => {
        try {
            const updated = await updateClient(id, data);
            setClients((prev) =>
                prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
            );
        } catch (err) {
            console.error('Update failed:', err);
            alert('Failed to update client.');
        } finally {
            setOpenEditDialog(false);
            setClientToEdit(null);
        }
    };

    const handleCreateClientSubmit = async (_: number, data: ClientCreate) => {
    try {
        const newClient = await createClient(data);
        setClients((prev) => [...prev, newClient]);
    } catch (err) {
        console.error('Create failed:', err);
        alert('Failed to create client.');
    } finally {
        setOpenCreateDialog(false);
    }
};

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Clients</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateClient}
                >
                    Create Client
                </Button>
            </Box>

            <ClientsTable
                clients={sortedClients}
                sortConfig={sortConfig}
                onSort={handleSort}
                onEdit={handleEditClient}
                onDelete={handleDeleteClick}
            />

            <DeleteClientDialog
                open={openDeleteDialog}
                client={clientToDelete}
                onCancel={() => setOpenDeleteDialog(false)}
                onConfirm={handleConfirmDelete}
            />

            <ClientUpsertDialog
                open={openEditDialog}
                client={clientToEdit}
                onCancel={() => setOpenEditDialog(false)}
                onSubmit={handleUpdateClient}
            />

            <ClientUpsertDialog
                open={openCreateDialog}
                client={null}
                onCancel={() => setOpenCreateDialog(false)}
                onSubmit={handleCreateClientSubmit}
            />
        </Box>
    );
};

export default ClientsPage;
