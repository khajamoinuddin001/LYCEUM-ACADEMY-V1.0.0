import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, X, AlertCircle, BookOpen, Layout } from '@/components/common/icons';

export type Question = {
  id: string;
  question_text: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
};

export type QuestionCategory = 'General' | 'Study' | 'Finances' | 'Ties' | 'Post-Graduation Plans' | 'Work Experience' | 'Family' | 'Other';

export type QuestionTemplate = {
  id: string;
  name: string;
  description?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  visa_types: string[];
  questions: Question[];
  created_at: string;
  updated_at?: string;
};

type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface QuestionBankProps {
  onEditQuestion?: (question: Question) => void;
}

const QuestionBank: React.FC<QuestionBankProps> = ({ onEditQuestion }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [mode, setMode] = useState<'questions' | 'templates'>('questions');
  const [templates, setTemplates] = useState<QuestionTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuestionTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<QuestionTemplate | null>(null);
  const [showAddQuestionToTemplateModal, setShowAddQuestionToTemplateModal] = useState(false);

  const [formData, setFormData] = useState({
    question_text: '',
    category: 'General' as QuestionCategory,
    difficulty: 'Easy' as Difficulty,
  });

  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    description: '',
    difficulty: 'Easy' as Difficulty,
    visa_types: [] as string[],
  });

  useEffect(() => {
    const savedQuestions = localStorage.getItem('mockInterviewQuestions');
    if (savedQuestions) {
      setQuestions(JSON.parse(savedQuestions));
    } else {
      setQuestions([
        { id: '1', question_text: 'Why did you choose this university?', category: 'Study', difficulty: 'Easy' },
        { id: '2', question_text: 'How will you fund your education?', category: 'Finances', difficulty: 'Medium' },
        { id: '3', question_text: 'Do you have family in US?', category: 'Ties', difficulty: 'Hard' },
        { id: '4', question_text: 'What will you do after graduation?', category: 'Post-Graduation Plans', difficulty: 'Medium' },
        { id: '5', question_text: 'Tell me about your family.', category: 'General', difficulty: 'Easy' },
      ]);
    }
  }, []);

  useEffect(() => {
    const savedTemplates = localStorage.getItem('mockInterviewTemplates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  const saveQuestionsToLocalStorage = (updatedQuestions: Question[]) => {
    localStorage.setItem('mockInterviewQuestions', JSON.stringify(updatedQuestions));
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         q.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || q.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All' || q.difficulty === selectedDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const categories: QuestionCategory[] = ['General', 'Study', 'Finances', 'Ties', 'Post-Graduation Plans', 'Work Experience', 'Family', 'Other'];
  const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard'];
  const visaTypes = ['F1 (Student Visa)', 'B1/B2 (Visit Visa)', 'H1B (Work Visa)', 'J1 (Exchange Visitor)', 'L1 (Intra-company Transfer)', 'Other'];

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question_text: '',
      category: 'General',
      difficulty: 'Easy',
    };
    setEditingQuestion(newQuestion);
    setFormData({
      question_text: '',
      category: 'General',
      difficulty: 'Easy',
    });
    setShowModal(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text,
      category: question.category as QuestionCategory,
      difficulty: question.difficulty,
    });
    setShowModal(true);
  };

  const handleSaveQuestion = () => {
    if (!formData.question_text.trim()) {
      alert('Please enter a question text');
      return;
    }

    let updatedQuestions: Question[];
    if (editingQuestion?.id) {
      updatedQuestions = questions.map(q =>
        q.id === editingQuestion.id ? { ...formData, id: editingQuestion.id } : q
      );
    } else {
      updatedQuestions = [...questions, { ...formData, id: Date.now().toString() }];
    }

    setQuestions(updatedQuestions);
    saveQuestionsToLocalStorage(updatedQuestions);
    setShowModal(false);
    setEditingQuestion(null);
    setFormData({
      question_text: '',
      category: 'General',
      difficulty: 'Easy',
    });
  };

  const handleDeleteQuestion = (id: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      const updatedQuestions = questions.filter(q => q.id !== id);
      setQuestions(updatedQuestions);
      saveQuestionsToLocalStorage(updatedQuestions);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingQuestion(null);
    setFormData({
      question_text: '',
      category: 'General',
      difficulty: 'Easy',
    });
  };

  // Template management functions
  const handleAddTemplate = () => {
    setEditingTemplate(null);
    setTemplateFormData({
      name: '',
      description: '',
      difficulty: 'Easy',
      visa_types: [],
    });
    setShowTemplateModal(true);
  };

  const handleEditTemplate = (template: QuestionTemplate) => {
    setEditingTemplate(template);
    setTemplateFormData({
      name: template.name,
      description: template.description || '',
      difficulty: template.difficulty,
      visa_types: template.visa_types,
    });
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = () => {
    if (!templateFormData.name.trim()) {
      alert('Please enter a template name');
      return;
    }

    const now = new Date().toISOString();
    let updatedTemplates: QuestionTemplate[];

    if (editingTemplate?.id) {
      updatedTemplates = templates.map(t => {
        if (t.id === editingTemplate.id) {
          return { ...templateFormData, questions: t.questions, created_at: t.created_at, updated_at: now } as QuestionTemplate;
        }
        return t;
      });
    } else {
      const newTemplate: QuestionTemplate = {
        ...templateFormData,
        id: Date.now().toString(),
        questions: [],
        created_at: now,
      };
      updatedTemplates = [...templates, newTemplate];
    }

    setTemplates(updatedTemplates);
    localStorage.setItem('mockInterviewTemplates', JSON.stringify(updatedTemplates));
    setShowTemplateModal(false);
    setEditingTemplate(null);
    setTemplateFormData({
      name: '',
      description: '',
      difficulty: 'Easy',
      visa_types: [],
    });
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      const updatedTemplates = templates.filter(t => t.id !== id);
      setTemplates(updatedTemplates);
      localStorage.setItem('mockInterviewTemplates', JSON.stringify(updatedTemplates));
    }
  };

  const handleViewTemplateQuestions = (template: QuestionTemplate) => {
    setSelectedTemplate(template);
    setShowAddQuestionToTemplateModal(true);
  };

  const handleAddQuestionToTemplate = (question: Question) => {
    if (!selectedTemplate) return;

    const updatedTemplates = templates.map(t => {
      if (t.id === selectedTemplate.id) {
        const existingQuestion = t.questions.find(q => q.id === question.id);
        if (existingQuestion) {
          alert('This question is already in the template');
          return t;
        }
        return { ...t, questions: [...t.questions, question] };
      }
      return t;
    });

    setTemplates(updatedTemplates);
    localStorage.setItem('mockInterviewTemplates', JSON.stringify(updatedTemplates));
    setSelectedTemplate(updatedTemplates.find(t => t.id === selectedTemplate.id) || null);
  };

  const handleRemoveQuestionFromTemplate = (questionId: string) => {
    if (!selectedTemplate) return;

    const updatedTemplates = templates.map(t => {
      if (t.id === selectedTemplate.id) {
        return { ...t, questions: t.questions.filter(q => q.id !== questionId) };
      }
      return t;
    });

    setTemplates(updatedTemplates);
    localStorage.setItem('mockInterviewTemplates', JSON.stringify(updatedTemplates));
    setSelectedTemplate(updatedTemplates.find(t => t.id === selectedTemplate.id) || null);
  };

  const handleToggleVisaType = (visaType: string) => {
    if (templateFormData.visa_types.includes(visaType)) {
      setTemplateFormData({ ...templateFormData, visa_types: templateFormData.visa_types.filter(v => v !== visaType) });
    } else {
      setTemplateFormData({ ...templateFormData, visa_types: [...templateFormData.visa_types, visaType] });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Hard': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex gap-3 mb-6 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setMode('questions')}
          className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-semibold transition-all ${
            mode === 'questions'
              ? 'bg-gradient-to-r from-lyceum-blue to-blue-600 text-white shadow-lg'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <BookOpen size={18} />
          Questions
        </button>
        <button
          onClick={() => setMode('templates')}
          className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-semibold transition-all ${
            mode === 'templates'
              ? 'bg-gradient-to-r from-lyceum-blue to-blue-600 text-white shadow-lg'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Layout size={18} />
          Templates
        </button>
      </div>

      {mode === 'questions' || mode === 'templates' ? (
        <>
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {mode === 'questions' ? 'Question Bank' : 'Question Templates'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {filteredQuestions.length} {mode === 'questions' ? 'questions' : 'templates'} available
              </p>
            </div>
            <button
              onClick={handleAddQuestion}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-lyceum-blue to-blue-600 text-white rounded-xl font-semibold hover:shadow-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
            >
              <Plus size={20} />
              Add Question
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="All">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="All">All Difficulties</option>
                  {difficulties.map(diff => (
                    <option key={diff} value={diff}>{diff}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Questions Grid */}
          {filteredQuestions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 text-center">
              <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">
                No questions found. {searchTerm && 'Try adjusting your filters or search term.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredQuestions.map((question) => (
                <div
                  key={question.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(question.difficulty)}`}>
                      {question.difficulty}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditQuestion(question)}
                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-900 dark:text-white font-medium mb-3 line-clamp-3">
                    {question.question_text}
                  </p>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {question.category}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingQuestion?.id ? 'Edit Question' : 'Add New Question'}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Question Text <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.question_text}
                      onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      placeholder="Enter the question..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as QuestionCategory })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Difficulty
                      </label>
                      <select
                        value={formData.difficulty}
                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as Difficulty })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {difficulties.map(diff => (
                          <option key={diff} value={diff}>{diff}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleCloseModal}
                    className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveQuestion}
                    className="px-6 py-3 bg-gradient-to-r from-lyceum-blue to-blue-600 text-white rounded-xl font-semibold hover:shadow-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
                  >
                    {editingQuestion?.id ? 'Update Question' : 'Add Question'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Templates View */}
          {mode === 'templates' && (
            <>
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Question Templates
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {templates.length} templates available
                  </p>
                </div>
                <button
                  onClick={handleAddTemplate}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-lyceum-blue to-blue-600 text-white rounded-xl font-semibold hover:shadow-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
                >
                  <Plus size={20} />
                  Create Template
                </button>
              </div>

              {/* Templates Grid */}
              {templates.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 text-center">
                  <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No templates found. Create your first template to get started.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 group"
                    >
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(template.difficulty)}`}>
                          {template.difficulty}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleViewTemplateQuestions(template)}
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                            title="Manage Questions"
                          >
                            <BookOpen size={16} />
                          </button>
                          <button
                            onClick={() => handleEditTemplate(template)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {template.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                        {template.description || 'No description'}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                          {template.questions.length} questions
                        </span>
                        <div className="flex gap-1 flex-wrap">
                          {template.visa_types.slice(0, 2).map((visa, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                              {visa}
                            </span>
                          ))}
                          {template.visa_types.length > 2 && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                              +{template.visa_types.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Template Modal */}
          {showTemplateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingTemplate?.id ? 'Edit Template' : 'Create New Template'}
                  </h3>
                  <button
                    onClick={() => setShowTemplateModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Template Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={templateFormData.name}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter template name..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={templateFormData.description}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      placeholder="Enter template description..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={templateFormData.difficulty}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, difficulty: e.target.value as Difficulty })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {difficulties.map(diff => (
                        <option key={diff} value={diff}>{diff}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Visa Types
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {visaTypes.map(visa => (
                        <button
                          key={visa}
                          type="button"
                          onClick={() => handleToggleVisaType(visa)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            templateFormData.visa_types.includes(visa)
                              ? 'bg-purple-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {visa}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowTemplateModal(false)}
                    className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    className="px-6 py-3 bg-gradient-to-r from-lyceum-blue to-blue-600 text-white rounded-xl font-semibold hover:shadow-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
                  >
                    {editingTemplate?.id ? 'Update Template' : 'Create Template'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Question to Template Modal */}
          {showAddQuestionToTemplateModal && selectedTemplate && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Manage Template: {selectedTemplate.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      {selectedTemplate.questions.length} questions selected
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddQuestionToTemplateModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Available Questions */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Add Questions
                    </h4>
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                      {questions.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                          No questions available. Create questions first.
                        </p>
                      ) : (
                        questions.map((question) => {
                          const isSelected = selectedTemplate.questions.some(q => q.id === question.id);
                          return (
                            <div
                              key={question.id}
                              className={`p-4 rounded-xl border transition-all ${
                                isSelected
                                  ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-600 opacity-50'
                                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                  <p className="text-gray-900 dark:text-white font-medium">
                                    {question.question_text}
                                  </p>
                                  <div className="flex gap-2 mt-2">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">{question.category}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs ${getDifficultyColor(question.difficulty)}`}>
                                      {question.difficulty}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => !isSelected && handleAddQuestionToTemplate(question)}
                                  disabled={isSelected}
                                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    isSelected
                                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                      : 'bg-purple-500 text-white hover:bg-purple-600'
                                  }`}
                                >
                                  {isSelected ? 'Added' : 'Add'}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Selected Questions */}
                  {selectedTemplate.questions.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Selected Questions ({selectedTemplate.questions.length})
                      </h4>
                      <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                        {selectedTemplate.questions.map((question) => (
                          <div
                            key={question.id}
                            className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-600"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <p className="text-gray-900 dark:text-white font-medium">
                                  {question.question_text}
                                </p>
                                <div className="flex gap-2 mt-2">
                                  <span className="text-sm text-gray-500 dark:text-gray-400">{question.category}</span>
                                  <span className={`px-2 py-0.5 rounded text-xs ${getDifficultyColor(question.difficulty)}`}>
                                    {question.difficulty}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveQuestionFromTemplate(question.id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowAddQuestionToTemplateModal(false)}
                    className="px-6 py-3 bg-gradient-to-r from-lyceum-blue to-blue-600 text-white rounded-xl font-semibold hover:shadow-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default QuestionBank;
