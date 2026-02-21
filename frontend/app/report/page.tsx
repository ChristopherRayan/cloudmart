'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api, { apiGet } from '@/lib/api';
import toast from 'react-hot-toast';

interface Report {
    id: number;
    subject: string;
    description: string;
    file_path: string | null;
    status: 'pending' | 'resolved' | 'closed';
    created_at: string;
}

export default function ReportPage() {
    const [loading, setLoading] = useState(false);
    const [reportsLoading, setReportsLoading] = useState(true);
    const [reports, setReports] = useState<Report[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
    });
    const router = useRouter();

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const response = await apiGet('/reports', { cacheTtlMs: 15000 });
            setReports(response.data.data);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setReportsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        data.append('subject', formData.subject);
        data.append('description', formData.description);
        if (file) {
            data.append('file', file);
        }

        try {
            const response = await api.post('/reports', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (response.data.status === 'success') {
                toast.success('Report submitted successfully!');
                setFormData({ subject: '', description: '' });
                setFile(null);
                fetchReports();
            }
        } catch (error) {
            toast.error('Failed to submit report. Please try again.');
        } finally {
            setLoading(false);
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

    return (
        <div className="min-h-screen flex flex-col bg-dark-950">
            <Header />

            <main className="flex-grow container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto space-y-12">
                    {/* Submit Section */}
                    <div className="max-w-2xl mx-auto text-center">
                        <h1 className="text-3xl font-bold mb-2 gradient-text">Report an Issue</h1>
                        <p className="text-dark-400 mb-8">
                            Experiencing problems with an order or the app? Let us know and we'll help you out.
                        </p>

                        <div className="card p-8 text-left">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-dark-400 uppercase tracking-wider mb-2">Subject</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="Brief summary of the issue"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-dark-400 uppercase tracking-wider mb-2">Detailed Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={4}
                                        className="input-field resize-none"
                                        placeholder="Please provide as much detail as possible..."
                                        required
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-dark-400 uppercase tracking-wider mb-2">Attachment (Optional)</label>
                                    <div className="mt-2 flex items-center gap-4">
                                        <label className="flex items-center gap-2 px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg cursor-pointer hover:bg-dark-700 transition-colors group">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-dark-400 group-hover:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                            </svg>
                                            <span className="text-sm text-dark-300">{file ? file.name : 'Attach a file or image'}</span>
                                            <input type="file" className="hidden" onChange={handleFileChange} />
                                        </label>
                                        {file && (
                                            <button
                                                type="button"
                                                onClick={() => setFile(null)}
                                                className="text-xs text-red-500 hover:underline"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-dark-500 mt-2 italic">
                                        Max 10MB. Images, PDF, Logs.
                                    </p>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Submitting...</span>
                                            </>
                                        ) : (
                                            'Submit Report'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* History Section */}
                    <div className="pt-8 border-t border-dark-800">
                        <h2 className="text-2xl font-bold mb-6 text-dark-100">My Previous Reports</h2>

                        {reportsLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500"></div>
                            </div>
                        ) : reports.length === 0 ? (
                            <div className="card p-12 text-center text-dark-500 italic text-sm">
                                You haven't submitted any reports yet.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {reports.map((report) => (
                                    <div key={report.id} className="card p-6 hover:border-dark-600 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-dark-100">{report.subject}</h3>
                                                <p className="text-xs text-dark-500 mt-1">
                                                    Submitted on {new Date(report.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border uppercase tracking-wider ${getStatusColor(report.status)}`}>
                                                {report.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-dark-400 line-clamp-2 mb-4 leading-relaxed">
                                            {report.description}
                                        </p>

                                        {report.file_path && (
                                            <div className="pt-4 border-t border-dark-800 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {/\.(jpg|jpeg|png|gif|webp)$/i.test(report.file_path) && (
                                                        <div className="w-10 h-10 rounded bg-dark-800 overflow-hidden border border-dark-700">
                                                            <img
                                                                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost'}/storage/${report.file_path}`}
                                                                alt="Thumbnail"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                    <span className="text-xs text-dark-300">Attachment: {report.file_path.split('/').pop()}</span>
                                                </div>
                                                <a
                                                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost'}/storage/${report.file_path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-primary-500 hover:text-primary-400 font-bold uppercase tracking-wider"
                                                >
                                                    View / Download
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
