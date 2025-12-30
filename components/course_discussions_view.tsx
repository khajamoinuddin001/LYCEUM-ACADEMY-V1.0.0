import React, { useState, useRef, useEffect } from 'react';
import type { LmsCourse, User, DiscussionThread, DiscussionPost } from '../types';
import { MessageCircle, CornerDownLeft, Plus, ArrowLeft, Send } from './icons';
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

const UserAvatar: React.FC<{ name: string; size?: string }> = ({ name, size = "w-10 h-10" }) => {
    return <div className={`${size} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${getAvatarColor(name)}`}>{getInitials(name)}</div>;
};

const formatTimeAgo = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " year(s) ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " month(s) ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " day(s) ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hour(s) ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minute(s) ago";
    return "just now";
}
interface CourseDiscussionsViewProps {
  course: LmsCourse;
  user: User;
  users: User[];
  onSavePost: (courseId: string, threadId: string | 'new', postContent: { title?: string; content: string }) => void;
}

const CourseDiscussionsView: React.FC<CourseDiscussionsViewProps> = ({ course, user, users, onSavePost }) => {
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [showNewThreadForm, setShowNewThreadForm] = useState(false);
    const [newThreadTitle, setNewThreadTitle] = useState('');
    const [newThreadContent, setNewThreadContent] = useState('');
    const [replyContent, setReplyContent] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeThread = course.discussions?.find(t => t.id === activeThreadId);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeThread?.posts]);

    const handleNewThreadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newThreadTitle.trim() && newThreadContent.trim()) {
            onSavePost(course.id, 'new', { title: newThreadTitle, content: newThreadContent });
            setShowNewThreadForm(false);
            setNewThreadTitle('');
            setNewThreadContent('');
        }
    };

    const handleReplySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (replyContent.trim() && activeThreadId) {
            onSavePost(course.id, activeThreadId, { content: replyContent });
            setReplyContent('');
        }
    };
    
    if (activeThread) {
        return (
            <div className="p-6">
                <button onClick={() => setActiveThreadId(null)} className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-lyceum-blue mb-4">
                    <ArrowLeft size={16} className="mr-2" />
                    Back to All Discussions
                </button>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">{activeThread.title}</h2>
                <div className="space-y-6">
                    {activeThread.posts.map(post => (
                        <div key={post.id} className="flex items-start gap-4">
                            <UserAvatar name={post.authorName} />
                            <div className="flex-grow bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{post.authorName}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(post.timestamp)}</p>
                                </div>
                                <p className="mt-2 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{post.content}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleReplySubmit} className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                     <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)} rows={4} placeholder="Write a reply..." className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600"></textarea>
                     <div className="text-right mt-2">
                         <button type="submit" disabled={!replyContent.trim()} className="inline-flex items-center px-4 py-2 bg-lyceum-blue text-white rounded-md text-sm font-medium hover:bg-lyceum-blue-dark disabled:opacity-50"><Send size={16} className="mr-2" /> Post Reply</button>
                     </div>
                </form>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Discussion Threads</h2>
                <button onClick={() => setShowNewThreadForm(!showNewThreadForm)} className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-lyceum-blue rounded-md hover:bg-lyceum-blue-dark transition-colors"><Plus size={14} className="mr-1.5" /> Start New Thread</button>
            </div>
            
            {showNewThreadForm && (
                <form onSubmit={handleNewThreadSubmit} className="p-4 mb-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 space-y-3">
                    <input type="text" value={newThreadTitle} onChange={e => setNewThreadTitle(e.target.value)} placeholder="Thread Title" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                    <textarea value={newThreadContent} onChange={e => setNewThreadContent(e.target.value)} rows={3} placeholder="Start your post..." className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600"></textarea>
                    <div className="text-right">
                        <button type="submit" disabled={!newThreadTitle.trim() || !newThreadContent.trim()} className="px-4 py-2 bg-lyceum-blue text-white rounded-md text-sm font-medium hover:bg-lyceum-blue-dark disabled:opacity-50">Create Thread</button>
                    </div>
                </form>
            )}

            {course.discussions && course.discussions.length > 0 ? (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {course.discussions.map(thread => (
                        <li key={thread.id}>
                            <button onClick={() => setActiveThreadId(thread.id)} className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-gray-100">{thread.title}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Last reply by <span className="font-medium">{thread.posts[thread.posts.length - 1].authorName}</span> &bull; {formatTimeAgo(thread.posts[thread.posts.length - 1].timestamp)}
                                    </p>
                                </div>
                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                    <CornerDownLeft size={16} className="mr-2" />
                                    {thread.posts.length} {thread.posts.length === 1 ? 'post' : 'posts'}
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                    <MessageCircle size={40} className="mx-auto text-gray-400" />
                    <h3 className="mt-2 text-lg font-semibold text-gray-700 dark:text-gray-200">No Discussions Yet</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Be the first to start a conversation!</p>
                </div>
            )}
        </div>
    );
};

export default CourseDiscussionsView;