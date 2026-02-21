'use client';

import { useState, useEffect } from 'react';
import api, { apiGet } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface Report {
    id: number;
    user_id: number;
    subject: string;
    description: string;
    file_path: string | null;
    status: 'pending' | 'resolved' | 'closed';
    created_at: string;
    user: {
        name: string;
        email: string;
    };
}

export default function AdminReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await apiGet('/reports', { cacheTtlMs: 15000 });
            setReports(res.data.data.data);
        } catch (error) {
            toast.error('Failed to fetch reports');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: number, status: string) => {
        try {
            await api.patch(`/reports/${id}/status`, { status });
            toast.success(`Report marked as ${status}`);
            setReports(reports.map(r => r.id === id ? { ...r, status: status as any } : r));
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'resolved': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'closed': return 'bg-dark-700 text-dark-400 border-dark-600';
            default: return '';
        }
    };

    if (loading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-dark-100">Customer Reports</h1>

            <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-dark-900/50 border-b border-dark-800">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-dark-400 uppercase">User</th>
                                <th className="px-6 py-4 text-xs font-semibold text-dark-400 uppercase">Issue</th>
                                <th className="px-6 py-4 text-xs font-semibold text-dark-400 uppercase">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-dark-400 uppercase">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-dark-400 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-800">
                            {reports.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-dark-500 uppercase text-sm tracking-widest">
                                        No reports found
                                    </td>
                                </tr>
                            ) : (
                                reports.map((report) => (
                                    <tr key={report.id} className="hover:bg-dark-900/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-dark-200">{report.user.name}</div>
                                            <div className="text-xs text-dark-500">{report.user.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-dark-200 font-semibold">{report.subject}</div>
                                            <div className="text-xs text-dark-400 mb-2 truncate max-w-xs">{report.description}</div>
                                            {report.file_path && (
                                                <a
                                                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost'}/storage/${report.file_path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center text-xs text-primary-500 hover:text-primary-400"
                                                >
                                                    View Attachment 📎
                                                </a>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-[10px] font-bold rounded-full border uppercase tracking-wider ${getStatusColor(report.status)}`}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-dark-400">
                                            {new Date(report.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <select
                                                value={report.status}
                                                onChange={(e) => handleStatusUpdate(report.id, e.target.value)}
                                                className="bg-dark-800 border-dark-700 text-xs text-dark-200 rounded p-1 focus:ring-1 focus:ring-primary-500"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="resolved">Resolved</option>
                                                <option value="closed">Closed</option>
                                            </select>
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
