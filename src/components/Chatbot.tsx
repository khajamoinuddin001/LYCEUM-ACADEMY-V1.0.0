import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Sparkles, Navigation, BookOpen } from 'lucide-react';
import { chatWithAssistant } from '@/utils/api';
import { useNavigate } from 'react-router-dom';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const QUICK_ACTIONS = [
    { label: 'Study Destinations', icon: <Navigation size={14} />, query: 'Tell me about top study destinations like Singapore.' },
    { label: 'Test Preparation', icon: <BookOpen size={14} />, query: 'What test prep courses do you offer? Specifically Duolingo.' },
    { label: 'How to Enroll', icon: <Sparkles size={14} />, query: 'How does the enrollment process work at Lyceum Academy?' },
];

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hi! I am the Lyceum Academy AI Assistant. ✨\n\nHow can I help you today? You can ask me about studying abroad, test prep, or enrollment!' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            // Focus input smoothly after opening
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [messages, isOpen, isTyping]);

    // Basic markdown parser for links
    const renderMessageContent = (content: string) => {
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = linkRegex.exec(content)) !== null) {
            if (match.index > lastIndex) {
                parts.push(<span key={`text-${lastIndex}`}>{content.slice(lastIndex, match.index)}</span>);
            }
            const [fullMatch, text, url] = match;
            parts.push(
                <button
                    key={`link-${match.index}`}
                    onClick={() => {
                        if (url.startsWith('/')) {
                            navigate(url);
                            setIsOpen(false);
                        } else {
                            window.open(url, '_blank');
                        }
                    }}
                    className="text-white underline hover:text-blue-100 font-bold transition-colors shadow-sm"
                >
                    {text}
                </button>
            );
            lastIndex = linkRegex.lastIndex;
        }

        if (lastIndex < content.length) {
            parts.push(<span key={`text-${lastIndex}`}>{content.slice(lastIndex)}</span>);
        }

        return parts.length > 0 ? parts : content;
    };

    const handleSend = async (userMessage: string) => {
        if (!userMessage.trim() || isLoading) return;

        setInput('');

        const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
        setMessages(newMessages);
        setIsLoading(true);
        setIsTyping(true);

        try {
            // Pass previous context
            const history = newMessages.slice(1, -1).map(msg => ({ role: msg.role, content: msg.content }));

            const { reply } = await chatWithAssistant(userMessage, history);

            // Artificial delay to simulate "human-like" typing feel for better UX
            setTimeout(() => {
                setIsTyping(false);
                setMessages([...newMessages, { role: 'assistant', content: reply }]);
            }, 800);

        } catch (error) {
            setIsTyping(false);
            setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I am having trouble connecting to the server. Please try again later.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSend(input);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as any);
        }
    };

    const autoResizeInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] font-sans">
            {isOpen ? (
                <div className="w-[360px] sm:w-[400px] h-[600px] max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/20 bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl animate-fade-in-up transition-all duration-300 transform origin-bottom-right">

                    {/* Header - Glassmorphism gradient */}
                    <div className="bg-gradient-to-r from-lyceum-blue via-blue-600 to-purple-600 p-5 flex justify-between items-center text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-inner overflow-hidden p-1.5">
                                <img src="/academy logo.png" alt="Lyceum AI" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg tracking-tight leading-none text-white shadow-sm">Lyceum AI</h3>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                    <span className="text-xs text-blue-100 font-medium tracking-wide font-sans">Online</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="relative z-10 hover:bg-white/20 p-2 rounded-full transition-all duration-300 hover:rotate-90 active:scale-90"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 mr-3 mt-auto shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden p-1">
                                        <img src="/academy logo.png" alt="AI" className="w-full h-full object-contain" />
                                    </div>
                                )}
                                <div className={`max-w-[80%] p-4 rounded-3xl shadow-sm ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-lyceum-blue to-blue-600 text-white rounded-br-sm shadow-blue-500/20'
                                    : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm shadow-black/5'
                                    }`}>
                                    <p className="text-[15px] whitespace-pre-wrap leading-relaxed font-sans">
                                        {msg.role === 'user' ? msg.content : renderMessageContent(msg.content)}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="flex justify-start items-end animate-fade-in">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 mr-3 shadow-md overflow-hidden p-1 border border-gray-100 dark:border-gray-700">
                                    <img src="/academy logo.png" alt="AI" className="w-full h-full object-contain" />
                                </div>
                                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 py-4 px-5 rounded-3xl rounded-bl-sm shadow-sm flex items-center gap-2">
                                    <div className="flex space-x-1.5">
                                        <div className="w-2 h-2 bg-lyceum-blue/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-lyceum-blue/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-lyceum-blue/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-1" />
                    </div>

                    {/* Quick Actions (only show if history is short and not loading) */}
                    {messages.length < 3 && !isLoading && (
                        <div className="px-5 pb-3 flex flex-wrap gap-2 animate-fade-in">
                            {QUICK_ACTIONS.map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSend(action.query)}
                                    className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-blue-100 dark:border-gray-700 rounded-xl text-xs font-semibold text-lyceum-blue dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                                >
                                    {action.icon}
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Form */}
                    <div className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-800">
                        <form onSubmit={handleSubmit} className="flex gap-3 items-end relative bg-gray-50 dark:bg-gray-800 rounded-3xl p-1.5 pr-2 border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-lyceum-blue/30 focus-within:border-lyceum-blue transition-all">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={autoResizeInput}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask me anything..."
                                rows={1}
                                className="flex-1 bg-transparent border-none px-4 py-3 text-[15px] focus:outline-none focus:ring-0 dark:text-white resize-none max-h-32 min-h-[44px] font-sans"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="bg-gradient-to-r from-lyceum-blue to-blue-600 text-white p-3 rounded-2xl hover:shadow-lg disabled:opacity-40 disabled:hover:shadow-none transition-all duration-300 shrink-0 mb-0.5"
                            >
                                <Send size={18} className={`transition-transform duration-300 ${input.trim() && !isLoading ? 'translate-x-0.5 -translate-y-0.5' : ''}`} />
                            </button>
                        </form>
                        <div className="text-center mt-3">
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Powered by Lyceum AI </span>
                        </div>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="relative bg-gradient-to-tr from-lyceum-blue via-blue-600 to-indigo-500 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(59,130,246,0.4)] hover:scale-105 active:scale-95 transition-all duration-500 w-16 h-16 flex items-center justify-center group z-[9999] border border-white/20"
                >
                    {/* Glassy Overlay */}
                    <div className="absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.3),transparent_50%)]"></div>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent"></div>

                    {/* Hover Sheen */}
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                        <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full -translate-x-full transform skew-x-12 transition-transform duration-700"></div>
                    </div>

                    {/* Premium Minimal Icon */}
                    <MessageSquare size={28} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />

                    {/* Notification Badge perfectly aligned */}
                    <div className="absolute top-0 right-0 flex h-3.5 w-3.5 -translate-x-0.5 translate-y-0.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-80"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-[1.5px] border-white shadow-sm dark:border-gray-900"></span>
                    </div>
                </button>
            )}
        </div>
    );
};

export default Chatbot;
