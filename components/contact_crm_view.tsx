
import React, { useMemo } from 'react';
import { FileText, IndianRupee, Building2, User as UserIcon, AlertCircle, ArrowLeft } from 'lucide-react';
import type { Contact, CrmLead, User } from '../types';

interface ContactCrmViewProps {
    contact: Contact;
    leads: CrmLead[];
    onNavigateBack: () => void;
    user: User;
}

const ContactCrmView: React.FC<ContactCrmViewProps> = ({ contact, leads, onNavigateBack, user }) => {
    // Filter leads associated with this contact
    // Matching by Email (precise) or Name (fallback)
    const associatedLeads = useMemo(() => {
        return leads.filter(lead => {
            const emailMatch = contact.email && lead.email && lead.email.toLowerCase() === contact.email.toLowerCase();
            const nameMatch = lead.contact && lead.contact.toLowerCase() === contact.name.toLowerCase();
            return emailMatch || nameMatch;
        });
    }, [contact, leads]);

    const associatedQuotations = useMemo(() => {
        return associatedLeads.flatMap(lead => lead.quotations || []);
    }, [associatedLeads]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm w-full mx-auto animate-fade-in p-6">
            <div className="flex items-center mb-6">
                <button
                    onClick={onNavigateBack}
                    className="mr-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">CRM History: {contact.name}</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Leads Section */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                        <UserIcon className="mr-2 text-lyceum-blue" size={20} />
                        Associated Leads ({associatedLeads.length})
                    </h2>

                    {associatedLeads.length === 0 ? (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 text-center border border-dashed border-gray-300 dark:border-gray-600">
                            <p className="text-gray-500 dark:text-gray-400">No leads found for this contact.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {associatedLeads.map(lead => (
                                <div key={lead.id} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-gray-900 dark:text-gray-100">{lead.title}</h3>
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full 
                                            ${lead.stage === 'Won' ? 'bg-green-100 text-green-800' :
                                                lead.stage === 'Lost' ? 'bg-red-100 text-red-800' :
                                                    'bg-blue-100 text-blue-800'}`}>
                                            {lead.stage}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                        <div className="flex items-center gap-2">
                                            <Building2 size={14} />
                                            <span>{lead.company}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-medium pt-2 border-t border-gray-100 dark:border-gray-600 mt-2">
                                        <div className="text-green-600 dark:text-green-400 flex items-center">
                                            <IndianRupee size={14} className="mr-1" />
                                            {lead.value.toLocaleString('en-IN')}
                                        </div>
                                        {lead.assignedTo && <span className="text-xs text-gray-500">Agent: {lead.assignedTo}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quotations Section */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                        <FileText className="mr-2 text-lyceum-blue" size={20} />
                        Quotations ({associatedQuotations.length})
                    </h2>

                    {associatedQuotations.length === 0 ? (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 text-center border border-dashed border-gray-300 dark:border-gray-600">
                            <p className="text-gray-500 dark:text-gray-400">No quotations found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {associatedQuotations.map((quote, idx) => (
                                <div key={quote.id || idx} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="text-xs font-bold text-lyceum-blue block mb-0.5">
                                                {quote.quotationNumber || `#${quote.id}`}
                                            </span>
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{quote.title}</h3>
                                        </div>
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full 
                                            ${quote.status === 'Agreed' ? 'bg-green-100 text-green-800' :
                                                quote.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                                                    'bg-yellow-100 text-yellow-800'}`}>
                                            {quote.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-medium pt-2 border-t border-gray-100 dark:border-gray-600 mt-2">
                                        <div className="text-gray-500 dark:text-gray-400 text-xs">
                                            {new Date(quote.date).toLocaleDateString()}
                                        </div>
                                        <div className="text-gray-900 dark:text-white flex items-center font-bold">
                                            <IndianRupee size={14} className="mr-1" />
                                            {quote.total.toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default ContactCrmView;
