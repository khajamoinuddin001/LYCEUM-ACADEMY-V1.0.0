import React, { useMemo, useState, useEffect } from 'react';
import { FileText, IndianRupee, Building2, User as UserIcon, AlertCircle, ArrowLeft, Plus, Calendar, CheckCircle2, Phone, Mail, File, PenTool, LayoutDashboard, Clock, History, MoreVertical, TrendingUp, CheckSquare, Trash2 } from 'lucide-react';
import type { Contact, CrmLead, User, TodoTask, ActivityType, Quotation, QuotationTemplate } from '@/types';
import ActivityModal from '@/features/shared/activity_modal';
import NewQuotationPage from '@/features/finance/new_quotation_modal';
import * as api from '@/utils/api';

interface ContactCrmViewProps {
    contact: Contact;
    leads: CrmLead[];
    onNavigateBack: () => void;
    user: User;
    tasks?: TodoTask[];
    onSaveTask?: (task: Partial<TodoTask>) => Promise<void>;
    onSaveQuotation?: (leadId: number, quotation: Omit<Quotation, 'id' | 'status' | 'date'> | Quotation) => void;
    quotationTemplates?: QuotationTemplate[];
    onSaveTemplate?: (template: QuotationTemplate) => void;
    onDeleteTemplate?: (templateId: number) => void;
    onDeleteContact?: (contactId: number) => void;
    onApproveQuotation?: (leadId: number, quotationId: number) => Promise<void>;
    onManualAcceptQuotation?: (leadId: number, quotationId: number) => Promise<void>;
}

