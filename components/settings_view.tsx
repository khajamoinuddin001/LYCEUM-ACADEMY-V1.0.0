import React, { useState } from 'react';
import { ArrowLeft, Bell, FileText, Edit, Trash2, Plus, User as UserIcon, Lock, Palette, DollarSign, CreditCard } from './icons';
import * as api from '../utils/api';
import type { QuotationTemplate, User, Coupon, LmsCourse } from '../types';
import QuotationTemplateModal from './quotation_template_modal';
import CouponEditModal from './coupon_edit_modal';

interface SettingsViewProps {
    user: User;
    onNavigateBack: () => void;
    quotationTemplates: QuotationTemplate[];
    onSaveTemplate: (template: QuotationTemplate) => void;
    onDeleteTemplate: (templateId: number) => void;
    onUpdateProfile: (userId: number, name: string, email: string) => void;
    onChangePassword: (current: string, newPass: string) => Promise<{ success: boolean; message: string; }>;
    darkMode: boolean;
    setDarkMode: (value: boolean | ((val: boolean) => boolean)) => void;
    coupons: Coupon[];
    onSaveCoupon: (coupon: Coupon) => void;
    onDeleteCoupon: (couponCode: string) => void;
    courses: LmsCourse[];
}

type Tab = 'Profile' | 'Security' | 'Appearance' | 'Notifications' | 'Templates' | 'Coupons' | 'Payment';

const TABS: { name: Tab; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { name: 'Profile', icon: <UserIcon size={18} /> },
    { name: 'Security', icon: <Lock size={18} /> },
    { name: 'Appearance', icon: <Palette size={18} /> },
    { name: 'Notifications', icon: <Bell size={18} /> },
    { name: 'Templates', icon: <FileText size={18} /> },
    { name: 'Coupons', icon: <DollarSign size={18} /> },
    { name: 'Payment', icon: <CreditCard size={18} />, adminOnly: true },
];

const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white";
const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

const ProfileTab: React.FC<Pick<SettingsViewProps, 'user' | 'onUpdateProfile'>> = ({ user, onUpdateProfile }) => {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateProfile(user.id, name, email);
        setMessage('Profile updated successfully!');
        setTimeout(() => setMessage(''), 3000);
    };

    return (
        <div>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Profile Information</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your personal details here.</p>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="profile-name" className={labelClasses}>Full Name</label>
                        <input type="text" id="profile-name" value={name} onChange={e => setName(e.target.value)} className={inputClasses} />
                    </div>
                    <div>
                        <label htmlFor="profile-email" className={labelClasses}>Email Address</label>
                        <input type="email" id="profile-email" value={email} onChange={e => setEmail(e.target.value)} className={inputClasses} />
                    </div>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between rounded-b-lg">
                    <p className="text-sm text-green-600 transition-opacity duration-300">{message}</p>
                    <button type="submit" className="px-4 py-2 bg-lyceum-blue text-white rounded-md shadow-sm text-sm font-medium hover:bg-lyceum-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-lyceum-blue">Save Changes</button>
                </div>
            </form>
        </div>
    );
};

const SecurityTab: React.FC<Pick<SettingsViewProps, 'user' | 'onChangePassword'>> = ({ user, onChangePassword }) => {
    const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if (passwords.newPass !== passwords.confirm) {
            setMessage({ type: 'error', text: "New passwords do not match." });
            return;
        }
        if (passwords.newPass.length < 6) {
            setMessage({ type: 'error', text: "New password must be at least 6 characters long." });
            return;
        }
        const result = await onChangePassword(passwords.current, passwords.newPass);
        setMessage({ type: result.success ? 'success' : 'error', text: result.message });
        if (result.success) {
            setPasswords({ current: '', newPass: '', confirm: '' });
        }
    };
    return (
        <div>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Change Password</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your password for better security.</p>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="current-password" className={labelClasses}>Current Password</label>
                        <input type="password" id="current-password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} className={inputClasses} autoComplete="current-password" />
                    </div>
                    <div>
                        <label htmlFor="new-password" className={labelClasses}>New Password</label>
                        <input type="password" id="new-password" value={passwords.newPass} onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))} className={inputClasses} autoComplete="new-password" />
                    </div>
                    <div>
                        <label htmlFor="confirm-password" className={labelClasses}>Confirm New Password</label>
                        <input type="password" id="confirm-password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} className={inputClasses} autoComplete="new-password" />
                    </div>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between rounded-b-lg">
                    {message && <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message.text}</p>}
                    {!message && <div></div>}
                    <button type="submit" className="px-4 py-2 bg-lyceum-blue text-white rounded-md shadow-sm text-sm font-medium hover:bg-lyceum-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-lyceum-blue">Update Password</button>
                </div>
            </form>
        </div>
    );
};

