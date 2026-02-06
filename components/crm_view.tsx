

import React, { useState, useMemo } from 'react';
import type { CrmLead, CrmStage, User } from '../types';
import { IndianRupee, Building2, User as UserIcon, GripVertical, Filter, Trash2, Search, X, ChevronDown, ChevronUp, FileText } from './icons';

const STAGES: CrmStage[] = ['New', 'Qualified', 'Proposal', 'Won', 'Lost'];

const stageColorClasses: { [key in CrmStage]: string } = {
    New: 'border-t-blue-500',
    Qualified: 'border-t-purple-500',
    Proposal: 'border-t-yellow-500',
    Won: 'border-t-green-500',
    Lost: 'border-t-red-500',
};

interface CrmViewProps {
    leads: CrmLead[];
    onLeadSelect: (lead: CrmLead) => void;
    onNewLeadClick: () => void;
    onUpdateLeadStage: (leadId: number, newStage: CrmStage) => void;
    onDeleteLead: (leadId: number) => void;
    user: User;
    onNavigateToContact: (contactName: string) => void;
}

const getInitials = (name: string = '') => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + (names[names.length - 1] || '').charAt(0)).toUpperCase();
};

const agentColors = [
    'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    'bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    'bg-purple-200 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    'bg-pink-200 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300',
    'bg-indigo-200 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
    'bg-teal-200 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
];

const getColorForAgent = (agentName: string = '') => {
    if (!agentName) return agentColors[0];
    let hash = 0;
    for (let i = 0; i < agentName.length; i++) {
        hash = agentName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % agentColors.length);
    return agentColors[index];
};

