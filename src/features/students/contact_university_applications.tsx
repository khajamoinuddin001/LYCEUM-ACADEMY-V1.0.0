import React from 'react';
import { Contact } from '@/types';
import { GraduationCap, School, Calendar, CheckCircle2, ClipboardList } from 'lucide-react';

interface ContactUniversityApplicationsViewProps {
    contact: Contact;
}

const ContactUniversityApplicationsView: React.FC<ContactUniversityApplicationsViewProps> = ({ contact }) => {
    // Only display universities that actually have a name filled in.
    const applications = (contact.visaInformation?.universityApplication?.universities || []).filter(u => u.universityName);

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'Shortlisted': 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
            'Applied': 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
            'In Review': 'bg-violet-100 text-violet-600 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
            'Offer Received': 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
            'Rejected': 'bg-red-100 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
        };
        return colors[status] || colors['Shortlisted'];
    };

    if (applications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800/20 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
                    <ClipboardList size={28} className="text-gray-300 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-1">No Applications Found</h3>
                <p className="text-sm text-gray-400 text-center max-w-sm">
                    This contact has not applied to any universities yet, or the data has not been recorded.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#1a1d24] rounded-2xl border border-gray-100 dark:border-gray-800/60 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-[#1e2330]/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-lyceum-blue/10 text-lyceum-blue flex items-center justify-center shrink-0">
                    <GraduationCap size={20} />
                </div>
                <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">University Applications</h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Tracking {applications.length} applied programs</p>
                </div>
            </div>

            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[700px]">
                    <thead>
                        <tr className="bg-gray-50/50 dark:bg-[#1e2330]/50 border-b border-gray-100 dark:border-gray-800/60 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                            <th className="px-6 py-4 font-extrabold w-48">ACK Number</th>
                            <th className="px-6 py-4 font-extrabold flex-1">University & Course</th>
                            <th className="px-6 py-4 font-extrabold w-40">Submission Date</th>
                            <th className="px-6 py-4 font-extrabold w-36">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/40">
                        {applications.map((app, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4">
                                    {app.ackNumber ? (
                                        <span className="font-extrabold text-xs tracking-widest text-lyceum-blue uppercase">
                                            {app.ackNumber}
                                        </span>
                                    ) : (
                                        <span className="text-gray-300 dark:text-gray-600 text-xs">-</span>
                                    )}
                                </td>

                                <td className="px-6 py-4">
                                    <div className="flex flex-col min-w-0 max-w-[300px]">
                                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate" title={app.universityName}>
                                            {app.universityName}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 truncate mt-0.5">
                                            <School size={10} className="shrink-0" />
                                            <span className="truncate" title={app.course}>{app.course || 'Bachelors'}</span>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
                                        <Calendar size={12} className="text-gray-400" />
                                        {app.applicationSubmissionDate ? new Date(app.applicationSubmissionDate).toLocaleDateString() : 'N/A'}
                                    </div>
                                </td>

                                <td className="px-6 py-4">
                                    <div className={`inline-flex px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${getStatusColor(app.status || 'Shortlisted')} items-center gap-1.5`}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0" />
                                        {app.status || 'Shortlisted'}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ContactUniversityApplicationsView;
