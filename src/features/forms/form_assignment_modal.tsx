import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  User, 
  Calendar, 
  Plus, 
  Check, 
  Loader2,
  AlertCircle
} from '@/components/common/icons';
import { FormTemplate, Contact } from '@/types';
import * as api from '@/utils/api';

interface AssignmentModalProps {
  templateId?: string;
  onClose: () => void;
  onAssigned: () => void;
}

const AssignmentModal: React.FC<AssignmentModalProps> = ({ templateId, onClose, onAssigned }) => {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(templateId || '');
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tmpls, ctcList] = await Promise.all([
          api.getFormTemplates(),
          api.getContacts()
        ]);
        setTemplates(tmpls);
        // Only show students who have a userId (can log into the portal)
        setContacts(ctcList.filter(c => c.contactType === 'Student' || c.userId));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredContacts = contacts.filter(c => 
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.contactId || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleStudent = (id: number) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    if (!selectedTemplateId || selectedStudentIds.length === 0) return;
    
    setIsAssigning(true);
    try {
      await api.assignForm(selectedStudentIds, selectedTemplateId, deadline);
      onAssigned();
    } catch (err) {
      console.error(err);
      alert('Failed to assign forms.');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col h-[80vh] animate-in zoom-in-95 duration-300 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white leading-none mb-1">Assign Form</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select template and students</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-8 space-y-8">
          {/* Step 1: Template */}
          <div className="space-y-4">
             <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">1. Select Form Template</label>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               {templates.map(tmpl => (
                 <button
                   key={tmpl.id}
                   onClick={() => setSelectedTemplateId(tmpl.id)}
                   className={`p-4 rounded-2xl border text-left transition-all ${selectedTemplateId === tmpl.id ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-500/20' : 'bg-gray-50 dark:bg-gray-800 border-transparent hover:border-violet-300 text-gray-700 dark:text-gray-300'}`}
                 >
                   <h4 className="font-bold text-sm leading-tight mb-1">{String(tmpl.title || 'Untitled Form')}</h4>
                   <p className={`text-[10px] ${selectedTemplateId === tmpl.id ? 'text-violet-100' : 'text-gray-400'} line-clamp-1`}>{String(tmpl.description || '')}</p>
                 </button>
               ))}
               {templates.length === 0 && !isLoading && <p className="text-xs text-gray-400 italic">No templates available. Create one first.</p>}
             </div>
          </div>

          {/* Step 2: Students */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">2. Select Students ({selectedStudentIds.length})</label>
                <div className="relative group w-48">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-xs outline-none focus:ring-1 focus:ring-violet-500 transition-all font-medium"
                    />
                </div>
             </div>
             
             <div className="bg-gray-50 dark:bg-gray-950/20 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y dark:divide-gray-800 max-h-64 overflow-y-auto shadow-inner">
               {filteredContacts.map(c => (
                 <div 
                   key={c.id} 
                   onClick={() => toggleStudent(c.id)}
                   className="flex items-center justify-between p-3 cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-all"
                 >
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center text-violet-600 dark:text-violet-400 text-xs font-black">
                       {String(c.name?.[0] || '?')}
                     </div>
                     <div>
                       <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{String(c.name || 'Unknown')}</p>
                       <p className="text-[10px] font-medium text-gray-400 mt-1">{String(c.contactId || '')}</p>
                     </div>
                   </div>
                   <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${selectedStudentIds.includes(c.id) ? 'bg-violet-600 border-violet-600 text-white shadow-md' : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                     {selectedStudentIds.includes(c.id) && <Check size={14} />}
                   </div>
                 </div>
               ))}
               {filteredContacts.length === 0 && !isLoading && (
                 <div className="p-8 text-center text-gray-400 text-sm italic">
                    No students found matching your search.
                 </div>
               )}
             </div>
          </div>

          {/* Step 3: Deadline */}
          <div className="space-y-4">
             <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">3. Set Deadline (Optional)</label>
             <div className="relative group">
                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
                <input 
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 rounded-2xl outline-none transition-all text-sm font-medium"
                />
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3 sticky bottom-0 z-10">
          <button onClick={onClose} className="px-6 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-xl font-bold transition-all">Cancel</button>
          <button 
            onClick={handleAssign}
            disabled={isAssigning || !selectedTemplateId || selectedStudentIds.length === 0}
            className="flex items-center gap-2 px-8 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-black shadow-xl shadow-violet-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {isAssigning ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            <span>{isAssigning ? 'Assigning...' : 'Confirm Assignment'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentModal;