const LeadCard: React.FC<{ lead: CrmLead; onSelect: (lead: CrmLead) => void; onDelete: (id: number) => void; draggable: boolean; canDelete: boolean; onNavigateToContact: (name: string) => void }> = ({ lead, onSelect, onDelete, draggable, canDelete, onNavigateToContact }) => {
    const agentAvatar = lead.assignedTo ? (
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getColorForAgent(lead.assignedTo)}`} title={lead.assignedTo}>
            {getInitials(lead.assignedTo)}
        </div>
    ) : null;

    return (
        <div
            className="relative bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 mb-4 transition-shadow hover:shadow-md flex flex-col group"
            draggable={draggable}
            style={{ cursor: draggable ? 'grab' : 'default' }}
            onDragStart={(e) => {
                if (!draggable) {
                    e.preventDefault();
                    return;
                }
                e.dataTransfer.setData('text/plain', lead.id.toString());
                e.currentTarget.style.opacity = '0.5';
            }}
            onDragEnd={(e) => {
                if (draggable) {
                    e.currentTarget.style.opacity = '1';
                }
            }}
        >
            <div className="flex-grow">
                <h3
                    onClick={() => onSelect(lead)}
                    className="font-semibold text-gray-800 dark:text-gray-100 mb-2 cursor-pointer hover:underline pr-6"
                >
                    {lead.title}
                </h3>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center">
                        <Building2 size={14} className="mr-2 text-gray-400" />
                        <span>{lead.company}</span>
                    </div>
                    <div className="flex items-center">
                        <UserIcon size={14} className="mr-2 text-gray-400" />
                        <span
                            className="cursor-pointer hover:underline hover:text-lyceum-blue"
                            onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToContact(lead.contact);
                            }}
                        >
                            {lead.contact}
                        </span>
                    </div>
                </div>
            </div>
            {/* Quotations Badge */}
            {lead.quotations && lead.quotations.length > 0 && (
                <div className="mt-2 flex items-center text-xs text-indigo-600 dark:text-indigo-400">
                    <FileText size={12} className="mr-1" />
                    <span className="font-medium">
                        {lead.quotations[lead.quotations.length - 1].quotationNumber || `QUO-${lead.quotations[lead.quotations.length - 1].id}`}
                    </span>
                    {lead.quotations.length > 1 && (
                        <span className="ml-1 text-gray-500">+{lead.quotations.length - 1}</span>
                    )}
                </div>
            )}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center font-medium text-green-600 dark:text-green-400 text-sm">
                    <IndianRupee size={14} className="mr-1" />
                    <span>
                        {(lead.quotations?.filter(q => q.status === 'Agreed').reduce((sum, q) => sum + q.total, 0) || 0).toLocaleString('en-IN')}
                    </span>
                </div>
                {agentAvatar}
            </div>
            {canDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(lead.id);
                    }}
                    className="absolute top-2 right-8 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Lead"
                >
                    <Trash2 size={16} />
                </button>
            )}
            {draggable && (
                <div className="absolute top-2 right-2 text-gray-400 dark:text-gray-500 group-hover:text-gray-600">
                    <GripVertical size={16} />
                </div>
            )}
        </div>
    )
};


const CrmView: React.FC<CrmViewProps> = ({ leads, onLeadSelect, onNewLeadClick, onUpdateLeadStage, onDeleteLead, user, onNavigateToContact }) => {
    const [dragOverStage, setDragOverStage] = useState<CrmStage | null>(null);
    const [agentFilter, setAgentFilter] = useState('All Agents');
    const [searchQuery, setSearchQuery] = useState('');
    const [isWonCollapsed, setIsWonCollapsed] = useState(true);
    const [isLostCollapsed, setIsLostCollapsed] = useState(true);
    const canUpdate = user.role === 'Admin' || !!user.permissions?.['CRM']?.update;
    const canDelete = user.role === 'Admin' || !!user.permissions?.['CRM']?.delete;

    const uniqueAgents = useMemo(() => ['All Agents', ...Array.from(new Set(leads.map(l => l.assignedTo).filter(Boolean))) as string[]], [leads]);

    const filteredLeads = useMemo(() => {
        let result = leads;

        // Filter by agent
        if (agentFilter !== 'All Agents') {
            result = result.filter(lead => lead.assignedTo === agentFilter);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(lead =>
                lead.title?.toLowerCase().includes(query) ||
                lead.contact?.toLowerCase().includes(query) ||
                lead.company?.toLowerCase().includes(query) ||
                lead.email?.toLowerCase().includes(query) ||
                lead.phone?.includes(query)
            );
        }

        return result;
    }, [leads, agentFilter, searchQuery]);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, stage: CrmStage) => {
        e.preventDefault();
        if (!canUpdate) return;
        const leadId = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (leadId) {
            onUpdateLeadStage(leadId, stage);
        }
        setDragOverStage(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, stage: CrmStage) => {
        e.preventDefault();
        if (canUpdate) {
            setDragOverStage(stage);
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOverStage(null);
    };

    const getStageValue = (stage: CrmStage) => {
        return filteredLeads
            .filter(lead => lead.stage === stage)
            .reduce((sum, lead) => {
                const agreedTotal = lead.quotations?.filter(q => q.status === 'Agreed').reduce((qSum, q) => qSum + q.total, 0) || 0;
                return sum + agreedTotal;
            }, 0);
    };

    return (
        <div className="h-full flex flex-col animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">CRM Pipeline</h1>
                <div className="flex w-full sm:w-auto items-center space-x-4">
                    <div className="flex items-center space-x-2 text-sm flex-grow sm:flex-grow-0">
                        <Filter size={16} className="text-gray-500" />
                        <label htmlFor="agent-filter" className="font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            Sales Agent:
                        </label>
                        <select
                            id="agent-filter"
                            value={agentFilter}
                            onChange={(e) => setAgentFilter(e.target.value)}
                            className="w-full sm:w-48 px-3 py-1.5 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm"
                        >
                            {uniqueAgents.map(agent => (
                                <option key={agent} value={agent}>{agent}</option>
                            ))}
                        </select>
                    </div>

                    {(user.role === 'Admin' || user.permissions?.['CRM']?.create) && (
                        <button
                            onClick={onNewLeadClick}
                            className="px-4 py-2 bg-lyceum-blue text-white rounded-md shadow-sm hover:bg-lyceum-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-lyceum-blue transition-colors"
                        >
                            New Lead
                        </button>
                    )}
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-4 relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search leads by name, company, email, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-lyceum-blue focus:border-lyceum-blue text-gray-900 dark:text-gray-100"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
                {searchQuery && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Found {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
                    </p>
                )}
            </div>

            <div className="flex-1 flex space-x-4 overflow-x-auto pb-4">
                {STAGES.map(stage => {
                    const stageLeads = filteredLeads.filter(lead => lead.stage === stage);
                    const isCollapsible = stage === 'Won' || stage === 'Lost';
                    const isCollapsed = stage === 'Won' ? isWonCollapsed : stage === 'Lost' ? isLostCollapsed : false;

                    return (
                        <div
                            key={stage}
                            className={`w-80 bg-gray-100 dark:bg-gray-800/50 rounded-lg shadow-sm flex-shrink-0 flex flex-col transition-colors duration-300 ${dragOverStage === stage ? 'bg-lyceum-blue/10 dark:bg-lyceum-blue/20' : ''}`}
                            onDrop={(e) => handleDrop(e, stage)}
                            onDragOver={(e) => handleDragOver(e, stage)}
                            onDragLeave={handleDragLeave}
                        >
                            <div className={`p-4 font-semibold text-gray-700 dark:text-gray-200 border-t-4 ${stageColorClasses[stage]} rounded-t-lg flex flex-col`}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-2">
                                        <span>{stage}</span>
                                        {isCollapsible && (
                                            <button
                                                onClick={() => stage === 'Won' ? setIsWonCollapsed(!isWonCollapsed) : setIsLostCollapsed(!isLostCollapsed)}
                                                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                                title={isCollapsed ? 'Expand' : 'Collapse'}
                                            >
                                                {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                                            </button>
                                        )}
                                    </div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                                        {stageLeads.length}
                                    </span>
                                </div>
                                <div className="flex items-center text-xs font-normal text-green-600 dark:text-green-400 mt-1">
                                    <IndianRupee size={12} className="mr-1" />
                                    {getStageValue(stage).toLocaleString('en-IN')}
                                </div>
                            </div>
                            {(!isCollapsible || !isCollapsed) && (
                                <div className="p-2 flex-1 overflow-y-auto">
                                    {stageLeads.map(lead => (
                                        <LeadCard key={lead.id} lead={lead} onSelect={onLeadSelect} onDelete={onDeleteLead} draggable={canUpdate} canDelete={canDelete} onNavigateToContact={onNavigateToContact} />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <style>{`
                @keyframes fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default CrmView;