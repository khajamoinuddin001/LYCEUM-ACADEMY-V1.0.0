
import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { Search, Plus, X, ArrowLeft, Paperclip, CheckCheck, MessageCircle, Send, Edit, ChevronUp, ChevronDown, Download, FileText } from '@/components/common/icons';
import type { User, Channel, Message } from '@/types';
import NewGroupModal from './new_group_modal';
import * as api from '@/utils/api';

interface DiscussViewProps {
    user: User;
    users: User[];
    isMobile: boolean;
    channels: Channel[];
    setChannels: (value: Channel[] | ((val: Channel[]) => Channel[])) => void;
    onCreateGroup: (name: string, memberIds: number[]) => void;
}

const avatarColors = [
    'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300', 'bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300', 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    'bg-purple-200 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300', 'bg-pink-200 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300',
    'bg-indigo-200 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300', 'bg-teal-200 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
];

const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return avatarColors[Math.abs(hash % avatarColors.length)];
};

const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
};

const formatTimestamp = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);

    if (diffSeconds < 5) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;

    if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate() - 1) {
        return "Yesterday";
    }

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};


const UserAvatar: React.FC<{ name: string; size?: string }> = ({ name, size = "w-10 h-10" }) => {
    if (name === 'System') {
        return <div className={`${size} rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold flex-shrink-0`}><MessageCircle size={size === "w-10 h-10" ? 20 : 16} /></div>;
    }
    return <div className={`${size} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${getAvatarColor(name)}`}>{getInitials(name)}</div>;
};

interface MessageBubbleProps {
    message: Message;
    isCurrentUser: boolean;
    isEditing: boolean;
    onStartEdit: (message: Message) => void;
    onSaveEdit: (newText: string) => void;
    onCancelEdit: () => void;
    isHighlighted: boolean;
    isReadOnly?: boolean;
}