const ContactCrmView: React.FC<ContactCrmViewProps> = ({ contact, leads, onNavigateBack, user, tasks = [], onSaveTask, onSaveQuotation, quotationTemplates = [], onSaveTemplate, onDeleteTemplate, onDeleteContact, onApproveQuotation, onManualAcceptQuotation, onDeleteQuotation }) => {
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<TodoTask | null>(null);
    const [quotationViewMode, setQuotationViewMode] = useState<'list' | 'create' | 'edit'>('list');
    const [selectedLeadForQuote, setSelectedLeadForQuote] = useState<CrmLead | null>(null);
    const [quotationToEdit, setQuotationToEdit] = useState<Quotation | null>(null);

    // Local state for tasks to ensure we see EVERYTHING for this contact
    const [crmTasks, setCrmTasks] = useState<TodoTask[]>(tasks);

    useEffect(() => {
        let isMounted = true;
        const fetchContactTasks = async () => {
            try {
                // Fetch ALL tasks for this contact, ignoring user assignment
                const tasks = await api.getTasks({ contactId: contact.id });
                if (isMounted) setCrmTasks(tasks);
            } catch (error) {
                console.error("Failed to fetch contact tasks", error);
            }
        };
        fetchContactTasks();
        return () => { isMounted = false; };
    }, [contact.id]);

    // Filter leads
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

    // Filter Scheduled Activities (Open Tasks) & History (Completed Tasks)
    const scheduledActivities = useMemo(() => {
        return crmTasks.filter(t => t.contactId === contact.id && t.status !== 'done').sort((a, b) => new Date(a.dueDate || '').getTime() - new Date(b.dueDate || '').getTime());
    }, [crmTasks, contact.id]);

    const activityHistory = useMemo(() => {
        return crmTasks.filter(t => t.contactId === contact.id && t.status === 'done').sort((a, b) => new Date(b.completedAt || b.createdAt || '').getTime() - new Date(a.completedAt || a.createdAt || '').getTime());
    }, [crmTasks, contact.id]);

    // Calculate Statistics
    const totalPipelineValue = associatedLeads.reduce((sum, lead) => sum + lead.value, 0);
    const activeLeadsCount = associatedLeads.filter(l => l.stage !== 'Lost').length;
    const completedTasksCount = activityHistory.length;

    const getActivityIcon = (type?: ActivityType) => {
        switch (type) {
            case 'Call': return <Phone size={14} />;
            case 'Meeting': return <UserIcon size={14} />; // Using UserIcon as generic meeting/person icon
            case 'Email': return <Mail size={14} />;
            case 'Upload Document': return <File size={14} />;
            case 'Request Signature': return <PenTool size={14} />;
            default: return <CheckCircle2 size={14} />;
        }
    };

    const handleSaveActivity = async (taskData: Partial<TodoTask>) => {
        if (onSaveTask) {
            await onSaveTask({ ...taskData, contactId: contact.id });
            // Refresh local list
            const updatedTasks = await api.getTasks({ contactId: contact.id });
            setCrmTasks(updatedTasks);
        }
        setIsActivityModalOpen(false);
        setEditingTask(null);
    };

    const handleEditActivity = (task: TodoTask) => {
        setEditingTask(task);
        setIsActivityModalOpen(true);
    };

    const handleNewQuotationClick = () => {
        if (associatedLeads.length === 0) {
            alert('This contact has no leads. Please create a lead first.');
            return;
        }
        // Default to the first associated lead (or latest if sorted)
        // Ideally we should prompt if there are multiple, but for now we pick the latest one (highest ID assuming auto-increment or created order)
        const latestLead = [...associatedLeads].sort((a, b) => b.id - a.id)[0];
        setSelectedLeadForQuote(latestLead);
        setQuotationViewMode('create');
        setQuotationToEdit(null);
    };

    const handleEditQuotation = (quote: Quotation) => {
        const lead = associatedLeads.find(l => l.quotations?.some(q => q.id === quote.id));
        if (lead) {
            setSelectedLeadForQuote(lead);
            setQuotationToEdit(quote);
            setQuotationViewMode('edit');
        }
    };

    if (quotationViewMode !== 'list' && selectedLeadForQuote && onSaveQuotation) {
        return (
            <NewQuotationPage
                lead={selectedLeadForQuote}
                user={user}
                onCancel={() => setQuotationViewMode('list')}
                onSave={(data) => {
                    onSaveQuotation(selectedLeadForQuote.id, data);
                    setQuotationViewMode('list');
                }}
                templates={quotationTemplates}
                quotationToEdit={quotationToEdit}
                onSaveTemplate={onSaveTemplate || (() => { })}
                onDeleteTemplate={onDeleteTemplate || (() => { })}
            />
        );
    }

    return (
        <div className="bg-gray-50/50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-7xl mx-auto p-6 space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onNavigateBack}
                            className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all hover:scale-105"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                CRM Overview <span className="text-gray-400 font-normal hidden sm:inline">|</span> <span className="text-lyceum-blue">{contact.name}</span>
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                                <LayoutDashboard size={14} /> Comprehensive 360° View
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">

                        <button
                            onClick={() => setIsActivityModalOpen(true)}
                            className="px-5 py-2.5 bg-gradient-to-r from-lyceum-blue to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-105 transition-all flex items-center gap-2"
                        >
                            <Plus size={18} /> Schedule Activity
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 transition-all hover:shadow-md">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Scheduled Activities</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{scheduledActivities.length}</h3>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 transition-all hover:shadow-md">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl">
                            <CheckSquare size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Tasks</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{completedTasksCount}</h3>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 transition-all hover:shadow-md">
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Leads</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{activeLeadsCount}</h3>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 transition-all hover:shadow-md">
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pipeline Value</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                                <IndianRupee size={18} /> {totalPipelineValue.toLocaleString('en-IN')}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left Column: Activity Timeline (Takes 2 columns on large screens) */}
                    <div className="xl:col-span-2 space-y-6">

                        {/* Up Next / Scheduled Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                    <Calendar className="text-blue-500" size={20} /> Up Next
                                </h2>
                            </div>
                            <div className="p-5">
                                {scheduledActivities.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                            <Calendar size={32} className="text-gray-400" />
                                        </div>
                                        <p className="text-gray-500 dark:text-gray-400 font-medium">No scheduled activities</p>
                                        <p className="text-xs text-gray-400 mt-1">Schedule a call, meeting, or task to get started.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {scheduledActivities.map(activity => (
                                            <div key={activity.id} className="group flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 hover:border-lyceum-blue dark:hover:border-lyceum-blue hover:shadow-md transition-all">
                                                <div className={`mt-1 p-2 rounded-lg 
                                                    ${activity.activityType === 'Call' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                                        activity.activityType === 'Meeting' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                                                            activity.activityType === 'Email' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                                'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'}`}>
                                                    {getActivityIcon(activity.activityType)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{activity.title}</h3>
                                                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                            Due: {activity.dueDate}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{activity.description || 'No description provided.'}</p>
                                                    <div className="mt-3 flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                                            <UserIcon size={12} />
                                                            {activity.assignedTo ? `Assigned to User ${activity.assignedTo}` : 'Unassigned'}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleEditActivity(activity)}
                                                                className="text-xs font-medium text-lyceum-blue hover:text-lyceum-blue-dark dark:text-lyceum-blue dark:hover:text-blue-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <PenTool size={12} /> Edit
                                                            </button>
                                                            <button
                                                                onClick={() => onSaveTask && onSaveTask({ ...activity, status: 'done' })}
                                                                className="text-xs font-medium text-green-600 hover:text-green-700 dark:text-green-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <CheckCircle2 size={12} /> Mark Complete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Timeline / History Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
                                <History className="text-gray-400" size={20} /> Activity Timeline
                            </h2>

                            {activityHistory.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-400 text-sm">No history available yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-0">
                                    {activityHistory.map((activity, index) => (
                                        <div key={activity.id} className="flex gap-4 relative pb-8 last:pb-0">
                                            {/* Timeline Line */}
                                            {index !== activityHistory.length - 1 && (
                                                <div className="absolute left-3.5 top-8 bottom-0 w-0.5 bg-gray-100 dark:bg-gray-700"></div>
                                            )}

                                            <div className="relative z-10 flex-shrink-0 mt-1">
                                                <div className="w-7 h-7 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm">
                                                    <CheckCircle2 size={14} />
                                                </div>
                                            </div>
                                            <div className="flex-1 bg-gray-50/50 dark:bg-gray-700/10 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700/30 transition-colors">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{activity.title}</h4>
                                                    <span className="text-xs text-gray-400 font-mono">
                                                        {activity.completedAt ? new Date(activity.completedAt).toLocaleDateString() : 'Done'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                    <span className="font-medium text-gray-700 dark:text-gray-300">{activity.activityType || 'Task'}</span> marked as complete.
                                                </p>
                                                {activity.description && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 italic">
                                                        "{activity.description}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Summaries (Leads & Quotes) */}
                    <div className="space-y-6">

                        {/* Leads Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                                <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                    <UserIcon className="text-lyceum-blue" size={18} /> Related Leads
                                </h3>
                                <span className="text-xs font-bold px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">{associatedLeads.length}</span>
                            </div>
                            <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {associatedLeads.length === 0 ? (
                                    <p className="text-center text-sm text-gray-400 py-4">No associated leads.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {associatedLeads.map(lead => (
                                            <div key={lead.id} className="p-3 bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl hover:shadow-md transition-shadow group cursor-pointer">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide
                                                        ${lead.stage === 'Won' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                            lead.stage === 'Lost' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                                        {lead.stage}
                                                    </span>
                                                    <ArrowLeft size={14} className="text-gray-300 group-hover:text-lyceum-blue transition-colors rotate-180" />
                                                </div>
                                                <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-1">{lead.title}</h4>
                                                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Building2 size={10} /> {lead.company}</p>
                                                <div className="flex items-center text-green-600 dark:text-green-400 font-bold text-sm">
                                                    <IndianRupee size={12} className="mr-0.5" />
                                                    {lead.value.toLocaleString('en-IN')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quotations Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                        <FileText className="text-purple-500" size={18} /> Quotations
                                    </h3>
                                    <span className="text-xs font-bold px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">{associatedQuotations.length}</span>
                                </div>
                                <button
                                    onClick={handleNewQuotationClick}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-lyceum-blue"
                                    title="New Quotation"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                            <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {associatedQuotations.length === 0 ? (
                                    <p className="text-center text-sm text-gray-400 py-4">No quotations found.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {associatedQuotations.map((quote, idx) => (
                                            <div
                                                key={quote.id || idx}
                                                onClick={() => handleEditQuotation(quote)}
                                                className={`p-3 bg-white dark:bg-gray-700 border rounded-xl hover:shadow-md transition-shadow relative overflow-hidden cursor-pointer group
                                                ${quote.status === 'Agreed'
                                                        ? 'border-green-200 dark:border-green-800 ring-1 ring-green-100 dark:ring-green-900/30'
                                                        : 'border-gray-100 dark:border-gray-600'}`}
                                            >

                                                {quote.status === 'Agreed' && (
                                                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
                                                        AGREED
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-xs font-bold text-gray-400 block group-hover:text-lyceum-blue transition-colors">
                                                        {quote.quotationNumber || `#${quote.id}`}
                                                    </span>
                                                    {onDeleteQuotation && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDeleteQuotation(associatedLeads.find(l => l.quotations?.some(q => q.id === quote.id))!.id, quote.id);
                                                            }}
                                                            className="p-1 -mr-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                            title="Delete Quotation"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-1">{quote.title}</h4>

                                                <div className="flex justify-between items-end mt-2 pt-2 border-t border-gray-50 dark:border-gray-600">
                                                    <span className="text-xs text-gray-400">{new Date(quote.date).toLocaleDateString()}</span>
                                                    <div className="flex items-center text-gray-900 dark:text-white font-bold text-sm">
                                                        <IndianRupee size={12} className="mr-0.5" />
                                                        {quote.total.toLocaleString('en-IN')}
                                                    </div>
                                                </div>

                                                {/* Approval Actions */}
                                                <div className="mt-3 pt-2 border-t border-gray-50 dark:border-gray-600 flex justify-end gap-2">
                                                    {quote.status === 'Accepted by Student' && onApproveQuotation && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (window.confirm('Approve this quotation? This will mark the lead as WON.')) {
                                                                    onApproveQuotation(associatedLeads.find(l => l.quotations?.some(q => q.id === quote.id))!.id, quote.id);
                                                                }
                                                            }}
                                                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                                                        >
                                                            <CheckCircle2 size={12} /> Approve
                                                        </button>
                                                    )}
                                                    {quote.status === 'In Review' && onManualAcceptQuotation && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (window.confirm('Mark this quotation as accepted (verbal)? This will mark the lead as WON.')) {
                                                                    onManualAcceptQuotation(associatedLeads.find(l => l.quotations?.some(q => q.id === quote.id))!.id, quote.id);
                                                                }
                                                            }}
                                                            className="px-3 py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                                                        >
                                                            <CheckSquare size={12} /> Mark Accepted
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            <ActivityModal
                isOpen={isActivityModalOpen}
                onClose={() => {
                    setIsActivityModalOpen(false);
                    setEditingTask(null);
                }}
                onSave={handleSaveActivity}
                editTask={editingTask}
                currentUserId={user.id}
                contacts={[contact]}
            />

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #e5e7eb;
                    border-radius: 20px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #374151;
                }
            `}</style>
        </div>
    );
};

export default ContactCrmView;
