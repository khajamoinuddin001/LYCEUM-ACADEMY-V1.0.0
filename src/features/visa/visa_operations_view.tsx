import React, { useState, useMemo } from 'react';
import {
    Filter,
    Calendar,
    ChevronDown,
    ChevronUp,
    ShieldCheck,
    MapPin,
    CheckCircle,
    AlertCircle,
    Upload,
    Download,
    Eye,
    FileText,
    Play,
    ArrowRight,
    User as UserIcon,
    UserCheck,
    Phone,
    Globe,
    Users as UsersIcon,
    Plus,
    ArrowLeft,
    Clock,
    Search,
    X,
    Lock,
    EyeOff,
    KeyRound,
    Trash2
} from 'lucide-react';
import { createVisaOperation, updateVisaOperationCgi, updateVisaOperationSlotBooking, updateVisaOperationDs160, uploadDs160Document, deleteDs160Document, updateDs160Status, downloadDocument, downloadVisaOperationItem, getToken, API_BASE_URL, uploadDs160DependencyDocument, deleteDs160DependencyDocument, deleteVisaOperation, uploadDocument, deleteDocument } from '@/utils/api';
import type { Contact, VisaOperation, User } from '@/types';

interface VisaOperationsViewProps {
    contacts: Contact[];
    onOperationCreated?: (op: VisaOperation) => void;
    existingOperations?: VisaOperation[];
    user?: User;
}

