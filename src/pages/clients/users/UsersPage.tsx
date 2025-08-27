import { FC, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Button, Typography, CircularProgress, IconButton } from "@mui/material";
import { Add as AddIcon, ArrowBack as ArrowBackIcon } from "@mui/icons-material";

import { getClientUsers, getClient } from "../../../services/clientService";
import { deleteClientUser, createClientUser, updateClientUser } from "../../../services/clientService";
import UsersTable from "./UsersTable";
import { User } from "../../../types";
import { UserCreate, UserUpdate } from "../../../types/client-users.types";

import DeleteUserDialog from "./UserDeleteDialog";
import UserUpsertDialog from "./UserUpsertDialog";

const UsersPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [clientName, setClientName] = useState<string>(""); 
  const [loading, setLoading] = useState(true);

  // Delete state
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Edit state
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  // Create state
  const [openCreateDialog, setOpenCreateDialog] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([getClient(Number(id)), getClientUsers(Number(id))])
      .then(([client, users]) => {
        setClientName(client.name);
        setUsers(users);
      })
      .catch((err) => console.error("Error fetching client or users:", err))
      .finally(() => setLoading(false));
  }, [id]);

  // Delete handlers
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete || !id) return;
    try {
      await deleteClientUser(+id, userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete user.");
    } finally {
      setOpenDeleteDialog(false);
      setUserToDelete(null);
    }
  };

  // Edit handlers
  const handleEditUser = (id: number) => {
    const user = users.find((u) => u.id === id);
    if (user) {
      setUserToEdit(user);
      setOpenEditDialog(true);
    }
  };

  const handleUpdateUser = async (userId: number | null, data: UserUpdate) => {
    if (!id || !userId) return;
    try {
      const updated = await updateClientUser(+id, userId, data);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updated } : u)));
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update user.");
    } finally {
      setOpenEditDialog(false);
      setUserToEdit(null);
    }
  };

  // Create handlers
  const handleCreateUser = () => {
    setOpenCreateDialog(true);
  };

  const handleCreateUserSubmit = (_: number | null, data: UserCreate | UserUpdate): void => {
    if (!id) return;
    if (!data.password) {
      alert("Password is required for new users.");
      return;
    }
  
    createClientUser(+id, data as UserCreate)
      .then((newUser) => setUsers((prev) => [...prev, newUser]))
      .catch((err: any) => {
        console.error("Create failed:", err);
        const msg = err.response?.data?.error || "Failed to create user.";
        alert(msg);
      })
      .finally(() => setOpenCreateDialog(false));
  };  

  return (
    <Box>
      {/* Header with Back Button */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(`/clients`)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
         {clientName && <Typography variant="h4">{ `Users for ${clientName}`}</Typography>}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateUser}
          sx={{ ml: 'auto' }}
        >
          Create User
        </Button>
      </Box>

      {/* Users Table */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <UsersTable
          users={users}
          onEdit={handleEditUser}
          onDelete={handleDeleteClick}
        />
      )}

      {/* Delete Dialog */}
      <DeleteUserDialog
        open={openDeleteDialog}
        user={userToDelete}
        onCancel={() => setOpenDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
      />

      {/* Edit Dialog */}
      <UserUpsertDialog
        open={openEditDialog}
        user={userToEdit}
        onCancel={() => setOpenEditDialog(false)}
        onSubmit={handleUpdateUser}
      />

      {/* Create Dialog */}
      <UserUpsertDialog
        open={openCreateDialog}
        user={null}
        onCancel={() => setOpenCreateDialog(false)}
        onSubmit={handleCreateUserSubmit}
      />
    </Box>
  );
};

export default UsersPage;