const MessageBubble = forwardRef<HTMLDivElement, MessageBubbleProps>(({ message, isCurrentUser, isEditing, onStartEdit, onSaveEdit, onCancelEdit, isHighlighted, isReadOnly }, ref) => {
    const [editText, setEditText] = useState(message.text);
    const editInputRef = useRef<HTMLTextAreaElement>(null);
    const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);

    useEffect(() => {
        if (isEditing) {
            setEditText(message.text);
            setTimeout(() => editInputRef.current?.focus(), 0);
        }
    }, [isEditing, message.text]);

    useEffect(() => {
        let objectUrl: string | null = null;
        if (message.attachment) {
            const fetchAttachment = async () => {
                try {
                    const token = api.getToken();
                    // Robust URL construction
                    const baseUrl = api.API_BASE_URL.endsWith('/api') ? api.API_BASE_URL.slice(0, -4) : api.API_BASE_URL;
                    const attachmentPath = message.attachment?.url.startsWith('/api') ? message.attachment.url : `/api${message.attachment?.url}`;
                    const fullUrl = `${baseUrl}${attachmentPath}`;

                    const response = await fetch(fullUrl, {
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                    });
                    const blob = await response.blob();
                    objectUrl = window.URL.createObjectURL(blob);
                    setAttachmentUrl(objectUrl);
                } catch (error) {
                    console.error('Failed to fetch attachment:', error);
                }
            };
            fetchAttachment();
        }
        return () => {
            if (objectUrl) window.URL.revokeObjectURL(objectUrl);
        };
    }, [message.attachment]);

    const handleSave = () => {
        if (editText.trim()) {
            onSaveEdit(editText.trim());
        }
    };

    const isEditable = !isReadOnly && isCurrentUser && (new Date().getTime() - new Date(message.timestamp).getTime()) < 600000;

    if (isEditing) {
        return (
            <div ref={ref} className={`flex items-end gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-2.5 rounded-xl shadow-sm w-full max-w-lg bg-white dark:bg-gray-700`}>
                    <textarea
                        ref={editInputRef}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); }
                            if (e.key === 'Escape') { onCancelEdit(); }
                        }}
                        className="w-full bg-transparent text-sm text-gray-800 dark:text-gray-100 focus:outline-none resize-none"
                        rows={3}
                    />
                    <div className="text-right mt-2 space-x-2">
                        <button onClick={onCancelEdit} className="px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 rounded-md">Cancel</button>
                        <button onClick={handleSave} className="px-3 py-1 text-xs font-semibold text-white bg-lyceum-blue rounded-md">Save</button>
                    </div>
                </div>
            </div>
        );
    }

    const bubbleClasses = isCurrentUser ? 'bg-emerald-200 dark:bg-emerald-900 rounded-br-none' : 'bg-white dark:bg-gray-700 rounded-bl-none';
    const highlightClass = isHighlighted ? 'ring-2 ring-yellow-400' : '';

    return (
        <div ref={ref} className={`group flex items-end gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
            {!isCurrentUser && <UserAvatar name={message.author} size="w-8 h-8" />}
            {isCurrentUser && isEditable && (
                <div className="flex-shrink-0 self-center mb-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onStartEdit(message)}
                        className="p-1 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
                        title="Edit message"
                    >
                        <Edit size={14} />
                    </button>
                </div>
            )}
            <div className={`p-2.5 rounded-xl shadow-sm w-fit max-w-lg ${bubbleClasses} ${highlightClass} transition-all duration-300`}>
                {!isCurrentUser && <span className={`text-sm font-semibold mb-1 ${getAvatarColor(message.author).split(' ')[1]}`}>{message.author}</span>}

                {message.attachment ? (
                    <div className="mb-2 space-y-2">
                        {message.attachment.contentType?.startsWith('image/') ? (
                            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                                {attachmentUrl ? (
                                    <img
                                        src={attachmentUrl}
                                        alt={message.attachment.name}
                                        className="max-w-full max-h-60 object-contain hover:opacity-90 transition-opacity cursor-pointer"
                                        onClick={() => window.open(attachmentUrl, '_blank')}
                                    />
                                ) : (
                                    <div className="w-40 h-40 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-lyceum-blue"></div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 min-w-[200px]">
                                <div className="p-2 bg-lyceum-blue/10 rounded-lg text-lyceum-blue">
                                    <FileText size={24} />
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{message.attachment.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{((message.attachment.size || 0) / 1024).toFixed(1)} KB</p>
                                </div>
                                {attachmentUrl && (
                                    <a
                                        href={attachmentUrl}
                                        download={message.attachment.name}
                                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400"
                                        title="Download"
                                    >
                                        <Download size={18} />
                                    </a>
                                )}
                            </div>
                        )}
                        <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap">{message.text}</p>
                    </div>
                ) : (
                    <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap">{message.text}</p>
                )}

                <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex items-center justify-end gap-1">
                    {message.edited && <span className='italic mr-1'>(edited)</span>}
                    <span>{formatTimestamp(message.timestamp)}</span>
                    {isCurrentUser && <CheckCheck size={16} className="text-blue-500" />}
                </div>
            </div>
        </div>
    );
});


const NewChatModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    currentUser: User;
    onSelectUser: (user: User) => void;
    channels: Channel[];
}> = ({ isOpen, onClose, users, currentUser, onSelectUser, channels }) => {
    if (!isOpen) return null;

    const existingDMUsers = channels
        .filter(c => c.type === 'dm' && c.members?.includes(currentUser.id))
        .flatMap(c => c.members)
        .filter(id => id !== currentUser.id);

    const isStudent = currentUser.role === 'Student';
    const availableUsers = users.filter(u => {
        if (u.id === currentUser.id) return false;
        if (existingDMUsers.includes(u.id)) return false;

        // Students can only start DMs with Staff/Admin
        if (isStudent) {
            return u.role === 'Admin' || u.role === 'Staff';
        }

        // Staff/Admin can start DMs with anyone (except maybe other students if privacy is strictly enforced, 
        // but usually they need to message students)
        return true;
    });

    return (
        <div className="absolute inset-0 bg-black/30 z-10 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">Start a new chat</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                    {availableUsers.length > 0 ? availableUsers.map(user => (
                        <button key={user.id} onClick={() => onSelectUser(user)} className="w-full flex items-center p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700">
                            <UserAvatar name={user.name} />
                            <span className="ml-3 font-medium text-gray-800 dark:text-gray-200">{user.name}</span>
                        </button>
                    )) : (
                        <p className="p-4 text-sm text-center text-gray-500">No new users to start a chat with.</p>
                    )}
                </div>
            </div>
        </div>
    );
};


const DiscussView: React.FC<DiscussViewProps> = ({ user, users, isMobile, channels, setChannels, onCreateGroup }) => {
    const [activeChannelId, setActiveChannelId] = useState<string>('general');
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [chatListSearch, setChatListSearch] = useState('');

    const [isNewChatMenuOpen, setIsNewChatMenuOpen] = useState(false);
    const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
    const newChatButtonRef = useRef<HTMLButtonElement>(null);
    const newChatMenuRef = useRef<HTMLDivElement>(null);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchResultsRef = useRef<number[]>([]);
    const [currentResultIndex, setCurrentResultIndex] = useState(-1);
    const messageRefs = useRef<Record<number, HTMLDivElement | null>>({});

    const activeChannel = channels.find(c => c.id === activeChannelId);
    const isAdmin = user.role === 'Admin';
    const isStaff = user.role === 'Staff';
    const [auditUser, setAuditUser] = useState<User | null>(null);
    const [auditChannels, setAuditChannels] = useState<Channel[]>([]);
    const [isAuditing, setIsAuditing] = useState(false);
    const [auditSearch, setAuditSearch] = useState('');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (newChatMenuRef.current && !newChatMenuRef.current.contains(event.target as Node) && newChatButtonRef.current && !newChatButtonRef.current.contains(event.target as Node)) {
                setIsNewChatMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNewChatClick = () => {
        if (isAdmin || isStaff) {
            setIsNewChatMenuOpen(prev => !prev);
        } else {
            setIsNewChatModalOpen(true);
        }
    };

    const handleStartAudit = async (targetUser: User) => {
        setAuditUser(targetUser);
        setIsAuditing(true);
        setIsNewChatMenuOpen(false);
        try {
            const fetchedChannels = await api.getChannels(targetUser.id);
            setAuditChannels(fetchedChannels);
            if (fetchedChannels.length > 0) {
                setActiveChannelId(fetchedChannels[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch audit channels", error);
        }
    };

    const stopAuditing = () => {
        setIsAuditing(false);
        setAuditUser(null);
        setAuditChannels([]);
        setActiveChannelId('general');
    };

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    useEffect(scrollToBottom, [activeChannel?.messages]);
    useEffect(() => {
        if (!isSearchVisible) {
            setSearchQuery('');
        }
    }, [isSearchVisible]);

    useEffect(() => {
        messageRefs.current = {};
        if (searchQuery && activeChannel) {
            const results = activeChannel.messages
                .filter(msg => msg.text.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(msg => msg.id);
            searchResultsRef.current = results;
            setCurrentResultIndex(results.length > 0 ? 0 : -1);
        } else {
            searchResultsRef.current = [];
            setCurrentResultIndex(-1);
        }
    }, [searchQuery, activeChannel]);

    useEffect(() => {
        if (currentResultIndex !== -1 && searchResultsRef.current.length > 0) {
            const messageId = searchResultsRef.current[currentResultIndex];
            const element = messageRefs.current[messageId];
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentResultIndex]);

    const handleNavigateResults = (direction: 'next' | 'prev') => {
        const totalResults = searchResultsRef.current.length;
        if (totalResults === 0) return;

        let nextIndex;
        if (direction === 'next') {
            nextIndex = (currentResultIndex + 1) % totalResults;
        } else {
            nextIndex = (currentResultIndex - 1 + totalResults) % totalResults;
        }
        setCurrentResultIndex(nextIndex);
    };


    const handleSendMessage = async (e: React.FormEvent, customMessage?: string) => {
        e.preventDefault();
        const messageText = customMessage || newMessage.trim();
        if (messageText === '' || !activeChannel) return;

        const userMessage: Message = { id: Date.now(), author: user.name, avatar: user.name, text: messageText, timestamp: new Date().toISOString() };

        const updatedChannel = { ...activeChannel, messages: [...activeChannel.messages, userMessage] };

        // Optimistic update
        setChannels(prevChannels =>
            prevChannels.map(c => c.id === activeChannelId ? updatedChannel : c)
        );

        // Note: persistence is handled by the setChannels prop in app.tsx
        if (!customMessage) {
            setNewMessage('');
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && activeChannel) {
            const file = e.target.files[0];
            try {
                // 1. Upload the file to the server
                const attachment = await api.uploadChannelFile(file);

                // 2. Prepare the system/user message with attachment metadata
                const userMessage: Message = {
                    id: Date.now(),
                    author: user.name,
                    avatar: user.name,
                    text: `Shared a file: ${file.name}`,
                    timestamp: new Date().toISOString(),
                    attachment: {
                        id: attachment.id,
                        name: attachment.name,
                        url: attachment.url,
                        contentType: attachment.contentType,
                        size: attachment.size
                    }
                };

                const updatedChannel = { ...activeChannel, messages: [...activeChannel.messages, userMessage] };

                // 3. Update UI
                setChannels(prevChannels =>
                    prevChannels.map(c => c.id === activeChannelId ? updatedChannel : c)
                );
            } catch (error) {
                console.error("File upload failed", error);
            } finally {
                e.target.value = '';
            }
        }
    };

    const handleSelectUserForDM = async (targetUser: User) => {
        const channelId = `dm-${[user.id, targetUser.id].sort().join('-')}`;
        const existingChannel = channels.find(c => c.id === channelId);

        if (existingChannel) {
            setActiveChannelId(existingChannel.id);
        } else {
            const newDMChannel: Channel = {
                id: channelId, name: targetUser.name, type: 'dm', members: [user.id, targetUser.id],
                messages: [{ id: Date.now(), author: 'System', avatar: 'System', text: `This is the beginning of your direct message history with ${targetUser.name}.`, timestamp: new Date().toISOString() }],
            };
            setChannels(prev => [...prev, newDMChannel]);
            setActiveChannelId(newDMChannel.id);
        }
        setIsNewChatModalOpen(false);
        setIsNewChatMenuOpen(false);
    };

    const getChannelDisplay = (channel: Channel) => {
        if (channel.type === 'dm') {
            const perspectiveUser = isAuditing ? auditUser : user;
            const otherUserId = channel.members?.find(id => id !== perspectiveUser?.id);
            const otherUser = users.find(u => u.id === otherUserId);
            return { name: otherUser?.name || 'Unknown User', avatarName: otherUser?.name || '?' };
        }
        return { name: channel.name, avatarName: channel.name };
    };

    const handleSaveEdit = async (newText: string) => {
        if (!editingMessage || !activeChannel) return;

        const updatedChannel = {
            ...activeChannel,
            messages: activeChannel.messages.map(m => m.id === editingMessage.id ? { ...m, text: newText, edited: true } : m)
        };

        setChannels(prev => prev.map(c => c.id === activeChannelId ? updatedChannel : c));
        setEditingMessage(null);
    };

    const displayChannels = isAuditing ? auditChannels : channels;

    const filteredChannels = displayChannels.filter(channel => {
        if (!chatListSearch.trim()) return true;
        const { name } = getChannelDisplay(channel);
        return name.toLowerCase().includes(chatListSearch.toLowerCase());
    });

    const renderChatListItem = (channel: Channel) => {
        const { name, avatarName } = getChannelDisplay(channel);
        const lastMessage = channel.messages[channel.messages.length - 1];
        const isActive = channel.id === activeChannelId;

        return (
            <button key={channel.id} onClick={() => { setActiveChannelId(channel.id); setIsSearchVisible(false); }} className={`w-full flex items-center p-3 text-left transition-colors ${isActive ? 'bg-lyceum-blue/10 dark:bg-lyceum-blue/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}>
                <UserAvatar name={avatarName} />
                <div className="flex-grow ml-3 overflow-hidden">
                    <div className="flex justify-between items-center">
                        <p className={`font-semibold text-gray-800 dark:text-gray-100 truncate ${isActive ? 'text-lyceum-blue' : ''}`}>{name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">{lastMessage ? formatTimestamp(lastMessage.timestamp) : ''}</p>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{lastMessage?.text}</p>
                </div>
            </button>
        )
    };

    const renderChatWindow = () => {
        const currentChannels = isAuditing ? auditChannels : channels;
        const activeChannel = currentChannels.find(c => c.id === activeChannelId);

        if (!activeChannel) {
            return (
                <div className="flex-1 flex-col items-center justify-center hidden md:flex" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232A6F97' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}>
                    <MessageCircle size={64} className="text-gray-300 dark:text-gray-600" />
                    <h2 className="mt-4 text-xl font-medium text-gray-500 dark:text-gray-400">Select a chat to start messaging</h2>
                    {isAuditing && auditUser && <p className="mt-2 text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full font-medium">Auditing: {auditUser.name}</p>}
                </div>
            );
        }

        const { name, avatarName } = getChannelDisplay(activeChannel);

        return (
            <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900">
                { }
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center bg-gray-50 dark:bg-gray-800 h-16 flex-shrink-0">
                    {isMobile && <button onClick={() => { setActiveChannelId(''); setIsSearchVisible(false); }} className="p-2 mr-2 text-gray-600 dark:text-gray-300"><ArrowLeft size={20} /></button>}
                    {isSearchVisible ? (
                        <div className="flex items-center w-full gap-2">
                            <input
                                type="text"
                                placeholder="Search in this chat..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-2 text-sm text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-lyceum-blue"
                                autoFocus
                            />
                            {searchResultsRef.current.length > 0 ? (
                                <span className="text-sm text-gray-500 whitespace-nowrap">{currentResultIndex + 1} of {searchResultsRef.current.length}</span>
                            ) : searchQuery && <span className="text-sm text-gray-500">No results</span>}
                            <button onClick={() => handleNavigateResults('prev')} disabled={searchResultsRef.current.length === 0} className="p-1 text-gray-500 disabled:opacity-50"><ChevronUp size={20} /></button>
                            <button onClick={() => handleNavigateResults('next')} disabled={searchResultsRef.current.length === 0} className="p-1 text-gray-500 disabled:opacity-50"><ChevronDown size={20} /></button>
                            <button onClick={() => setIsSearchVisible(false)} className="p-1 text-gray-500"><X size={20} /></button>
                        </div>
                    ) : (
                        <>
                            <UserAvatar name={avatarName} />
                            <div className="ml-3">
                                <h2 className="font-bold text-gray-800 dark:text-gray-100">{name}</h2>
                                {isAuditing ? (
                                    <p className="text-xs text-amber-600 font-medium italic">Viewing as Auditor</p>
                                ) : (
                                    <p className="text-xs text-green-500">online</p>
                                )}
                            </div>
                            <div className="ml-auto flex items-center gap-4 text-gray-500 dark:text-gray-400">
                                <button onClick={() => setIsSearchVisible(true)}><Search size={20} /></button>
                                {isAuditing && <button onClick={stopAuditing} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-md hover:bg-red-200">Exit Audit</button>}
                            </div>
                        </>
                    )}
                </div>

                { }
                <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232A6F97' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}>
                    {activeChannel.messages.map(msg => (
                        <MessageBubble
                            key={msg.id}
                            ref={el => { messageRefs.current[msg.id] = el; }}
                            message={msg}
                            isCurrentUser={msg.author === (isAuditing ? auditUser?.name : user.name)}
                            isEditing={editingMessage?.id === msg.id}
                            onStartEdit={setEditingMessage}
                            onSaveEdit={handleSaveEdit}
                            onCancelEdit={() => setEditingMessage(null)}
                            isHighlighted={searchResultsRef.current[currentResultIndex] === msg.id}
                            isReadOnly={isAuditing}
                        />
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                { }
                {/* Input Area (Disabled in Audit Mode) */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
                    {isAuditing ? (
                        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-center text-sm font-medium">
                            Transparency Mode: Messages are read-only during an audit.
                        </div>
                    ) : (
                        <form onSubmit={handleSendMessage} className="relative flex items-center">
                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-500 hover:text-lyceum-blue"><Paperclip size={20} /></button>
                            <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full py-3 pl-5 pr-14 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-lyceum-blue focus:border-lyceum-blue" />
                            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white bg-lyceum-blue rounded-full hover:bg-lyceum-blue-dark disabled:opacity-50" disabled={!newMessage.trim()}><Send size={20} /></button>
                        </form>
                    )}
                </div>
            </div>
        )
    };

    const renderChatList = () => (
        <div className="w-full md:w-96 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between h-16">
                <h2 className="font-bold text-xl text-gray-800 dark:text-gray-100">Chats</h2>
                <div className="relative">
                    <button ref={newChatButtonRef} onClick={handleNewChatClick} className="p-1.5 text-gray-500 hover:text-lyceum-blue rounded-full hover:bg-lyceum-blue/10 flex items-center gap-1">
                        <Plus size={20} />
                        {isAuditing && <span className="text-[10px] font-bold text-amber-600">AUDIT</span>}
                    </button>
                    {isNewChatMenuOpen && (
                        <div ref={newChatMenuRef} className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-20 ring-1 ring-black dark:ring-white/10 ring-opacity-5">
                            <button onClick={() => { setIsNewChatModalOpen(true); setIsNewChatMenuOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                New Direct Message
                            </button>
                            <button onClick={() => { setIsNewGroupModalOpen(true); setIsNewChatMenuOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                New Group
                            </button>
                            {isAdmin && (
                                <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                                    <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transparency Admin</div>
                                    <div className="px-2 pb-2">
                                        <input
                                            type="text"
                                            placeholder="Audit name..."
                                            value={auditSearch}
                                            onChange={(e) => setAuditSearch(e.target.value)}
                                            className="w-full px-2 py-1 text-xs border rounded bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                                        />
                                    </div>
                                    <div className="max-h-32 overflow-y-auto">
                                        {users.filter(u => u.name.toLowerCase().includes(auditSearch.toLowerCase()) && u.id !== user.id).map(u => (
                                            <button
                                                key={u.id}
                                                onClick={() => handleStartAudit(u)}
                                                className="w-full text-left px-4 py-1.5 text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                            >
                                                Audit: {u.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={chatListSearch}
                        onChange={(e) => setChatListSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-lyceum-blue"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {filteredChannels.map(c => renderChatListItem(c))}
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <div className="relative h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm animate-fade-in overflow-hidden">
                <NewChatModal
                    isOpen={isNewChatModalOpen}
                    onClose={() => setIsNewChatModalOpen(false)}
                    users={users}
                    currentUser={user}
                    onSelectUser={handleSelectUserForDM}
                    channels={channels}
                />
                {(isAdmin || isStaff) && <NewGroupModal isOpen={isNewGroupModalOpen} onClose={() => setIsNewGroupModalOpen(false)} users={users} currentUser={user} onCreateGroup={onCreateGroup} />}
                {activeChannelId ? renderChatWindow() : renderChatList()}
            </div>
        )
    }

    return (
        <div className="relative flex h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm animate-fade-in overflow-hidden">
            <NewChatModal
                isOpen={isNewChatModalOpen}
                onClose={() => setIsNewChatModalOpen(false)}
                users={users}
                currentUser={user}
                onSelectUser={handleSelectUserForDM}
                channels={channels}
            />
            {(isAdmin || isStaff) && <NewGroupModal isOpen={isNewGroupModalOpen} onClose={() => setIsNewGroupModalOpen(false)} users={users} currentUser={user} onCreateGroup={onCreateGroup} />}
            {renderChatList()}
            {renderChatWindow()}
        </div>
    );
};

export default DiscussView;
