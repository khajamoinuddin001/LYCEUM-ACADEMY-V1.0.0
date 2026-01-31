import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, Sparkles, MailPlus, Flag, PlusCircle, StickyNote, Video as VideoIcon, CheckCircle2, VideoOff, Camera, Plus, Trash2, ChevronDown, Upload } from './icons';
import type { Contact, FileStatus, User, ContactActivity, ContactActivityAction, RecordedSession, AccountingTransaction, TodoTask } from '../types';
import { summarizeText } from '../utils/gemini';
import VideoRecordingModal from './video_recording_modal';
import CameraModal from './camera_modal';
import { uploadContactPhoto } from '../utils/api';
import ContactCrmView from './contact_crm_view';

interface NewContactFormProps {
    contact?: Contact;
    contacts: Contact[];
    onNavigateBack: () => void;
    onNavigateToDocuments: () => void;
    onNavigateToVisa: () => void;
    onNavigateToChecklist: () => void;
    onNavigateToVisits: () => void;
    onNavigateToCRM: () => void;
    onNavigateToTasks: () => void;
    onSave: (contact: Contact) => Promise<Contact | null>;
    onComposeAIEmail: (prompt: string, contact: Contact) => void;
    user: User;
    users: User[]; // Added for staff dropdown
    onAddSessionVideo: (contactId: number, videoBlob: Blob) => Promise<void>;
    onDeleteSessionVideo: (contactId: number, sessionId: number) => Promise<void>;
    transactions?: AccountingTransaction[];
    tasks?: TodoTask[];
    onSaveTask?: (task: Partial<TodoTask>) => Promise<void>;
}

const SessionPlayer: React.FC<{
    session: RecordedSession;
    onDelete: (sessionId: number) => void;
    canWrite: boolean;
}> = ({ session, onDelete, canWrite }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchVideo = async () => {
            if (isOpen && !videoUrl) {
                setIsLoading(true);
                setError(null);
                try {
                    const { getVideo } = await import('../utils/db');
                    const blob = await getVideo(session.id);
                    if (isMounted && blob) {
                        setVideoUrl(URL.createObjectURL(blob));
                    } else if (isMounted) {
                        setError("Video not found in local database.");
                    }
                } catch (err) {
                    console.error("Failed to load video", err);
                    if (isMounted) setError("Failed to load video.");
                } finally {
                    if (isMounted) {
                        setIsLoading(false);
                    }
                }
            }
        };

        fetchVideo();

        return () => {
            isMounted = false;
            if (videoUrl) {
                URL.revokeObjectURL(videoUrl);
            }
        };
    }, [isOpen, session.id]);

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-md">
            <div className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50" onClick={() => setIsOpen(!isOpen)}>
                <div className="flex items-center overflow-hidden">
                    <VideoIcon size={16} className="mr-2 text-gray-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">
                        Session from {new Date(session.timestamp).toLocaleString()}
                    </span>
                </div>
                <div className="flex items-center flex-shrink-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
                        disabled={!canWrite}
                        className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-50"
                        title="Delete Session"
                    >
                        <Trash2 size={14} />
                    </button>
                    <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>
            {isOpen && (
                <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                    {isLoading ? (
                        <div className="w-full aspect-video bg-black rounded-md flex items-center justify-center text-white">Loading...</div>
                    ) : error ? (
                        <div className="w-full aspect-video bg-black rounded-md flex items-center justify-center text-red-500 text-sm p-2">{error}</div>
                    ) : videoUrl ? (
                        <video src={videoUrl} controls className="w-full rounded-md aspect-video bg-black"></video>
                    ) : null}
                </div>
            )}
        </div>
    );
};


const FormRow: React.FC<{ label: string; helpText?: string; children: React.ReactNode; }> = ({ label, helpText, children }) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start py-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center pt-1">
            {label}
            {helpText && (
                <span className="ml-2" title={helpText}>
                    <HelpCircle size={14} className="text-gray-400" />
                </span>
            )}
        </label>
        <div className="sm:col-span-2">
            {children}
        </div>
    </div>
);

const FormInput: React.FC<{
    name: string;
    value?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    disabled?: boolean;
}> = ({ name, value, onChange, placeholder, disabled }) => (
    <input
        type="text"
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-transparent text-gray-800 dark:text-gray-200 text-sm focus:outline-none placeholder:text-gray-400/80 disabled:opacity-70 disabled:cursor-not-allowed"
    />
);

