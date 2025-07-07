import { FC } from 'react';
import {
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	IconButton,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faUsers, faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import { Client } from '../../types';

interface Props {
	clients: Client[];
	sortConfig: { key: keyof Client; direction: 'asc' | 'desc' } | null;
	onSort: (key: keyof Client) => void;
	onEdit: (id: number) => void;
	onDelete: (client: Client) => void;
}

const ClientsTable: FC<Props> = ({ clients, sortConfig, onSort, onEdit, onDelete }) => {
	return (
		<TableContainer component={Paper}>
			<Table>
				<TableHead>
					<TableRow>
						<TableCell
							onClick={() => onSort('name')}
							style={{ cursor: 'pointer' }}
						>
							Name&nbsp;
							<FontAwesomeIcon
								icon={
									sortConfig?.key === 'name'
										? sortConfig.direction === 'asc'
											? faSortUp
											: faSortDown
										: faSort
								}
								style={{ fontSize: '0.85rem' }}
							/>
						</TableCell>
						<TableCell>Email</TableCell>
						<TableCell>Phone</TableCell>
						<TableCell>Status</TableCell>
						<TableCell>Users</TableCell>
						<TableCell>Actions</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{clients.map((client) => (
						<TableRow key={client.id}>
							<TableCell>{client.name}</TableCell>
							<TableCell>{client.contact_email}</TableCell>
							<TableCell>{client.contact_phone}</TableCell>
							<TableCell>{client.is_active ? 'Active' : 'Inactive'}</TableCell>
							<TableCell>{client.user_count}</TableCell>
							<TableCell>
								<IconButton onClick={() => {}} aria-label="users" title='View Users'>
									<FontAwesomeIcon icon={faUsers} />
								</IconButton>
								<IconButton onClick={() => onEdit(client.id)} aria-label="edit" title='Edit Client'>
									<FontAwesomeIcon icon={faEdit} />
								</IconButton>
								<IconButton onClick={() => onDelete(client)} aria-label="delete" color="error" title='Delete Client'>
									<FontAwesomeIcon icon={faTrashAlt} />
								</IconButton>
							</TableCell>
						</TableRow>
					))}
					{clients.length === 0 && (
						<TableRow>
							<TableCell colSpan={6} align="center">
								No clients found.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</TableContainer>
	);
};

export default ClientsTable;
