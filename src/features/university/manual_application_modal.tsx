import React, { useState, useEffect } from 'react';
import { Contact, UniversityCourse } from '@/types';
import * as api from '@/utils/api';
import { X, Search as SearchIcon, Building2, BookOpen, HelpCircle, Save, Loader2, User, GraduationCap } from 'lucide-react';

interface ManualApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ManualApplicationModal: React.FC<ManualApplicationModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [students, setStudents] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [universityCourses, setUniversityCourses] = useState<UniversityCourse[]>([]);
    const [isUniDropdownOpen, setIsUniDropdownOpen] = useState(false);

    const [selectedStudent, setSelectedStudent] = useState<Contact | null>(null);
    const [formData, setFormData] = useState({
        universityName: '',
        course: '',
        degree: "Master's",
        status: 'Applied'
    });

    useEffect(() => {
        if (isOpen) {
            fetchStudents();
            // Reset form
            setSelectedStudent(null);
            setSearchTerm('');
            setFormData({
                universityName: '',
                course: '',
                degree: "Master's",
                status: 'Applied'
            });
            setIsUniDropdownOpen(false);
            fetchUniversityCourses();
        }
    }, [isOpen]);

    const fetchUniversityCourses = async () => {
        try {
            const data = await api.getUniversityCourses();
            setUniversityCourses(data);
        } catch (error) {
            console.error('Failed to fetch university courses:', error);
        }
    };

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const data = await api.getContacts();
            setStudents(data);
        } catch (error) {
            console.error('Failed to fetch students:', error);
            alert('Could not load student list. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedStudent || !formData.universityName || !formData.course) {
            alert('Please fill in all required fields (Student, University, Course).');
            return;
        }

        setSaving(true);
        try {
            // First get the most up-to-date contact data from our local selection
            const fullContact = selectedStudent;
            if (!fullContact) throw new Error("Contact not found");

            // Prepare the new application construct
            const updatedContact = { ...fullContact };

            // Ensure visaInformation structure exists
            if (!updatedContact.visaInformation) updatedContact.visaInformation = {};
            if (!updatedContact.visaInformation.universityApplication) updatedContact.visaInformation.universityApplication = {};
            if (!Array.isArray(updatedContact.visaInformation.universityApplication.universities)) {
                updatedContact.visaInformation.universityApplication.universities = [];
            }

            const { ackNumber } = await api.getNextAckNumber();
            const newAck = ackNumber;

            const newApp = {
                universityName: formData.universityName,
                course: formData.course,
                degree: formData.degree,
                status: formData.status,
                ackNumber: newAck,
                applicationSubmissionDate: new Date().toISOString(),
                // Empty required arrays based on generic shape (if any backend validation needs them)
            };

            updatedContact.visaInformation.universityApplication.universities.push(newApp);

            await api.saveContact(updatedContact, false);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to save manual application:', error);
            alert('Failed to save the application. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const expandedUniversities = universityCourses.flatMap(uc => {
        if (!uc.courseName) return [{ uc, singleCourseName: '' }];
        return uc.courseName.split(',').map(c => ({ uc, singleCourseName: c.trim() })).filter(item => item.singleCourseName);
    });

    const filteredUniversities = expandedUniversities.filter(item =>
        item.uc.universityName.toLowerCase().includes(formData.universityName.toLowerCase()) ||
        item.singleCourseName.toLowerCase().includes(formData.universityName.toLowerCase())
    );

    const handleUniversitySelect = (item: { uc: UniversityCourse, singleCourseName: string }) => {
        setFormData({
            ...formData,
            universityName: item.uc.universityName,
            course: item.singleCourseName
        });
        setIsUniDropdownOpen(false);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
                {/* Header */}
                <div className="flex items-center justify-between p-6 md:p-8 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/20 shrink-0">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-lyceum-blue/10 text-lyceum-blue flex items-center justify-center">
                                <Save size={20} />
                            </div>
                            Manual Application
                        </h2>
                        <p className="text-sm text-gray-500 mt-1 font-medium">Add an application record directly to a student's profile.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 text-gray-400 hover:text-gray-600 hover:bg-white dark:hover:bg-gray-700 dark:hover:text-gray-300 rounded-xl transition-all shadow-sm"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 md:p-8 overflow-y-auto overflow-visible custom-scrollbar">
                    <div className="space-y-6">

                        {/* Student Selection */}
                        <div className="space-y-2 relative">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <User size={14} /> Selected Student <span className="text-red-500">*</span>
                            </label>

                            {selectedStudent ? (
                                <div className="flex items-center justify-between p-4 bg-lyceum-blue/5 border border-lyceum-blue/20 rounded-2xl group transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-lyceum-blue/10 text-lyceum-blue flex items-center justify-center font-black">
                                            {selectedStudent.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">{selectedStudent.name}</p>
                                            <p className="text-xs text-gray-500">{selectedStudent.email || 'No email'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedStudent(null)}
                                        className="text-gray-400 hover:text-red-500 p-2 rounded-lg transition-colors"
                                        title="Change Student"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 focus-within:border-lyceum-blue focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                                        <SearchIcon size={18} className="text-gray-400 mr-3 shrink-0" />
                                        <input
                                            type="text"
                                            placeholder="Search student by name or email..."
                                            className="bg-transparent border-none text-sm font-medium text-gray-900 dark:text-white w-full outline-none"
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setIsDropdownOpen(true);
                                            }}
                                            onFocus={() => setIsDropdownOpen(true)}
                                        />
                                        {loading && <Loader2 size={16} className="animate-spin text-lyceum-blue shrink-0" />}
                                    </div>

                                    {isDropdownOpen && searchTerm.length > 0 && (
                                        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 max-h-64 overflow-y-auto p-2 animate-in fade-in slide-in-from-top-2">
                                            {filteredStudents.length === 0 ? (
                                                <div className="p-4 text-center text-sm text-gray-500">No students found</div>
                                            ) : (
                                                filteredStudents.map(student => (
                                                    <button
                                                        key={student.id}
                                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                                                        onClick={() => {
                                                            setSelectedStudent(student);
                                                            setIsDropdownOpen(false);
                                                            setSearchTerm('');
                                                        }}
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 shrink-0 text-sm">
                                                            {student.name.charAt(0)}
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{student.name}</p>
                                                            <p className="text-xs text-gray-500 truncate">{student.email}</p>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* University Name */}
                        <div className="space-y-2 relative">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Building2 size={14} /> University Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="e.g. University of Toronto"
                                    value={formData.universityName}
                                    onChange={(e) => {
                                        setFormData({ ...formData, universityName: e.target.value });
                                        setIsUniDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsUniDropdownOpen(true)}
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3.5 text-sm font-bold text-gray-900 dark:text-white focus:border-lyceum-blue focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:font-medium"
                                />
                                {isUniDropdownOpen && formData.universityName.length > 0 && (
                                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 max-h-64 overflow-y-auto p-2 animate-in fade-in slide-in-from-top-2">
                                        {filteredUniversities.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-gray-500">No universities found</div>
                                        ) : (
                                            filteredUniversities.map((item, idx) => (
                                                <button
                                                    key={`${item.uc.id}-${idx}`}
                                                    type="button"
                                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left gap-3"
                                                    onClick={() => handleUniversitySelect(item)}
                                                >
                                                    <div className="overflow-hidden flex-1">
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.uc.universityName}</p>
                                                        <p className="text-xs text-lyceum-blue font-medium truncate">{item.singleCourseName}</p>
                                                    </div>
                                                    <div className="text-xs text-gray-400 shrink-0">
                                                        {item.uc.country}
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Course Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <BookOpen size={14} /> Course Program <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. MS in Computer Science"
                                    value={formData.course}
                                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3.5 text-sm font-bold text-gray-900 dark:text-white focus:border-lyceum-blue focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:font-medium"
                                />
                            </div>

                            {/* Degree Dropdown */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <GraduationCap size={14} /> Degree <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.degree}
                                    onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3.5 text-sm font-bold text-gray-900 dark:text-white focus:border-lyceum-blue focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="Bachelor's">Bachelor's</option>
                                    <option value="Master's">Master's</option>
                                </select>
                            </div>

                            {/* Status Select */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <HelpCircle size={14} /> Initial Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3.5 text-sm font-bold text-gray-900 dark:text-white focus:border-lyceum-blue focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="Shortlisted">Shortlisted</option>
                                    <option value="Applied">Applied</option>
                                    <option value="In Review">In Review</option>
                                    <option value="Offer Received">Offer Received</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 md:p-8 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/20 flex items-center justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-bold text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !selectedStudent || !formData.universityName || !formData.course}
                        className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-lyceum-blue hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        {saving ? (
                            <><Loader2 size={16} className="animate-spin" /> Saving...</>
                        ) : (
                            <><Save size={16} /> Add Application</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManualApplicationModal;