const Toggle: React.FC<{ label: string; enabled: boolean; setEnabled: (e: boolean) => void; }> = ({ label, enabled, setEnabled }) => (
    <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
        <button
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-lyceum-blue ${enabled ? 'bg-lyceum-blue' : 'bg-gray-200 dark:bg-gray-600'
                }`}
        >
            <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
            />
        </button>
    </div>
);

const AppearanceTab: React.FC = () => {
    return (
        <div>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Appearance</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Customize the look and feel of the application.</p>
            </div>
            <div className="p-6 space-y-6">
                <div>
                    <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language</label>
                    <select id="language" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm">
                        <option>English (US)</option>
                        <option>Español</option>
                        <option>Français</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

const NotificationsTab: React.FC = () => {
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(false);
    return (
        <div>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Notifications</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose how you receive notifications.</p>
            </div>
            <div className="p-6 space-y-4">
                <Toggle label="Email Notifications" enabled={emailNotifications} setEnabled={setEmailNotifications} />
                <Toggle label="Push Notifications" enabled={pushNotifications} setEnabled={setPushNotifications} />
            </div>
        </div>
    );
};

const TemplatesTab: React.FC<Pick<SettingsViewProps, 'quotationTemplates' | 'onSaveTemplate' | 'onDeleteTemplate'>> = ({ quotationTemplates, onSaveTemplate, onDeleteTemplate }) => {
    const [editingTemplate, setEditingTemplate] = useState<QuotationTemplate | 'new' | null>(null);

    return (
        <div>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Quotation Templates</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage pre-built quotation packages.</p>
            </div>
            <div className="p-6">
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => setEditingTemplate('new')}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-lyceum-blue rounded-md hover:bg-lyceum-blue-dark transition-colors"
                    >
                        <Plus size={14} className="mr-1.5" />
                        New Template
                    </button>
                </div>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {quotationTemplates.length > 0 ? quotationTemplates.map(template => (
                        <li key={template.id} className="py-3 flex items-center justify-between">
                            <div>
                                <p className="font-medium text-sm text-gray-800 dark:text-gray-100">{template.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Total: ₹{template.total.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="space-x-2">
                                <button onClick={() => setEditingTemplate(template)} className="p-2 text-gray-500 hover:text-lyceum-blue rounded-md" aria-label={`Edit ${template.title}`}>
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => { if (window.confirm(`Are you sure you want to delete "${template.title}"?`)) onDeleteTemplate(template.id) }}
                                    className="p-2 text-gray-500 hover:text-red-500 rounded-md"
                                    aria-label={`Delete ${template.title}`}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </li>
                    )) : <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-6">No templates created yet.</p>}
                </ul>
            </div>
            {editingTemplate && (
                <QuotationTemplateModal
                    template={editingTemplate === 'new' ? null : editingTemplate}
                    onClose={() => setEditingTemplate(null)}
                    onSave={(template) => {
                        onSaveTemplate(template);
                        setEditingTemplate(null);
                    }}
                />
            )}
        </div>
    );
};

const CouponsTab: React.FC<Pick<SettingsViewProps, 'coupons' | 'onSaveCoupon' | 'onDeleteCoupon' | 'courses'>> = ({ coupons, onSaveCoupon, onDeleteCoupon, courses }) => {
    const [editingCoupon, setEditingCoupon] = useState<Coupon | 'new' | null>(null);

    return (
        <div>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Discount Coupons</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage coupon codes for course purchases.</p>
            </div>
            <div className="p-6">
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => setEditingCoupon('new')}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-lyceum-blue rounded-md hover:bg-lyceum-blue-dark transition-colors"
                    >
                        <Plus size={14} className="mr-1.5" />
                        New Coupon
                    </button>
                </div>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {coupons.length > 0 ? coupons.map(coupon => (
                        <li key={coupon.code} className="py-3 flex items-center justify-between">
                            <div>
                                <p className="font-mono text-sm font-bold text-gray-800 dark:text-gray-100">{coupon.code}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {coupon.discountPercentage}% Discount
                                    <span className="ml-2 text-gray-400 dark:text-gray-500">
                                        (
                                        {coupon.applicableCourseIds && coupon.applicableCourseIds.length > 0
                                            ? `Applies to ${coupon.applicableCourseIds.length} course(s)`
                                            : 'Applies to all courses'}
                                        )
                                    </span>
                                </p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${coupon.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                    {coupon.isActive ? 'Active' : 'Inactive'}
                                </span>
                                <div className="space-x-2">
                                    <button onClick={() => setEditingCoupon(coupon)} className="p-2 text-gray-500 hover:text-lyceum-blue rounded-md" aria-label={`Edit ${coupon.code}`}>
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => onDeleteCoupon(coupon.code)}
                                        className="p-2 text-gray-500 hover:text-red-500 rounded-md"
                                        aria-label={`Delete ${coupon.code}`}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </li>
                    )) : <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-6">No coupons created yet.</p>}
                </ul>
            </div>
            {editingCoupon && (
                <CouponEditModal
                    coupon={editingCoupon === 'new' ? null : editingCoupon}
                    onClose={() => setEditingCoupon(null)}
                    onSave={(coupon) => {
                        onSaveCoupon(coupon);
                        setEditingCoupon(null);
                    }}
                    courses={courses}
                />
            )}
        </div>
    );
};
const PaymentTab: React.FC = () => {
    const [upiId, setUpiId] = useState('');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    React.useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await api.getPaymentSettings();
                setUpiId(settings.upiId || '');
                setQrCode(settings.qrCode);
            } catch (error) {
                console.error('Failed to load payment settings:', error);
            }
        };
        loadSettings();
    }, []);

    const handleSaveUpi = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);
        try {
            await api.savePaymentSettings(upiId);
            setMessage({ type: 'success', text: 'UPI ID saved successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to save UPI ID' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setMessage(null);
        try {
            const result = await api.uploadPaymentQr(file);
            setQrCode(result.qrCode);
            setMessage({ type: 'success', text: 'QR Code uploaded successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to upload QR Code' });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Payment Settings</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure payment details for student billing.</p>
            </div>
            <div className="p-6 space-y-8">
                <form onSubmit={handleSaveUpi} className="space-y-4">
                    <div>
                        <label htmlFor="upi-id" className={labelClasses}>UPI ID</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                id="upi-id"
                                value={upiId}
                                onChange={e => setUpiId(e.target.value)}
                                className={inputClasses}
                                placeholder="e.g. academy@upi"
                            />
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-4 py-2 bg-lyceum-blue text-white rounded-md shadow-sm text-sm font-medium hover:bg-lyceum-blue-dark focus:outline-none disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </form>

                <div className="space-y-4">
                    <label className={labelClasses}>Payment QR Code</label>
                    <div className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        {qrCode ? (
                            <div className="relative mb-4 group">
                                <img src={qrCode} alt="Payment QR" className="w-48 h-48 object-contain rounded-lg shadow-sm bg-white p-2" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                    <label className="cursor-pointer text-white text-sm font-medium bg-lyceum-blue px-3 py-1.5 rounded-md">
                                        Change Photo
                                        <input type="file" className="hidden" accept="image/*" onChange={handleQrUpload} disabled={isUploading} />
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">No QR code uploaded yet.</p>
                                <label className="mt-4 inline-flex items-center px-4 py-2 bg-lyceum-blue text-white rounded-md shadow-sm text-sm font-medium hover:bg-lyceum-blue-dark cursor-pointer transition-colors">
                                    Upload QR Code
                                    <input type="file" className="hidden" accept="image/*" onChange={handleQrUpload} disabled={isUploading} />
                                </label>
                            </div>
                        )}
                        {isUploading && <p className="mt-2 text-xs text-lyceum-blue animate-pulse">Uploading...</p>}
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Recommended: Square image, PNG or JPG (max 5MB)</p>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-100/50 text-green-800 border border-green-200' : 'bg-red-100/50 text-red-800 border border-red-200'}`}>
                        <p className="text-sm">{message.text}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const SettingsView: React.FC<SettingsViewProps> = (props) => {
    const [activeTab, setActiveTab] = useState<Tab>('Profile');

    const renderContent = () => {
        switch (activeTab) {
            case 'Profile': return <ProfileTab user={props.user} onUpdateProfile={props.onUpdateProfile} />;
            case 'Security': return <SecurityTab user={props.user} onChangePassword={props.onChangePassword} />;
            case 'Appearance': return <AppearanceTab />;
            case 'Notifications': return <NotificationsTab />;
            case 'Templates': return <TemplatesTab {...props} />;
            case 'Coupons': return <CouponsTab {...props} />;
            case 'Payment': return <PaymentTab />;
            default: return null;
        }
    };

    return (
        <div className="animate-fade-in max-w-5xl mx-auto">
            <button
                onClick={props.onNavigateBack}
                className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-lyceum-blue mb-4 transition-colors"
                aria-label="Back to apps"
            >
                <ArrowLeft size={16} className="mr-2" />
                Back to Apps
            </button>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Settings</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Manage your application and account settings.</p>

            <div className="flex flex-col md:flex-row gap-8">
                <aside className="md:w-1/4">
                    <nav className="space-y-1">
                        {TABS.map(tab => (
                            tab.adminOnly && props.user.role !== 'Admin' ? null : (
                                <button
                                    key={tab.name}
                                    onClick={() => setActiveTab(tab.name)}
                                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.name
                                        ? 'bg-lyceum-blue/10 dark:bg-lyceum-blue/20 text-lyceum-blue'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {tab.icon}
                                    <span className="ml-3">{tab.name}</span>
                                </button>
                            )
                        ))}
                    </nav>
                </aside>
                <main className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 min-h-[400px]">
                    {renderContent()}
                </main>
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

export default SettingsView;