import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  GripVertical, 
  Settings2, 
  ArrowLeft, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Save,
  AlertCircle
} from '@/components/common/icons';
import { FormTemplate, FormSection, FormField, FormElementType } from '@/types';
import { FORM_ELEMENTS } from './form_elements_config';

interface FormBuilderProps {
  template: FormTemplate;
  onSave: (template: FormTemplate) => void;
  onClose: () => void;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ template: initialTemplate, onSave, onClose }) => {
  const [template, setTemplate] = useState<FormTemplate>(JSON.parse(JSON.stringify(initialTemplate)));
  const [activeSectionId, setActiveSectionId] = useState<string | null>(template.sections[0]?.id || null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const activeSection = template.sections.find(s => s.id === activeSectionId);
  const selectedField = template.sections.flatMap(s => s.fields).find(f => f.id === selectedFieldId);

  const handleAddSection = () => {
    const newSection: FormSection = {
      id: `sec-${Date.now()}`,
      title: 'New Section',
      description: '',
      fields: []
    };
    setTemplate(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
    setActiveSectionId(newSection.id);
  };

  const handleRemoveSection = (sectionId: string) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId)
    }));
    if (activeSectionId === sectionId) {
      setActiveSectionId(template.sections.find(s => s.id !== sectionId)?.id || null);
    }
  };

  const handleAddField = (type: FormElementType) => {
    if (!activeSectionId) return;

    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: `New ${type.replace('-', ' ')} field`,
      required: false,
    };

    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === activeSectionId ? { ...s, fields: [...s.fields, newField] } : s
      )
    }));
    setSelectedFieldId(newField.id);
  };

  const handleRemoveField = (fieldId: string) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.map(s => ({
        ...s,
        fields: s.fields.filter(f => f.id !== fieldId)
      }))
    }));
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.map(s => ({
        ...s,
        fields: s.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
      }))
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 z-50 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 transition-colors">
            <X size={24} />
          </button>
          <div>
            <input 
              type="text" 
              value={template.title}
              onChange={e => setTemplate(p => ({ ...p, title: e.target.value }))}
              className="text-xl font-bold bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white p-0"
              placeholder="Form Title"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => onSave(template)}
            className="flex items-center gap-2 px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-lg shadow-violet-500/20 transition-all active:scale-95"
          >
            <Save size={18} />
            <span>Save Template</span>
          </button>
        </div>
      </header>

      <div className="flex-grow flex overflow-hidden">
        {/* Left Sidebar: Components */}
        <aside className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto p-6 space-y-6">
          <section>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Elements</h3>
            <div className="grid grid-cols-2 gap-3">
              {FORM_ELEMENTS.map(elem => (
                <button
                  key={elem.type}
                  onClick={() => handleAddField(elem.type)}
                  className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/10 group transition-all"
                >
                  <div className="text-gray-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 mb-2 transition-colors">
                    {elem.icon}
                  </div>
                  <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-center">{elem.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Sections</h3>
            <div className="space-y-2">
              {template.sections.map((sec, idx) => (
                <div 
                  key={sec.id}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${activeSectionId === sec.id ? 'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-900/20 dark:border-violet-800/50 dark:text-violet-300' : 'bg-white border-transparent hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black opacity-50">{idx + 1}</span>
                    <span className="text-sm font-bold truncate max-w-[140px]">{sec.title}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleRemoveSection(sec.id); }} className="p-1 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 group-hover:block">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button 
                onClick={handleAddSection}
                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-400 hover:border-violet-500 hover:text-violet-500 transition-all font-bold text-sm"
              >
                <Plus size={16} />
                <span>Add Section</span>
              </button>
            </div>
          </section>
        </aside>

        {/* Main Canvas Area */}
        <main className="flex-1 bg-gray-50 dark:bg-gray-950/50 overflow-y-auto p-12">
          <div className="max-w-3xl mx-auto space-y-8">
            {activeSection ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
                  <div className="space-y-2">
                    <input 
                      type="text"
                      value={activeSection.title}
                      onChange={e => setTemplate(p => ({
                        ...p,
                        sections: p.sections.map(s => s.id === activeSectionId ? { ...s, title: e.target.value } : s)
                      }))}
                      className="text-2xl font-black bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white p-0 "
                      placeholder="Section Title"
                    />
                    <textarea 
                      value={activeSection.description}
                      onChange={e => setTemplate(p => ({
                        ...p,
                        sections: p.sections.map(s => s.id === activeSectionId ? { ...s, description: e.target.value } : s)
                      }))}
                      className="w-full text-gray-500 dark:text-gray-400 bg-transparent border-none focus:ring-0 p-0 text-sm italic"
                      placeholder="Enter a brief description for this section..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    {activeSection.fields.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                          <Plus size={32} className="text-gray-300" />
                        </div>
                        <p className="text-gray-400 text-sm font-medium">No fields in this section yet.<br/>Select an element from the sidebar to add it.</p>
                      </div>
                    ) : (
                      activeSection.fields.map((field, fIdx) => (
                        <div 
                          key={field.id}
                          onClick={() => setSelectedFieldId(field.id)}
                          className={`group relative p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border transition-all cursor-pointer ${selectedFieldId === field.id ? 'ring-2 ring-violet-500 border-violet-500 shadow-lg shadow-violet-500/10 translate-x-2' : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white dark:bg-gray-900 rounded-lg text-gray-400 shadow-sm group-hover:text-violet-500">
                                {FORM_ELEMENTS.find(e => e.type === field.type)?.icon}
                              </div>
                              <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {String(field.label || 'Unnamed Field')}
                                {field.required && <span className="text-red-500 font-black ml-0.5">*</span>}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={(e) => { e.stopPropagation(); handleRemoveField(field.id); }} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                <Trash2 size={16} />
                              </button>
                              <div className="p-2 text-gray-300 cursor-grab">
                                <GripVertical size={16} />
                              </div>
                            </div>
                          </div>
                          
                          {field.mapping && (
                            <div className="flex items-center gap-2 text-[10px] font-black text-violet-500 uppercase tracking-widest bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded-full w-fit mt-2">
                              <span>Mapped to: {field.mapping}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <AlertCircle size={48} className="text-gray-200 mb-4" />
                <h3 className="text-xl font-bold text-gray-400">Select a section to begin building</h3>
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar: Configuration */}
        <aside className="w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-y-auto p-6 shadow-2xl">
          {selectedField ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
              <div className="flex items-center gap-3 pb-6 border-b border-gray-100 dark:border-gray-800">
                <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <Settings2 size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">Field Settings</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedField.type}</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Field Label</label>
                    <input 
                      type="text"
                      value={selectedField.label}
                      onChange={e => updateField(selectedField.id, { label: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 rounded-xl outline-none transition-all text-sm font-bold text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Placeholder</label>
                    <input 
                      type="text"
                      value={selectedField.placeholder || ''}
                      onChange={e => updateField(selectedField.id, { placeholder: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 rounded-xl outline-none transition-all text-sm font-medium text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Mapping */}
                <div className="p-5 bg-violet-50/50 dark:bg-violet-900/10 rounded-2xl border border-violet-100 dark:border-violet-800/50 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                       <label className="text-xs font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest block">Contact Mapping</label>
                       <span className="text-[10px] font-bold text-violet-400 bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border border-violet-100 dark:border-violet-800/50">Admin Only</span>
                    </div>
                    <p className="text-xs text-violet-500/70 mb-3 leading-relaxed">Map this field to a contact profile property for auto-population upon approval.</p>
                    <select 
                      value={selectedField.mapping || ''}
                      onChange={e => updateField(selectedField.id, { mapping: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-violet-200 dark:border-violet-800/50 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 rounded-xl outline-none transition-all text-sm font-black text-violet-700 dark:text-violet-300"
                    >
                      <option value="">No Mapping</option>
                      <optgroup label="Personal Information">
                        <option value="name">Full Name</option>
                        <option value="email">Email Address</option>
                        <option value="phone">Phone Number</option>
                        <option value="notes">Internal Notes</option>
                      </optgroup>
                      <optgroup label="Address & Location">
                        <option value="street1">Street 1</option>
                        <option value="street2">Street 2</option>
                        <option value="city">City</option>
                        <option value="state">State</option>
                        <option value="zip">Zip Code</option>
                        <option value="country">Country</option>
                      </optgroup>
                      <optgroup label="Academic Details">
                        <option value="department">Department</option>
                        <option value="major">Major</option>
                        <option value="degree">Degree</option>
                        <option value="stream">Stream</option>
                        <option value="intake">Intake</option>
                        <option value="year">Year</option>
                        <option value="session">Session</option>
                        <option value="gpa">GPA Score</option>
                      </optgroup>
                      <optgroup label="Government IDs & Visa">
                        <option value="visa.passportNumber">Passport Number</option>
                        <option value="visa.passportExpiry">Passport Expiry</option>
                        <option value="visa.visaType">Visa Type</option>
                        <option value="visa.visaStatus">Visa Status</option>
                        <option value="visa.casNumber">CAS Number</option>
                        <option value="pan">PAN Number</option>
                        <option value="gstin">GSTIN</option>
                      </optgroup>
                      <optgroup label="Visa & Application">
                        <option value="visaInformation.otherInformation.passportNo">Passport Number</option>
                        <option value="visaInformation.ds160.ds160ConfirmationNumber">DS-160 Confirmation</option>
                        <option value="visaInformation.sevisInformation.sevisNo">SEVIS Number</option>
                        <option value="visaType">Visa Type</option>
                        <option value="countryOfApplication">Country of Application</option>
                      </optgroup>
                      <optgroup label="System Fields">
                        <option value="contactId">System ID</option>
                        <option value="contactType">Contact Type</option>
                        <option value="fileStatus">File Status</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                {/* Conditional Logic */}
                <div className="p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block">Visibility Logic</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={!!selectedField.conditionalLogic}
                        onChange={e => {
                          if (e.target.checked) {
                            updateField(selectedField.id, { 
                              conditionalLogic: { fieldId: '', operator: 'equals', value: '' } 
                            });
                          } else {
                            updateField(selectedField.id, { conditionalLogic: undefined });
                          }
                        }}
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>
                  
                  {selectedField.conditionalLogic && (
                    <div className="space-y-3 animate-in fade-in duration-300">
                      <p className="text-[10px] text-blue-500 font-bold leading-tight">Show this field only if:</p>
                      <select 
                        value={selectedField.conditionalLogic.fieldId}
                        onChange={e => updateField(selectedField.id, { 
                          conditionalLogic: { ...selectedField.conditionalLogic!, fieldId: e.target.value } 
                        })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-blue-800/50 rounded-xl outline-none text-xs font-bold"
                      >
                        <option value="">Select Field</option>
                        {template.sections.flatMap(s => s.fields).filter(f => f.id !== selectedField.id).map(f => (
                          <option key={f.id} value={f.id}>{f.label}</option>
                        ))}
                      </select>

                      <div className="flex gap-2">
                        <select 
                          value={selectedField.conditionalLogic.operator}
                          onChange={e => updateField(selectedField.id, { 
                            conditionalLogic: { ...selectedField.conditionalLogic!, operator: e.target.value as any } 
                          })}
                          className="w-1/2 px-3 py-2 bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-blue-800/50 rounded-xl outline-none text-xs font-bold"
                        >
                          <option value="equals">Equals</option>
                          <option value="not-equals">Not Equals</option>
                          <option value="contains">Contains</option>
                        </select>
                        <input 
                          type="text"
                          value={selectedField.conditionalLogic.value || ''}
                          onChange={e => updateField(selectedField.id, { 
                            conditionalLogic: { ...selectedField.conditionalLogic!, value: e.target.value } 
                          })}
                          className="w-1/2 px-3 py-2 bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-blue-800/50 rounded-xl outline-none text-xs font-bold"
                          placeholder="Value"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Validation */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Required Field</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={selectedField.required}
                      onChange={e => updateField(selectedField.id, { required: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 dark:peer-focus:ring-violet-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-violet-600"></div>
                  </label>
                </div>

                {/* Type-specific settings */}
                {(selectedField.type === 'dropdown' || selectedField.type === 'radio' || selectedField.type === 'checkbox') && (
                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Options (One per line)</label>
                    <textarea 
                      value={selectedField.options?.join('\n') || ''}
                      onChange={e => updateField(selectedField.id, { options: e.target.value.split('\n').filter(o => o.trim()) })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 rounded-xl outline-none transition-all text-sm font-medium text-gray-900 dark:text-white"
                      rows={5}
                      placeholder="Option 1\nOption 2\nOption 3"
                    />
                  </div>
                )}

                {selectedField.type === 'signature' && (
                  <div className="space-y-4">
                    <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Signature Mode</label>
                        <select 
                            value={selectedField.signatureType || 'both'}
                            onChange={e => updateField(selectedField.id, { signatureType: e.target.value as any })}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 rounded-xl outline-none transition-all text-sm font-bold text-gray-900 dark:text-white"
                        >
                            <option value="draw">Draw Only</option>
                            <option value="type">Type Only</option>
                            <option value="both">Both (Draw & Type)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Declaration Text</label>
                        <textarea 
                            value={selectedField.declarationText || ''}
                            onChange={e => updateField(selectedField.id, { declarationText: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 rounded-xl outline-none transition-all text-sm italic"
                            rows={3}
                            placeholder="I declare that the information provided..."
                        />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-24 text-gray-300">
               <Settings2 size={64} className="mb-4 opacity-20" />
               <p className="text-sm font-bold uppercase tracking-widest opacity-50">Select a field<br/>to configure</p>
            </div>
          )}
        </aside>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in-bottom {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-in {
          animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .slide-in-from-bottom-4 {
          animation-name: slide-in-bottom;
        }
        .slide-in-from-right-4 {
          animation-name: slide-in-right;
        }
      `}</style>
    </div>
  );
};

export default FormBuilder;
