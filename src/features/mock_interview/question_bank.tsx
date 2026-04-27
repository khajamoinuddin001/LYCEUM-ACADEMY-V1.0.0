import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, Edit, Trash2, ChevronDown, ChevronUp, BookOpen, Layout, Target, CheckCircle, X, GripVertical } from '@/components/common/icons';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as api from '@/utils/api';
import type { Question, QuestionTemplate, VisaType } from '@/types';
import { MOCK_INTERVIEW_VISA_TYPES } from '@/lib/constants';

const SortableQuestionItem: React.FC<{ question: Question; onRemove: (id: string) => void }> = ({ question, onRemove }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: question.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
    };

    return (
        <div 
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm ${isDragging ? 'opacity-50 ring-2 ring-lyceum-blue' : ''}`}
        >
            <div className="p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600" {...attributes} {...listeners}>
                <GripVertical size={16} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{question.question_text}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-tight">{question.category}</p>
            </div>
            <button 
                onClick={() => onRemove(question.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
                <X size={14} />
            </button>
        </div>
    );
};

const QuestionBank: React.FC = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [templates, setTemplates] = useState<QuestionTemplate[]>([]);
    const [activeView, setActiveView] = useState<'questions' | 'templates'>('questions');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [isAddingQuestion, setIsAddingQuestion] = useState(false);
    const [isAddingTemplate, setIsAddingTemplate] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
        question_text: '',
        category: 'General',
        difficulty: 'medium'
    });

    const [newTemplate, setNewTemplate] = useState<Partial<QuestionTemplate>>({
        name: '',
        difficulty: 'medium',
        visa_types: ['F-1'],
        questions: []
    });

    const [bankSearchQuery, setBankSearchQuery] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [qs, tmpls] = await Promise.all([
                api.getQuestions(),
                api.getTemplates()
            ]);
            setQuestions(qs);
            setTemplates(tmpls);
        } catch (err) {
            console.error('Failed to load question bank:', err);
        }
    };

    const handleSaveQuestion = async () => {
        if (!newQuestion.question_text) return;
        try {
            await api.saveQuestion(newQuestion);
            setIsAddingQuestion(false);
            setEditingItem(null);
            setNewQuestion({ question_text: '', category: 'General', difficulty: 'medium' });
            loadData();
        } catch (err) {
            console.error('Error saving question:', err);
        }
    };

    const handleDeleteQuestion = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this question?')) return;
        try {
            await api.deleteQuestion(id);
            loadData();
        } catch (err) {
            console.error('Error deleting question:', err);
        }
    };

    const handleSaveTemplate = async () => {
        if (!newTemplate.name) return;
        try {
            await api.saveTemplate(newTemplate);
            setIsAddingTemplate(false);
            setEditingItem(null);
            setNewTemplate({ name: '', difficulty: 'medium', visa_types: ['F-1'], questions: [] });
            loadData();
        } catch (err) {
            console.error('Error saving template:', err);
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;
        try {
            await api.deleteTemplate(id);
            loadData();
        } catch (err) {
            console.error('Error deleting template:', err);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const currentQuestions = newTemplate.questions || [];
            const oldIndex = currentQuestions.findIndex(q => q.id === active.id);
            const newIndex = currentQuestions.findIndex(q => q.id === over.id);
            
            setNewTemplate({
                ...newTemplate,
                questions: arrayMove(currentQuestions, oldIndex, newIndex)
            });
        }
    };

    const filteredQuestions = questions.filter(q => 
        (q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) || 
         q.category.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (filterCategory === 'All' || q.category === filterCategory)
    );

    const categories = ['All', ...Array.from(new Set(questions.map(q => q.category)))];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-6">
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveView('questions')}
                        className={`px-6 py-2 rounded-lg font-medium transition-all ${activeView === 'questions' ? 'bg-white dark:bg-gray-700 text-lyceum-blue shadow-sm' : 'text-gray-500'}`}
                    >
                        Questions
                    </button>
                    <button
                        onClick={() => setActiveView('templates')}
                        className={`px-6 py-2 rounded-lg font-medium transition-all ${activeView === 'templates' ? 'bg-white dark:bg-gray-700 text-lyceum-blue shadow-sm' : 'text-gray-500'}`}
                    >
                        Templates
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-lyceum-blue outline-none"
                        />
                    </div>
                    {activeView === 'questions' ? (
                        <button
                            onClick={() => { setIsAddingQuestion(true); setEditingItem(null); }}
                            className="w-full sm:w-auto bg-lyceum-blue text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg font-semibold"
                        >
                            <Plus size={18} />
                            Add Question
                        </button>
                    ) : (
                        <button
                            onClick={() => { setIsAddingTemplate(true); setEditingItem(null); }}
                            className="w-full sm:w-auto bg-purple-600 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-purple-700 transition-all shadow-lg font-semibold"
                        >
                            <Plus size={18} />
                            Add Template
                        </button>
                    )}
                </div>
            </div>

            {activeView === 'questions' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredQuestions.map((q) => (
                        <div key={q.id} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 group hover:border-lyceum-blue/30 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                    q.difficulty.toLowerCase() === 'easy' ? 'bg-green-100 text-green-700' :
                                    q.difficulty.toLowerCase() === 'medium' ? 'bg-blue-100 text-blue-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                    {q.difficulty}
                                </span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => { setEditingItem(q); setNewQuestion(q); setIsAddingQuestion(true); }} className="p-1.5 hover:bg-blue-100 rounded text-blue-600"><Edit size={14} /></button>
                                    <button onClick={() => handleDeleteQuestion(q.id)} className="p-1.5 hover:bg-red-100 rounded text-red-600"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <p className="text-gray-900 dark:text-gray-100 font-medium mb-3">{q.question_text}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Layout size={12} />
                                <span>{q.category}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((t) => (
                        <div key={t.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900 dark:text-white">{t.name}</h3>
                                <div className="flex gap-2 text-xs">
                                    {t.visa_types.map(v => (
                                        <span key={v} className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{v}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 flex items-center gap-2"><Target size={14} /> Difficulty</span>
                                    <span className="font-medium">{t.difficulty}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 flex items-center gap-2"><BookOpen size={14} /> Questions</span>
                                    <span className="font-medium text-lyceum-blue">{t.questions?.length || 0} items</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setEditingItem(t); setNewTemplate(t); setIsAddingTemplate(true); }}
                                    className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200"
                                >
                                    Edit Template
                                </button>
                                <button
                                    onClick={() => handleDeleteTemplate(t.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {(isAddingQuestion || isAddingTemplate) && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-none md:rounded-3xl w-full max-w-xl h-full md:h-auto shadow-2xl overflow-hidden animate-fade-in flex flex-col">
                        <div className="bg-gradient-to-r from-lyceum-blue to-blue-600 p-6 text-white flex justify-between items-center">
                            <h2 className="text-xl font-bold">{editingItem ? 'Edit' : 'Add'} {isAddingQuestion ? 'Question' : 'Template'}</h2>
                            <button onClick={() => { setIsAddingQuestion(false); setIsAddingTemplate(false); setEditingItem(null); }} className="hover:rotate-90 transition-all"><X size={24} /></button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto">
                            {isAddingQuestion ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Question Text</label>
                                        <textarea
                                            value={newQuestion.question_text}
                                            onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                                            className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl h-32 outline-none focus:ring-2 focus:ring-lyceum-blue"
                                            placeholder="Enter question text..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                                            <input
                                                type="text"
                                                value={newQuestion.category}
                                                onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Difficulty</label>
                                            <select
                                                value={newQuestion.difficulty}
                                                onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value as any })}
                                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none"
                                            >
                                                <option value="easy">Easy</option>
                                                <option value="medium">Medium</option>
                                                <option value="hard">Hard</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button onClick={handleSaveQuestion} className="w-full py-4 bg-lyceum-blue text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all">
                                        {editingItem ? 'Update Question' : 'Save Question'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Template Name</label>
                                        <input
                                            type="text"
                                            value={newTemplate.name}
                                            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Visa Types</label>
                                            <div className="flex flex-wrap gap-2">
                                                {MOCK_INTERVIEW_VISA_TYPES.map(visa => (
                                                    <button
                                                        key={visa}
                                                        onClick={() => {
                                                            const current = newTemplate.visa_types || [];
                                                            const updated = current.includes(visa) 
                                                                ? current.filter(v => v !== visa) 
                                                                : [...current, visa];
                                                            setNewTemplate({ ...newTemplate, visa_types: updated });
                                                        }}
                                                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                                            newTemplate.visa_types?.includes(visa)
                                                                ? 'bg-purple-600 text-white'
                                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                                                        }`}
                                                    >
                                                        {visa}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Difficulty</label>
                                            <select
                                                value={newTemplate.difficulty}
                                                onChange={(e) => setNewTemplate({ ...newTemplate, difficulty: e.target.value as any })}
                                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                                            >
                                                <option value="easy">Easy</option>
                                                <option value="medium">Medium</option>
                                                <option value="hard">Hard</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                                                <span>Selected Questions ({newTemplate.questions?.length || 0})</span>
                                                <span className="text-[10px] text-gray-400 font-normal italic">Drag to reorder</span>
                                            </label>
                                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-3 border border-gray-100 dark:border-gray-800 min-h-[100px] max-h-64 overflow-y-auto">
                                                {newTemplate.questions && newTemplate.questions.length > 0 ? (
                                                    <DndContext 
                                                        sensors={sensors}
                                                        collisionDetection={closestCenter}
                                                        onDragEnd={handleDragEnd}
                                                    >
                                                        <SortableContext 
                                                            items={newTemplate.questions.map(q => q.id)}
                                                            strategy={verticalListSortingStrategy}
                                                        >
                                                            <div className="space-y-2">
                                                                {newTemplate.questions.map((q) => (
                                                                    <SortableQuestionItem 
                                                                        key={q.id} 
                                                                        question={q} 
                                                                        onRemove={(id) => {
                                                                            setNewTemplate({
                                                                                ...newTemplate,
                                                                                questions: newTemplate.questions?.filter(cq => cq.id !== id)
                                                                            });
                                                                        }}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </SortableContext>
                                                    </DndContext>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                                        <BookOpen className="text-gray-200 mb-2" size={32} />
                                                        <p className="text-xs text-gray-400">No questions selected.<br/>Add some from the bank below.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Question Bank</label>
                                                <div className="relative w-48">
                                                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input 
                                                        type="text" 
                                                        placeholder="Search bank..."
                                                        value={bankSearchQuery}
                                                        onChange={(e) => setBankSearchQuery(e.target.value)}
                                                        className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-purple-500"
                                                    />
                                                </div>
                                            </div>
                                            <div className="max-h-48 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-2xl p-2 space-y-1 bg-gray-50 dark:bg-gray-900/30">
                                                {questions
                                                    .filter(q => 
                                                        !newTemplate.questions?.find(cq => cq.id === q.id) &&
                                                        (q.question_text.toLowerCase().includes(bankSearchQuery.toLowerCase()) || 
                                                         q.category.toLowerCase().includes(bankSearchQuery.toLowerCase()))
                                                    )
                                                    .map(q => (
                                                        <button
                                                            key={q.id}
                                                            onClick={() => {
                                                                const current = newTemplate.questions || [];
                                                                setNewTemplate({ ...newTemplate, questions: [...current, q] });
                                                            }}
                                                            className="w-full text-left px-3 py-2 rounded-xl text-sm transition-all hover:bg-purple-50 dark:hover:bg-purple-900/20 group flex items-center justify-between"
                                                        >
                                                            <span className="truncate">{q.question_text}</span>
                                                            <Plus size={14} className="text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </button>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={handleSaveTemplate} className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all">
                                        {editingItem ? 'Update Template' : 'Save Template'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestionBank;
