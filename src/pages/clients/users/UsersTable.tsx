// src/pages/users/UsersTable.tsx
import { FC, useState } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrashAlt,
  faSort,
  faSortUp,
  faSortDown,
} from "@fortawesome/free-solid-svg-icons";
import { User } from "../../../types";
import { formatDistanceToNow } from "date-fns";

interface Props {
  users: User[];
  onEdit: (id: number) => void;
  onDelete: (user: User) => void;
}

const UsersTable: FC<Props> = ({ users, onEdit, onDelete }) => {
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  const handleSort = () => {
    setOrder(order === "asc" ? "desc" : "asc");
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (typeof a.username === "string" && typeof b.username === "string") {
      return order === "asc"
        ? a.username.localeCompare(b.username)
        : b.username.localeCompare(a.username);
    }
    return 0;
  });

  const formatLastLogin = (lastLogin?: string | null) => {
    if (!lastLogin) return "Never";
    return formatDistanceToNow(new Date(lastLogin), { addSuffix: true });
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell onClick={handleSort} style={{ cursor: "pointer" }}>
              Username&nbsp;
              <FontAwesomeIcon
                icon={order === "asc" ? faSortUp : faSortDown}
                style={{ fontSize: "0.85rem" }}
              />
            </TableCell>
            <TableCell>Full Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Active</TableCell>
            <TableCell>Last Login</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedUsers.map((user, index) => (
            <TableRow
              key={user.id}
              sx={{
                backgroundColor: index % 2 === 0 ? "#ffffff" : "#f5f5f5", // white / light gray
              }}
            >
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.full_name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.is_active ? "Yes" : "No"}</TableCell>
              <TableCell>{formatLastLogin(user.last_login)}</TableCell>
              <TableCell>
                <IconButton
                  onClick={() => onEdit(user.id)}
                  aria-label="edit"
                  title="Edit User"
                >
                  <FontAwesomeIcon icon={faEdit} />
                </IconButton>
                <IconButton
                  onClick={() => onDelete(user)}
                  aria-label="delete"
                  color="error"
                  title="Delete User"
                >
                  <FontAwesomeIcon icon={faTrashAlt} />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center">
                No users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default UsersTable;
