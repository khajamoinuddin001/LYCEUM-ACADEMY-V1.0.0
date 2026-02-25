import React, { useState, useEffect } from 'react';
import { ArrowLeft, GraduationCap, Calendar, BookOpen, CheckCircle2, Search, Plus, Building2, Globe2, Sparkles, Languages, ArrowRight, Edit3, Award, Clock, MapPin, School, FileText, ChevronRight, Check, Bookmark, X, Trash2, Copy, ClipboardList, Folder } from 'lucide-react';
import { Contact, UniversityCourse } from '@/types';
import * as api from '@/utils/api';

interface StudentUniversityApplicationViewProps {
    student: Contact;
    onNavigateBack: () => void;
    onSave?: (updatedContact: Contact) => Promise<void | Contact>;
    onNavigateToTickets?: () => void;
    onNavigateToDocuments?: () => void;
}

const StudentUniversityApplicationView: React.FC<StudentUniversityApplicationViewProps> = ({ student, onNavigateBack, onSave, onNavigateToTickets, onNavigateToDocuments }) => {
    const hasApplications = (student.visaInformation?.universityApplication?.universities?.length || 0) > 0;
    const hasAcademicInfo = !!student.visaInformation?.universityApplication?.academicInformation?.sscPercentage;
    const hasLanguageInfo = !!student.visaInformation?.universityApplication?.languageProficiency?.score;

    const savedState = student.visaInformation?.universityApplication?.applicationState;
    const initialStep = savedState?.step !== undefined ? savedState.step : (hasApplications ? 0 : (hasAcademicInfo && hasLanguageInfo ? 3 : (hasAcademicInfo ? 2 : 1)));

    const [step, setStep] = useState(initialStep);
    const [loading, setLoading] = useState(false);
    const [isEditingStep1, setIsEditingStep1] = useState(!hasAcademicInfo);
    const [isEditingStep2, setIsEditingStep2] = useState(!hasLanguageInfo);

    const [academicInfo, setAcademicInfo] = useState({
        sscPercentage: student.visaInformation?.universityApplication?.academicInformation?.sscPercentage || '',
        intermediatePercentage: student.visaInformation?.universityApplication?.academicInformation?.intermediatePercentage || '',
        degreePercentage: student.visaInformation?.universityApplication?.academicInformation?.degreePercentage || '',
        major: student.visaInformation?.universityApplication?.academicInformation?.major || 'Bachelors'
    });

    const [languageInfo, setLanguageInfo] = useState({
        exam: student.visaInformation?.universityApplication?.languageProficiency?.languageProficiency || 'IELTS',
        score: student.visaInformation?.universityApplication?.languageProficiency?.score || ''
    });

    const [availableCourses, setAvailableCourses] = useState<UniversityCourse[]>([]);
    const [selectedCountry, setSelectedCountry] = useState(savedState?.selectedCountry || '');
    const [myApplications, setMyApplications] = useState(student.visaInformation?.universityApplication?.universities || []);

    const [hoveredApp, setHoveredApp] = useState<number | null>(null);
    const [expandedApp, setExpandedApp] = useState<any | null>(null);
    const [basket, setBasket] = useState<{ course: UniversityCourse; courseName: string }[]>(savedState?.basket || []);
    const [isBasketOpen, setIsBasketOpen] = useState(false);

    // Filters for Step 3 results
    const [filterUniversity, setFilterUniversity] = useState('');
    const [filterCourse, setFilterCourse] = useState('');
    const [filterIntake, setFilterIntake] = useState('');

    // Basket detail panel
    const [selectedBasketItem, setSelectedBasketItem] = useState<{ course: any; courseName: string } | null>(null);

    // Persistence helper
    const saveEverything = async (overrides: {
        newStep?: number,
        newBasket?: { course: UniversityCourse; courseName: string }[],
        newCountry?: string
    } = {}) => {
        const targetStep = overrides.newStep !== undefined ? overrides.newStep : step;
        const targetBasket = overrides.newBasket !== undefined ? overrides.newBasket : basket;
        const targetCountry = overrides.newCountry !== undefined ? overrides.newCountry : selectedCountry;

        try {
            const updatedVisaInfo = {
                ...student.visaInformation,
                universityApplication: {
                    ...student.visaInformation?.universityApplication,
                    academicInformation: {
                        ...student.visaInformation?.universityApplication?.academicInformation,
                        ...academicInfo
                    },
                    languageProficiency: {
                        ...student.visaInformation?.universityApplication?.languageProficiency,
                        languageProficiency: languageInfo.exam,
                        score: languageInfo.score
                    },
                    applicationState: {
                        step: targetStep,
                        basket: targetBasket,
                        selectedCountry: targetCountry
                    }
                }
            };
            const updatedContact = { ...student, visaInformation: updatedVisaInfo };
            if (onSave) {
                await onSave(updatedContact);
            } else {
                await api.saveContact(updatedContact, false);
            }
        } catch (error) {
            console.error('Failed to save state', error);
        }
    };

    const handleUpdateStep = (newStep: number) => {
        setStep(newStep);
        saveEverything({ newStep });
    };

    useEffect(() => {
        if (selectedCountry) {
            fetchCourses(selectedCountry);
        }
    }, [selectedCountry]);

    const fetchCourses = async (country: string) => {
        setLoading(true);
        try {
            const data = await api.getUniversityCourses(country);
            setAvailableCourses(data);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = async () => {
        setLoading(true);
        try {
            if (step === 1 && isEditingStep1) {
                if (!academicInfo.sscPercentage || !academicInfo.intermediatePercentage || (academicInfo.major === 'Masters' && !academicInfo.degreePercentage)) {
                    alert('Please fill in all required academic percentages.');
                    return;
                }
                setIsEditingStep1(false);
            }
            if (step === 2 && isEditingStep2) {
                if (!languageInfo.exam || !languageInfo.score) {
                    alert('Please fill in Language Proficiency details.');
                    return;
                }
                setIsEditingStep2(false);
            }

            // Immediately skip to searching if both are filled, or proceed sequentially
            let nextStep = step;
            if (step === 1) {
                if (hasLanguageInfo && !isEditingStep2) nextStep = 3;
                else nextStep = 2;
            }
            else if (step === 2) nextStep = 3;
            else nextStep = step + 1;

            setStep(nextStep);
            await saveEverything({ newStep: nextStep });

        } catch (error) {
            console.error('Failed to save profile details', error);
            alert('Encountered an error saving details.');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        let prevStep = step;
        if (step === 0) onNavigateBack();
        else if (step === 1) {
            if (hasApplications) prevStep = 0;
            else onNavigateBack();
        }
        else if (step === 2) prevStep = 1;
        else if (step === 3) {
            if (hasApplications) prevStep = 0;
            else prevStep = 2;
        }
        else if (step === 4) prevStep = 3;

        if (prevStep !== step) {
            setStep(prevStep);
            saveEverything({ newStep: prevStep });
        }
    };

    const isEligible = (course: UniversityCourse) => {
        const ssc = parseFloat(academicInfo.sscPercentage) || 0;
        const inter = parseFloat(academicInfo.intermediatePercentage) || 0;
        const degree = parseFloat(academicInfo.degreePercentage || '0');
        const score = parseFloat(languageInfo.score) || 0;

        if (ssc < course.minSscPercent) return false;
        if (inter < course.minInterPercent) return false;
        if (course.minDegreePercent && degree < course.minDegreePercent) return false;

        let hasLanguageMatch = true;
        if (course.acceptedExams && course.acceptedExams.length > 0) {
            const matchingExam = course.acceptedExams.find(e => e.exam.toLowerCase() === languageInfo.exam.toLowerCase());
            if (!matchingExam || score < matchingExam.score) {
                hasLanguageMatch = false;
            }
        } else if (course.requiredExam && course.requiredExam !== 'None') {
            if (course.requiredExam.toLowerCase() !== languageInfo.exam.toLowerCase() || (course.minExamScore && score < course.minExamScore)) {
                hasLanguageMatch = false;
            }
        }

        if (!hasLanguageMatch) return false;

        return true;
    };

    const calculateMatchScore = (course: UniversityCourse) => {
        let score = 0;
        const ssc = parseFloat(academicInfo.sscPercentage) || 0;
        const inter = parseFloat(academicInfo.intermediatePercentage) || 0;

        if (ssc >= course.minSscPercent + 10) score += 30; else if (ssc >= course.minSscPercent) score += 20;
        if (inter >= course.minInterPercent + 10) score += 40; else if (inter >= course.minInterPercent) score += 30;

        const langScore = parseFloat(languageInfo.score) || 0;

        let requiredScore = course.minExamScore;
        if (course.acceptedExams && course.acceptedExams.length > 0) {
            const matchingExam = course.acceptedExams.find(e => e.exam.toLowerCase() === languageInfo.exam.toLowerCase());
            if (matchingExam) {
                requiredScore = matchingExam.score;
            }
        }

        if (requiredScore && langScore >= requiredScore + 1) score += 30; else if (requiredScore && langScore >= requiredScore) score += 20;

        if (score >= 80) return { label: 'Excellent Match', color: 'from-emerald-500/20 to-teal-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', badge: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]', icon: <Award className="w-4 h-4" /> };
        if (score >= 60) return { label: 'Good Match', color: 'from-blue-500/20 to-indigo-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30', badge: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]', icon: <CheckCircle2 className="w-4 h-4" /> };
        return { label: 'Fair Match', color: 'from-amber-500/20 to-orange-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30', badge: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]', icon: <Clock className="w-4 h-4" /> };
    };

    const handleToggleBasket = (course: UniversityCourse, courseName: string) => {
        const isInBasket = basket.some(item => item.course.id === course.id && item.courseName === courseName);
        if (isInBasket) {
            const newBasket = basket.filter(item => !(item.course.id === course.id && item.courseName === courseName));
            setBasket(newBasket);
            saveEverything({ newBasket });
        } else {
            const newBasket = [...basket, { course, courseName }];
            setBasket(newBasket);
            saveEverything({ newBasket });
        }
    };

    const generateAckNumber = (existingCount: number) => {
        const n = existingCount + 1;
        return `ACK-${String(n).padStart(7, '0')}`;
    };

    const handleConfirmShortlist = async () => {
        if (basket.length === 0) return;
        setLoading(true);

        const newApps = basket.map((item, i) => ({
            universityName: item.course.universityName,
            course: item.courseName,
            applicationSubmissionDate: new Date().toISOString().split('T')[0],
            status: 'Shortlisted',
            remarks: 'Shortlisted via basket',
            ackNumber: generateAckNumber(myApplications.length + i),
            logoUrl: item.course.logoUrl || null,
            country: item.course.country || '',
            intake: item.course.intake || '',
            applicationFee: item.course.applicationFee || null,
            enrollmentDeposit: item.course.enrollmentDeposit || null,
        }));

        const updatedApps = [...myApplications, ...newApps];
        setMyApplications(updatedApps);

        const updatedVisaInfo = {
            ...student.visaInformation,
            universityApplication: {
                ...student.visaInformation?.universityApplication,
                universities: updatedApps,
                academicInformation: {
                    ...student.visaInformation?.universityApplication?.academicInformation,
                    ...academicInfo
                },
                languageProficiency: {
                    ...student.visaInformation?.universityApplication?.languageProficiency,
                    languageProficiency: languageInfo.exam,
                    score: languageInfo.score
                },
                applicationState: {
                    step: 0,
                    basket: [],
                    selectedCountry: ''
                }
            }
        };

        try {
            const updatedContact = { ...student, visaInformation: updatedVisaInfo };
            if (onSave) {
                await onSave(updatedContact);
            } else {
                await api.saveContact(updatedContact, false);
            }
            setBasket([]);
            setIsBasketOpen(false);
            setStep(0);
        } catch (error) {
            console.error('Failed to save shortlisted universities:', error);
            alert('Failed to save shortlisted universities');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitSingle = async (item: { course: any; courseName: string }) => {
        setLoading(true);
        const newApp = {
            universityName: item.course.universityName,
            course: item.courseName,
            applicationSubmissionDate: new Date().toISOString().split('T')[0],
            status: 'Shortlisted',
            remarks: 'Submitted individually via basket',
            ackNumber: generateAckNumber(myApplications.length),
            logoUrl: item.course.logoUrl || null,
            country: item.course.country || '',
            intake: item.course.intake || '',
            applicationFee: item.course.applicationFee || null,
            enrollmentDeposit: item.course.enrollmentDeposit || null,
        };
        const updatedApps = [...myApplications, newApp];
        setMyApplications(updatedApps);
        const newBasket = basket.filter(b => !(b.course.id === item.course.id && b.courseName === item.courseName));

        const updatedVisaInfo = {
            ...student.visaInformation,
            universityApplication: {
                ...student.visaInformation?.universityApplication,
                universities: updatedApps,
                academicInformation: {
                    ...student.visaInformation?.universityApplication?.academicInformation,
                    ...academicInfo
                },
                languageProficiency: {
                    ...student.visaInformation?.universityApplication?.languageProficiency,
                    languageProficiency: languageInfo.exam,
                    score: languageInfo.score
                },
                applicationState: {
                    step: 0,
                    basket: newBasket,
                    selectedCountry: selectedCountry
                }
            }
        };

        try {
            const updatedContact = { ...student, visaInformation: updatedVisaInfo };
            if (onSave) {
                await onSave(updatedContact);
            } else {
                await api.saveContact(updatedContact, false);
            }
            setBasket(newBasket);
            setStep(0);  // Always go to dashboard to see submitted app
        } catch (error) {
            console.error('Failed to submit application:', error);
            alert('Failed to submit application');
        } finally {
            setLoading(false);
        }
    };

    const renderApplicationCard = (app: any, idx: number) => {
        const isHovered = hoveredApp === idx;
        const statusColors = {
            'Shortlisted': 'bg-slate-50/80 text-slate-600 border-slate-200/50 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20 ring-slate-500/20',
            'Applied': 'bg-blue-50/80 text-blue-600 border-blue-200/50 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 ring-blue-500/20',
            'In Review': 'bg-violet-50/80 text-violet-600 border-violet-200/50 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20 ring-violet-500/20',
            'Offer Received': 'bg-emerald-50/80 text-emerald-600 border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 ring-emerald-500/20'
        };
        const currentStatusColor = statusColors[app.status as keyof typeof statusColors] || statusColors['Shortlisted'];

        return (
            <div
                key={idx}
                onClick={() => setExpandedApp(app)}
                onMouseEnter={() => setHoveredApp(idx)}
                onMouseLeave={() => setHoveredApp(null)}
                className="group relative flex flex-col bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-[32px] p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(255,255,255,0.04)] transition-all duration-500 overflow-hidden cursor-pointer hover:border-lyceum-blue/30"
            >
                <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5 dark:from-blue-500/10 dark:to-indigo-500/10 opacity-0 transition-opacity duration-500 pointer-events-none ${isHovered ? 'opacity-100' : ''}`} />

                <div className="relative z-10">
                    {/* ACK Number Badge */}
                    {app.ackNumber && (
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-lyceum-blue/10 dark:bg-lyceum-blue/20 border border-lyceum-blue/20 rounded-xl">
                                <div className="w-1.5 h-1.5 rounded-full bg-lyceum-blue animate-pulse" />
                                <span className="font-black text-xs tracking-widest text-lyceum-blue uppercase">{app.ackNumber}</span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(app.ackNumber); }}
                                className="p-1.5 text-gray-300 hover:text-lyceum-blue hover:bg-lyceum-blue/10 rounded-lg transition-all"
                                title="Copy ACK number"
                            >
                                <Copy size={12} />
                            </button>
                        </div>
                    )}

                    <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-4 items-center">
                            {/* University logo or initial */}
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700/80 dark:to-gray-800/80 flex items-center justify-center text-gray-700 dark:text-gray-200 font-bold text-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] border border-white/50 dark:border-gray-600/30 group-hover:scale-105 transition-all duration-300 overflow-hidden">
                                {app.logoUrl
                                    ? <img src={`${api.API_BASE_URL}${app.logoUrl}`} alt={app.universityName} className="w-full h-full object-cover" />
                                    : app.universityName.charAt(0)
                                }
                            </div>
                            <div>
                                <h3 className="font-extrabold text-gray-900 dark:text-white text-lg leading-tight line-clamp-1 group-hover:text-lyceum-blue transition-colors">
                                    {app.universityName}
                                </h3>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1 line-clamp-1">
                                    <School size={14} />
                                    {app.course}
                                </p>
                                {app.country && (
                                    <p className="text-xs font-medium text-gray-400 flex items-center gap-1 mt-0.5">
                                        <Globe2 size={11} />{app.country}{app.intake ? ` · ${app.intake}` : ''}
                                    </p>
                                )}
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-gray-300 group-hover:text-lyceum-blue group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>

                    <div className="relative pt-6 pb-2">
                        <div className="absolute top-[38px] left-4 right-4 h-0.5 bg-gray-200/50 dark:bg-gray-700/50 rounded-full" />
                        <div className="absolute top-[38px] left-4 h-0.5 bg-lyceum-blue rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: ['Offer Received', 'Received Acceptance', 'Received I20'].includes(app.status) ? '100%' : app.status === 'In Review' ? '66%' : app.status === 'Applied' ? '33%' : '0%' }} />

                        <div className="flex justify-between relative z-10 w-full space-x-1">
                            {[
                                { status: 'Shortlisted', icon: <Bookmark size={12} /> },
                                { status: 'Applied', icon: <FileText size={12} /> },
                                { status: 'In Review', icon: <Search size={12} /> },
                                { status: 'Offer Received', icon: <Award size={12} /> }
                            ].map((stage, i) => {
                                const isPassed = (['Offer Received', 'Received Acceptance', 'Received I20'].includes(app.status)) || (app.status === 'In Review' && i <= 2) || (app.status === 'Applied' && i <= 1) || (app.status === 'Shortlisted' && i === 0);
                                const isCurrent = stage.status === 'Offer Received' ? ['Offer Received', 'Received Acceptance', 'Received I20'].includes(app.status) : app.status === stage.status;
                                return (
                                    <div key={stage.status} className="flex flex-col items-center gap-2">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 ${isPassed
                                            ? 'bg-lyceum-blue text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-50 dark:ring-blue-900/20'
                                            : 'bg-white dark:bg-gray-800 text-gray-400 border-2 border-gray-100 dark:border-gray-700'
                                            } ${isCurrent ? 'scale-110' : 'scale-100'}`}>
                                            {isPassed ? <Check size={14} className="animate-in zoom-in" /> : stage.icon}
                                        </div>
                                        <span className={`text-[11px] font-bold tracking-wide uppercase transition-colors duration-300 ${isCurrent ? 'text-gray-900 dark:text-gray-100' : isPassed ? 'text-gray-500 dark:text-gray-400' : 'text-gray-300 dark:text-gray-600'
                                            }`}>{stage.status}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-8 pt-5 border-t border-gray-100/80 dark:border-gray-700/50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                            <Calendar size={14} />
                            {new Date(app.applicationSubmissionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-2">
                            {['Received Acceptance', 'Received I20'].includes(app.status) && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onNavigateToDocuments?.(); }}
                                    className="px-3 py-1.5 rounded-xl border border-lyceum-blue/30 text-xs font-bold text-lyceum-blue hover:bg-lyceum-blue hover:text-white transition-all shadow-sm flex items-center gap-1.5"
                                >
                                    <FileText size={12} />
                                    {app.status === 'Received Acceptance' ? 'See Acceptance' : 'See I20'}
                                </button>
                            )}
                            <div className={`px-4 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider ${currentStatusColor} flex items-center gap-1.5`}>
                                <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                {app.status}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-[#fcfcfd] dark:bg-[#090b14] rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-200/40 dark:border-gray-800/60 w-full mx-auto h-full flex flex-col overflow-hidden relative">
            {/* Cinematic Background Effects */}
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-tl from-indigo-400/5 to-transparent dark:from-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />

            {expandedApp ? (
                /* Application Detail Full Page View */
                <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-500 bg-white dark:bg-gray-900">
                    <div className="relative w-full h-full flex flex-col overflow-hidden">
                        {/* Header / Hero Section */}
                        <div className="relative h-64 sm:h-80 shrink-0 overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-900">
                            <div className="absolute inset-0 opacity-20">
                                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white blur-[100px] rounded-full" />
                                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400 blur-[80px] rounded-full" />
                            </div>

                            <div className="absolute top-8 left-8 z-20">
                                <button
                                    onClick={() => setExpandedApp(null)}
                                    className="flex items-center gap-2 px-4 py-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-2xl text-white transition-all hover:scale-105 active:scale-95 font-bold text-sm"
                                >
                                    <ArrowLeft size={18} />
                                    Back to Applications
                                </button>
                            </div>

                            <div className="absolute inset-0 p-8 sm:p-12 flex items-end">
                                <div className="flex items-center gap-6 sm:gap-10 max-w-7xl mx-auto w-full">
                                    <div className="w-24 h-24 sm:w-40 sm:h-40 rounded-[32px] bg-white shadow-2xl flex items-center justify-center shrink-0 border-4 border-white/10 overflow-hidden">
                                        {expandedApp.logoUrl ? (
                                            <img src={`${api.API_BASE_URL}${expandedApp.logoUrl}`} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-4xl font-black text-gray-900">{expandedApp.universityName.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div className="text-white pb-2">
                                        <div className="flex flex-wrap items-center gap-3 mb-4">
                                            <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-xl text-xs font-black uppercase tracking-widest leading-none flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-300 animate-pulse" />
                                                {expandedApp.ackNumber}
                                            </span>
                                            {['Received Acceptance', 'Received I20'].includes(expandedApp.status) && (
                                                <button
                                                    onClick={() => onNavigateToDocuments?.()}
                                                    className="px-4 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-xs font-black uppercase tracking-widest leading-none flex items-center gap-2 transition-colors border border-white/20 border-dotted"
                                                >
                                                    <FileText size={12} />
                                                    {expandedApp.status === 'Received Acceptance' ? 'See Acceptance' : 'See I20'}
                                                </button>
                                            )}
                                            <span className="px-4 py-1.5 bg-green-500/30 backdrop-blur-md border border-green-500/30 rounded-xl text-xs font-black uppercase tracking-widest leading-none">
                                                {expandedApp.status}
                                            </span>
                                        </div>
                                        <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">{expandedApp.universityName}</h2>
                                        <p className="text-blue-100/80 font-bold text-xl mt-2 flex items-center gap-3">
                                            <School size={24} className="shrink-0" />
                                            {expandedApp.course}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 overflow-y-auto p-8 sm:p-12 custom-scrollbar bg-lyceum-light dark:bg-gray-900">
                            <div className="max-w-7xl mx-auto">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                    <div className="lg:col-span-12">
                                        <h3 className="text-[14px] font-black uppercase tracking-[0.2em] text-gray-400 mb-10 flex items-center gap-4">
                                            Application Progress Pipeline
                                            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                                        </h3>

                                        <div className="relative pt-10 pb-16">
                                            <div className="absolute top-[62px] left-8 right-8 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full" />
                                            <div className="absolute top-[62px] left-8 h-1.5 bg-lyceum-blue rounded-full transition-all duration-1000 shadow-[0_0_25px_rgba(59,130,246,0.5)]"
                                                style={{ width: ['Offer Received', 'Received Acceptance', 'Received I20'].includes(expandedApp.status) ? '100.1%' : expandedApp.status === 'In Review' ? '66.6%' : expandedApp.status === 'Applied' ? '33.3%' : '0%' }}
                                            />

                                            <div className="flex justify-between relative z-10">
                                                {[
                                                    { status: 'Shortlisted', icon: <Bookmark size={20} />, desc: 'Initial selection made' },
                                                    { status: 'Applied', icon: <FileText size={20} />, desc: 'Docs submitted to portal' },
                                                    { status: 'In Review', icon: <Search size={20} />, desc: 'University is evaluating' },
                                                    { status: 'Offer Received', icon: <Award size={20} />, desc: 'Admission letter issued' }
                                                ].map((stage, i) => {
                                                    const isPassed = (['Offer Received', 'Received Acceptance', 'Received I20'].includes(expandedApp.status)) || (expandedApp.status === 'In Review' && i <= 2) || (expandedApp.status === 'Applied' && i <= 1) || (expandedApp.status === 'Shortlisted' && i === 0);
                                                    const isCurrent = stage.status === 'Offer Received' ? ['Offer Received', 'Received Acceptance', 'Received I20'].includes(expandedApp.status) : expandedApp.status === stage.status;

                                                    return (
                                                        <div key={stage.status} className="flex flex-col items-center gap-5 w-32 sm:w-48">
                                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 ${isPassed
                                                                ? 'bg-lyceum-blue text-white shadow-2xl shadow-blue-500/30 ring-[8px] ring-blue-50 dark:ring-blue-900/20'
                                                                : 'bg-white dark:bg-gray-800 text-gray-400 border-2 border-gray-100 dark:border-gray-700'
                                                                } ${isCurrent ? 'scale-110' : 'scale-90 opacity-70'}`}>
                                                                {isPassed ? <Check size={28} className="animate-in zoom-in" /> : stage.icon}
                                                            </div>
                                                            <div className="text-center">
                                                                <p className={`text-xs font-black tracking-widest uppercase mb-1.5 transition-colors ${isCurrent ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{stage.status}</p>
                                                                <p className="text-[11px] text-gray-400 font-bold leading-tight hidden sm:block uppercase tracking-wider">{stage.desc}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-8 space-y-10">
                                        <div className="bg-white dark:bg-gray-800/40 rounded-[40px] p-10 border border-gray-100 dark:border-gray-700/50 shadow-sm transition-all hover:shadow-md">
                                            <h4 className="text-[12px] font-black uppercase tracking-widest text-gray-500 mb-8 flex items-center gap-2">
                                                <ClipboardList size={16} /> Course Parameters
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                                                <div>
                                                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-2">Destination</p>
                                                    <p className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                                        <Globe2 size={20} className="text-blue-500" />
                                                        {expandedApp.country || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-2">Target Intake</p>
                                                    <p className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                                        <Calendar size={20} className="text-blue-500" />
                                                        {expandedApp.intake || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-2">Submission Date</p>
                                                    <p className="text-xl font-black text-gray-900 dark:text-white">
                                                        {new Date(expandedApp.applicationSubmissionDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                                <div className="space-y-4">
                                                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-2">Portal Remark</p>
                                                    <div className="bg-blue-50/50 dark:bg-blue-500/5 p-6 rounded-[30px] border border-blue-100/50 dark:border-blue-500/10 shadow-inner">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                                                            {expandedApp.studentRemark || 'No specific message from the staff at the moment.'}
                                                        </p>

                                                        {expandedApp.requiresDocument && (
                                                            <div className="mt-6 pt-6 border-t border-blue-100/50 dark:border-blue-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                                                        <Folder size={18} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Action Required</p>
                                                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Please upload the requested documents</p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => onNavigateToDocuments?.()}
                                                                    className="w-full sm:w-auto px-6 py-3 bg-lyceum-blue hover:bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                                >
                                                                    <Plus size={16} />
                                                                    Upload Documents
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-4 space-y-6">
                                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 rounded-[40px] p-10 text-white shadow-2xl shadow-black/20 border border-white/5">
                                            <h4 className="text-[12px] font-black uppercase tracking-widest text-gray-400 mb-8">Financial Overview</h4>
                                            <div className="space-y-8">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-base font-medium text-gray-400">Application Fee</span>
                                                    <span className="text-2xl font-black">${expandedApp.applicationFee || '0'}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-base font-medium text-gray-400">Enrollment Deposit</span>
                                                    <span className="text-2xl font-black text-emerald-400">${expandedApp.enrollmentDeposit || '0'}</span>
                                                </div>
                                                <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                                                    <span className="text-sm font-bold text-gray-400">ACK Number</span>
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(expandedApp.ackNumber)}
                                                        className="flex items-center gap-3 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-2xl transition-all font-black text-sm tracking-widest"
                                                    >
                                                        {expandedApp.ackNumber}
                                                        <Copy size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={onNavigateToTickets}
                                            className="w-full py-5 bg-lyceum-blue hover:bg-blue-600 text-white font-black rounded-[32px] transition-all shadow-xl shadow-blue-500/25 active:scale-[0.98] text-lg tracking-tight"
                                        >
                                            Open Portal Support
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Header Navigation */}
                    <div className="relative flex items-center justify-between p-6 z-20">

                        <button
                            onClick={handleBack}
                            className="group flex items-center justify-center w-12 h-12 rounded-2xl bg-white/60 dark:bg-gray-800/40 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 active:scale-95"
                        >
                            <ArrowLeft size={18} className="text-gray-600 dark:text-gray-300 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        {step > 0 && (
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-3 bg-white/60 dark:bg-gray-800/40 backdrop-blur-xl px-5 py-3 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="relative flex items-center justify-center">
                                            <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${step >= i
                                                ? 'bg-lyceum-blue shadow-[0_0_12px_rgba(59,130,246,0.7)] scale-110'
                                                : 'bg-gray-300/50 dark:bg-gray-600/50 scale-90'
                                                }`} />
                                            {step === i && <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-lyceum-blue animate-ping opacity-30" />}
                                        </div>
                                    ))}
                                </div>
                                {basket.length > 0 && step !== 4 && (
                                    <button
                                        onClick={() => setIsBasketOpen(true)}
                                        className="flex items-center gap-2 bg-lyceum-blue text-white px-4 py-2.5 rounded-2xl shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all animate-in zoom-in"
                                    >
                                        <Bookmark size={18} fill="currentColor" />
                                        <span className="font-bold text-sm">Basket</span>
                                        <span className="bg-white text-lyceum-blue text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                                            {basket.length}
                                        </span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="relative px-4 sm:px-8 pb-8 flex-1 overflow-y-auto z-10 custom-scrollbar">

                        {/* STEP 0: Dashboard */}
                        {step === 0 && (
                            <div className="space-y-10 max-w-7xl mx-auto animate-fade-in-up">
                                <div className="relative overflow-hidden bg-gray-900 rounded-[40px] p-10 sm:p-14 border border-gray-800 shadow-2xl shadow-blue-900/20 group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-purple-900/40 mix-blend-multiply" />
                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />

                                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 group-hover:bg-blue-500/30 transition-colors duration-700" />
                                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 group-hover:bg-purple-500/30 transition-colors duration-700" />

                                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                                        <div className="max-w-xl">
                                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-widest backdrop-blur-md mb-6">
                                                <Sparkles size={14} className="text-blue-400" /> Global Education Portal
                                            </div>
                                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                                                Shape Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Future</span>
                                            </h1>
                                            <p className="text-gray-400 mt-6 font-medium text-lg lg:text-xl leading-relaxed">
                                                Monitor your applications in real-time, manage your academic profile, and uncover premium programs tailored for you.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleUpdateStep(3)}
                                            className="relative inline-flex items-center justify-center gap-3 px-8 py-5 font-black text-gray-900 bg-white rounded-[24px] overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] w-full md:w-auto shrink-0 group/btn"
                                        >
                                            <span className="relative z-10 flex items-center gap-3">
                                                <Globe2 size={22} className="text-blue-600" />
                                                Explore Universities
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover/btn:bg-blue-50 transition-colors">
                                                    <ArrowRight size={16} className="text-blue-600 group-hover/btn:translate-x-0.5 transition-transform" />
                                                </div>
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                                    <div className="xl:col-span-7 space-y-6">
                                        <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
                                            Shortlisted & Active Programs
                                            <span className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 text-sm font-black px-3 py-1 rounded-xl">
                                                {myApplications.length}
                                            </span>
                                        </h2>

                                        {myApplications.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-24 px-8 rounded-[40px] border-2 border-dashed border-gray-200 dark:border-gray-800 bg-white/30 dark:bg-gray-900/20 backdrop-blur-sm">
                                                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl flex items-center justify-center mb-8 shadow-inner border border-white/50 dark:border-gray-700/50">
                                                    <Building2 size={36} className="text-gray-400" />
                                                </div>
                                                <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-3 tracking-tight">Zero Shortlisted Programs</h3>
                                                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm text-center font-medium leading-relaxed">
                                                    Your portfolio is currently empty. Tap into our global network and find a program that elevates your career.
                                                </p>
                                                <button onClick={() => handleUpdateStep(3)} className="text-lyceum-blue font-black hover:text-blue-700 flex items-center gap-2 text-lg bg-blue-50 dark:bg-blue-500/10 px-6 py-3 rounded-2xl transition-colors">
                                                    Start Exploring <ArrowRight size={20} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-6">
                                                {myApplications.filter(app => app.universityName).map((app, idx) => renderApplicationCard(app, idx))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="xl:col-span-5 space-y-6">
                                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Identity Profile</h2>
                                        <div className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl rounded-[40px] border border-gray-200/50 dark:border-gray-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.02)] overflow-hidden flex flex-col p-2">

                                            {/* Academics Block */}
                                            <div className="relative p-6 sm:p-8 bg-gradient-to-br from-gray-50/50 to-white dark:from-gray-800/50 dark:to-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-[32px] mb-2 group">
                                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                                                    <GraduationCap size={120} />
                                                </div>

                                                <div className="flex items-center justify-between mb-8 relative z-10">
                                                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-800 dark:text-gray-200">
                                                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600 flex items-center justify-center">
                                                            <BookOpen size={14} className="text-blue-500" />
                                                        </div>
                                                        Academic Record
                                                    </div>
                                                    <button onClick={() => { setIsEditingStep1(true); handleUpdateStep(1); }} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-blue-600 bg-white dark:bg-gray-700 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 transition-all hover:scale-105 active:scale-95">
                                                        <Edit3 size={16} />
                                                    </button>
                                                </div>

                                                <div className="relative z-10">
                                                    <div className="mb-6">
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Target Objective</p>
                                                        <h3 className="font-black text-gray-900 dark:text-white text-3xl tracking-tight">{academicInfo.major}</h3>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur border border-gray-100 dark:border-gray-700/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">SSC</p>
                                                            <p className="font-black text-gray-900 dark:text-white text-2xl">{academicInfo.sscPercentage || '--'}%</p>
                                                        </div>
                                                        <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur border border-gray-100 dark:border-gray-700/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Inter</p>
                                                            <p className="font-black text-gray-900 dark:text-white text-2xl">{academicInfo.intermediatePercentage || '--'}%</p>
                                                        </div>
                                                    </div>

                                                    {academicInfo.degreePercentage && (
                                                        <div className="mt-3 bg-white/60 dark:bg-gray-900/40 backdrop-blur border border-gray-100 dark:border-gray-700/80 p-4 rounded-2xl flex justify-between items-center">
                                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Bachelor's</span>
                                                            <span className="font-black text-gray-900 dark:text-white text-xl">{academicInfo.degreePercentage}%</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Language Block */}
                                            <div className="relative p-6 sm:p-8 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 dark:from-indigo-900/10 dark:to-purple-900/10 border border-indigo-100/50 dark:border-indigo-800/30 rounded-[32px] group">
                                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05] pointer-events-none text-indigo-500 group-hover:scale-110 transition-transform duration-700">
                                                    <Languages size={120} />
                                                </div>

                                                <div className="flex items-center justify-between mb-8 relative z-10">
                                                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-800 dark:text-gray-200">
                                                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600 flex items-center justify-center">
                                                            <Languages size={14} className="text-indigo-500" />
                                                        </div>
                                                        Linguistics
                                                    </div>
                                                    <button onClick={() => { setIsEditingStep2(true); handleUpdateStep(2); }} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-indigo-600 bg-white dark:bg-gray-700 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 transition-all hover:scale-105 active:scale-95">
                                                        <Edit3 size={16} />
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-6 relative z-10">
                                                    <div className="relative">
                                                        <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-30 rounded-full" />
                                                        <div className="relative w-24 h-24 rounded-[32px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-4xl shadow-inner border border-white/20">
                                                            {languageInfo.score || '-'}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Certification</p>
                                                        <h4 className="font-black text-gray-900 dark:text-white text-3xl tracking-tight">{languageInfo.exam || 'None'}</h4>
                                                        {languageInfo.score ? (
                                                            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                                                                <CheckCircle2 size={12} /> Verified
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Form Steps (Steps 1, 2, 3) */}
                        {step > 0 && step < 4 && (
                            <div className="max-w-4xl mx-auto py-8">
                                {step < 3 && (
                                    <>
                                        <div className="text-center mb-12">
                                            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-[32px] mb-6 shadow-2xl ${step === 1 ? 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-600/30' : 'bg-gradient-to-br from-indigo-500 to-purple-700 shadow-indigo-600/30'} backdrop-blur-md border border-white/20`}>
                                                {step === 1 ? <BookOpen size={40} className="text-white" /> : <Languages size={40} className="text-white" />}
                                            </div>
                                            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
                                                {step === 1 ? 'Academic Foundations' : 'English Proficiency Test'}
                                            </h1>
                                            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto font-medium text-lg">
                                                {step === 1 ? 'Quantify your past achievements so our algorithm can match you with the perfect global programs.' : 'Certify your language skills. This is the ultimate key to unlocking premier international universities.'}
                                            </p>
                                        </div>
                                    </>
                                )}

                                {/* Step 1 Content */}
                                {step === 1 && (
                                    <div className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-200/50 dark:border-gray-700/50 p-8 sm:p-12 relative overflow-hidden group">
                                        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

                                        {!isEditingStep1 ? (
                                            <div className="space-y-10 relative z-10">
                                                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700/50 pb-8">
                                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Data Confirmed</h3>
                                                    <button onClick={() => setIsEditingStep1(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200/50 dark:border-gray-600/50">
                                                        <Edit3 size={16} /> Edit Data
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="p-6 rounded-[24px] bg-white/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm">
                                                        <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">Objective</p>
                                                        <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{academicInfo.major}</p>
                                                    </div>
                                                    <div className="p-6 rounded-[24px] bg-white/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm">
                                                        <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">SSC Accuracy</p>
                                                        <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{academicInfo.sscPercentage}%</p>
                                                    </div>
                                                    <div className="p-6 rounded-[24px] bg-white/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm">
                                                        <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">Intermediate Score</p>
                                                        <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{academicInfo.intermediatePercentage}%</p>
                                                    </div>
                                                    {academicInfo.degreePercentage && (
                                                        <div className="p-6 rounded-[24px] bg-white/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm">
                                                            <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">Bachelor's Level</p>
                                                            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{academicInfo.degreePercentage}%</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <button onClick={handleNext} className="w-full flex items-center justify-center gap-3 py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-extrabold text-xl rounded-[24px] mt-4 hover:scale-[1.02] transition-transform shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(255,255,255,0.05)]">
                                                    Proceed to Verification <ArrowRight size={20} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-8 animate-fade-in-up relative z-10">
                                                <div className="space-y-6">
                                                    <div className="relative">
                                                        <label className="block text-[13px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3 ml-2">Objective Level</label>
                                                        <div className="relative">
                                                            <select value={academicInfo.major} onChange={(e) => setAcademicInfo({ ...academicInfo, major: e.target.value as any })} className="w-full pl-6 pr-12 py-5 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/80 rounded-[24px] focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none font-bold text-lg dark:text-white cursor-pointer shadow-inner">
                                                                <option value="Bachelors">Undergraduate (Bachelors)</option>
                                                                <option value="Masters">Postgraduate (Masters)</option>
                                                            </select>
                                                            <ChevronRight className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none rotate-90" size={20} />
                                                        </div>
                                                    </div>

                                                    <div className="relative">
                                                        <label className="block text-[13px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3 ml-2">SSC Analytics (%)</label>
                                                        <input type="number" value={academicInfo.sscPercentage} onChange={(e) => setAcademicInfo({ ...academicInfo, sscPercentage: e.target.value })} className="w-full px-6 py-5 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/80 rounded-[24px] focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-black text-2xl dark:text-white outline-none shadow-inner" placeholder="00.00" />
                                                    </div>

                                                    <div className="relative">
                                                        <label className="block text-[13px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3 ml-2">Inter/School Base (%)</label>
                                                        <input type="number" value={academicInfo.intermediatePercentage} onChange={(e) => setAcademicInfo({ ...academicInfo, intermediatePercentage: e.target.value })} className="w-full px-6 py-5 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/80 rounded-[24px] focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-black text-2xl dark:text-white outline-none shadow-inner" placeholder="00.00" />
                                                    </div>

                                                    {academicInfo.major === 'Masters' && (
                                                        <div className="relative animate-fade-in-up">
                                                            <label className="block text-[13px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3 ml-2">Degree Index (%)</label>
                                                            <input type="number" value={academicInfo.degreePercentage} onChange={(e) => setAcademicInfo({ ...academicInfo, degreePercentage: e.target.value })} className="w-full px-6 py-5 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/80 rounded-[24px] focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-black text-2xl dark:text-white outline-none shadow-inner" placeholder="00.00" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-gray-100 dark:border-gray-700/50">
                                                    {hasAcademicInfo && (
                                                        <button onClick={() => setIsEditingStep1(false)} className="px-8 py-5 font-bold bg-white/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 rounded-[24px] hover:bg-white dark:hover:bg-gray-600 transition-colors border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-sm">
                                                            Abort Edit
                                                        </button>
                                                    )}
                                                    <button onClick={handleNext} className="flex-1 bg-lyceum-blue text-white font-extrabold text-xl py-5 rounded-[24px] hover:scale-[1.02] hover:bg-blue-600 transition-all shadow-[0_10px_40px_rgba(59,130,246,0.3)] flex justify-center items-center gap-2">
                                                        Next <ArrowRight size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 2 Content */}
                                {step === 2 && (
                                    <div className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-200/50 dark:border-gray-700/50 p-8 sm:p-12 relative overflow-hidden group">
                                        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />

                                        {!isEditingStep2 ? (
                                            <div className="space-y-10 relative z-10">
                                                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700/50 pb-8">
                                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Certification Registered</h3>
                                                    <button onClick={() => setIsEditingStep2(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200/50 dark:border-gray-600/50">
                                                        <Edit3 size={16} /> Edit Data
                                                    </button>
                                                </div>
                                                <div className="p-8 rounded-[32px] bg-gradient-to-r from-gray-50/80 to-indigo-50/30 dark:from-gray-900/80 dark:to-indigo-900/20 border border-gray-100 dark:border-gray-700/80 flex items-center gap-10">
                                                    <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-4xl shadow-lg border border-white/20">
                                                        {languageInfo.score}
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">Primary Entity</p>
                                                        <h4 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{languageInfo.exam}</h4>
                                                    </div>
                                                </div>
                                                <button onClick={handleNext} className="w-full flex items-center justify-center gap-3 py-5 bg-indigo-600 text-white font-extrabold text-xl rounded-[24px] mt-4 hover:scale-[1.02] hover:bg-indigo-700 transition-transform shadow-[0_10px_40px_rgba(79,70,229,0.3)]">
                                                    {hasApplications ? 'Return to Dashboard' : 'Explore Global Programs'} <ArrowRight size={20} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-8 animate-fade-in-up relative z-10">
                                                <div className="space-y-8">
                                                    <div className="relative">
                                                        <label className="block text-[13px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3 ml-2">Testing Protocol</label>
                                                        <div className="relative">
                                                            <select value={languageInfo.exam} onChange={(e) => setLanguageInfo({ ...languageInfo, exam: e.target.value })} className="w-full pl-6 pr-12 py-5 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/80 rounded-[24px] focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none font-bold text-lg dark:text-white cursor-pointer shadow-inner">
                                                                <option value="IELTS">IELTS</option>
                                                                <option value="TOEFL">TOEFL</option>
                                                                <option value="PTE">PTE Academic</option>
                                                                <option value="DET">Duolingo Entity Test (DET)</option>
                                                                <option value="None">None</option>
                                                            </select>
                                                            <ChevronRight className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none rotate-90" size={20} />
                                                        </div>
                                                    </div>

                                                    <div className="relative">
                                                        <label className="block text-[13px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3 ml-2">Final Certification Score</label>
                                                        <input type="number" step="0.5" value={languageInfo.score} onChange={(e) => setLanguageInfo({ ...languageInfo, score: e.target.value })} className="w-full px-6 py-5 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/80 rounded-[24px] focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-black text-2xl dark:text-white outline-none shadow-inner" placeholder="E.g. 7.5" />
                                                    </div>
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-gray-100 dark:border-gray-700/50">
                                                    {hasLanguageInfo && (
                                                        <button onClick={() => setIsEditingStep2(false)} className="px-8 py-5 font-bold bg-white/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 rounded-[24px] hover:bg-white dark:hover:bg-gray-600 transition-colors border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-sm">
                                                            Abort Edit
                                                        </button>
                                                    )}
                                                    <button onClick={handleNext} className="flex-1 bg-indigo-600 text-white font-extrabold text-xl py-5 rounded-[24px] hover:scale-[1.02] hover:bg-indigo-700 transition-all shadow-[0_10px_40px_rgba(79,70,229,0.3)] flex justify-center items-center gap-2">
                                                        Update Certification <ArrowRight size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 3 Content */}
                                {step === 3 && (
                                    <div className="max-w-[1400px] mx-auto animate-fade-in-up">
                                        <div className="text-center mb-14">
                                            <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
                                                <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tight text-center sm:text-left">Results</h1>
                                                <button
                                                    onClick={() => {
                                                        setStep(1);
                                                        setIsEditingStep1(true);
                                                        setIsEditingStep2(true);
                                                    }}
                                                    className="mt-6 sm:mt-0 flex items-center justify-center gap-2 px-6 py-3 font-bold bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 rounded-[20px] hover:bg-white dark:hover:bg-gray-700 transition-colors border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-sm shadow-sm"
                                                >
                                                    <Edit3 size={18} className="text-blue-500" />
                                                    Re-Calibrate Profile
                                                </button>
                                            </div>

                                            {/* Filters */}
                                            <div className="flex flex-col sm:flex-row gap-3 mt-4">
                                                {/* Country selector – compact */}
                                                <div className="relative">
                                                    <Globe2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" />
                                                    <select
                                                        value={selectedCountry}
                                                        onChange={(e) => {
                                                            const newCountry = e.target.value;
                                                            setSelectedCountry(newCountry);
                                                            saveEverything({ newCountry });
                                                        }}
                                                        className="pl-10 pr-8 py-3 bg-white/70 dark:bg-gray-800/60 backdrop-blur border border-gray-200/50 dark:border-gray-700/50 rounded-2xl text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-lyceum-blue/30 outline-none appearance-none cursor-pointer"
                                                    >
                                                        <option value="" disabled>Country</option>
                                                        <option value="USA">🇺🇸 United States</option>
                                                        <option value="UK">🇬🇧 United Kingdom</option>
                                                        <option value="Canada">🇨🇦 Canada</option>
                                                        <option value="Australia">🇦🇺 Australia</option>
                                                        <option value="Germany">🇩🇪 Germany</option>
                                                        <option value="France">🇫🇷 France</option>
                                                    </select>
                                                </div>
                                                <div className="relative flex-1">
                                                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                    <input
                                                        type="text"
                                                        placeholder="Filter by university..."
                                                        value={filterUniversity}
                                                        onChange={e => setFilterUniversity(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-3 bg-white/70 dark:bg-gray-800/60 backdrop-blur border border-gray-200/50 dark:border-gray-700/50 rounded-2xl text-gray-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-lyceum-blue/30 outline-none"
                                                    />
                                                </div>
                                                <div className="relative flex-1">
                                                    <BookOpen size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                    <input
                                                        type="text"
                                                        placeholder="Filter by course..."
                                                        value={filterCourse}
                                                        onChange={e => setFilterCourse(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-3 bg-white/70 dark:bg-gray-800/60 backdrop-blur border border-gray-200/50 dark:border-gray-700/50 rounded-2xl text-gray-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-lyceum-blue/30 outline-none"
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <select
                                                        value={filterIntake}
                                                        onChange={e => setFilterIntake(e.target.value)}
                                                        className="pl-4 pr-10 py-3 bg-white/70 dark:bg-gray-800/60 backdrop-blur border border-gray-200/50 dark:border-gray-700/50 rounded-2xl text-gray-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-lyceum-blue/30 outline-none appearance-none cursor-pointer"
                                                    >
                                                        <option value="">All Intakes</option>
                                                        {[...new Set(availableCourses.flatMap(c => (c.intake || '').split(',').map(i => i.trim())).filter(Boolean))].sort().map(intake => (
                                                            <option key={intake} value={intake}>{intake}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {(filterUniversity || filterCourse || filterIntake) && (
                                                    <button
                                                        onClick={() => { setFilterUniversity(''); setFilterCourse(''); setFilterIntake(''); }}
                                                        className="px-4 py-3 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-2xl font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors whitespace-nowrap"
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>

                                            {loading ? (
                                                <div className="flex flex-col justify-center items-center py-32">
                                                    <div className="w-20 h-20 border-4 border-gray-200 dark:border-gray-800 rounded-[28px] relative animate-spin">
                                                        <div className="absolute inset-[-4px] border-4 border-blue-600 border-t-transparent rounded-[28px]" />
                                                    </div>
                                                    <p className="mt-8 text-gray-500 font-bold tracking-widest uppercase">Cross-Referencing Global Nodes...</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-4 mt-6">
                                                    {availableCourses.flatMap(course => {
                                                        if (!isEligible(course)) return [];
                                                        return course.courseName.split(',').map(c => c.trim()).map(courseName => ({
                                                            course,
                                                            courseName
                                                        }));
                                                    }).filter(({ course, courseName }) => {
                                                        const uniMatch = !filterUniversity || course.universityName.toLowerCase().includes(filterUniversity.toLowerCase());
                                                        const courseMatch = !filterCourse || courseName.toLowerCase().includes(filterCourse.toLowerCase());
                                                        const intakeMatch = !filterIntake || (course.intake || '').split(',').map(i => i.trim()).includes(filterIntake);
                                                        return uniMatch && courseMatch && intakeMatch;
                                                    }).map(({ course, courseName }, index) => {
                                                        const matchData = calculateMatchScore(course);
                                                        const isApplied = myApplications.some(app => app.universityName === course.universityName && app.course === courseName);

                                                        return (
                                                            <div key={`${course.id}-${index}`} className="group relative bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl rounded-[32px] border border-gray-200/50 dark:border-gray-700/50 p-2 flex flex-col md:flex-row items-center hover:-translate-y-1 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_60px_-15px_rgba(255,255,255,0.05)] transition-all duration-500 w-full">
                                                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 rounded-[32px] pointer-events-none transition-opacity duration-500" />

                                                                <div className="bg-white dark:bg-gray-900 rounded-[28px] p-6 flex flex-col gap-6 w-full relative z-10 border border-gray-50 dark:border-gray-800">

                                                                    {/* Top section: Logo and Names */}
                                                                    <div className="flex items-center gap-5 w-full">
                                                                        <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 flex shrink-0 items-center justify-center text-gray-900 dark:text-white font-black text-2xl shadow-inner border border-gray-200/50 dark:border-gray-700 group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                                                                            {course.logoUrl ? (
                                                                                <img src={`${api.API_BASE_URL}${course.logoUrl}`} alt={course.universityName} className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                course.universityName.charAt(0)
                                                                            )}
                                                                        </div>
                                                                        <div className="flex flex-col flex-1">
                                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border bg-gradient-to-r ${matchData.color} w-max mb-1.5`}>
                                                                                {matchData.icon} {matchData.label}
                                                                            </span>
                                                                            <h3 className="font-black text-xl sm:text-2xl text-gray-900 dark:text-white leading-tight">
                                                                                {course.universityName}
                                                                            </h3>
                                                                            <h4 className="text-sm sm:text-base font-bold text-gray-500 dark:text-gray-400">{courseName}</h4>
                                                                        </div>
                                                                    </div>

                                                                    {/* Bottom section: Requirements & Action */}
                                                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 w-full pt-4 border-t border-gray-100 dark:border-gray-800">
                                                                        <div className="flex flex-row flex-wrap items-center gap-4 md:gap-5 xl:gap-6">
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1">SSC</span>
                                                                                <span className="font-bold text-gray-900 dark:text-white text-lg">{course.minSscPercent}%</span>
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1">Inter</span>
                                                                                <span className="font-bold text-gray-900 dark:text-white text-lg">{course.minInterPercent}%</span>
                                                                            </div>
                                                                            {course.minDegreePercent ? (
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1">Degree</span>
                                                                                    <span className="font-bold text-gray-900 dark:text-white text-lg">{course.minDegreePercent}%</span>
                                                                                </div>
                                                                            ) : null}
                                                                            {(course.acceptedExams?.length > 0 || course.requiredExam) && (
                                                                                <div className="flex flex-col border-l border-gray-200 dark:border-gray-700 pl-4 md:pl-5 xl:pl-6">
                                                                                    <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1">Language</span>
                                                                                    <span className="font-bold text-gray-900 dark:text-white text-lg">
                                                                                        {course.acceptedExams?.length > 0
                                                                                            ? course.acceptedExams.map(e => `${e.exam} ${e.score}`).join(', ')
                                                                                            : `${course.requiredExam} ${course.minExamScore}`}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                            {course.applicationFee && (
                                                                                <div className="flex flex-col border-l border-gray-200 dark:border-gray-700 pl-4 md:pl-5 xl:pl-6">
                                                                                    <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1">App Fee</span>
                                                                                    <span className="font-bold text-gray-900 dark:text-white text-lg">{course.applicationFee}</span>
                                                                                </div>
                                                                            )}
                                                                            {course.enrollmentDeposit && (
                                                                                <div className="flex flex-col border-l border-gray-200 dark:border-gray-700 pl-4 md:pl-5 xl:pl-6">
                                                                                    <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1">Deposit</span>
                                                                                    <span className="font-bold text-gray-900 dark:text-white text-lg">{course.enrollmentDeposit}</span>
                                                                                </div>
                                                                            )}
                                                                            {course.wesRequirement && (
                                                                                <div className="flex flex-col border-l border-gray-200 dark:border-gray-700 pl-4 md:pl-5 xl:pl-6">
                                                                                    <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1">WES</span>
                                                                                    <span className="font-bold text-gray-900 dark:text-white text-lg">{course.wesRequirement}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Action */}
                                                                        <div className="shrink-0 w-full md:w-auto mt-2 md:mt-0">
                                                                            <button
                                                                                disabled={isApplied}
                                                                                onClick={() => handleToggleBasket(course, courseName)}
                                                                                className={`w-full md:w-auto px-8 py-4 rounded-[20px] font-black flex items-center justify-center gap-3 transition-all duration-300 ${isApplied
                                                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/30 dark:text-emerald-400 cursor-not-allowed'
                                                                                    : basket.some(item => item.course.id === course.id && item.courseName === courseName)
                                                                                        ? 'bg-lyceum-blue text-white shadow-lg'
                                                                                        : 'bg-gray-900 text-white hover:bg-lyceum-blue hover:scale-[1.02] shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:bg-white dark:text-gray-900 dark:hover:bg-lyceum-blue dark:hover:text-white'
                                                                                    }`}
                                                                            >
                                                                                {isApplied ? (
                                                                                    <><CheckCircle2 size={20} /> Sent</>
                                                                                ) : basket.some(item => item.course.id === course.id && item.courseName === courseName) ? (
                                                                                    <><Check size={20} /> In Basket</>
                                                                                ) : (
                                                                                    <><Plus size={20} /> Shortlist</>
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {availableCourses.length > 0 && availableCourses.every(c => !isEligible(c)) && (
                                                        <div className="w-full py-32 text-center text-gray-500">
                                                            No optimal paths found in this region.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                            </div>
                        )}

                        {/* Step 4: Basket Review */}
                        {step === 4 && (
                            <div className="w-full max-w-[1400px] mx-auto py-8 animate-fade-in-up">

                                {/* Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                    <div>
                                        <button onClick={handleBack} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 dark:hover:text-white font-bold text-xs uppercase tracking-widest mb-3 transition-colors">
                                            <ArrowLeft size={14} /> Back to Search
                                        </button>
                                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                                            Review your <span className="text-lyceum-blue">Shortlist</span>
                                        </h2>
                                        <p className="text-gray-500 font-medium mt-1.5 text-sm">{basket.length} course{basket.length === 1 ? '' : 's'} selected — click any card to view details</p>
                                    </div>
                                    <button
                                        onClick={handleConfirmShortlist}
                                        disabled={loading || basket.length === 0}
                                        className="px-8 py-4 bg-lyceum-blue text-white font-black rounded-3xl shadow-2xl shadow-blue-500/30 hover:bg-blue-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 group whitespace-nowrap self-start sm:self-center"
                                    >
                                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle2 size={20} className="group-hover:rotate-12 transition-transform" /> Confirm &amp; Submit</>}
                                    </button>
                                </div>

                                {basket.length === 0 ? (
                                    <div className="py-20 text-center bg-gray-50 dark:bg-gray-800/20 rounded-[40px] border-2 border-dashed border-gray-200 dark:border-gray-800">
                                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                            <Search size={32} className="text-gray-400" />
                                        </div>
                                        <p className="text-gray-500 font-bold mb-6">Your shortlist is empty</p>
                                        <button onClick={() => handleUpdateStep(3)} className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-2xl hover:scale-105 active:scale-95 transition-all">Browse Universities</button>
                                    </div>

                                ) : selectedBasketItem ? (
                                    /* ── Full detail view ── */
                                    <div className="animate-fade-in-up">
                                        {/* Back to list */}
                                        <button onClick={() => setSelectedBasketItem(null)} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 dark:hover:text-white font-bold text-xs uppercase tracking-widest mb-6 transition-colors">
                                            <ArrowLeft size={14} /> Back to Shortlist
                                        </button>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                                            {/* Left — university info */}
                                            <div className="flex flex-col gap-6">

                                                {/* Hero card */}
                                                <div className="bg-white dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 rounded-[32px] p-8">
                                                    <div className="flex items-start gap-5 mb-6">
                                                        <div className="w-20 h-20 rounded-[24px] bg-gray-50 dark:bg-gray-900 flex shrink-0 items-center justify-center font-black text-3xl text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700 overflow-hidden shadow-inner">
                                                            {selectedBasketItem.course.logoUrl ? <img src={`${api.API_BASE_URL}${selectedBasketItem.course.logoUrl}`} alt="" className="w-full h-full object-cover" /> : selectedBasketItem.course.universityName.charAt(0)}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{selectedBasketItem.course.universityName}</h3>
                                                            <p className="text-lyceum-blue font-black tracking-widest text-xs uppercase mt-1">{selectedBasketItem.courseName}</p>
                                                            <div className="flex flex-wrap gap-2 mt-3">
                                                                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold flex items-center gap-1"><Globe2 size={10} />{selectedBasketItem.course.country}</span>
                                                                {(selectedBasketItem.course.intake || '').split(',').map(i => i.trim()).filter(Boolean).map((intake, i) => (
                                                                    <span key={i} className="px-3 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold">{intake}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <button onClick={() => { handleToggleBasket(selectedBasketItem.course, selectedBasketItem.courseName); setSelectedBasketItem(null); }} className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all" title="Remove from shortlist">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>

                                                    {/* Fees */}
                                                    {(selectedBasketItem.course.applicationFee || selectedBasketItem.course.enrollmentDeposit) && (
                                                        <div className="grid grid-cols-2 gap-3 mb-6">
                                                            {selectedBasketItem.course.applicationFee && (
                                                                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/20 rounded-2xl p-4">
                                                                    <span className="text-[10px] font-black tracking-widest text-amber-600 dark:text-amber-400 uppercase block mb-1">Application Fee</span>
                                                                    <span className="text-2xl font-black text-gray-900 dark:text-white">${selectedBasketItem.course.applicationFee}</span>
                                                                </div>
                                                            )}
                                                            {selectedBasketItem.course.enrollmentDeposit && (
                                                                <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/20 rounded-2xl p-4">
                                                                    <span className="text-[10px] font-black tracking-widest text-green-600 dark:text-green-400 uppercase block mb-1">Enrollment Deposit</span>
                                                                    <span className="text-2xl font-black text-gray-900 dark:text-white">${selectedBasketItem.course.enrollmentDeposit}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Requirements */}
                                                    {(selectedBasketItem.course.minSsc || selectedBasketItem.course.minIntermediate || selectedBasketItem.course.minDegree) && (
                                                        <div className="mb-6">
                                                            <h4 className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-3">Min. Academic Requirements</h4>
                                                            <div className="grid grid-cols-3 gap-3">
                                                                {selectedBasketItem.course.minSsc && <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-3 text-center"><span className="text-[9px] font-black tracking-widest text-gray-400 uppercase block mb-1">SSC</span><span className="text-xl font-black text-gray-900 dark:text-white">{selectedBasketItem.course.minSsc}%</span></div>}
                                                                {selectedBasketItem.course.minIntermediate && <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-3 text-center"><span className="text-[9px] font-black tracking-widest text-gray-400 uppercase block mb-1">Inter</span><span className="text-xl font-black text-gray-900 dark:text-white">{selectedBasketItem.course.minIntermediate}%</span></div>}
                                                                {selectedBasketItem.course.minDegree && <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-3 text-center"><span className="text-[9px] font-black tracking-widest text-gray-400 uppercase block mb-1">Degree</span><span className="text-xl font-black text-gray-900 dark:text-white">{selectedBasketItem.course.minDegree}%</span></div>}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Language */}
                                                    {selectedBasketItem.course.languageRequirements && (
                                                        <div>
                                                            <h4 className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-3">Language Requirements</h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {selectedBasketItem.course.languageRequirements.split(',').map((req: string, i: number) => (
                                                                    <span key={i} className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-2xl text-sm font-bold border border-indigo-100 dark:border-indigo-800/30">{req.trim()}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* WES */}
                                                {selectedBasketItem.course.wesRequired !== undefined && (
                                                    <div className={`flex items-center gap-4 p-5 rounded-2xl border ${selectedBasketItem.course.wesRequired ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800/30' : 'bg-gray-50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-700/30'}`}>
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedBasketItem.course.wesRequired ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-gray-100 dark:bg-gray-700/30'}`}>
                                                            <BookOpen size={18} className={selectedBasketItem.course.wesRequired ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-sm text-gray-900 dark:text-white">WES Evaluation {selectedBasketItem.course.wesRequired ? 'Required' : 'Not Required'}</p>
                                                            <p className="text-xs text-gray-400 mt-0.5">World Education Services credential evaluation</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right — Application Timeline */}
                                            <div className="bg-white dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 rounded-[32px] p-8">
                                                <div className="flex items-center gap-3 mb-8">
                                                    <div className="w-10 h-10 rounded-2xl bg-lyceum-blue/10 flex items-center justify-center">
                                                        <ChevronRight size={18} className="text-lyceum-blue" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-gray-900 dark:text-white">Application Timeline</h4>
                                                        <p className="text-xs text-gray-400 font-medium">Step-by-step journey to enrollment</p>
                                                    </div>
                                                </div>

                                                <div className="relative">
                                                    {/* Vertical gradient line */}
                                                    <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-gradient-to-b from-lyceum-blue via-violet-500 to-pink-400 rounded-full opacity-30" />

                                                    <div className="flex flex-col gap-0">
                                                        {[
                                                            { n: 1, label: 'Profile Submitted', desc: 'Academic & language profile saved in Lyceum', icon: CheckCircle2, color: 'bg-lyceum-blue', ring: 'ring-lyceum-blue/20', done: true },
                                                            { n: 2, label: 'Shortlist Confirmed', desc: 'University selection confirmed and submitted', icon: CheckCircle2, color: 'bg-lyceum-blue', ring: 'ring-lyceum-blue/20', done: true },
                                                            { n: 3, label: 'Submit Documents', desc: 'Transcripts, SOP, LOR & passport copy required', icon: Edit3, color: 'bg-violet-500', ring: 'ring-violet-500/20', done: false },
                                                            { n: 4, label: 'Application Filed', desc: 'Your counselor files the formal application', icon: Globe2, color: 'bg-purple-500', ring: 'ring-purple-500/20', done: false },
                                                            { n: 5, label: 'Under Review', desc: 'University reviews your application (~4–8 weeks)', icon: Search, color: 'bg-fuchsia-500', ring: 'ring-fuchsia-500/20', done: false },
                                                            { n: 6, label: 'Decision Received', desc: 'Offer letter or conditional admission issued', icon: Sparkles, color: 'bg-pink-500', ring: 'ring-pink-500/20', done: false },
                                                            { n: 7, label: 'Pay Deposit & Enroll', desc: `Secure your seat with the enrollment deposit${selectedBasketItem.course.enrollmentDeposit ? ` ($${selectedBasketItem.course.enrollmentDeposit})` : ''}`, icon: ArrowRight, color: 'bg-rose-500', ring: 'ring-rose-500/20', done: false },
                                                        ].map(({ n, label, desc, icon: Icon, color, ring, done }, i) => (
                                                            <div key={n} className="flex gap-4 relative pb-6 last:pb-0">
                                                                <div className={`w-10 h-10 rounded-2xl ${color} flex shrink-0 items-center justify-center z-10 ring-4 ${ring} shadow-md ${done ? 'opacity-100' : 'opacity-40'} transition-all`}>
                                                                    {done ? <CheckCircle2 size={18} className="text-white" /> : <span className="text-white font-black text-sm">{n}</span>}
                                                                </div>
                                                                <div className={`pt-1.5 ${done ? '' : 'opacity-50'}`}>
                                                                    <p className={`font-black text-sm leading-tight ${done ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{label}</p>
                                                                    <p className="text-gray-400 text-xs mt-1 font-medium leading-relaxed">{desc}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* ── Card grid ── */
                                    <div className="flex flex-col gap-4">
                                        {basket.map((item, idx) => (
                                            <div
                                                key={`${item.course.id}-${idx}`}
                                                onClick={() => setSelectedBasketItem(item)}
                                                className="group relative bg-white dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 rounded-[32px] p-6 flex items-center gap-6 cursor-pointer hover:border-lyceum-blue/40 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-0.5"
                                            >
                                                {/* Logo */}
                                                <div className="w-20 h-20 rounded-[24px] bg-gray-50 dark:bg-gray-900 flex shrink-0 items-center justify-center font-black text-3xl text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700 overflow-hidden shadow-inner">
                                                    {item.course.logoUrl ? <img src={`${api.API_BASE_URL}${item.course.logoUrl}`} alt="" className="w-full h-full object-cover" /> : item.course.universityName.charAt(0)}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-black text-gray-900 dark:text-white text-xl leading-tight">{item.course.universityName}</p>
                                                    <p className="text-lyceum-blue font-black text-xs uppercase tracking-widest mt-1">{item.courseName}</p>
                                                    <div className="flex items-center gap-4 mt-3">
                                                        <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 font-medium"><Globe2 size={13} />{item.course.country}</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                                        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{(item.course.intake || '').split(',').map(i => i.trim()).filter(Boolean).join(', ')}</span>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleToggleBasket(item.course, item.courseName); }}
                                                        className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                                                        title="Remove from shortlist"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleSubmitSingle(item); }}
                                                        disabled={loading}
                                                        className="px-5 py-2.5 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-green-500 hover:text-white hover:border-green-500 hover:shadow-lg hover:shadow-green-500/20 transition-all disabled:opacity-50"
                                                    >
                                                        <CheckCircle2 size={15} />
                                                        Submit
                                                    </button>
                                                    <div
                                                        onClick={() => setSelectedBasketItem(item)}
                                                        className="px-5 py-2.5 bg-lyceum-blue/10 text-lyceum-blue rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-lyceum-blue hover:text-white cursor-pointer transition-all"
                                                    >
                                                        Details <ChevronRight size={15} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {/* Floating Basket Indicator */}
                        {
                            !expandedApp && basket.length > 0 && step === 3 && (
                                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[90] w-full max-w-[600px] px-6 animate-slide-up">
                                    <div onClick={() => handleUpdateStep(4)} className="bg-gray-900/90 dark:bg-white/90 backdrop-blur-2xl border border-white/10 dark:border-black/5 rounded-[32px] p-4 flex items-center gap-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] cursor-pointer group hover:scale-[1.02] transition-all active:scale-95">
                                        <div className="flex -space-x-3 overflow-hidden ml-2">
                                            {basket.slice(0, 3).map((item, i) => (
                                                <div key={i} className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-900 border-2 border-gray-800 dark:border-gray-100 flex items-center justify-center shrink-0 overflow-hidden shadow-lg">
                                                    {item.course.logoUrl ? (
                                                        <img src={`${api.API_BASE_URL}${item.course.logoUrl}`} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <span className="text-lyceum-blue font-black">{item.course.universityName.charAt(0)}</span>
                                                    )}
                                                </div>
                                            ))}
                                            {basket.length > 3 && (
                                                <div className="w-12 h-12 rounded-2xl bg-lyceum-blue text-white flex items-center justify-center text-xs font-black border-2 border-gray-800 dark:border-gray-100 shadow-lg">
                                                    +{basket.length - 3}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-white dark:text-gray-900 font-black text-lg tracking-tight leading-none">
                                                {(() => {
                                                    const uniCount = new Set(basket.map(b => b.course.universityName)).size;
                                                    const courseCount = basket.length;
                                                    const uniText = `${uniCount} ${uniCount === 1 ? 'University' : 'Universities'}`;
                                                    const courseText = courseCount > 1 ? `, ${courseCount} Courses` : '';
                                                    return `${uniText}${courseText} Selected`;
                                                })()}
                                            </h4>
                                            <p className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                                                <Sparkles size={10} className="text-blue-400" /> Click to finalize applications
                                            </p>
                                        </div>
                                        <div className="px-6 py-3 bg-lyceum-blue hover:bg-blue-600 text-white rounded-[20px] font-black text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20 group-hover:gap-3 transition-all">
                                            View Basket <ArrowRight size={16} />
                                        </div>
                                    </div>
                                </div>
                            )
                        }

                        <style>{`
                    @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
                    @keyframes slide-up { from { opacity: 0; transform: translate(-50%, 40px) scale(0.9); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }
                    .animate-fade-in-up { animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                    .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.2); border-radius: 10px; }
                    .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(51, 65, 85, 0.4); }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.8); }
                `}</style>
                    </div >
                </>
            )}
        </div>

    );
};
export default StudentUniversityApplicationView;

