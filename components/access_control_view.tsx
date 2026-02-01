import React, { useState } from 'react';
import type { User, UserRole, AppPermissions, ActivityLog } from '../types';
import * as api from '../utils/api';
import { ArrowLeft, X, Eye, UserPlus, Trash2, Edit as UserIcon } from './icons';
import { ODOO_APPS, STAFF_ROLES } from './constants';

interface ManageAppsModalProps {
    user: User;
    onClose: () => void;
    onSave: (userId: number, permissions: { [key: string]: AppPermissions }) => void;
}

const ToggleSwitch: React.FC<{
    id: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    disabled?: boolean;
}> = ({ id, checked, onChange, label, disabled }) => (
    <label htmlFor={id} className={`flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <div className="relative">
            <input
                id={id}
                type="checkbox"
                className="sr-only peer"
                checked={checked}
                onChange={(e) => !disabled && onChange(e.target.checked)}
                disabled={disabled}
            />
            <div className="w-10 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer-checked:bg-lyceum-blue"></div>
            <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4"></div>
        </div>
    </label>
);


const ManageAppsModal: React.FC<ManageAppsModalProps> = ({ user, onClose, onSave }) => {
    const [permissions, setPermissions] = useState<{ [key: string]: AppPermissions }>(user.permissions || {});
    const [isSaving, setIsSaving] = useState(false);

    const handlePermissionChange = (appName: string, action: keyof AppPermissions, value: boolean) => {
        const newPermissions = JSON.parse(JSON.stringify(permissions));
        const appPerms = newPermissions[appName] || {};

        appPerms[action] = value;
        if (action === 'read' && !value) {
            delete appPerms.create;
            delete appPerms.update;
            delete appPerms.delete;
        }
        if (action !== 'read' && value) {
            appPerms.read = true;
        }

        if (!appPerms.read && !appPerms.create && !appPerms.update && !appPerms.delete) {
            delete newPermissions[appName];
        } else {
            newPermissions[appName] = appPerms;
        }

        setPermissions(newPermissions);
    };

    const handleFullAccessChange = (appName: string, value: boolean) => {
        const newPermissions = { ...permissions };
        if (value) {
            newPermissions[appName] = { read: true, create: true, update: true, delete: true };
        } else {
            delete newPermissions[appName];
        }
        setPermissions(newPermissions);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(user.id, permissions);
            // Show success message
            alert('✅ Permissions updated successfully!');
            onClose();
        } catch (error) {
            console.error('Failed to save permissions:', error);
            alert('❌ Failed to save permissions: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
            onClick={onClose}
        >
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" aria-hidden="true" />

            <div
                className="relative bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col h-auto max-h-[85vh] border border-gray-100 dark:border-gray-700 animate-fade-in-fast"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800 rounded-t-xl md:rounded-t-2xl">
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <span className="p-1.5 bg-lyceum-blue/10 rounded-lg text-lyceum-blue">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                            </span>
                            <span className="hidden sm:inline">App Permissions</span>
                            <span className="sm:hidden">Permissions</span>
                        </h2>
                        <p className="mt-1 text-xs md:text-sm text-gray-500 dark:text-gray-400 pl-0 sm:pl-11">Manage access for <span className="font-semibold text-gray-900 dark:text-gray-200">{user.name}</span></p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6">
                    <div className="grid grid-cols-1 gap-4">
                        {ODOO_APPS.map((app) => {
                            const currentPerms = permissions[app.name] || {};
                            const hasRead = !!currentPerms.read;
                            const hasFullAccess = hasRead && currentPerms.create && currentPerms.update && currentPerms.delete;

                            return (
                                <div
                                    key={app.name}
                                    className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-4 md:p-5 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`${app.bgColor} ${app.iconColor} p-2.5 rounded-lg`}>
                                                {app.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">{app.name}</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Configure access level</p>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <ToggleSwitch
                                                id={`full-access-${app.name}`}
                                                checked={hasFullAccess}
                                                onChange={(checked) => handleFullAccessChange(app.name, checked)}
                                                label="Full Access"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <ToggleSwitch
                                            id={`read-${app.name}`}
                                            checked={hasRead}
                                            onChange={(checked) => handlePermissionChange(app.name, 'read', checked)}
                                            label="Read"
                                        />
                                        <ToggleSwitch
                                            id={`create-${app.name}`}
                                            checked={!!currentPerms.create}
                                            onChange={(checked) => handlePermissionChange(app.name, 'create', checked)}
                                            label="Create"
                                            disabled={!hasRead}
                                        />
                                        <ToggleSwitch
                                            id={`update-${app.name}`}
                                            checked={!!currentPerms.update}
                                            onChange={(checked) => handlePermissionChange(app.name, 'update', checked)}
                                            label="Update"
                                            disabled={!hasRead}
                                        />
                                        <ToggleSwitch
                                            id={`delete-${app.name}`}
                                            checked={!!currentPerms.delete}
                                            onChange={(checked) => handlePermissionChange(app.name, 'delete', checked)}
                                            label="Delete"
                                            disabled={!hasRead}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                {/* Footer with actions */}
                <div className="flex-shrink-0 px-4 md:px-6 py-4 md:py-5 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 rounded-b-xl md:rounded-b-2xl">
                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
                        <button
                            onClick={onClose}
                            disabled={isSaving}
                            className="w-full sm:w-auto px-4 py-2.5 md:py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lyceum-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full sm:w-auto px-4 py-2.5 md:py-2 text-sm font-medium text-white bg-lyceum-blue rounded-lg hover:bg-lyceum-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lyceum-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm touch-manipulation flex items-center justify-center gap-2"
                        >
                            {isSaving && (
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface AccessControlViewProps {
    users: User[];
    activityLog: ActivityLog[];
    onUpdateUserRole: (userId: number, role: UserRole) => void;
    onUpdateUserPermissions: (userId: number, permissions: { [key: string]: AppPermissions }) => void;
    onDeleteUser: (userId: number) => void;
    onUserCreated: (newUserData: { allUsers: User[], addedUser: User, temporaryPassword?: string }) => void;
    onNavigateBack: () => void;
    currentUser: User;
    onNewStaffClick: () => void;
    onStartImpersonation: (user: User) => void;
    onUpdateUserDetails: (userId: number, data: { name: string; email: string; phone: string }) => void;
}

const AccessControlView: React.FC<AccessControlViewProps> = ({ users, activityLog, onUpdateUserRole, onUpdateUserPermissions, onDeleteUser, onUserCreated, onNavigateBack, currentUser, onNewStaffClick, onStartImpersonation, onUpdateUserDetails }) => {
    const [modalUser, setModalUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState('staff');
    const [showNewUserModal, setShowNewUserModal] = useState(false);
    const [newUserForm, setNewUserForm] = useState({ name: '', email: '', phone: '', role: 'Staff' as UserRole });
    const [isCreating, setIsCreating] = useState(false);
    const [createdPassword, setCreatedPassword] = useState<string | null>(null);

    // Edit User State
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
    const [isUpdating, setIsUpdating] = useState(false);

    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setEditForm({
            name: user.name,
            email: user.email,
            phone: (user as any).phone || ''
        });
    };

    const handleUpdateUser = async () => {
        if (!editingUser || !editForm.name || !editForm.email) return;
        setIsUpdating(true);
        try {
            await api.updateUser(editingUser.id, {
                name: editForm.name,
                email: editForm.email,
                phone: editForm.phone
            });
            onUpdateUserDetails(editingUser.id, {
                ...editForm,
                // Pass phone update to check
            } as any);
            setEditingUser(null);
            alert('✅ User details updated successfully');
        } catch (error) {
            console.error('Failed to update user:', error);
            alert('Failed to update user');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRoleChange = async (userId: number, newRole: UserRole) => {
        try {
            await api.updateUser(userId, { role: newRole });
            onUpdateUserRole(userId, newRole); // Update local state
        } catch (error) {
            console.error('Failed to update role:', error);
            alert('Failed to update role: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const handleCreateUser = async () => {
        if (!newUserForm.name || !newUserForm.email || !newUserForm.role) {
            alert('Please fill in all fields');
            return;
        }

        setIsCreating(true);
        try {
            const result = await api.createUser(newUserForm.name, newUserForm.email, newUserForm.role, { phone: newUserForm.phone });
            setCreatedPassword(result.temporaryPassword);

            // Update parent state
            onUserCreated({
                allUsers: await api.getUsers(), // Fetch fresh list
                addedUser: result.user,
                temporaryPassword: result.temporaryPassword
            });

            alert(`✅ User created successfully!\n\nTemporary Password: ${result.temporaryPassword}\n\nPlease save this password and share it securely with the user.`);
            setNewUserForm({ name: '', email: '', phone: '', role: 'Staff' });
            setShowNewUserModal(false);
        } catch (error: any) {
            console.error('Failed to create user:', error);
            alert('❌ Failed to create user: ' + (error?.message || 'Unknown error'));
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteUser = async (userId: number, userName: string) => {
        if (!window.confirm(
            `⚠️ Delete User: ${userName}?\n\n` +
            `This will permanently delete the user account and contact record.\n\n` +
            `✅ PRESERVED: All leads and business data will be kept intact.\n\n` +
            `Are you sure?`
        )) {
            return;
        }

        try {
            await api.deleteUser(userId);
            alert('✅ User deleted successfully. All business data has been preserved.');
            onDeleteUser(userId); // Update parent state without reload
        } catch (error: any) {
            console.error('Failed to delete user:', error);
            alert('❌ Failed to delete user: ' + (error?.message || 'Unknown error'));
        }
    };

    const staffUsers = users.filter(u => STAFF_ROLES.includes(u.role));

    return (
        <>
            <div className="animate-fade-in p-4 md:p-0">
                {/* Header - Stack on mobile */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-6 gap-3 md:gap-4">
                    <div>
                        <button
                            onClick={onNavigateBack}
                            className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-lyceum-blue mb-2 transition-colors touch-manipulation"
                            aria-label="Back to apps"
                        >
                            <ArrowLeft size={16} className="mr-2" />
                            Back to Apps
                        </button>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">Access Control</h1>
                    </div>
                    {(currentUser.role === 'Admin' || currentUser.permissions['Access Control']?.create) && activeTab === 'staff' && (
                        <button
                            onClick={() => setShowNewUserModal(true)}
                            className="w-full md:w-auto px-4 py-2.5 md:py-2 bg-lyceum-blue text-white rounded-md shadow-sm hover:bg-lyceum-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-lyceum-blue transition-colors touch-manipulation flex items-center justify-center gap-2"
                        >
                            <UserPlus size={18} />
                            Add User
                        </button>
                    )}
                </div>

                {/* Tabs - Scrollable on mobile */}
                <div className="mb-4 md:mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                    <nav className="-mb-px flex space-x-4 md:space-x-8 min-w-max px-1">
                        <button
                            onClick={() => setActiveTab('staff')}
                            className={`py-3 md:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'staff'
                                ? 'border-lyceum-blue text-lyceum-blue'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            Staff Members
                        </button>
                        <button
                            onClick={() => setActiveTab('log')}
                            className={`py-3 md:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'log'
                                ? 'border-lyceum-blue text-lyceum-blue'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            Activity Log
                        </button>
                    </nav>
                </div>

                {activeTab === 'staff' && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {/* Table - Horizontal scroll on mobile */}
                        <div className="overflow-x-auto -mx-4 md:mx-0">
                            <div className="inline-block min-w-full align-middle">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">App Permissions</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {staffUsers.map(user => (
                                            <tr key={user.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                                                    {(user as any).phone && <div className="text-xs text-gray-400 dark:text-gray-500">{(user as any).phone}</div>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                                        disabled={user.id === currentUser.id}
                                                        className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-lyceum-blue focus:border-lyceum-blue disabled:opacity-50 disabled:cursor-not-allowed"
                                                        aria-label={`Role for ${user.name}`}
                                                    >
                                                        {STAFF_ROLES.map(role => (
                                                            <option key={role} value={role}>{role}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    <button
                                                        onClick={() => setModalUser(user)}
                                                        disabled={user.id === currentUser.id}
                                                        className="px-3 py-2 text-sm font-medium text-lyceum-blue bg-lyceum-blue/10 rounded-md hover:bg-lyceum-blue/20 dark:bg-lyceum-blue/20 dark:hover:bg-lyceum-blue/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Manage ({Object.keys(user.permissions || {}).length} Apps)
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => onStartImpersonation(user)}
                                                            disabled={user.id === currentUser.id}
                                                            className="flex items-center px-3 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:hover:bg-yellow-900/80 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title={`Impersonate ${user.name}`}
                                                        >
                                                            <Eye size={16} className="mr-2" />
                                                            Impersonate
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditClick(user)}
                                                            className="p-2 text-gray-500 hover:text-lyceum-blue dark:hover:text-blue-400"
                                                            title="Edit User Details"
                                                        >
                                                            <UserIcon size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(user.id, user.name)}
                                                            disabled={user.id === currentUser.id}
                                                            className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title={user.id === currentUser.id ? "Can't delete yourself" : `Delete ${user.name}`}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'log' && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-4">
                            <h3 className="text-lg font-semibold">Administrator Activity</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Recent administrative actions are logged here.</p>
                        </div>
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[60vh] overflow-y-auto">
                            {activityLog.map(log => (
                                <li key={log.id} className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{log.action}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">by {log.adminName}</p>
                                    </div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(log.timestamp).toLocaleString()}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {
                modalUser && (
                    <ManageAppsModal
                        user={modalUser}
                        onClose={() => setModalUser(null)}
                        onSave={onUpdateUserPermissions}
                    />
                )
            }

            {/* New User Modal */}
            {showNewUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !isCreating && setShowNewUserModal(false)}>
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" />
                    <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Add New User</h2>
                            <button onClick={() => setShowNewUserModal(false)} disabled={isCreating} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={newUserForm.name}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                                    placeholder="Full Name"
                                    disabled={isCreating}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={newUserForm.email}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                                    placeholder="email@example.com"
                                    disabled={isCreating}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                                <input
                                    type="text"
                                    value={newUserForm.phone}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                                    placeholder="+91..."
                                    disabled={isCreating}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                                <select
                                    value={newUserForm.role}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                                    disabled={isCreating}
                                >
                                    <option value="Admin">Admin</option>
                                    <option value="Staff">Staff</option>
                                    <option value="Student">Student</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setShowNewUserModal(false)}
                                disabled={isCreating}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateUser}
                                disabled={isCreating}
                                className="flex-1 px-4 py-2 bg-lyceum-blue text-white rounded-md hover:bg-lyceum-blue-dark disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isCreating && (
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                {isCreating ? 'Creating...' : 'Create User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !isUpdating && setEditingUser(null)}>
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" />
                    <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Edit User Details</h2>
                            <button onClick={() => setEditingUser(null)} disabled={isUpdating} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                                    disabled={isUpdating}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                                    disabled={isUpdating}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                                <input
                                    type="text"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                                    placeholder="+91..."
                                    disabled={isUpdating}
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setEditingUser(null)}
                                disabled={isUpdating}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateUser}
                                disabled={isUpdating}
                                className="flex-1 px-4 py-2 bg-lyceum-blue text-white rounded-md hover:bg-lyceum-blue-dark disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isUpdating ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
              @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
              .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
              @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
              .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
            `}</style>
        </>
    );
};

export default AccessControlView;
