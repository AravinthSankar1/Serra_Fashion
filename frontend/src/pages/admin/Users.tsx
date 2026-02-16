import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import type { User, UserRole } from '../../types';
import { Search, Trash2, ShieldCheck, Mail, Phone, Calendar } from 'lucide-react';
import PremiumLoader from '../../components/ui/PremiumLoader';
import { useState } from 'react';
import { toast } from 'react-toastify';

export default function AdminUsers() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['admin', 'users'],
        queryFn: async () => {
            const res = await api.get('/users');
            return res.data.data as User[];
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string, updates: Partial<User> }) => {
            await api.put(`/users/${id}`, updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            toast.success('User updated successfully');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to update user');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            if (!window.confirm('Are you sure you want to remove this user? This action cannot be undone.')) return;
            await api.delete(`/users/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            toast.success('User removed successfully');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to remove user');
        }
    });

    const filteredUsers = Array.isArray(data) ? data.filter(user =>
        (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    ) : [];

    const handleRoleChange = (id: string, newRole: UserRole) => {
        updateMutation.mutate({ id, updates: { role: newRole } });
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif text-gray-900">User Management</h1>
                    <p className="text-gray-500 mt-1">Monitor accounts, roles, and platform permissions</p>
                </div>
                <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Secure Access Control</span>
                </div>
            </div>

            <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full bg-white border border-gray-200 rounded-full py-2.5 pl-11 pr-5 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/30">
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">User Identity</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Contact</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Platform Role</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <PremiumLoader size="md" text="Syncing user database..." />
                                    </td>
                                </tr>
                            ) : isError ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-red-500 font-medium">
                                        Failed to load users: {(error as any)?.message || 'Unknown error'}
                                    </td>
                                </tr>
                            ) : filteredUsers?.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-gray-400 font-medium">
                                        No users matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers?.map((u) => (
                                    <tr key={u._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center space-x-4">
                                                <div className="h-10 w-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">
                                                    {(u.name?.[0] || 'U').toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{u.name || 'Anonymous User'}</p>
                                                    <div className="flex items-center text-[10px] text-gray-400 mt-0.5">
                                                        <Calendar className="h-3 w-3 mr-1" />
                                                        <span>{u.createdAt ? `Member Since ${new Date(u.createdAt).toLocaleDateString()}` : 'Member'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="space-y-1">
                                                <div className="flex items-center space-x-2 text-xs text-gray-600">
                                                    <Mail className="h-3 w-3" />
                                                    <span>{u.email}</span>
                                                </div>
                                                {u.phoneNumber && (
                                                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                                                        <Phone className="h-3 w-3" />
                                                        <span>{u.phoneNumber}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <select
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(u._id, e.target.value as UserRole)}
                                                className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest border-none focus:ring-2 focus:ring-black/5 cursor-pointer transition-all ${u.role === 'admin' || u.role === 'super_admin' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
                                                    }`}
                                            >
                                                <option value="customer">Customer</option>
                                                <option value="vendor">Vendor</option>
                                                <option value="admin">Admin</option>
                                                <option value="super_admin">Super Admin</option>
                                            </select>
                                        </td>
                                        <td className="px-8 py-5 text-right space-x-2">
                                            <button
                                                onClick={() => deleteMutation.mutate(u._id)}
                                                disabled={u.role === 'super_admin'}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
