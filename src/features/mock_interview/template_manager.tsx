import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, FileText, Target, Layers } from '@/components/common/icons';
import type { QuestionTemplate, Question, VisaType } from './types';
import { MOCK_INTERVIEW_VISA_TYPES } from './util/constants';

interface TemplateManagerProps {
  templates: QuestionTemplate[];
  setTemplates: (templates: QuestionTemplate[]) => void;
  questions: Question[];
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ templates, setTemplates, questions }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuestionTemplate | null>(null);
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [formData, setFormData] = useState<Partial<QuestionTemplate>>({
    name: '',
    description: '',
    difficulty: 'Medium',
    visa_types: ['F-1'],
    questions: []
  });
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'templates' | 'manage'>('templates');

  useEffect(() => {
    // Load templates from localStorage
    const savedTemplates = localStorage.getItem('mockInterviewTemplates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  useEffect(() => {
    // Save templates to localStorage whenever they change
    localStorage.setItem('mockInterviewTemplates', JSON.stringify(templates));
  }, [templates, setTemplates]);

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.difficulty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredQuestions = questions.filter(question =>
    question.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateTemplateId = (): string => {
    const existingIds = templates.map(t => parseInt(t.id.replace('TPL-', '') || '0', 10));
    const maxId = Math.max(...existingIds, 0);
    return `TPL-${String(maxId + 1).padStart(6, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const template: QuestionTemplate = {
      id: editingTemplate ? editingTemplate.id : generateTemplateId(),
      name: formData.name || '',
      description: formData.description,
      difficulty: formData.difficulty || 'Medium',
      visa_types: formData.visa_types || ['F-1'],
      questions: selectedQuestions,
      created_at: editingTemplate?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (editingTemplate) {
      setTemplates(templates.map(t => t.id === editingTemplate.id ? template : t));
    } else {
      setTemplates([...templates, template]);
    }

    resetForm();
  };

  const handleEdit = (template: QuestionTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      difficulty: template.difficulty,
      visa_types: template.visa_types,
      questions: template.questions
    });
    setSelectedQuestions(template.questions);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    setTemplates(templates.filter(t => t.id !== id));
  };

  const handleRemoveQuestion = (question: Question) => {
    setSelectedQuestions(selectedQuestions.filter(q => q.id !== question.id));
  };

  const handleAddQuestion = (question: Question) => {
    if (selectedQuestions.find(q => q.id === question.id)) return;
    setSelectedQuestions([...selectedQuestions, question]);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', difficulty: 'Medium', visa_types: ['F-1'], questions: [] });
    setSelectedQuestions([]);
    setEditingTemplate(null);
    setShowForm(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Hard': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-2 border border-gray-100 dark:border-gray-700">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all ${
              activeTab === 'templates'
                ? 'bg-gradient-to-r from-lyceum-blue to-blue-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <FileText size={18} />
            Templates
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all ${
              activeTab === 'manage'
                ? 'bg-gradient-to-r from-lyceum-blue to-blue-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Layers size={18} />
            Manage Templates
          </button>
        </div>
      </div>

      {activeTab === 'templates' ? (
        <>
          {/* Templates List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold ${getDifficultyColor(template.difficulty)}`}>
                    {template.difficulty}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(template)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {template.name}
                </h3>
                {template.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {template.description}
                  </p>
                )}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Target size={14} />
                    <span>{template.questions.length} questions</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {template.visa_types.map(vt => (
                      <span key={vt} className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        {vt}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold uppercase">
                    Questions Preview
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {template.questions.slice(0, 3).map((q, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {q.question_text}
                        </span>
                      </div>
                    ))}
                    {template.questions.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                        +{template.questions.length - 3} more questions...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl border border-gray-100 dark:border-gray-700">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                <FileText size={40} className="text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Templates Yet</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Create question templates to quickly select multiple questions for mock interviews.
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Create/Edit Template Form */}
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lyceum-blue to-blue-600 flex items-center justify-center">
                  {editingTemplate ? <Edit size={20} className="text-white" /> : <Plus size={20} className="text-white" />}
                </div>
                {editingTemplate ? 'Edit Template' : 'New Template'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., F-1 Student Visa - Easy"
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Brief description of this template..."
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Visa Types
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {MOCK_INTERVIEW_VISA_TYPES.map(vt => (
                        <button
                          key={vt}
                          type="button"
                          onClick={() => {
                            const current = formData.visa_types || [];
                            if (current.includes(vt)) {
                              setFormData({ ...formData, visa_types: current.filter(t => t !== vt) });
                            } else {
                              setFormData({ ...formData, visa_types: [...current, vt] });
                            }
                          }}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            (formData.visa_types || []).includes(vt)
                              ? 'bg-purple-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                          }`}
                        >
                          {vt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Questions ({selectedQuestions.length} selected)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowQuestionSelector(!showQuestionSelector)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors"
                    >
                      <Plus size={16} />
                      Add Questions
                    </button>
                  </div>

                  {selectedQuestions.length > 0 && (
                    <div className="space-y-2">
                      {selectedQuestions.map((question, idx) => (
                        <div
                          key={question.id}
                          className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600"
                        >
                          <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 flex items-center justify-center text-sm font-bold">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 dark:text-gray-100 font-medium">
                              {question.question_text}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(question)}
                            className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {showQuestionSelector && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl p-6 w-full max-w-2xl border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Select Questions
                          </h3>
                          <button
                            onClick={() => setShowQuestionSelector(false)}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
                          >
                            <X size={24} />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search questions..."
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 mb-4"
                        />
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {filteredQuestions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                              No questions found
                            </div>
                          ) : (
                            filteredQuestions.map((question, idx) => (
                              <div
                                key={question.id}
                                onClick={() => handleAddQuestion(question)}
                                className={`p-4 rounded-xl cursor-pointer transition-all ${
                                  selectedQuestions.find(q => q.id === question.id)
                                    ? 'bg-purple-100 border-purple-500'
                                    : 'bg-white dark:bg-gray-800 hover:bg-purple-50 border-gray-200 dark:border-gray-600 hover:border-purple-300'
                                }`}
                              >
                                <p className="text-sm text-gray-800 dark:text-gray-100 font-medium">
                                  {question.question_text}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowQuestionSelector(false)}
                          className="w-full mt-4 px-6 py-3 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 transition-colors"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!formData.name || selectedQuestions.length === 0}
                    className="flex items-center px-8 py-3 bg-gradient-to-r from-lyceum-blue to-blue-600 text-white rounded-xl font-bold hover:shadow-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={20} className="mr-2" />
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default TemplateManager;
