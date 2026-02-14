import React, { useState, useMemo } from 'react';
import {
    Filter,
    Calendar,
    ChevronLeft,
    ChevronRight,
    ShieldCheck,
    MapPin
} from 'lucide-react';
import { FileText, Play, ArrowRight, User as UserIcon, Phone, Globe, Plus, ArrowLeft, Clock, Search, X, Lock, Eye, EyeOff, KeyRound } from '@/components/common/icons';
import { createVisaOperation, updateVisaOperationCgi, updateVisaOperationSlotBooking } from '@/utils/api';
import type { Contact, VisaOperation } from '@/types';

interface VisaOperationsViewProps {
    contacts: Contact[];
    onOperationCreated?: (op: VisaOperation) => void;
    existingOperations?: VisaOperation[];
}

export const VisaOperationsView: React.FC<VisaOperationsViewProps> = ({
    contacts,
    onOperationCreated,
    existingOperations = []
}) => {
    const [step, setStep] = useState<'list' | 'form' | 'detail' | 'cgi' | 'slot'>('list');
    const [selectedContactId, setSelectedContactId] = useState<number | ''>('');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        country: ''
    });
    const [cgiFormData, setCgiFormData] = useState({
        username: '',
        password: '',
        securityQuestion1: '',
        securityAnswer1: '',
        securityQuestion2: '',
        securityAnswer2: '',
        securityQuestion3: '',
        securityAnswer3: '',
        showCgiOnPortal: false
    });
    const [slotFormData, setSlotFormData] = useState({
        vacConsulate: '',
        viConsulate: '',
        vacDate: '',
        vacTime: '',
        viDate: '',
        viTime: '',
        bookedOn: '',
        bookedBy: '',
        vacPreferred: [] as string[],
        viPreferred: [] as string[],
        preferencesLocked: false
    });
    const [interviewFormData, setInterviewFormData] = useState({
        visaOutcome: '',
        remarks: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [activeOp, setActiveOp] = useState<VisaOperation | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // List view filters
    const [listSearchQuery, setListSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const filteredOperations = useMemo(() => {
        return existingOperations.filter(op => {
            const matchesSearch =
                op.name.toLowerCase().includes(listSearchQuery.toLowerCase()) ||
                op.vopNumber.toLowerCase().includes(listSearchQuery.toLowerCase()) ||
                op.phone.toLowerCase().includes(listSearchQuery.toLowerCase()) ||
                op.country.toLowerCase().includes(listSearchQuery.toLowerCase());

            let matchesDate = true;
            if (startDate || endDate) {
                const opDate = new Date(op.createdAt).toISOString().split('T')[0];
                if (startDate && opDate < startDate) matchesDate = false;
                if (endDate && opDate > endDate) matchesDate = false;
            }

            return matchesSearch && matchesDate;
        });
    }, [existingOperations, listSearchQuery, startDate, endDate]);

    const filteredContacts = useMemo(() => {
        if (!searchTerm.trim()) return contacts;
        return contacts.filter(contact =>
            contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (contact.phone && contact.phone.includes(searchTerm))
        );
    }, [contacts, searchTerm]);

    // Auto-fetch logic
    const handleContactChange = (id: number) => {
        setSelectedContactId(id);
        const contact = contacts.find(c => c.id === id);
        if (contact) {
            setFormData({
                name: contact.name,
                phone: contact.phone || '',
                country: contact.countryOfApplication || contact.country || ''
            });
        }
    };

    const handleStart = async () => {
        if (!selectedContactId) return;
        setIsSubmitting(true);
        try {
            const newOp = await createVisaOperation({
                contactId: Number(selectedContactId),
                ...formData
            });
            setActiveOp(newOp);
            setStep('detail');
            onOperationCreated?.(newOp);
        } catch (error) {
            console.error('Failed to create visa operation:', error);
            alert('Failed to start visa operation. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveCgi = async () => {
        if (!activeOp) return;
        setIsSubmitting(true);
        try {
            const { showCgiOnPortal, ...cgiData } = cgiFormData;
            const updatedOp = await updateVisaOperationCgi(activeOp.id, cgiData, showCgiOnPortal);
            setActiveOp(updatedOp);
            setStep('detail');
            alert('CGI data saved successfully!');
        } catch (error) {
            console.error('Failed to save CGI data:', error);
            alert('Failed to save CGI data. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveSlot = async () => {
        if (!activeOp) return;
        setIsSubmitting(true);
        try {
            const updatedOp = await updateVisaOperationSlotBooking(activeOp.id, {
                slotBookingData: slotFormData,
                visaInterviewData: interviewFormData,
                status: interviewFormData.visaOutcome ? `Visa ${interviewFormData.visaOutcome}` : activeOp.status
            });
            setActiveOp(updatedOp);
            setStep('detail');
            alert('Slot booking details saved successfully!');
        } catch (error) {
            console.error('Failed to save slot data:', error);
            alert('Failed to save slot data. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (step === 'list') {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Visa Operations</h2>
                        <p className="text-slate-500 text-sm">Manage and track visa processes for contacts.</p>
                    </div>
                    <button
                        onClick={() => {
                            setStep('form');
                            setSelectedContactId('');
                            setSearchTerm('');
                            setFormData({ name: '', phone: '', country: '' });
                        }}
                        className="flex items-center gap-2 bg-lyceum-blue text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-lyceum-blue/20 hover:bg-blue-700 transition-all transform hover:scale-105"
                    >
                        <Plus size={20} />
                        New Operation
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search name, VOP, phone, or country..."
                            value={listSearchQuery}
                            onChange={(e) => setListSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-4 focus:ring-lyceum-blue/10 dark:text-white transition-all font-medium"
                        />
                    </div>
                    <div className="flex gap-4 w-full lg:w-auto items-center">
                        <div className="flex items-center gap-2 flex-1 lg:flex-none">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">From</span>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full pl-12 pr-8 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none dark:text-white transition-all font-medium"
                                />
                                {startDate && (
                                    <button onClick={() => setStartDate('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            <span className="text-slate-300 font-bold text-xs uppercase">To</span>
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">To</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none dark:text-white transition-all font-medium"
                                />
                                {endDate && (
                                    <button onClick={() => setEndDate('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">VOP Number</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Country</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredOperations.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                                            {listSearchQuery || startDate || endDate
                                                ? "No operations match your filters."
                                                : "No visa operations found. Start by creating a new one."}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOperations.map(op => (
                                        <tr
                                            key={op.id}
                                            className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                            onClick={() => { setActiveOp(op); setStep('detail'); }}
                                        >
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-mono font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded">
                                                    {op.vopNumber}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-800">{op.name}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                <div className="flex items-center gap-1.5">
                                                    <Phone size={14} className="text-slate-400" />
                                                    {op.phone}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                    <Globe size={14} className="text-slate-400" />
                                                    {op.country}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            alert(`Starting DS process for ${op.vopNumber}...`);
                                                        }}
                                                        className="px-3 py-1.5 bg-lyceum-blue/5 text-lyceum-blue hover:bg-lyceum-blue hover:text-white rounded-lg text-xs font-bold transition-all border border-lyceum-blue/10 flex items-center gap-1.5"
                                                    >
                                                        Start DS
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveOp(op);
                                                            setCgiFormData({
                                                                username: op.cgiData?.username || '',
                                                                password: op.cgiData?.password || '',
                                                                securityQuestion1: op.cgiData?.securityQuestion1 || '',
                                                                securityAnswer1: op.cgiData?.securityAnswer1 || '',
                                                                securityQuestion2: op.cgiData?.securityQuestion2 || '',
                                                                securityAnswer2: op.cgiData?.securityAnswer2 || '',
                                                                securityQuestion3: op.cgiData?.securityQuestion3 || '',
                                                                securityAnswer3: op.cgiData?.securityAnswer3 || '',
                                                                showCgiOnPortal: op.showCgiOnPortal || false
                                                            });
                                                            setStep('cgi');
                                                        }}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${op.cgiData?.username
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white'
                                                            : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-600 hover:text-white'
                                                            }`}
                                                    >
                                                        {op.cgiData?.username ? 'View CGI' : 'Start CGI'}
                                                    </button>
                                                    <button className="p-2 text-slate-400 hover:text-lyceum-blue transition-colors rounded-lg group-hover:bg-blue-50 ml-1">
                                                        <ArrowRight size={20} />
                                                    </button>
                                                </div>
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

    if (step === 'form') {
        return (
            <div className="max-w-2xl mx-auto py-8">
                <button
                    onClick={() => setStep('list')}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-bold mb-6 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Back to List
                </button>

                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-8 py-6 border-b border-slate-100">
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <FileText className="text-orange-600" size={24} />
                            New Visa Operation
                        </h2>
                    </div>

                    <div className="p-8 space-y-6">
                        {/* Contact Selection */}
                        <div className="relative">
                            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                <UserIcon size={16} className="text-lyceum-blue" />
                                Select Contact
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Type name to search..."
                                    value={searchTerm}
                                    onFocus={() => setIsDropdownOpen(true)}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-lyceum-blue/10 focus:border-lyceum-blue outline-none transition-all font-medium"
                                />
                                {isDropdownOpen && (
                                    <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden animate-fade-in-up">
                                        {filteredContacts.length > 0 ? (
                                            filteredContacts.map(contact => (
                                                <div
                                                    key={contact.id}
                                                    onClick={() => {
                                                        handleContactChange(contact.id);
                                                        setSearchTerm(contact.name);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className="px-6 py-3 hover:bg-slate-50 cursor-pointer transition-colors flex flex-col border-b border-slate-50 last:border-0"
                                                >
                                                    <span className="font-bold text-slate-800">{contact.name}</span>
                                                    <span className="text-xs text-slate-500">{contact.phone || 'No phone'} • {contact.country || 'No country'}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-6 py-4 text-slate-400 text-sm text-center italic">
                                                No contacts found matching "{searchTerm}"
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {isDropdownOpen && (
                                <div className="fixed inset-0 z-0" onClick={() => setIsDropdownOpen(false)} />
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <Phone size={16} className="text-lyceum-blue" />
                                    Phone
                                </label>
                                <input
                                    type="text"
                                    disabled
                                    value={formData.phone}
                                    className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-medium cursor-not-allowed"
                                    placeholder="Auto-filled"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <Globe size={16} className="text-lyceum-blue" />
                                    Country
                                </label>
                                <input
                                    type="text"
                                    disabled
                                    value={formData.country}
                                    className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-medium cursor-not-allowed"
                                    placeholder="Auto-filled"
                                />
                            </div>
                        </div>

                        <div className="pt-8 flex justify-end gap-4">
                            <button
                                onClick={() => setStep('list')}
                                className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStart}
                                disabled={!selectedContactId || isSubmitting}
                                className="flex items-center gap-2 bg-lyceum-blue text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-lyceum-blue/20"
                            >
                                {isSubmitting ? 'Starting...' : 'Create Operation'}
                                {!isSubmitting && <ArrowRight size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'cgi') {
        return (
            <div className="max-w-3xl mx-auto py-8">
                <button
                    onClick={() => setStep('detail')}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-bold mb-6 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Back to Detail
                </button>

                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="bg-orange-50 px-8 py-6 border-b border-orange-100 flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <KeyRound className="text-orange-600" size={24} />
                            CGI Process Credentials
                        </h2>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-slate-500">Visible to Student Portal</span>
                            <button
                                onClick={() => setCgiFormData(prev => ({ ...prev, showCgiOnPortal: !prev.showCgiOnPortal }))}
                                className={`w-12 h-6 rounded-full transition-all relative ${cgiFormData.showCgiOnPortal ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${cgiFormData.showCgiOnPortal ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Username</label>
                                <div className="relative">
                                    <UserIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={cgiFormData.username}
                                        onChange={(e) => setCgiFormData(prev => ({ ...prev, username: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-medium"
                                        placeholder="Enter CGI Username"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Password</label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={cgiFormData.password}
                                        onChange={(e) => setCgiFormData(prev => ({ ...prev, password: e.target.value }))}
                                        className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-medium"
                                        placeholder="Enter CGI Password"
                                    />
                                    <button
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Security Questions</h3>
                            <div className="grid gap-6">
                                {[1, 2, 3].map(num => (
                                    <div key={num} className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Question {num}</label>
                                            <input
                                                type="text"
                                                value={(cgiFormData as any)[`securityQuestion${num}`]}
                                                onChange={(e) => setCgiFormData(prev => ({ ...prev, [`securityQuestion${num}`]: e.target.value }))}
                                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:border-orange-500 outline-none transition-all text-sm font-medium"
                                                placeholder={`Enter Security Question ${num}`}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Answer {num}</label>
                                            <input
                                                type="text"
                                                value={(cgiFormData as any)[`securityAnswer${num}`]}
                                                onChange={(e) => setCgiFormData(prev => ({ ...prev, [`securityAnswer${num}`]: e.target.value }))}
                                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:border-orange-500 outline-none transition-all text-sm font-medium"
                                                placeholder={`Enter Answer ${num}`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-4">
                            <button
                                onClick={() => setStep('detail')}
                                className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveCgi}
                                disabled={isSubmitting}
                                className="bg-orange-600 text-white px-10 py-2.5 rounded-lg font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Saving...' : 'Save CGI Credentials'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'slot') {
        const consulates = ['Hyderabad', 'Chennai', 'Mumbai', 'New Delhi', 'Kolkata'];
        return (
            <div className="max-w-4xl mx-auto py-8">
                <button
                    onClick={() => setStep('detail')}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-bold mb-6 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Back to Detail
                </button>

                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="bg-blue-50 px-8 py-6 border-b border-blue-100 flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Clock className="text-blue-600" size={24} />
                            Slot Booking Details
                        </h2>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Booking Info</h3>
                                <div className="space-y-4">
                                    {slotFormData.preferencesLocked && (
                                        <div className="grid grid-cols-1 gap-6 p-6 bg-slate-50/50 border border-slate-100 rounded-3xl">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between px-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-200" />
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">VAC Preferred Locations</span>
                                                    </div>
                                                    <span className="text-[9px] font-bold text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100/50">Client Choice</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {consulates.map(city => {
                                                        const isSelected = slotFormData.vacPreferred.includes(city);
                                                        return (
                                                            <div
                                                                key={`staff-view-vac-${city}`}
                                                                className={`px-3 py-2 rounded-xl border flex items-center gap-2 transition-all duration-300 ${isSelected
                                                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm'
                                                                    : 'bg-white/50 text-slate-400 border-slate-100 opacity-60 hover:opacity-100'
                                                                    }`}
                                                            >
                                                                {isSelected ? (
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                                                ) : (
                                                                    <div className="w-1.5 h-1.5 rounded-full border border-slate-200" />
                                                                )}
                                                                <span className={`text-[11px] ${isSelected ? 'font-black' : 'font-medium'}`}>{city}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                                <div className="flex items-center justify-between px-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">VI Preferred Locations</span>
                                                    </div>
                                                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50">Client Choice</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {consulates.map(city => {
                                                        const isSelected = slotFormData.viPreferred.includes(city);
                                                        return (
                                                            <div
                                                                key={`staff-view-vi-${city}`}
                                                                className={`px-3 py-2 rounded-xl border flex items-center gap-2 transition-all duration-300 ${isSelected
                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                                                                    : 'bg-white/50 text-slate-400 border-slate-100 opacity-60 hover:opacity-100'
                                                                    }`}
                                                            >
                                                                {isSelected ? (
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                ) : (
                                                                    <div className="w-1.5 h-1.5 rounded-full border border-slate-200" />
                                                                )}
                                                                <span className={`text-[11px] ${isSelected ? 'font-black' : 'font-medium'}`}>{city}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-bold text-slate-700 block mb-2">Booked On</label>
                                            <input
                                                type="date"
                                                value={slotFormData.bookedOn}
                                                onChange={(e) => setSlotFormData(prev => ({ ...prev, bookedOn: e.target.value }))}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all text-sm font-medium"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-bold text-slate-700 block mb-2">Booked By</label>
                                            <input
                                                type="text"
                                                value={slotFormData.bookedBy}
                                                onChange={(e) => setSlotFormData(prev => ({ ...prev, bookedBy: e.target.value }))}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all text-sm font-medium"
                                                placeholder="Staff Name"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Appointment Dates</h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                        <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase letter-spacing-wider">
                                            <Clock size={14} /> VAC Appointment Details
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Consulate</label>
                                                <select
                                                    value={slotFormData.vacConsulate}
                                                    onChange={(e) => setSlotFormData(prev => ({ ...prev, vacConsulate: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all text-sm font-medium"
                                                >
                                                    <option value="">Select...</option>
                                                    {consulates.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Date</label>
                                                <input
                                                    type="date"
                                                    value={slotFormData.vacDate}
                                                    onChange={(e) => setSlotFormData(prev => ({ ...prev, vacDate: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all text-sm font-medium"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Time</label>
                                                <input
                                                    type="time"
                                                    value={slotFormData.vacTime}
                                                    onChange={(e) => setSlotFormData(prev => ({ ...prev, vacTime: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all text-sm font-medium"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase letter-spacing-wider">
                                            <Clock size={14} /> VI Appointment Details
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Consulate</label>
                                                <select
                                                    value={slotFormData.viConsulate}
                                                    onChange={(e) => setSlotFormData(prev => ({ ...prev, viConsulate: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                                                >
                                                    <option value="">Select...</option>
                                                    {consulates.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Date</label>
                                                <input
                                                    type="date"
                                                    value={slotFormData.viDate}
                                                    onChange={(e) => setSlotFormData(prev => ({ ...prev, viDate: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Time</label>
                                                <input
                                                    type="time"
                                                    value={slotFormData.viTime}
                                                    onChange={(e) => setSlotFormData(prev => ({ ...prev, viTime: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Visa Outcome</h3>
                            <div className="grid grid-cols-3 gap-6">
                                <div className="col-span-1">
                                    <label className="text-sm font-bold text-slate-700 block mb-2">Final Status</label>
                                    <select
                                        value={interviewFormData.visaOutcome}
                                        onChange={(e) => setInterviewFormData(prev => ({ ...prev, visaOutcome: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all font-medium"
                                    >
                                        <option value="">Pending...</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Rejected">Rejected</option>
                                        <option value="221g">221g (Administrative Processing)</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-sm font-bold text-slate-700 block mb-2">Outcome Remarks</label>
                                    <input
                                        type="text"
                                        value={interviewFormData.remarks}
                                        onChange={(e) => setInterviewFormData(prev => ({ ...prev, remarks: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all font-medium"
                                        placeholder="Enter outcome details, 221g colors, etc."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-4">
                            <button
                                onClick={() => setStep('detail')}
                                className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveSlot}
                                disabled={isSubmitting}
                                className="bg-blue-600 text-white px-10 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Saving...' : 'Save Slot Details'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Detail View
    return (
        <div className="space-y-6">
            <button
                onClick={() => setStep('list')}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-bold transition-colors"
            >
                <ArrowLeft size={18} />
                Back to Operations
            </button>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded uppercase tracking-wider">
                            Active Operation
                        </span>
                        <span className="text-slate-300">/</span>
                        <span className="text-slate-700 font-mono font-bold text-lg">
                            {activeOp?.vopNumber}
                        </span>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800">{activeOp?.name}</h2>
                    <div className="flex items-center gap-6 mt-4">
                        <span className="flex items-center gap-2 text-slate-600 font-medium">
                            <Phone size={16} className="text-lyceum-blue" />
                            {activeOp?.phone}
                        </span>
                        <span className="flex items-center gap-2 text-slate-600 font-medium">
                            <Globe size={16} className="text-lyceum-blue" />
                            {activeOp?.country}
                        </span>
                    </div>
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <button className="flex-1 md:flex-none px-8 py-3 bg-lyceum-blue text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-lyceum-blue/20 flex items-center justify-center gap-2">
                        Start DS
                    </button>
                    <button
                        onClick={() => {
                            setCgiFormData({
                                username: activeOp?.cgiData?.username || '',
                                password: activeOp?.cgiData?.password || '',
                                securityQuestion1: activeOp?.cgiData?.securityQuestion1 || '',
                                securityAnswer1: activeOp?.cgiData?.securityAnswer1 || '',
                                securityQuestion2: activeOp?.cgiData?.securityQuestion2 || '',
                                securityAnswer2: activeOp?.cgiData?.securityAnswer2 || '',
                                securityQuestion3: activeOp?.cgiData?.securityQuestion3 || '',
                                securityAnswer3: activeOp?.cgiData?.securityAnswer3 || '',
                                showCgiOnPortal: activeOp?.showCgiOnPortal || false
                            });
                            setStep('cgi');
                        }}
                        className={`flex-1 md:flex-none px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${activeOp?.cgiData?.username
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
                            : 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-600/20'
                            }`}
                    >
                        {activeOp?.cgiData?.username ? 'View CGI' : 'Start CGI'}
                    </button>
                    <button
                        onClick={() => {
                            setSlotFormData({
                                vacConsulate: activeOp?.slotBookingData?.vacConsulate || '',
                                viConsulate: activeOp?.slotBookingData?.viConsulate || '',
                                vacDate: activeOp?.slotBookingData?.vacDate || '',
                                vacTime: activeOp?.slotBookingData?.vacTime || '',
                                viDate: activeOp?.slotBookingData?.viDate || '',
                                viTime: activeOp?.slotBookingData?.viTime || '',
                                bookedOn: activeOp?.slotBookingData?.bookedOn || '',
                                bookedBy: activeOp?.slotBookingData?.bookedBy || '',
                                vacPreferred: activeOp?.slotBookingData?.vacPreferred || [],
                                viPreferred: activeOp?.slotBookingData?.viPreferred || [],
                                preferencesLocked: activeOp?.slotBookingData?.preferencesLocked || false
                            });
                            setInterviewFormData({
                                visaOutcome: activeOp?.visaInterviewData?.visaOutcome || '',
                                remarks: activeOp?.visaInterviewData?.remarks || ''
                            });
                            setStep('slot');
                        }}
                        className={`flex-1 md:flex-none px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${activeOp?.slotBookingData?.consulate
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'
                            : 'bg-slate-700 text-white hover:bg-slate-800 shadow-slate-600/20'
                            }`}
                    >
                        {activeOp?.slotBookingData?.consulate ? 'Update Slot' : 'Book Slot'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 border-dashed flex flex-col items-center justify-center min-h-[200px] text-center">
                            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                <FileText className="text-slate-400" size={32} />
                            </div>
                            <p className="text-slate-500 font-medium">Document Tracking coming soon</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 border-dashed flex flex-col items-center justify-center min-h-[200px] text-center">
                            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                <Clock className="text-slate-400" size={32} />
                            </div>
                            <p className="text-slate-500 font-medium">Timeline features coming soon</p>
                        </div>
                    </div>

                    {/* Slot/Interview Information Summary Card */}
                    {(activeOp?.slotBookingData?.vacConsulate || activeOp?.slotBookingData?.viConsulate || activeOp?.slotBookingData?.consulate || activeOp?.slotBookingData?.vacPreferred?.length > 0 || activeOp?.slotBookingData?.viPreferred?.length > 0) && (
                        <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50 space-y-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Clock className="text-blue-600" size={20} />
                                Slot & Interview Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VAC Selection</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-slate-700">
                                                    {activeOp.slotBookingData.vacConsulate || activeOp.slotBookingData.consulate || 'Not set'}
                                                </span>
                                                <div className="flex flex-col text-[10px] text-slate-500 font-medium">
                                                    <span>{activeOp.slotBookingData.vacDate || '---'}</span>
                                                    <span>{activeOp.slotBookingData.vacTime || '--:--'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VI Selection</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-slate-700">
                                                    {activeOp.slotBookingData.viConsulate || activeOp.slotBookingData.consulate || 'Not set'}
                                                </span>
                                                <div className="flex flex-col text-[10px] text-slate-500 font-medium">
                                                    <span>{activeOp.slotBookingData.viDate || '---'}</span>
                                                    <span>{activeOp.slotBookingData.viTime || '--:--'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Booked Details</span>
                                        <span className="text-[10px] text-slate-500">
                                            On: {activeOp.slotBookingData.bookedOn || 'N/A'} • By: {activeOp.slotBookingData.bookedBy || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visa Outcome</span>
                                        <span className={`text-sm font-bold px-2 py-0.5 rounded-full inline-block w-fit ${activeOp.visaInterviewData?.visaOutcome === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {activeOp.visaInterviewData?.visaOutcome || 'Pending Decision'}
                                        </span>
                                    </div>
                                    {activeOp.visaInterviewData?.remarks && (
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Outcome Remarks</span>
                                            <span className="text-xs text-slate-600 italic">"{activeOp.visaInterviewData.remarks}"</span>
                                        </div>
                                    )}

                                    {/* Preferred Locations Summary (Inline for better consistency) */}
                                    {activeOp.slotBookingData.preferencesLocked && (activeOp.slotBookingData.vacPreferred?.length > 0 || activeOp.slotBookingData.viPreferred?.length > 0) && (
                                        <div className="pt-4 border-t border-blue-100/50 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student Requested</span>
                                                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded border border-emerald-200">
                                                    <ShieldCheck size={10} /> Confirmed
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="space-y-1.5">
                                                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight">VAC: {activeOp.slotBookingData.vacPreferred?.join(', ') || 'Any'}</span>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">VI: {activeOp.slotBookingData.viPreferred?.join(', ') || 'Any'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: CGI & Credentials */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <KeyRound className="text-orange-600" size={20} />
                                CGI Credentials
                            </h3>
                            {activeOp?.showCgiOnPortal && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">
                                    Portal Visible
                                </span>
                            )}
                        </div>

                        {activeOp?.cgiData?.username ? (
                            <div className="space-y-4">
                                <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username</span>
                                        <span className="text-sm font-bold text-slate-700">{activeOp.cgiData.username}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</span>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-slate-700">
                                                {showPassword ? activeOp.cgiData.password : '••••••••'}
                                            </span>
                                            <button onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600">
                                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <span className="text-xs font-bold text-slate-500 uppercase px-1">Security Questions</span>
                                    {[1, 2, 3].map(num => {
                                        const q = (activeOp?.cgiData as any)?.[`securityQuestion${num}`];
                                        const a = (activeOp?.cgiData as any)?.[`securityAnswer${num}`];
                                        if (!q) return null;
                                        return (
                                            <div key={num} className="bg-orange-50/50 p-3 rounded-xl border border-orange-100/50">
                                                <p className="text-[10px] font-bold text-orange-600/70 uppercase mb-1">Q{num}: {q}</p>
                                                <p className="text-xs font-bold text-slate-700">A: {a}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center space-y-3">
                                <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                                    <Lock className="text-slate-300" size={20} />
                                </div>
                                <p className="text-sm text-slate-400 font-medium">No CGI data saved yet.</p>
                                <button
                                    onClick={() => {
                                        setCgiFormData({
                                            username: '', password: '',
                                            securityQuestion1: '', securityAnswer1: '',
                                            securityQuestion2: '', securityAnswer2: '',
                                            securityQuestion3: '', securityAnswer3: '',
                                            showCgiOnPortal: false
                                        });
                                        setStep('cgi');
                                    }}
                                    className="text-xs font-bold text-lyceum-blue hover:underline"
                                >
                                    Setup Credentials
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