export const VisaOperationsView: React.FC<VisaOperationsViewProps> = ({
    contacts,
    onOperationCreated,
    existingOperations = [],
    user
}) => {
    const [step, setStep] = useState<'list' | 'form' | 'detail' | 'cgi' | 'slot' | 'ds'>('list');
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
        preferencesLocked: false,
        appointmentConfirmationDocId: undefined as number | undefined,
        appointmentConfirmationDocName: ''
    });
    const [interviewFormData, setInterviewFormData] = useState({
        visaOutcome: '',
        remarks: ''
    });
    const [dsGroups, setDsGroups] = useState<any[]>([]);
    const [minimizedFlows, setMinimizedFlows] = useState<boolean[][]>([]); // [groupIndex][flowIndex]
    const [showPassword, setShowPassword] = useState(false);
    const [activeOp, setActiveOp] = useState<VisaOperation | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [operations, setOperations] = useState<VisaOperation[]>(existingOperations);

    // Sync state with props
    React.useEffect(() => {
        setOperations(existingOperations);
    }, [existingOperations]);

    // Initialize DS Groups from active operation
    React.useEffect(() => {
        if (step === 'ds' && activeOp) {
            let initialGroups = [];
            if (Array.isArray(activeOp.dsData)) {
                initialGroups = activeOp.dsData.map((g: any) => ({
                    ...g,
                    minimized: g.minimized ?? false
                }));
            } else if (activeOp.dsData && typeof activeOp.dsData === 'object' && Object.keys(activeOp.dsData).length > 0) {
                // Migrate legacy single object to first group
                initialGroups = [{
                    main: activeOp.dsData,
                    dependencies: activeOp.dsData.dependencies || [],
                    minimized: false
                }];
            } else {
                // New operation or empty data
                initialGroups = [{
                    main: createFlowTemplate(),
                    dependencies: [],
                    minimized: false
                }];
            }
            setDsGroups(initialGroups);
            setMinimizedFlows(initialGroups.map(g => [false, ...new Array(g.dependencies?.length || 0).fill(false)]));
        }
    }, [step, activeOp]);

    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // List view filters
    const [listSearchQuery, setListSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'slots_not_booked' | 'ds160_not_submitted'>('all');
    const [activeTab, setActiveTab] = useState<'Ongoing' | 'Completed'>('Ongoing');

    const slotsNotBookedCount = useMemo(() => {
        return operations.filter(op => !op.slotBookingData?.vacDate && !op.slotBookingData?.viDate).length;
    }, [operations]);

    const ds160NotSubmittedCount = useMemo(() => {
        return operations.filter(op => {
            const dsData = op.dsData;
            if (Array.isArray(dsData) && dsData.length > 0) {
                return !dsData[0].main?.confirmationDocumentId;
            }
            return !dsData?.confirmationDocumentId;
        }).length;
    }, [operations]);

    const createFlowTemplate = () => ({
        confirmationNumber: '',
        securityQuestion: '',
        securityAnswer: '',
        surname: '',
        yearOfBirth: '',
        startDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        basicDsBox: '',
        documentId: undefined,
        documentName: '',
        fillingDocuments: [],
        studentStatus: 'pending',
        adminStatus: 'pending',
        rejectionReason: '',
        adminName: '',
        internalDocuments: [],
        dependencies: []
    });

    const handleAddNewGroup = () => {
        setDsGroups(prev => [...prev, { main: createFlowTemplate(), dependencies: [], minimized: false }]);
        setMinimizedFlows(prev => [...prev, [false]]);
    };

    const handleRemoveDsGroup = (index: number) => {
        if (!window.confirm(`Are you sure you want to remove Group #${index + 1}?`)) return;
        setDsGroups(prev => prev.filter((_, i) => i !== index));
        setMinimizedFlows(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddDependency = (groupIndex: number) => {
        setDsGroups(prev => {
            const newGroups = [...prev];
            const group = { ...newGroups[groupIndex] };
            group.dependencies = [
                ...group.dependencies,
                {
                    ...createFlowTemplate(),
                    dependencies: undefined // Dependents don't have nested dependencies
                }
            ];
            newGroups[groupIndex] = group;
            return newGroups;
        });
        setMinimizedFlows(prev => {
            const next = [...prev];
            next[groupIndex] = [...next[groupIndex], false];
            return next;
        });
    };

    const handleRemoveDependency = (groupIndex: number, index: number) => {
        setDsGroups(prev => {
            const newGroups = [...prev];
            const group = { ...newGroups[groupIndex] };
            group.dependencies = group.dependencies.filter((_, i) => i !== index);
            newGroups[groupIndex] = group;
            return newGroups;
        });
    };

    const handleFlowChange = (groupIndex: number, flowIndex: number, field: string, value: any) => {
        setDsGroups(prev => {
            const newGroups = [...prev];
            const group = { ...newGroups[groupIndex] };
            if (flowIndex === 0) {
                group.main = { ...group.main, [field]: value };
                if (field === 'startDate') group.main.expiryDate = calculateExpiry(value);
            } else {
                const newDeps = [...group.dependencies];
                newDeps[flowIndex - 1] = { ...newDeps[flowIndex - 1], [field]: value };
                if (field === 'startDate') newDeps[flowIndex - 1].expiryDate = calculateExpiry(value);
                group.dependencies = newDeps;
            }
            newGroups[groupIndex] = group;
            return newGroups;
        });
    };



    const handleSlotFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeOp) return;

        setIsSubmitting(true);
        try {
            const response = await uploadDocument(activeOp.contactId, file, false, 'Appointment Confirmation');

            const updatedOp = {
                ...activeOp,
                slotBookingData: {
                    ...activeOp.slotBookingData,
                    appointmentConfirmationDocId: response.id,
                    appointmentConfirmationDocName: response.name
                }
            };

            setActiveOp(updatedOp);
            setOperations(prev => prev.map(op => op.id === updatedOp.id ? updatedOp : op));
            setSlotFormData(prev => ({
                ...prev,
                appointmentConfirmationDocId: response.id,
                appointmentConfirmationDocName: response.name
            }));
            alert('Appointment confirmation document uploaded successfully!');
        } catch (error) {
            console.error('Failed to upload document:', error);
            alert('Failed to upload document. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSlotFileDelete = async () => {
        if (!activeOp || !slotFormData.appointmentConfirmationDocId) return;

        if (!window.confirm('Are you sure you want to delete this document?')) return;

        setIsSubmitting(true);
        try {
            await deleteDocument(slotFormData.appointmentConfirmationDocId);

            const updatedOp = {
                ...activeOp,
                slotBookingData: {
                    ...activeOp.slotBookingData,
                    appointmentConfirmationDocId: undefined,
                    appointmentConfirmationDocName: ''
                }
            };

            setActiveOp(updatedOp);
            setOperations(prev => prev.map(op => op.id === updatedOp.id ? updatedOp : op));
            setSlotFormData(prev => ({
                ...prev,
                appointmentConfirmationDocId: undefined,
                appointmentConfirmationDocName: ''
            }));
            alert('Appointment confirmation document deleted!');
        } catch (error) {
            console.error('Failed to delete document:', error);
            alert('Failed to delete document. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredOperations = useMemo(() => {
        return operations.filter(op => {
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

            let matchesFilterType = true;
            if (filterType === 'slots_not_booked') {
                matchesFilterType = !op.slotBookingData?.vacDate && !op.slotBookingData?.viDate;
            } else if (filterType === 'ds160_not_submitted') {
                matchesFilterType = !op.dsData?.confirmationDocumentId;
            }

            // Tab logic
            const hasOutcome = !!op.visaInterviewData?.visaOutcome;
            const matchesTab = activeTab === 'Ongoing' ? !hasOutcome : hasOutcome;

            return matchesSearch && matchesDate && matchesFilterType && matchesTab;
        });
    }, [operations, listSearchQuery, startDate, endDate, filterType, activeTab]);

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
            setOperations(prev => [newOp, ...prev]);
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
            setOperations(prev => prev.map(op => op.id === updatedOp.id ? updatedOp : op));
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
                slotBookingData: {
                    ...slotFormData,
                    appointmentConfirmationDocId: slotFormData.appointmentConfirmationDocId,
                    appointmentConfirmationDocName: slotFormData.appointmentConfirmationDocName
                },
                visaInterviewData: interviewFormData,
                status: interviewFormData.visaOutcome ? `Visa ${interviewFormData.visaOutcome}` : activeOp.status
            });
            setActiveOp(updatedOp);
            setOperations(prev => prev.map(op => op.id === updatedOp.id ? updatedOp : op));
            setStep('detail');
            alert('Slot booking details saved successfully!');
        } catch (error) {
            console.error('Failed to save slot data:', error);
            alert('Failed to save slot data. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveDs = async () => {
        if (!activeOp) return;
        setIsSubmitting(true);
        try {
            const updatedOp = await updateVisaOperationDs160(activeOp.id, dsGroups);
            setActiveOp(updatedOp);
            setOperations(prev => prev.map(op => op.id === updatedOp.id ? updatedOp : op));
            setStep('detail');
            alert('DS-160 Groups saved successfully!');
        } catch (error) {
            console.error('Failed to save DS-160 data:', error);
            alert('Failed to save DS-160 data. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDsFileUpload = async (groupIndex: number, flowIndex: number, e: React.ChangeEvent<HTMLInputElement>, type: 'internal' | 'filling' | 'confirmation' = 'internal') => {
        const file = e.target.files?.[0];
        if (!file || !activeOp) return;

        setIsSubmitting(true);
        try {
            const updatedOp = await uploadDs160Document(activeOp.id, file, type, groupIndex, flowIndex);
            setActiveOp(updatedOp);
            setOperations(prev => prev.map(op => op.id === updatedOp.id ? updatedOp : op));

            // Sync local state
            setDsGroups(prev => {
                const newGroups = [...prev];
                const group = { ...newGroups[groupIndex] };
                let target;
                if (flowIndex === 0) target = group.main = { ...group.main };
                else target = group.dependencies[flowIndex - 1] = { ...group.dependencies[flowIndex - 1] };

                if (type === 'filling') {
                    target.fillingDocuments = [...(target.fillingDocuments || []), { id: updatedOp.dsData[groupIndex].main.fillingDocuments.slice(-1)[0].id, name: file.name }];
                } else if (type === 'confirmation') {
                    // Update confirmation info from updatedOp
                    const freshTarget = flowIndex === 0 ? updatedOp.dsData[groupIndex].main : updatedOp.dsData[groupIndex].dependencies[flowIndex - 1];
                    target.confirmationDocumentId = freshTarget.confirmationDocumentId;
                    target.confirmationDocumentName = freshTarget.confirmationDocumentName;
                } else {
                    target.internalDocuments = [...(target.internalDocuments || []), { id: updatedOp.dsData[groupIndex].main.internalDocuments.slice(-1)[0].id, name: file.name }];
                    target.documentId = target.internalDocuments.slice(-1)[0].id;
                    target.documentName = file.name;
                }

                newGroups[groupIndex] = group;
                return newGroups;
            });
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ... inside render ...

    const handleDsFileDelete = async (groupIndex: number, flowIndex: number, itemId: number) => {
        if (!activeOp || !confirm('Are you sure you want to delete this document?')) return;

        setIsSubmitting(true);
        try {
            const updatedOp = await deleteDs160Document(activeOp.id, itemId);
            setActiveOp(updatedOp);
            setOperations(prev => prev.map(op => op.id === updatedOp.id ? updatedOp : op));

            // Sync local state
            setDsGroups(prev => {
                const newGroups = [...prev];
                const group = { ...newGroups[groupIndex] };
                let target;
                if (flowIndex === 0) target = group.main = { ...group.main };
                else target = group.dependencies[flowIndex - 1] = { ...group.dependencies[flowIndex - 1] };

                target.internalDocuments = (target.internalDocuments || []).filter((d: any) => d.id !== itemId);
                target.fillingDocuments = (target.fillingDocuments || []).filter((d: any) => d.id !== itemId);
                if (target.documentId === itemId) {
                    target.documentId = undefined;
                    target.documentName = '';
                }
                if (target.confirmationDocumentId === itemId) {
                    target.confirmationDocumentId = undefined;
                    target.confirmationDocumentName = '';
                }

                newGroups[groupIndex] = group;
                return newGroups;
            });
            alert('Document deleted successfully!');
        } catch (error) {
            console.error('Failed to delete DS-160 document:', error);
            alert('Failed to delete document. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteOperation = async () => {
        if (!activeOp || !window.confirm('Are you sure you want to delete this visa operation? This action cannot be undone.')) return;
        setIsSubmitting(true);
        try {
            await deleteVisaOperation(activeOp.id);
            setOperations(prev => prev.filter(op => op.id !== activeOp.id));
            setActiveOp(null);
            setStep('list');
            alert('Visa operation deleted successfully!');
        } catch (error) {
            console.error('Failed to delete visa operation:', error);
            alert('Failed to delete visa operation. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    function calculateExpiry(startDate: string) {
        if (!startDate) return '';
        const date = new Date(startDate);
        date.setDate(date.getDate() + 20);
        return date.toISOString().split('T')[0];
    }

    const handleDsStatusUpdate = async (groupIndex: number, flowIndex: number, data: { studentStatus?: string, adminStatus?: string, rejectionReason?: string }) => {
        if (!activeOp) return;
        setIsSubmitting(true);
        try {
            const updatedOp = await updateDs160Status(activeOp.id, { ...data, groupIndex, flowIndex });
            setActiveOp(updatedOp);
            setOperations(prev => prev.map(op => op.id === updatedOp.id ? updatedOp : op));

            // Sync local state
            setDsGroups(prev => {
                const newGroups = [...prev];
                const group = { ...newGroups[groupIndex] };
                let target;
                if (flowIndex === 0) target = group.main = { ...group.main };
                else target = group.dependencies[flowIndex - 1] = { ...group.dependencies[flowIndex - 1] };

                Object.assign(target, data);
                if (data.adminStatus === 'accepted') {
                    target.adminName = user?.name;
                }

                newGroups[groupIndex] = group;
                return newGroups;
            });
            alert('DS-160 status updated successfully!');
        } catch (error) {
            console.error('Failed to update DS-160 status:', error);
            alert('Failed to update status. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePreviewFile = async (documentId: number) => {
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE_URL}/visa-operations/items/${documentId}?preview=true`, {
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
            });
            if (!response.ok) throw new Error('Failed to fetch document');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error('Preview failed:', error);
            alert('Could not preview document.');
        }
    };

    const handleDownloadFile = async (documentId: number, filename: string) => {
        try {
            await downloadVisaOperationItem(documentId, filename);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Could not download document.');
        }
    };

    const renderDsApplicant = (groupIndex: number, flowIndex: number, data: any) => {
        const isMain = flowIndex === 0;
        const title = isMain ? "Main Applicant" : `Dependent #${flowIndex}`;

        return (
            <div className={`bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative ${!isMain ? 'mt-6' : ''}`}>
                {!isMain && (
                    <div className="absolute -top-3 -right-3">
                        <button
                            onClick={() => handleRemoveDependency(groupIndex, flowIndex - 1)}
                            className="p-2 bg-white text-slate-400 hover:text-rose-600 rounded-full border border-slate-200 shadow-sm transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                    <div className={`p-2 rounded-lg ${isMain ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'}`}>
                        {isMain ? <UserIcon size={20} /> : <UsersIcon size={18} />}
                    </div>
                    <h4 className="text-lg font-bold text-slate-800">{title}</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Details */}
                    <div className="space-y-6">
                        <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Confirmation Number</label>
                                <input
                                    type="text"
                                    value={data.confirmationNumber || ''}
                                    onChange={(e) => handleFlowChange(groupIndex, flowIndex, 'confirmationNumber', e.target.value.toUpperCase())}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all font-mono font-bold text-slate-700"
                                    placeholder="AA00XXXXXX"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Start Date</label>
                                <input
                                    type="date"
                                    value={data.startDate || ''}
                                    onChange={(e) => handleFlowChange(groupIndex, flowIndex, 'startDate', e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all text-sm font-medium"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Expiry Date</label>
                                <input type="date" readOnly value={data.expiryDate || ''} className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-400 text-sm font-medium cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Surname (First 5)</label>
                                <input
                                    type="text"
                                    value={data.surname || ''}
                                    onChange={(e) => handleFlowChange(groupIndex, flowIndex, 'surname', e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5))}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all text-sm font-medium"
                                    placeholder="ABCDE"
                                    maxLength={5}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Year of Birth</label>
                                <input
                                    type="text"
                                    value={data.yearOfBirth || ''}
                                    onChange={(e) => handleFlowChange(groupIndex, flowIndex, 'yearOfBirth', e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all text-sm font-medium"
                                    placeholder="YYYY"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-tight">Basic DS Box</label>
                            <textarea
                                rows={3}
                                value={data.basicDsBox || ''}
                                onChange={(e) => handleFlowChange(groupIndex, flowIndex, 'basicDsBox', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all text-sm font-medium resize-none"
                                placeholder="Enter details..."
                            />
                        </div>
                    </div>

                    {/* Right Column: Documentation & Status */}
                    <div className="space-y-6">
                        <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Documentation</h4>

                        {/* Internal Resource Section */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Internal Resource</label>
                            <input
                                type="file"
                                id={`upload-internal-${groupIndex}-${flowIndex}`}
                                className="hidden"
                                onChange={(e) => handleDsFileUpload(groupIndex, flowIndex, e, 'internal')}
                            />
                            <label
                                htmlFor={`upload-internal-${groupIndex}-${flowIndex}`}
                                className="flex items-center justify-center gap-2 bg-white text-slate-600 px-5 py-2 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer border border-slate-200 shadow-sm"
                            >
                                <Upload size={14} /> Upload Document
                            </label>
                            <div className="mt-3 space-y-2">
                                {data.internalDocuments?.map((doc: any) => (
                                    <div key={doc.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100">
                                        <span className="text-xs font-medium text-slate-600 truncate max-w-[150px]">{doc.name}</span>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handlePreviewFile(doc.id)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Eye size={12} /></button>
                                            <button onClick={() => handleDsFileDelete(groupIndex, flowIndex, doc.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded"><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Customer Review Section */}
                        <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-4">
                            <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase">
                                <FileText size={14} /> Customer Review (Filling)
                            </div>
                            <input
                                type="file"
                                id={`upload-filling-${groupIndex}-${flowIndex}`}
                                className="hidden"
                                onChange={(e) => handleDsFileUpload(groupIndex, flowIndex, e, 'filling')}
                            />
                            <label
                                htmlFor={`upload-filling-${groupIndex}-${flowIndex}`}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer shadow-sm"
                            >
                                <Upload size={14} /> {data.fillingDocuments?.length ? 'Add Another' : 'Upload Filling'}
                            </label>
                            <div className="space-y-2">
                                {data.fillingDocuments?.map((doc: any) => (
                                    <div key={doc.id} className="flex items-center justify-between bg-white/60 p-2 rounded-lg border border-blue-100">
                                        <span className="text-xs font-bold text-blue-700 truncate max-w-[150px]">{doc.name}</span>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handlePreviewFile(doc.id)} className="p-1 text-blue-600 hover:bg-white rounded"><Eye size={12} /></button>
                                            <button onClick={() => handleDsFileDelete(groupIndex, flowIndex, doc.id)} className="p-1 text-rose-500 hover:bg-white rounded"><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Status Sections */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl border ${data.studentStatus === 'accepted' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Filling Status</span>
                                {data.studentStatus === 'accepted' ? (
                                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                                        <CheckCircle size={14} /> Accepted
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleDsStatusUpdate(groupIndex, flowIndex, { studentStatus: 'accepted' })}
                                        className="w-full py-1.5 bg-white text-slate-600 rounded-lg text-[9px] font-bold uppercase tracking-wider border border-slate-200 hover:bg-slate-50"
                                    >
                                        Mark as Accepted
                                    </button>
                                )}
                            </div>
                            <div className={`p-4 rounded-xl border ${data.adminStatus === 'accepted' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Academy Director Verification</span>
                                {data.adminStatus === 'accepted' ? (
                                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                                        <ShieldCheck size={14} /> Verified
                                    </div>
                                ) : (
                                    <div className="flex gap-1.5">
                                        <button onClick={() => handleDsStatusUpdate(groupIndex, flowIndex, { adminStatus: 'accepted' })} className="flex-1 py-1.5 bg-emerald-600 text-white rounded-lg text-[9px] font-bold uppercase hover:bg-emerald-700">Accept</button>
                                        <button onClick={() => handleDsStatusUpdate(groupIndex, flowIndex, { adminStatus: 'rejected' })} className="flex-1 py-1.5 bg-rose-600 text-white rounded-lg text-[9px] font-bold uppercase hover:bg-rose-700">Reject</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Final Confirmation */}
                        {data.studentStatus === 'accepted' && data.adminStatus === 'accepted' && (
                            <div className="p-4 bg-slate-800 rounded-xl text-white shadow-lg space-y-3">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Final Confirmation</div>
                                <input
                                    type="file"
                                    id={`upload-conf-${groupIndex}-${flowIndex}`}
                                    className="hidden"
                                    onChange={(e) => handleDsFileUpload(groupIndex, flowIndex, e, 'confirmation')}
                                />
                                <label
                                    htmlFor={`upload-conf-${groupIndex}-${flowIndex}`}
                                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer shadow-sm"
                                >
                                    <Upload size={14} /> {data.confirmationDocumentId ? 'Replace File' : 'Upload Final Confirmation'}
                                </label>
                                {data.confirmationDocumentName && (
                                    <div className="flex items-center justify-between bg-white/10 p-2 rounded-lg border border-white/10">
                                        <span className="text-xs font-medium truncate flex-1 pr-2">{data.confirmationDocumentName}</span>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handlePreviewFile(data.confirmationDocumentId!)} className="p-1 hover:bg-white/10 rounded"><Eye size={12} /></button>
                                            <button onClick={() => handleDsFileDelete(groupIndex, flowIndex, data.confirmationDocumentId!)} className="p-1 text-rose-300 hover:bg-white/10 rounded"><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
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

                {/* Tabs */}
                <div className="flex gap-2 p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl w-fit border border-slate-100 dark:border-slate-700">
                    <button
                        onClick={() => setActiveTab('Ongoing')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'Ongoing'
                            ? 'bg-white dark:bg-slate-700 text-lyceum-blue shadow-md'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Ongoing Visa operations
                    </button>
                    <button
                        onClick={() => setActiveTab('Completed')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'Completed'
                            ? 'bg-white dark:bg-slate-700 text-lyceum-blue shadow-md'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Completed Visa operations
                    </button>
                </div>

                {/* Information Hub */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                        onClick={() => setFilterType(filterType === 'slots_not_booked' ? 'all' : 'slots_not_booked')}
                        className={`p-6 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between group relative overflow-hidden ${filterType === 'slots_not_booked' ? 'bg-amber-50 border-amber-300 shadow-md ring-2 ring-amber-500/20 transform scale-[1.01]' : 'bg-white border-slate-200 hover:border-amber-200 hover:bg-amber-50/30 hover:shadow-sm hover:-translate-y-0.5'}`}
                    >
                        <div className="relative z-10">
                            <p className={`text-xs font-bold uppercase tracking-wider mb-1 transition-colors ${filterType === 'slots_not_booked' ? 'text-amber-800' : 'text-slate-500 group-hover:text-amber-700'}`}>Slots Not Booked</p>
                            <h3 className={`text-3xl font-black transition-colors ${filterType === 'slots_not_booked' ? 'text-amber-600' : 'text-slate-800 group-hover:text-amber-600'}`}>{slotsNotBookedCount}</h3>
                        </div>
                        <div className={`p-4 rounded-xl relative z-10 transition-colors ${filterType === 'slots_not_booked' ? 'bg-amber-100 text-amber-600 shadow-inner' : 'bg-slate-50 text-slate-400 group-hover:bg-amber-100 group-hover:text-amber-600'}`}>
                            <Calendar size={28} />
                        </div>
                        {filterType === 'slots_not_booked' && (
                            <div className="absolute top-3 right-3 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </div>
                        )}
                        <div className={`absolute -right-10 -bottom-10 w-32 h-32 rounded-full transition-all duration-500 blur-2xl z-0 ${filterType === 'slots_not_booked' ? 'bg-amber-400/20 opacity-100' : 'bg-amber-400/0 opacity-0 group-hover:bg-amber-400/10 group-hover:opacity-100'}`}></div>
                    </div>

                    <div
                        onClick={() => setFilterType(filterType === 'ds160_not_submitted' ? 'all' : 'ds160_not_submitted')}
                        className={`p-6 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between group relative overflow-hidden ${filterType === 'ds160_not_submitted' ? 'bg-rose-50 border-rose-300 shadow-md ring-2 ring-rose-500/20 transform scale-[1.01]' : 'bg-white border-slate-200 hover:border-rose-200 hover:bg-rose-50/30 hover:shadow-sm hover:-translate-y-0.5'}`}
                    >
                        <div className="relative z-10">
                            <p className={`text-xs font-bold uppercase tracking-wider mb-1 transition-colors ${filterType === 'ds160_not_submitted' ? 'text-rose-800' : 'text-slate-500 group-hover:text-rose-700'}`}>DS-160 Not Submitted</p>
                            <h3 className={`text-3xl font-black transition-colors ${filterType === 'ds160_not_submitted' ? 'text-rose-600' : 'text-slate-800 group-hover:text-rose-600'}`}>{ds160NotSubmittedCount}</h3>
                        </div>
                        <div className={`p-4 rounded-xl relative z-10 transition-colors ${filterType === 'ds160_not_submitted' ? 'bg-rose-100 text-rose-600 shadow-inner' : 'bg-slate-50 text-slate-400 group-hover:bg-rose-100 group-hover:text-rose-600'}`}>
                            <FileText size={28} />
                        </div>
                        {filterType === 'ds160_not_submitted' && (
                            <div className="absolute top-3 right-3 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                            </div>
                        )}
                        <div className={`absolute -right-10 -bottom-10 w-32 h-32 rounded-full transition-all duration-500 blur-2xl z-0 ${filterType === 'ds160_not_submitted' ? 'bg-rose-400/20 opacity-100' : 'bg-rose-400/0 opacity-0 group-hover:bg-rose-400/10 group-hover:opacity-100'}`}></div>
                    </div>
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
                                                    {(() => {
                                                        const mainDsData = Array.isArray(op.dsData) ? op.dsData[0]?.main : op.dsData;
                                                        const allDependencies = Array.isArray(op.dsData)
                                                            ? op.dsData.flatMap((g: any) => g.dependencies || [])
                                                            : (op.dsData?.dependencies || []);

                                                        if ((mainDsData?.studentStatus === 'accepted' && mainDsData?.adminStatus === 'pending') ||
                                                            allDependencies.some((d: any) => d.studentStatus === 'accepted' && d.adminStatus === 'pending')) {
                                                            return (
                                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 border border-purple-200 rounded-md animate-pulse">
                                                                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                                                                    <span className="text-[9px] font-black text-purple-700 uppercase tracking-tighter">Waiting for Admin Approval</span>
                                                                </div>
                                                            );
                                                        } else if (mainDsData?.confirmationDocumentId &&
                                                            (allDependencies.every((d: any) => d.confirmationDocumentId))) {
                                                            return (
                                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-md">
                                                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                                                    <span className="text-[9px] font-black text-emerald-700 uppercase tracking-tighter">Process Completed</span>
                                                                </div>
                                                            );
                                                        } else if (mainDsData?.adminStatus === 'accepted') {
                                                            return (
                                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-lyceum-blue/5 border border-lyceum-blue/10 rounded-md">
                                                                    <div className="w-1.5 h-1.5 bg-lyceum-blue rounded-full animate-pulse"></div>
                                                                    <span className="text-[9px] font-black text-lyceum-blue uppercase tracking-tighter">Waiting for DS-160 Submission</span>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveOp(op);
                                                            setStep('ds');
                                                        }}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${op.dsData
                                                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100'
                                                            : 'bg-lyceum-blue/5 text-lyceum-blue hover:bg-lyceum-blue hover:text-white border-lyceum-blue/10'
                                                            }`}
                                                    >
                                                        {op.dsData ? (
                                                            <>
                                                                <Eye size={12} />
                                                                View DS-160
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Play size={12} />
                                                                Start DS
                                                            </>
                                                        )}
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

                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Appointment Confirmation</h3>
                                <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl space-y-4">
                                    <p className="text-sm text-slate-600 font-medium mb-4">Upload the final appointment confirmation document to make it available in the student's portal.</p>

                                    <div className="flex items-center gap-4">
                                        <input
                                            type="file"
                                            id="slot-document-upload"
                                            className="hidden"
                                            onChange={handleSlotFileUpload}
                                        />
                                        <label
                                            htmlFor="slot-document-upload"
                                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-all cursor-pointer shadow-lg shadow-blue-600/20"
                                        >
                                            <Upload size={20} />
                                            {slotFormData.appointmentConfirmationDocName ? 'Replace Document' : 'Upload Document'}
                                        </label>

                                        {slotFormData.appointmentConfirmationDocName && (
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-slate-600 font-medium truncate max-w-xs">{slotFormData.appointmentConfirmationDocName}</span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handlePreviewFile(slotFormData.appointmentConfirmationDocId!)}
                                                        className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-2 py-1 rounded-md border border-blue-100"
                                                    >
                                                        <Eye size={12} />
                                                        Preview
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadFile(slotFormData.appointmentConfirmationDocId!, slotFormData.appointmentConfirmationDocName!)}
                                                        className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-2 py-1 rounded-md border border-blue-100"
                                                    >
                                                        <Download size={12} />
                                                        Download
                                                    </button>
                                                    <button
                                                        onClick={handleSlotFileDelete}
                                                        className="flex items-center gap-1 text-[10px] font-bold text-rose-600 hover:text-rose-800 transition-colors bg-rose-50 px-2 py-1 rounded-md border border-rose-100"
                                                    >
                                                        <Trash2 size={12} />
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        )}
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

    if (step === 'ds') {
        return (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 lg:p-10 animate-in fade-in duration-300">
                <div className="bg-white w-full max-w-7xl h-full max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95 duration-300">
                    {/* Header */}
                    <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-xl sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-blue-600 text-white rounded-[1.5rem] shadow-lg shadow-blue-600/20">
                                <FileText size={28} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-slate-800 tracking-tight">DS-160 Workflow</h2>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Multi-Group Application management</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleAddNewGroup}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl active:scale-95"
                            >
                                <Plus size={16} /> Add New Group
                            </button>
                            <button
                                onClick={() => setStep('detail')}
                                className="p-4 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-2xl transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-10 space-y-12">
                        {dsGroups.map((group, gIdx) => (
                            <div key={gIdx} className="space-y-6 animate-in slide-in-from-bottom-5 duration-500" style={{ animationDelay: `${gIdx * 100}ms` }}>
                                {/* Group Header */}
                                <div className="flex items-center justify-between group/header">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 font-black text-xl border-2 border-slate-200">
                                            #{gIdx + 1}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                                                {gIdx === 0 ? "Group" : `Group #${gIdx + 1}`}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    {group.dependencies?.length || 0} Dependents
                                                </span>
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                                                <button
                                                    onClick={() => handleAddDependency(gIdx)}
                                                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 transition-colors"
                                                >
                                                    + Add Family Member
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {dsGroups.length > 1 && (
                                            <button
                                                onClick={() => { if (confirm('Delete entire group?')) setDsGroups(prev => prev.filter((_, i) => i !== gIdx)); }}
                                                className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover/header:opacity-100"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setDsGroups(prev => {
                                                const next = [...prev];
                                                next[gIdx] = { ...next[gIdx], minimized: !next[gIdx].minimized };
                                                return next;
                                            })}
                                            className="p-3 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                                        >
                                            {group.minimized ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
                                        </button>
                                    </div>
                                </div>

                                {!group.minimized && (
                                    <div className="grid grid-cols-1 gap-8 pl-16 relative">
                                        {/* Connector Line */}
                                        <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-slate-200 to-transparent rounded-full"></div>

                                        {/* Main Applicant */}
                                        <div className="relative">
                                            <div className="absolute -left-[2.75rem] top-10 w-6 h-1 bg-slate-200 rounded-full"></div>
                                            {renderDsApplicant(gIdx, 0, group.main)}
                                        </div>

                                        {/* Dependents */}
                                        {group.dependencies?.map((dep, dIdx) => (
                                            <div key={dIdx} className="relative">
                                                <div className="absolute -left-[2.75rem] top-10 w-6 h-1 bg-slate-200 rounded-full"></div>
                                                {renderDsApplicant(gIdx, dIdx + 1, dep)}
                                            </div>
                                        ))}

                                        {group.dependencies?.length === 0 && (
                                            <button
                                                onClick={() => handleAddDependency(gIdx)}
                                                className="w-full py-8 border-2 border-dashed border-slate-100 rounded-[2rem] text-slate-400 font-bold hover:border-blue-200 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center gap-2 group"
                                            >
                                                <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                                                    <UsersIcon size={24} />
                                                </div>
                                                <span className="text-sm">No dependents added. Click to add a family member.</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Footer - Fixed */}
                    <div className="px-10 py-8 border-t border-slate-100 bg-slate-50/80 backdrop-blur-md flex justify-end gap-4">
                        <button
                            onClick={() => setStep('detail')}
                            className="px-8 py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 rounded-2xl transition-all"
                        >
                            Cancel Changes
                        </button>
                        <button
                            onClick={handleSaveDs}
                            disabled={isSubmitting}
                            className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 active:scale-95 flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck size={18} />
                                    Finalize All Persistence
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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
                    <button
                        onClick={() => {
                            const dsData = activeOp?.dsData;
                            let groups: any[] = [];
                            if (Array.isArray(dsData)) {
                                groups = dsData;
                            } else if (dsData) {
                                // Migrate legacy object
                                const main = { ...dsData };
                                const deps = main.dependencies || [];
                                delete main.dependencies;
                                groups = [{ main, dependencies: deps, minimized: false }];
                            } else {
                                // Default initial group
                                groups = [{
                                    main: createFlowTemplate(),
                                    dependencies: [],
                                    minimized: false
                                }];
                            }
                            setDsGroups(groups);
                            setMinimizedFlows(groups.map(g => [false, ...(g.dependencies || []).map(() => false)]));
                            setStep('ds');
                        }}
                        className="flex-1 md:flex-none px-8 py-3 bg-lyceum-blue text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-lyceum-blue/20 flex items-center justify-center gap-2"
                    >
                        {activeOp?.dsData?.confirmationNumber ? 'View DS-160' : 'Start DS'}
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
                                preferencesLocked: activeOp?.slotBookingData?.preferencesLocked || false,
                                appointmentConfirmationDocId: activeOp?.slotBookingData?.appointmentConfirmationDocId,
                                appointmentConfirmationDocName: activeOp?.slotBookingData?.appointmentConfirmationDocName || ''
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
                    {user?.role === 'Admin' && (
                        <button
                            onClick={handleDeleteOperation}
                            disabled={isSubmitting}
                            className="flex-1 md:flex-none px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/20 disabled:opacity-50"
                            title="Delete Operation"
                        >
                            <Trash2 size={20} />
                            <span className="md:hidden lg:inline">Delete</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 col-span-1 md:col-span-2">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <FileText className="text-lyceum-blue" size={20} />
                                    DS-160 Status
                                </h3>
                                <button
                                    onClick={() => setStep('ds')}
                                    className="text-xs font-bold text-lyceum-blue hover:text-blue-700 flex items-center gap-1 bg-lyceum-blue/5 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    Manage Workflow <ArrowRight size={12} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Student Status */}
                                <div className={`p-4 rounded-xl border ${activeOp?.dsData?.studentStatus === 'accepted' ? 'bg-emerald-50 border-emerald-100' : activeOp?.dsData?.studentStatus === 'rejected' ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Student Review</span>
                                    <div className="flex items-center gap-2 mt-2">
                                        {activeOp?.dsData?.studentStatus === 'accepted' ? (
                                            <CheckCircle size={18} className="text-emerald-500" />
                                        ) : activeOp?.dsData?.studentStatus === 'rejected' ? (
                                            <AlertCircle size={18} className="text-rose-500" />
                                        ) : (
                                            <Clock size={18} className="text-slate-400" />
                                        )}
                                        <span className={`text-sm font-bold ${activeOp?.dsData?.studentStatus === 'accepted' ? 'text-emerald-700' : activeOp?.dsData?.studentStatus === 'rejected' ? 'text-rose-700' : 'text-slate-600'}`}>
                                            {activeOp?.dsData?.studentStatus === 'accepted' ? 'Approved' : activeOp?.dsData?.studentStatus === 'rejected' ? 'Rejected' : 'Pending'}
                                        </span>
                                    </div>
                                </div>

                                {/* Admin Status */}
                                <div className={`p-4 rounded-xl border ${activeOp?.dsData?.adminStatus === 'accepted' ? 'bg-emerald-50 border-emerald-100' : activeOp?.dsData?.adminStatus === 'rejected' ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Admin Approval</span>
                                    <div className="flex items-center gap-2 mt-2">
                                        {activeOp?.dsData?.adminStatus === 'accepted' ? (
                                            <CheckCircle size={18} className="text-emerald-500" />
                                        ) : activeOp?.dsData?.adminStatus === 'rejected' ? (
                                            <AlertCircle size={18} className="text-rose-500" />
                                        ) : (
                                            <Clock size={18} className="text-slate-400" />
                                        )}
                                        <span className={`text-sm font-bold ${activeOp?.dsData?.adminStatus === 'accepted' ? 'text-emerald-700' : activeOp?.dsData?.adminStatus === 'rejected' ? 'text-rose-700' : 'text-slate-600'}`}>
                                            {activeOp?.dsData?.adminStatus === 'accepted' ? 'Approved' : activeOp?.dsData?.adminStatus === 'rejected' ? 'Rejected' : 'Pending'}
                                        </span>
                                    </div>
                                </div>

                                {/* Confirmation Details */}
                                <div className="p-4 rounded-xl border bg-slate-50 border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Confirmation No.</span>
                                    <div className="flex items-center gap-2 mt-2">
                                        <FileText size={18} className="text-slate-400" />
                                        <p className="font-mono font-bold text-slate-700 text-sm">
                                            {activeOp?.dsData?.confirmationNumber || 'Not Generated'}
                                        </p>
                                    </div>
                                </div>
                            </div>
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
                                        {activeOp.slotBookingData.appointmentConfirmationDocId && (
                                            <div className="space-y-2 pt-4 border-t border-blue-100/50">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirmation Document</span>
                                                <div className="flex items-center gap-3 bg-white/50 p-2 rounded-xl border border-blue-100">
                                                    <FileText size={16} className="text-blue-500" />
                                                    <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{activeOp.slotBookingData.appointmentConfirmationDocName}</span>
                                                    <div className="ml-auto flex items-center gap-1">
                                                        <button
                                                            onClick={() => handlePreviewFile(activeOp.slotBookingData!.appointmentConfirmationDocId!)}
                                                            className="p-1 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                                                            title="Preview"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDownloadFile(activeOp.slotBookingData!.appointmentConfirmationDocId!, activeOp.slotBookingData!.appointmentConfirmationDocName!)}
                                                            className="p-1 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                                                            title="Download"
                                                        >
                                                            <Download size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
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

                    {/* Visa History & Other Attempts */}
                    {(() => {
                        const historyOps = existingOperations
                            .filter(op => op.contactId === activeOp?.contactId && op.id !== activeOp?.id)
                            .sort((a, b) => b.id - a.id);

                        if (historyOps.length > 0) {
                            return (
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                                        <Clock className="text-slate-400" size={20} />
                                        Visa History
                                    </h3>
                                    <div className="space-y-3">
                                        {historyOps.map(op => (
                                            <div
                                                key={op.id}
                                                onClick={() => setActiveOp(op)}
                                                className="p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors group"
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-mono text-xs font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 group-hover:border-lyceum-blue/30 group-hover:text-lyceum-blue transition-colors">
                                                        {op.vopNumber}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {new Date(op.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <span className="text-sm font-bold text-slate-700">{op.country}</span>
                                                    <ArrowRight size={14} className="text-slate-300 group-hover:text-lyceum-blue transform group-hover:translate-x-1 transition-all" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}
                </div>
            </div>
        </div>
    );
};
