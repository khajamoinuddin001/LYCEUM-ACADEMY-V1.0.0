
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Save, GraduationCap } from 'lucide-react';
import * as api from '@/utils/api';
import { UniversityCourse } from '@/types';

interface UniversityManagerProps {
    user: any;
}

const UniversityManager: React.FC<UniversityManagerProps> = ({ user }) => {
    const [courses, setCourses] = useState<UniversityCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<UniversityCourse | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<UniversityCourse>>({
        universityName: '',
        country: '',
        courseName: '', // Can be comma separated
        intake: '', // Can be comma separated
        minSscPercent: 0,
        minInterPercent: 0,
        minDegreePercent: 0,
        requiredExam: 'IELTS', // Legacy/Default
        minExamScore: 0, // Legacy/Default
        acceptedExams: [], // New multi-exam support
        applicationFee: '',
        enrollmentDeposit: '',
        wesRequirement: 'No'
    });

    // Temporary state for adding a new exam in the modal
    const [newExamType, setNewExamType] = useState('IELTS');
    const [newExamScore, setNewExamScore] = useState<number>(0);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const data = await api.getUniversityCourses();
            setCourses(data);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
            alert('Failed to load university courses.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (course?: UniversityCourse) => {
        if (course) {
            setEditingCourse(course);
            setFormData({
                ...course,
                acceptedExams: course.acceptedExams || []
            });
            setPreviewUrl(course.logoUrl ? `${api.API_BASE_URL}${course.logoUrl}` : null);
        } else {
            setEditingCourse(null);
            setFormData({
                universityName: '',
                country: '',
                courseName: '',
                intake: '',
                minSscPercent: 0,
                minInterPercent: 0,
                minDegreePercent: 0,
                requiredExam: 'IELTS',
                minExamScore: 0,
                acceptedExams: [],
                applicationFee: '',
                enrollmentDeposit: '',
                wesRequirement: 'No'
            });
            setPreviewUrl(null);
        }
        setNewExamType('IELTS');
        setNewExamScore(0);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCourse(null);
        setPreviewUrl(null);
        const fileInput = document.getElementById('university-logo-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handleAddExam = () => {
        if (newExamScore <= 0) return;
        const updatedExams = [...(formData.acceptedExams || [])];
        // Check if exam already exists
        const existingIndex = updatedExams.findIndex(e => e.exam === newExamType);
        if (existingIndex >= 0) {
            updatedExams[existingIndex].score = newExamScore;
        } else {
            updatedExams.push({ exam: newExamType, score: newExamScore });
        }
        setFormData({ ...formData, acceptedExams: updatedExams });
        setNewExamScore(0);
    };

    const handleRemoveExam = (examType: string) => {
        const updatedExams = (formData.acceptedExams || []).filter(e => e.exam !== examType);
        setFormData({ ...formData, acceptedExams: updatedExams });
    };

    const handleSave = async () => {
        if (!formData.universityName || !formData.country || !formData.courseName) {
            alert('Please fill in all required fields.');
            return;
        }

        // Backend expects acceptedExams. 
        // We can also sync legacy fields with the first exam for query compatibility if needed, 
        // but the new API logic uses acceptedExams.
        const payload = {
            ...formData,
            // Ensure legacy fields are populated at least with the first exam if available
            requiredExam: formData.acceptedExams && formData.acceptedExams.length > 0 ? formData.acceptedExams[0].exam : formData.requiredExam,
            minExamScore: formData.acceptedExams && formData.acceptedExams.length > 0 ? formData.acceptedExams[0].score : formData.minExamScore,
        };

        try {
            if (editingCourse) {
                const saved = await api.updateUniversityCourse(editingCourse.id, payload as any);
                // Handle logo upload if an image was selected
                const fileInput = document.getElementById('university-logo-upload') as HTMLInputElement;
                if (fileInput?.files?.[0]) {
                    await api.uploadUniversityLogo(saved.id, fileInput.files[0]);
                }
            } else {
                const saved = await api.createUniversityCourse(payload as any);
                // Handle logo upload if an image was selected
                const fileInput = document.getElementById('university-logo-upload') as HTMLInputElement;
                if (fileInput?.files?.[0]) {
                    await api.uploadUniversityLogo(saved.id, fileInput.files[0]);
                }
            }
            handleCloseModal();
            fetchCourses();
        } catch (error: any) {
            console.error('Failed to save course:', error);
            alert(error.message || 'Failed to save course.');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this course?')) {
            try {
                await api.deleteUniversityCourse(id);
                fetchCourses();
            } catch (error) {
                console.error('Failed to delete course:', error);
                alert('Failed to delete course.');
            }
        }
    };

    const filteredCourses = courses.filter(c =>
        c.universityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.courseName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <GraduationCap className="text-lyceum-blue" />
                        University Manager
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage universities and course eligibility</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-lyceum-blue text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-lyceum-blue-dark transition-colors"
                >
                    <Plus size={18} />
                    Add University
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col flex-1 overflow-hidden">
                {/* Search Bar */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search universities, countries, or courses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-lyceum-blue focus:border-transparent outline-none"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">University</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Country</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Courses</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Intakes</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Requirements</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">Loading courses...</td>
                                </tr>
                            ) : filteredCourses.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">No courses found.</td>
                                </tr>
                            ) : (
                                filteredCourses.map((course) => (
                                    <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600 flex-shrink-0">
                                                    {course.logoUrl ? (
                                                        <img
                                                            src={`${api.API_BASE_URL}${course.logoUrl}`}
                                                            alt={course.universityName}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = ''; // Clear broken image
                                                                (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-lyceum-blue font-bold">${course.universityName.charAt(0)}</span>`;
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="text-lyceum-blue font-bold text-lg">
                                                            {course.universityName.charAt(0)}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-gray-800 dark:text-gray-200 font-medium">{course.universityName}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-600 dark:text-gray-300">{course.country}</td>
                                        <td className="p-4 text-gray-600 dark:text-gray-300">
                                            {course.courseName.split(',').map((c, i) => (
                                                <span key={i} className="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded mr-1 mb-1">
                                                    {c.trim()}
                                                </span>
                                            ))}
                                        </td>
                                        <td className="p-4 text-gray-600 dark:text-gray-300">
                                            {course.intake.split(',').map((c, i) => (
                                                <span key={i} className="inline-block bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs px-2 py-0.5 rounded mr-1 mb-1">
                                                    {c.trim()}
                                                </span>
                                            ))}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                                            <div>SSC: {course.minSscPercent}% | Inter: {course.minInterPercent}%</div>
                                            {course.minDegreePercent && <div>Degree: {course.minDegreePercent}%</div>}
                                            <div className="mt-1 space-y-1">
                                                {course.acceptedExams && course.acceptedExams.length > 0 ? (
                                                    course.acceptedExams.map((exam, idx) => (
                                                        <div key={idx} className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                            {exam.exam}: {exam.score}
                                                        </div>
                                                    ))
                                                ) : (
                                                    course.requiredExam && <div>{course.requiredExam}: {course.minExamScore}</div>
                                                )}
                                                {(course.applicationFee || course.enrollmentDeposit || course.wesRequirement) && (
                                                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                                        {course.applicationFee && <div>App Fee: {course.applicationFee}</div>}
                                                        {course.enrollmentDeposit && <div>Deposit: {course.enrollmentDeposit}</div>}
                                                        {course.wesRequirement && <div>WES: {course.wesRequirement}</div>}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(course)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(course.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                {editingCourse ? 'Edit University Course' : 'Add New University Course'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Course Details</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">University Logo</label>
                                        <div className="flex items-center gap-4 mt-1">
                                            <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {previewUrl ? (
                                                    <img src={previewUrl.startsWith('data:') ? previewUrl : previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <GraduationCap className="text-gray-400" size={32} />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="file"
                                                    id="university-logo-upload"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                setPreviewUrl(reader.result as string);
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => document.getElementById('university-logo-upload')?.click()}
                                                    className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                                >
                                                    Select Picture
                                                </button>
                                                <p className="text-[10px] text-gray-500 mt-1">Recommended: Square image, max 2MB</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">University Name *</label>
                                        <input
                                            type="text"
                                            value={formData.universityName}
                                            onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            placeholder="e.g. Harvard University"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country *</label>
                                        <select
                                            value={formData.country}
                                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="">Select Country</option>
                                            <option value="USA">USA</option>
                                            <option value="UK">UK</option>
                                            <option value="Canada">Canada</option>
                                            <option value="Australia">Australia</option>
                                            <option value="Germany">Germany</option>
                                            <option value="France">France</option>
                                            <option value="Ireland">Ireland</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course Name(s) *</label>
                                        <input
                                            type="text"
                                            value={formData.courseName}
                                            onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            placeholder="e.g. MS CS, MBA (comma separated)"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Separate multiple courses with commas</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Intake(s) *</label>
                                        <input
                                            type="text"
                                            value={formData.intake}
                                            onChange={(e) => setFormData({ ...formData, intake: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            placeholder="e.g. Fall 2024, Spring 2025"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Separate multiple intakes with commas</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Application Fee</label>
                                            <input
                                                type="text"
                                                value={formData.applicationFee || ''}
                                                onChange={(e) => setFormData({ ...formData, applicationFee: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                placeholder="e.g. $100"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enrollment Deposit</label>
                                            <input
                                                type="text"
                                                value={formData.enrollmentDeposit || ''}
                                                onChange={(e) => setFormData({ ...formData, enrollmentDeposit: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                placeholder="e.g. $500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WES Requirement</label>
                                        <div className="flex items-center gap-4 mt-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="wesRequirement"
                                                    value="Yes"
                                                    checked={formData.wesRequirement === 'Yes'}
                                                    onChange={(e) => setFormData({ ...formData, wesRequirement: e.target.value })}
                                                    className="w-4 h-4 text-lyceum-blue focus:ring-lyceum-blue border-gray-300"
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">Yes</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="wesRequirement"
                                                    value="No"
                                                    checked={formData.wesRequirement === 'No'}
                                                    onChange={(e) => setFormData({ ...formData, wesRequirement: e.target.value })}
                                                    className="w-4 h-4 text-lyceum-blue focus:ring-lyceum-blue border-gray-300"
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">No</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Requirements */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Eligibility Requirements</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min SSC %</label>
                                            <input
                                                type="number"
                                                value={formData.minSscPercent}
                                                onChange={(e) => setFormData({ ...formData, minSscPercent: parseFloat(e.target.value) })}
                                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Inter %</label>
                                            <input
                                                type="number"
                                                value={formData.minInterPercent}
                                                onChange={(e) => setFormData({ ...formData, minInterPercent: parseFloat(e.target.value) })}
                                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Degree % (Optional)</label>
                                        <input
                                            type="number"
                                            value={formData.minDegreePercent || ''}
                                            onChange={(e) => setFormData({ ...formData, minDegreePercent: e.target.value ? parseFloat(e.target.value) : undefined })}
                                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            placeholder="Required for Masters"
                                        />
                                    </div>

                                    {/* Accepted Exams Section */}
                                    <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Accepted Exams</label>

                                        <div className="space-y-2 mb-3">
                                            {formData.acceptedExams && formData.acceptedExams.map((exam, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded shadow-sm border border-gray-200 dark:border-gray-600">
                                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                        {exam.exam}: {exam.score}
                                                    </span>
                                                    <button
                                                        onClick={() => handleRemoveExam(exam.exam)}
                                                        className="text-red-500 hover:text-red-700 p-1"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            {(!formData.acceptedExams || formData.acceptedExams.length === 0) && (
                                                <p className="text-xs text-gray-500 italic">No exams added yet.</p>
                                            )}
                                        </div>

                                        <div className="flex gap-2 items-end">
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500 mb-1">Exam</p>
                                                <select
                                                    value={newExamType}
                                                    onChange={(e) => setNewExamType(e.target.value)}
                                                    className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                >
                                                    <option value="IELTS">IELTS</option>
                                                    <option value="TOEFL">TOEFL</option>
                                                    <option value="PTE">PTE</option>
                                                    <option value="DET">DET</option>
                                                </select>
                                            </div>
                                            <div className="w-20">
                                                <p className="text-xs text-gray-500 mb-1">Score</p>
                                                <input
                                                    type="number"
                                                    value={newExamScore || ''}
                                                    onChange={(e) => setNewExamScore(parseFloat(e.target.value))}
                                                    className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <button
                                                onClick={handleAddExam}
                                                type="button"
                                                className="bg-lyceum-blue text-white p-1.5 rounded hover:bg-lyceum-blue-dark transition-colors mb-[1px]"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-gray-800">
                            <button
                                onClick={handleCloseModal}
                                className="px-5 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-5 py-2 bg-lyceum-blue text-white rounded-lg hover:bg-lyceum-blue-dark shadow-md flex items-center gap-2"
                            >
                                <Save size={18} />
                                Save Course
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UniversityManager;