const ActivityIcon: React.FC<{ action: ContactActivityAction }> = ({ action }) => {
    const iconMap: { [key in ContactActivityAction]: React.ReactNode } = {
        created: <PlusCircle size={16} />,
        note: <StickyNote size={16} />,
        status: <Flag size={16} />,
        checklist: <CheckCircle2 size={16} />,
        video_add: <VideoIcon size={16} />,
        video_remove: <VideoOff size={16} />,
    };
    return <div className="w-8 h-8 rounded-full flex items-center justify-center bg-lyceum-blue/10 text-lyceum-blue flex-shrink-0">{iconMap[action]}</div>;
};

const formatTimeAgo = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "just now";
}

const initialFormState = {
    name: '',
    avatarUrl: undefined as string | undefined,
    street1: '', street2: '', city: '', country: '', zip: '', state: '',
    gstin: '', referenceNumber: '', pan: '',
    phone: '', email: '', tags: '', visaType: '', countryOfApplication: '', source: '', contactType: '',
    majors: '', stream: '', course: '', intake: '',
    counselorAssigned: '', agentAssigned: '', applicationEmail: '', applicationPassword: '', fileStatus: '',
    notes: '',
};



const NewContactForm: React.FC<NewContactFormProps> = ({
    contact,
    contacts,
    onNavigateBack,
    onNavigateToDocuments,
    onNavigateToVisa,
    onNavigateToChecklist,
    onNavigateToVisits,
    onNavigateToCRM,
    onNavigateToTasks,
    onSave,
    onComposeAIEmail,
    user,
    users,
    onAddSessionVideo,
    onDeleteSessionVideo,
    transactions = [],
    tasks = [],
    onSaveTask
}) => {
    const [currentTab, setCurrentTab] = useState<'details' | 'finance' | 'crm'>('details');
    const [formData, setFormData] = useState(initialFormState);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    const [pendingPhotoBlob, setPendingPhotoBlob] = useState<Blob | null>(null);
    const avatarMenuRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isNew = !contact;
    const canWrite = user.role === 'Admin' || (isNew ? user.permissions?.['Contacts']?.create : user.permissions?.['Contacts']?.update);


    useEffect(() => {
        if (contact) {
            setFormData({
                ...initialFormState,
                name: contact.name || '',
                avatarUrl: contact.avatarUrl,
                email: contact.email || '',
                phone: contact.phone || '',
                referenceNumber: contact.contactId || '',
                course: contact.department || '',
                majors: contact.major || '',
                agentAssigned: contact.agentAssigned || '',
                notes: contact.notes || '',
                fileStatus: contact.fileStatus || '',
                street1: contact.street1 || '',
                street2: contact.street2 || '',
                city: contact.city || '',
                state: contact.state || '',
                zip: contact.zip || '',
                country: contact.country || '',
                gstin: contact.gstin || '',
                pan: contact.pan || '',
                tags: contact.tags || '',
                visaType: contact.visaType || '',
                countryOfApplication: contact.countryOfApplication || '',
                source: contact.source || '',
                contactType: contact.contactType || '',
                stream: contact.stream || '',
                intake: contact.intake || '',
                counselorAssigned: contact.counselorAssigned || '',
                applicationEmail: contact.applicationEmail || '',
                applicationPassword: contact.applicationPassword || '',
            });
        } else {
            // For new contacts, leave reference empty - backend will generate
            setFormData({
                ...initialFormState,
                referenceNumber: 'Auto-generated',
            });
        }
    }, [contact, contacts]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target as Node)) {
                setIsAvatarMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        return () => {
            if (formData.avatarUrl && formData.avatarUrl.startsWith('blob:')) {
                URL.revokeObjectURL(formData.avatarUrl);
            }
        };
    }, [formData.avatarUrl]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSummarize = async () => {
        if (!formData.notes.trim()) return;
        setIsSummarizing(true);
        try {
            const summary = await summarizeText(formData.notes);
            setFormData(prev => ({ ...prev, notes: summary }));
        } catch (error) {
            console.error("Failed to summarize notes:", error);
        } finally {
            setIsSummarizing(false);
        }
    };

    const handleComposeEmail = () => {
        if (!contact) return;
        const prompt = window.prompt("What should the email be about?");
        if (prompt) {
            onComposeAIEmail(prompt, contact);
        }
    };

    const handleSave = async () => {
        const contactToSave: Contact = {
            id: contact?.id || 0,
            name: formData.name,
            avatarUrl: formData.avatarUrl,
            contactId: contact?.contactId || undefined, // Let backend generate for new contacts
            department: formData.course,
            major: formData.majors,
            email: formData.email,
            phone: formData.phone,
            agentAssigned: formData.agentAssigned,
            notes: formData.notes,
            fileStatus: formData.fileStatus as FileStatus,
            documents: contact?.documents,
            visaInformation: contact?.visaInformation,
            checklist: contact?.checklist,
            activityLog: contact?.activityLog,
            recordedSessions: contact?.recordedSessions,
            street1: formData.street1,
            street2: formData.street2,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
            country: formData.country,
            gstin: formData.gstin,
            pan: formData.pan,
            tags: formData.tags,
            visaType: formData.visaType,
            countryOfApplication: formData.countryOfApplication,
            source: formData.source,
            contactType: formData.contactType,
            stream: formData.stream,
            intake: formData.intake,
            counselorAssigned: formData.counselorAssigned,
            applicationEmail: formData.applicationEmail,
            applicationPassword: formData.applicationPassword,
        };

        try {
            // Call parent onSave first to handle standard fields
            const savedContact = await onSave(contactToSave);

            if (savedContact) {
                // If we have a pending photo blob, upload it using the returned ID
                if (pendingPhotoBlob) {
                    const { avatarUrl: serverUrl } = await uploadContactPhoto(savedContact.id, pendingPhotoBlob);
                    setFormData(prev => ({ ...prev, avatarUrl: serverUrl }));
                    setPendingPhotoBlob(null);
                }

                // If it was a NEW contact, we need to navigate back now that we're done
                if (isNew) {
                    onNavigateBack();
                }
            }
        } catch (error) {
            console.error("Failed to save contact/photo:", error);
            alert("Failed to save contact/photo. Please try again.");
        }
    };

    const handleSaveVideo = async (videoBlob: Blob) => {
        if (!contact || typeof contact === 'string') return;
        await onAddSessionVideo(contact.id, videoBlob);
    };

    const handleDeleteVideo = async (sessionId: number) => {
        if (!contact || typeof contact === 'string') return;
        if (window.confirm("Are you sure you want to delete this recorded session?")) {
            await onDeleteSessionVideo(contact.id, sessionId);
        }
    };

    const handleAvatarClick = () => {
        if (canWrite) {
            setIsAvatarMenuOpen(prev => !prev);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (formData.avatarUrl && formData.avatarUrl.startsWith('blob:')) {
                URL.revokeObjectURL(formData.avatarUrl);
            }
            const newUrl = URL.createObjectURL(file);
            setFormData(prev => ({ ...prev, avatarUrl: newUrl }));
            setPendingPhotoBlob(file);
        }
        setIsAvatarMenuOpen(false);
    };

    const handleCapture = (blob: Blob) => {
        if (formData.avatarUrl && formData.avatarUrl.startsWith('blob:')) {
            URL.revokeObjectURL(formData.avatarUrl);
        }
        const newUrl = URL.createObjectURL(blob);
        setFormData(prev => ({ ...prev, avatarUrl: newUrl }));
        setPendingPhotoBlob(blob);
        setIsCameraModalOpen(false);
        setIsAvatarMenuOpen(false);
    };

    const handleRemovePhoto = () => {
        if (formData.avatarUrl && formData.avatarUrl.startsWith('blob:')) {
            URL.revokeObjectURL(formData.avatarUrl);
        }
        setFormData(prev => ({ ...prev, avatarUrl: undefined }));
        setPendingPhotoBlob(null);
        setIsAvatarMenuOpen(false);
    };


    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm w-full mx-auto animate-fade-in">
            <div className="p-6">
                <div className="flex items-start justify-between">
                    <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Brandon Freeman"
                        disabled={!canWrite}
                        className="w-full bg-transparent text-gray-800 dark:text-gray-200 text-3xl font-bold focus:outline-none placeholder:text-gray-400/80 border-b-2 border-gray-200 dark:border-gray-700 focus:border-lyceum-blue pb-2"
                    />
                    <div className="relative ml-6 flex-shrink-0" ref={avatarMenuRef}>
                        <button
                            onClick={handleAvatarClick}
                            disabled={!canWrite}
                            className="w-20 h-20 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 hover:border-lyceum-blue hover:text-lyceum-blue transition-colors disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-400 overflow-hidden"
                        >
                            {formData.avatarUrl ? (
                                <img
                                    src={formData.avatarUrl.startsWith('blob:') || formData.avatarUrl.startsWith('http') ? formData.avatarUrl : `${import.meta.env.VITE_API_URL}${formData.avatarUrl}`}
                                    alt="Contact Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Camera size={24} />
                            )}
                        </button>
                        {isAvatarMenuOpen && canWrite && (
                            <div className="absolute top-full mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-10 border dark:border-gray-600">
                                <button onClick={() => fileInputRef.current?.click()} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                                    <Upload size={16} className="mr-3" />
                                    Upload Photo
                                </button>
                                <button onClick={() => { setIsCameraModalOpen(true); setIsAvatarMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                                    <Camera size={16} className="mr-3" />
                                    Take Photo
                                </button>
                                {formData.avatarUrl && (
                                    <>
                                        <div className="my-1 h-px bg-gray-200 dark:bg-gray-600" />
                                        <button onClick={handleRemovePhoto} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50">
                                            <Trash2 size={16} className="mr-3" />
                                            Remove Photo
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    </div>
                </div>
            </div>

            <div className="flex border-b border-gray-200 dark:border-gray-700 px-6 overflow-x-auto whitespace-nowrap">
                <button
                    onClick={() => setCurrentTab('details')}
                    className={`px-1 py-3 font-semibold transition-colors ${currentTab === 'details' ? 'text-lyceum-blue border-b-2 border-lyceum-blue' : 'text-gray-500 dark:text-gray-400 hover:text-lyceum-blue'}`}
                >
                    Details
                </button>
                <button
                    onClick={() => setCurrentTab('finance')}
                    disabled={!contact}
                    className={`ml-4 px-1 py-3 font-semibold transition-colors disabled:opacity-50 ${currentTab === 'finance' ? 'text-lyceum-blue border-b-2 border-lyceum-blue' : 'text-gray-500 dark:text-gray-400 hover:text-lyceum-blue'}`}
                >
                    Finance
                </button>
                <button
                    onClick={() => setCurrentTab('crm')}
                    disabled={!contact}
                    className={`ml-4 px-1 py-3 font-semibold transition-colors disabled:opacity-50 ${currentTab === 'crm' ? 'text-lyceum-blue border-b-2 border-lyceum-blue' : 'text-gray-500 dark:text-gray-400 hover:text-lyceum-blue'}`}
                >
                    CRM
                </button>
                <button onClick={onNavigateToDocuments} disabled={!contact} className="ml-4 px-1 py-3 font-medium text-gray-500 dark:text-gray-400 hover:text-lyceum-blue disabled:opacity-50 disabled:cursor-not-allowed">Documents</button>
                <button onClick={onNavigateToChecklist} disabled={!contact} className="ml-4 px-1 py-3 font-medium text-gray-500 dark:text-gray-400 hover:text-lyceum-blue disabled:opacity-50 disabled:cursor-not-allowed">Checklist</button>
                <button onClick={onNavigateToVisa} disabled={!contact} className="ml-4 px-1 py-3 font-medium text-gray-500 dark:text-gray-400 hover:text-lyceum-blue disabled:opacity-50 disabled:cursor-not-allowed">Visa Filing</button>
                <button onClick={onNavigateToVisits} disabled={!contact} className="ml-4 px-1 py-3 font-medium text-gray-500 dark:text-gray-400 hover:text-lyceum-blue disabled:opacity-50 disabled:cursor-not-allowed">Visits</button>
                <button onClick={onNavigateToCRM} disabled={!contact} className="ml-4 px-1 py-3 font-medium text-gray-500 dark:text-gray-400 hover:text-lyceum-blue disabled:opacity-50 disabled:cursor-not-allowed">CRM</button>
                <button onClick={onNavigateToTasks} disabled={!contact} className="ml-4 px-1 py-3 font-medium text-gray-500 dark:text-gray-400 hover:text-lyceum-blue disabled:opacity-50 disabled:cursor-not-allowed">Tasks</button>
            </div>

            {currentTab === 'details' ? (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-4 p-6">
                        {/* Left Column */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start py-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-1">Address</label>
                                <div className="sm:col-span-2 space-y-2">
                                    <FormInput name="street1" value={formData.street1} onChange={handleChange} placeholder="Street..." disabled={!canWrite} />
                                    <FormInput name="street2" value={formData.street2} onChange={handleChange} placeholder="Street 2..." disabled={!canWrite} />
                                    <div className="flex gap-2">
                                        <FormInput name="city" value={formData.city} onChange={handleChange} placeholder="City" disabled={!canWrite} />
                                        <FormInput name="state" value={formData.state} onChange={handleChange} placeholder="State" disabled={!canWrite} />
                                    </div>
                                    <div className="flex gap-2">
                                        <FormInput name="zip" value={formData.zip} onChange={handleChange} placeholder="ZIP" disabled={!canWrite} />
                                        <FormInput name="country" value={formData.country} onChange={handleChange} placeholder="Country" disabled={!canWrite} />
                                    </div>
                                </div>
                            </div>
                            <FormRow label="GSTIN">
                                <FormInput name="gstin" value={formData.gstin} onChange={handleChange} disabled={!canWrite} />
                            </FormRow>
                            <FormRow label="Reference Number">
                                <FormInput name="referenceNumber" value={formData.referenceNumber} onChange={handleChange} disabled />
                            </FormRow>
                            <FormRow label="PAN" helpText="Permanent Account Number">
                                <FormInput name="pan" value={formData.pan} onChange={handleChange} placeholder="e.g. ABCDE1234F" disabled={!canWrite} />
                            </FormRow>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-2 divide-y divide-gray-200 dark:divide-gray-700/50">
                            <FormRow label="Phone"><FormInput name="phone" value={formData.phone} onChange={handleChange} disabled={!canWrite} /></FormRow>
                            <FormRow label="Email"><FormInput name="email" value={formData.email} onChange={handleChange} disabled={!canWrite} /></FormRow>
                            <FormRow label="Tags"><FormInput name="tags" value={formData.tags} onChange={handleChange} placeholder='e.g. "B2B", "VIP", "Consulting", ...' disabled={!canWrite} /></FormRow>
                            <FormRow label="Visa Type"><FormInput name="visaType" value={formData.visaType} onChange={handleChange} disabled={!canWrite} /></FormRow>
                            <FormRow label="Country"><FormInput name="countryOfApplication" value={formData.countryOfApplication} onChange={handleChange} disabled={!canWrite} /></FormRow>
                            <FormRow label="Source"><FormInput name="source" value={formData.source} onChange={handleChange} disabled={!canWrite} /></FormRow>
                            <FormRow label="Type"><FormInput name="contactType" value={formData.contactType} onChange={handleChange} disabled={!canWrite} /></FormRow>
                            <FormRow label="Majors"><FormInput name="majors" value={formData.majors} onChange={handleChange} disabled={!canWrite} /></FormRow>
                            <FormRow label="Stream"><FormInput name="stream" value={formData.stream} onChange={handleChange} disabled={!canWrite} /></FormRow>
                            <FormRow label="Course"><FormInput name="course" value={formData.course} onChange={handleChange} disabled={!canWrite} /></FormRow>
                            <FormRow label="Intake"><FormInput name="intake" value={formData.intake} onChange={handleChange} disabled={!canWrite} /></FormRow>
                            <FormRow label="Counselor Assigned">
                                <select name="counselorAssigned" value={formData.counselorAssigned} onChange={handleChange} disabled={!canWrite} className="w-full bg-transparent text-gray-800 dark:text-gray-200 text-sm focus:outline-none dark:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed">
                                    <option value="">Select a Counselor</option>
                                    {users.filter(u => u.role === 'Staff' || u.role === 'Admin').map(staffMember => (
                                        <option key={staffMember.id} value={staffMember.name}>{staffMember.name}</option>
                                    ))}
                                </select>
                            </FormRow>
                            <FormRow label="Agent Assigned">
                                <select name="agentAssigned" value={formData.agentAssigned} onChange={handleChange} disabled={!canWrite} className="w-full bg-transparent text-gray-800 dark:text-gray-200 text-sm focus:outline-none dark:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed">
                                    <option value="">Select an Agent</option><option value="Agent A">Agent A</option><option value="Agent B">Agent B</option><option value="Agent C">Agent C</option>
                                </select>
                            </FormRow>
                            <FormRow label="Application Email"><FormInput name="applicationEmail" value={formData.applicationEmail} onChange={handleChange} disabled={!canWrite} /></FormRow>
                            <FormRow label="Application Password"><FormInput name="applicationPassword" value={formData.applicationPassword} onChange={handleChange} disabled={!canWrite} /></FormRow>
                            <FormRow label="File Status">
                                <select name="fileStatus" value={formData.fileStatus} onChange={handleChange} disabled={!canWrite} className="w-full bg-transparent text-gray-800 dark:text-gray-200 text-sm focus:outline-none dark:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed">
                                    <option value="">Select Status</option><option value="In progress">In progress</option><option value="Closed">Closed</option><option value="On hold">On hold</option>
                                </select>
                            </FormRow>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="px-6 py-4">
                        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                                <div className="flex items-center gap-2">
                                    <button onClick={handleSummarize} disabled={isSummarizing || !formData.notes || !canWrite} className="flex items-center px-2 py-1 text-xs font-semibold text-lyceum-blue rounded-md hover:bg-lyceum-blue/10 disabled:opacity-50 disabled:cursor-not-allowed" title="Summarize with AI">
                                        <Sparkles size={14} className="mr-1" />
                                        {isSummarizing ? 'Summarizing...' : 'Summarize with AI'}
                                    </button>
                                    <button
                                        onClick={handleComposeEmail}
                                        disabled={isNew || !canWrite}
                                        className="flex items-center px-2 py-1 text-xs font-semibold text-lyceum-blue rounded-md hover:bg-lyceum-blue/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={isNew ? "Save contact to use AI Email Assistant" : "Draft an email with AI"}
                                    >
                                        <MailPlus size={14} className="mr-1" />
                                        AI Email
                                    </button>
                                </div>
                            </div>
                            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={5} disabled={!canWrite} placeholder="Add notes about the student..." className="w-full bg-transparent text-gray-800 dark:text-gray-200 text-sm mt-1 focus:outline-none placeholder:text-gray-400 resize-y disabled:opacity-70 disabled:cursor-not-allowed" />
                        </div>
                    </div>
                </>
            ) : currentTab === 'finance' ? (
                <div className="p-6">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-100 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {transactions.filter(tx => tx.contactId === contact?.id && tx.type === 'Income').length > 0 ? (
                                    transactions.filter(tx => tx.contactId === contact?.id && tx.type === 'Income').map(tx => (
                                        <tr key={tx.id} className="text-sm">
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">{tx.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">{tx.id}</td>
                                            <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{tx.description}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${tx.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-right font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                ₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No financial history found for this contact.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : currentTab === 'crm' && contact ? (
                <ContactCrmView
                    contact={contact}
                    leads={[]} // If leads are needed, pass them too, assuming parent handles or empty for now
                    onNavigateBack={() => setCurrentTab('details')}
                    user={user}
                    tasks={tasks}
                    onSaveTask={onSaveTask}
                />
            ) : null}

            {/* Activity and Sessions Section */}
            <div className="px-6 py-4 mt-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Activity &amp; Sessions</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Recorded Sessions</h3>
                            <button
                                onClick={() => setIsVideoModalOpen(true)}
                                disabled={!canWrite || isNew}
                                className="inline-flex items-center px-2 py-1 text-xs font-semibold text-white bg-lyceum-blue rounded-md hover:bg-lyceum-blue-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
                                title={isNew ? "Save contact to enable recording" : ""}
                            >
                                <Plus size={14} className="mr-1" />
                                Add Session
                            </button>
                        </div>
                        <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                            {contact?.recordedSessions && contact.recordedSessions.length > 0 ? (
                                [...contact.recordedSessions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(session => (
                                    <SessionPlayer
                                        key={session.id}
                                        session={session}
                                        onDelete={handleDeleteVideo}
                                        canWrite={!!canWrite}
                                    />
                                ))
                            ) : (
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">No sessions recorded.</p>
                            )}
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Recent Activity</h3>
                        <ul className="mt-3 space-y-4 max-h-96 overflow-y-auto">
                            {contact?.activityLog?.map(activity => (
                                <li key={activity.id} className="flex items-start gap-3">
                                    <ActivityIcon action={activity.action} />
                                    <div>
                                        <p className="text-sm text-gray-700 dark:text-gray-200">{activity.description}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(activity.timestamp)}</p>
                                    </div>
                                </li>
                            ))}
                            {(!contact?.activityLog || contact.activityLog.length === 0) && <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">No activity yet.</p>}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button onClick={onNavigateBack} className="px-6 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-lyceum-blue">
                    Cancel
                </button>
                <button onClick={handleSave} disabled={!canWrite} className="px-6 py-2 bg-lyceum-blue border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-lyceum-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-lyceum-blue disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">
                    Save Changes
                </button>
            </div>

            {!isNew && (
                <VideoRecordingModal
                    isOpen={isVideoModalOpen}
                    onClose={() => setIsVideoModalOpen(false)}
                    onSave={handleSaveVideo}
                />
            )}

            <CameraModal
                isOpen={isCameraModalOpen}
                onClose={() => setIsCameraModalOpen(false)}
                onCapture={handleCapture}
            />

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

export default NewContactForm;
