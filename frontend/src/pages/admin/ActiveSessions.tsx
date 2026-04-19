import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import { Users, Monitor, MapPin, Clock, ExternalLink, ShieldCheck, Mail, Phone } from 'lucide-react';
import PremiumLoader from '../../components/ui/PremiumLoader';
import { useState } from 'react';

interface ActiveSession {
    _id: string;
    userId?: {
        name: string;
        email: string;
        phoneNumber?: string;
        profilePicture?: { imageUrl: string };
        role: string;
    };
    sessionId: string;
    ip: string;
    userAgent: string;
    currentPath: string;
    lastActive: string;
}

export default function ActiveSessions() {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: sessions, isLoading, isError } = useQuery({
        queryKey: ['admin', 'active-sessions'],
        queryFn: async () => {
            const res = await api.get('/admin/active-sessions');
            return res.data.data as ActiveSession[];
        },
        refetchInterval: 5000, // Refresh every 5 seconds for "live" feel
    });

    const maskIp = (ip: string) => {
        if (!ip) return 'Unknown';
        const parts = ip.split('.');
        if (parts.length === 4) {
            return `${parts[0]}.${parts[1]}.*.*`;
        }
        return ip;
    };


    const formatTimeAgo = (dateStr: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m ago`;
    };

    const filteredSessions = sessions?.filter(s => 
        (s.userId?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (s.userId?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (s.ip?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (s.currentPath?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif text-gray-900 dark:text-gray-100 font-bold">Live Traffic Monitor</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time view of active visitors and registered users</p>
                </div>
                <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-full border border-emerald-100 dark:border-emerald-800/30">
                    <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider">Live System Active</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Online</p>
                    <p className="text-3xl font-serif font-bold text-gray-900 dark:text-gray-100">{sessions?.length || 0}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Active Guests</p>
                    <p className="text-3xl font-serif font-bold text-gray-900 dark:text-gray-100">{sessions?.filter(s => !s.userId).length || 0}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Logged-in Users</p>
                    <p className="text-3xl font-serif font-bold text-gray-900 dark:text-gray-100">{sessions?.filter(s => s.userId).length || 0}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 dark:bg-gray-800/20">
                    <div className="relative flex-1 max-w-md">
                        <Monitor className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Filter by user, email, IP, or path..."
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full py-2.5 pl-11 pr-5 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all dark:text-gray-100"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/30 dark:bg-gray-800/30">
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Identified As</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Email / Phone</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Connection</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Current Page</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <PremiumLoader size="md" text="Syncing live data..." />
                                    </td>
                                </tr>
                            ) : isError ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-red-500 font-medium font-bold">
                                        Failed to sync live data
                                    </td>
                                </tr>
                            ) : filteredSessions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-medium uppercase tracking-widest text-xs font-bold">
                                        No active sessions found
                                    </td>
                                </tr>
                            ) : (
                                filteredSessions.map((session) => (
                                    <tr key={session._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center space-x-4">
                                                <div className={`h-10 w-10 min-w-[40px] rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${
                                                    session.userId ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                                                }`}>
                                                    {session.userId ? <Users className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate max-w-[150px]">
                                                        {session.userId?.name || 'Guest Visitor'}
                                                    </p>
                                                    <div className="flex items-center text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 uppercase tracking-tighter">
                                                        <ShieldCheck className={`h-3 w-3 mr-1 ${session.userId ? 'text-emerald-500' : 'text-gray-300'}`} />
                                                        <span>{session.userId ? (session.userId.role === 'admin' ? 'Admin' : 'Registered') : 'Public Guest'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            {session.userId ? (
                                                <div className="space-y-1">
                                                    <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-300 font-medium">
                                                        <Mail className="h-3 w-3 text-gray-400" />
                                                        <span>{session.userId.email}</span>
                                                    </div>
                                                    {session.userId.phoneNumber && (
                                                        <div className="flex items-center space-x-2 text-[10px] text-gray-400">
                                                            <Phone className="h-3 w-3 text-gray-400" />
                                                            <span>{session.userId.phoneNumber}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] italic text-gray-400 uppercase tracking-widest font-bold">Details Unavailable</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="space-y-1">
                                                <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 font-bold">
                                                    <MapPin className="h-3 w-3 text-gray-400" />
                                                    <span>{maskIp(session.ip)}</span>
                                                </div>
                                                <div className="flex items-center space-x-2 text-[10px] text-gray-400 italic">
                                                    <Clock className="h-2.5 w-2.5 mr-1" />
                                                    <span>{formatTimeAgo(session.lastActive)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-sm">
                                            <div className="flex items-center space-x-2">
                                                <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg font-mono text-gray-600 dark:text-gray-300 max-w-[150px] truncate" title={session.currentPath}>
                                                    {session.currentPath}
                                                </span>
                                                <a href={session.currentPath} target="_blank" rel="noreferrer" className="text-gray-300 hover:text-black dark:hover:text-white transition-colors">
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            {session.userId ? (
                                                <div className="flex items-center justify-end space-x-2">
                                                    <a
                                                        href={`mailto:${session.userId.email}`}
                                                        className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:rotate-12 transition-transform shadow-sm"
                                                        title="Send Email"
                                                    >
                                                        <Mail className="h-4 w-4" />
                                                    </a>
                                                    {session.userId.phoneNumber && (
                                                        <a
                                                            href={`tel:${session.userId.phoneNumber}`}
                                                            className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:rotate-12 transition-transform shadow-sm"
                                                            title="Call User"
                                                        >
                                                            <Phone className="h-4 w-4" />
                                                        </a>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end pr-4 text-gray-300" title="Contact info hidden for guests">
                                                    <ShieldCheck className="h-5 w-5 opacity-20" />
                                                </div>
                                            )}
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
