import * as React from 'react';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    Users,
    UserPlus,
    Shield,
    Mail,
    MoreVertical,
    Edit2,
    Trash2,
    CheckCircle2,
    XCircle,
    Loader2
} from 'lucide-react';
import UserModal from '../components/UserModal';

interface UserRecord {
    id: number;
    username: string;
    email: string;
    role: string;
    is_active: boolean;
}

const UserManagementPage: React.FC = () => {
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserRecord | undefined>();

    const fetchUsers = async () => {
        try {
            const response = await api.get('/v1/users/');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEdit = (user: UserRecord) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedUser(undefined);
        setIsModalOpen(true);
    };

    const getRoleBadge = (role: string) => {
        const styles: any = {
            'ADMIN': 'bg-purple-100 text-purple-700 border-purple-200',
            'HR': 'bg-blue-100 text-blue-700 border-blue-200',
            'FINANCE': 'bg-amber-100 text-amber-700 border-amber-200',
            'MANAGER': 'bg-slate-100 text-slate-700 border-slate-200',
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${styles[role] || styles.MANAGER}`}>
                {role}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">System Users</h1>
                    <p className="text-slate-500 text-sm">Manage staff accounts and system access levels</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-primary-900/20 transition-all text-sm font-semibold"
                >
                    <UserPlus size={18} />
                    Add New User
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                            <Loader2 className="animate-spin mb-2" size={32} />
                            <span>Loading user accounts...</span>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">User Details</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                                    {u.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">{u.username}</p>
                                                    <p className="text-xs text-slate-500">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getRoleBadge(u.role)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {u.is_active ? (
                                                <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                                                    <CheckCircle2 size={14} />
                                                    Active
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                                                    <XCircle size={14} />
                                                    Inactive
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(u)}
                                                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                                    title="Edit User"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <UserModal
                isOpen={isModalOpen}
                user={selectedUser}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchUsers}
            />
        </div>
    );
};

export default UserManagementPage;
