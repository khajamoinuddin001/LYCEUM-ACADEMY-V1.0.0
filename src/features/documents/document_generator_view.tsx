import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Sparkles, FileText, CreditCard, Search, Download, UploadCloud, Plus, Trash2, 
  ChevronRight, ArrowRight, Layout, CheckCircle, RefreshCw, Layers, Edit, Eye, 
  MapPin, Phone, Mail, Award, BookOpen, Briefcase, PlusCircle, Settings, Sliders, Check
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as api from '@/utils/api';
import type { Contact, User } from '@/types';

interface DocumentGeneratorViewProps {
  currentUser?: User | null;
  contacts?: Contact[];
}

interface IDCardTemplate {
  id?: number;
  name: string;
  background_image: string; // base64 encoded background
  zones: IDCardZone[];
  is_default: boolean;
}

interface IDCardZone {
  id: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  width: number; // percentage (0-100)
  height: number; // percentage (0-100)
  fieldName: string; // e.g., 'name', 'photo', 'id', 'course', 'blood_group', 'emergency_contact', 'qr_code', 'barcode'
  fieldType: 'text' | 'photo' | 'qr_code' | 'barcode';
  properties: {
    fontSize: number;
    color: string;
    alignment: 'left' | 'center' | 'right';
    shape?: 'rectangle' | 'circle'; // for photo
  };
}

const DocumentGeneratorView: React.FC<DocumentGeneratorViewProps> = ({ currentUser, contacts = [] }) => {
  const [activeTab, setActiveTab] = useState<'cv' | 'sop' | 'id_card'>('cv');
  const [selectedStudent, setSelectedStudent] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Filter enrolled students (where contactType is 'Student')
  const students = useMemo(() => {
    return contacts.filter(c => {
      if (!c) return false;
      const type = (c.contactType || '').toLowerCase();
      const role = (c as any).role ? String((c as any).role).toLowerCase() : '';
      return type !== 'staff' && type !== 'admin' && role !== 'staff' && role !== 'admin';
    });
  }, [contacts]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students.slice(0, 5);
    const q = searchQuery.toLowerCase();
    return students.filter(s => 
      s.name.toLowerCase().includes(q) || 
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q))
    );
  }, [students, searchQuery]);

  // Handle student select
  const handleSelectStudent = (student: Contact) => {
    setSelectedStudent(student);
    setIsSearching(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 sm:p-6 lg:p-8 font-sans">
      {/* HEADER SECTION */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-lyceum-blue/90 to-blue-600/90 p-8 sm:p-10 text-white shadow-2xl mb-8 border border-white/10">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6 z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
              <Sparkles size={32} className="text-amber-300 animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none mb-2">Document Generator</h1>
              <p className="text-white/80 font-medium text-sm sm:text-base">Auto-populate, customise, and generate print-quality CVs, SOPs, and ID Cards.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CORE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* STUDENT SELECTOR LEFT BAR */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700/50">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-lyceum-blue rounded-full"></span>
              1. Select Student
            </h3>
            
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name, email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearching(true);
                }}
                onFocus={() => setIsSearching(true)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl outline-none text-sm focus:border-lyceum-blue focus:ring-2 focus:ring-lyceum-blue/20 dark:text-white transition-all font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => { setSearchQuery(''); setSelectedStudent(null); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-white font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Floating Search Results */}
            {isSearching && searchQuery.trim() && (
              <div className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl max-h-60 overflow-y-auto w-[calc(100%-3rem)] md:w-80 p-2">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map(student => (
                    <button
                      key={student.id}
                      onClick={() => handleSelectStudent(student)}
                      className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all flex items-center justify-between border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{student.name}</p>
                        <p className="text-xs text-gray-400">{student.email || 'No email'}</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-400" />
                    </button>
                  ))
                ) : (
                  <p className="text-center p-4 text-xs text-gray-400 font-medium">No students found.</p>
                )}
              </div>
            )}

            {/* Selected Student Display */}
            {selectedStudent ? (
              <div className="p-4 bg-gradient-to-br from-lyceum-blue/10 to-blue-500/10 rounded-2xl border border-lyceum-blue/20 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-gray-900 dark:text-white text-base">{selectedStudent.name}</h4>
                  <p className="text-xs text-lyceum-blue font-bold mt-0.5">{selectedStudent.degree || 'Degree unspecified'} - {selectedStudent.major || 'Major unspecified'}</p>
                  <p className="text-xs text-gray-400 mt-1">{selectedStudent.email}</p>
                </div>
                <div className="w-12 h-12 bg-lyceum-blue text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-lyceum-blue/20">
                  {selectedStudent.name.charAt(0)}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Please select a student to begin</p>
              </div>
            )}
          </div>

          {/* TAB SYSTEM */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
            {[
              { id: 'cv', label: 'CV Generator', icon: FileText, desc: 'Generate multi-page resumes' },
              { id: 'sop', label: 'AI SOP Generator', icon: Sparkles, desc: 'Draft custom AI statement of purpose' },
              { id: 'id_card', label: 'ID Card Templates', icon: CreditCard, desc: 'Custom template builder & batch export' }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all ${
                    isActive 
                      ? 'bg-lyceum-blue text-white shadow-xl shadow-lyceum-blue/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isActive ? 'bg-white/20 border-white/10' : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600'}`}>
                    <Icon size={20} className={isActive ? 'text-amber-300' : 'text-gray-500'} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm">{tab.label}</h4>
                    <p className={`text-[10px] mt-0.5 ${isActive ? 'text-white/80' : 'text-gray-400'}`}>{tab.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* WORKSPACE DETAIL SECTION */}
        <div className="lg:col-span-8">
          {activeTab === 'cv' && <CVGenerator student={selectedStudent} />}
          {activeTab === 'sop' && <SOPGenerator student={selectedStudent} />}
          {activeTab === 'id_card' && <IDCardGenerator student={selectedStudent} students={students} />}
        </div>

      </div>
    </div>
  );
};

/* =========================================================================
   1. CV GENERATOR SUB-COMPONENT
   ========================================================================= */
const CVGenerator = ({ student }: { student: Contact | null }) => {
  const [template, setTemplate] = useState<'academic' | 'professional' | 'minimalist'>('professional');
  const [cvData, setCvData] = useState({
    name: '', email: '', phone: '', address: '', dob: '', nationality: '',
    education: [] as any[], experience: [] as any[], skills: [] as any[],
    ielts: '', references: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync with selected student
  useEffect(() => {
    if (student) {
      // Dynamically compile education details (SSC, Intermediate, Degree) from actual database values
      const educationList = [];
      const acad = student.visaInformation?.universityApplication?.academicInformation;
      if (acad) {
        if (acad.sscPercentage) {
          educationList.push({
            degree: 'SSC',
            major: 'General Secondary',
            school: 'Secondary School',
            year: 'Completed',
            score: `${acad.sscPercentage}%`
          });
        }
        if (acad.intermediatePercentage) {
          educationList.push({
            degree: 'Intermediate',
            major: 'Higher Secondary',
            school: 'Junior College',
            year: 'Completed',
            score: `${acad.intermediatePercentage}%`
          });
        }
        if (acad.degreePercentage) {
          educationList.push({
            degree: student.degree || 'Bachelor\'s',
            major: (acad as any).major || student.major || 'Computer Science',
            school: acad.passingBodyUniversity || 'University',
            year: acad.passingYear || 'Completed',
            score: `${acad.degreePercentage}%`
          });
        }
      }
      if (educationList.length === 0) {
        educationList.push({
          degree: student.degree || 'Bachelor\'s',
          major: student.major || 'Computer Science',
          school: 'University',
          year: 'Completed',
          score: student.gpa ? `${student.gpa}/4.0` : '85%'
        });
      }

      // Populate experience list only if actual work details are present in the database
      const experienceList = [];
      if ((student as any).workExperience && (student as any).workExperience.length > 0) {
        experienceList.push(...(student as any).workExperience);
      } else if (student.visaInformation?.others?.workDetails && student.visaInformation.others.workDetails.length > 0) {
        experienceList.push(...student.visaInformation.others.workDetails.map(wd => ({
          role: 'Employee',
          company: wd.durationAndCompany?.split(' at ')?.[1] || wd.durationAndCompany || 'Company',
          duration: wd.durationAndCompany?.split(' at ')?.[0] || 'Duration',
          desc: 'Work details submitted in form.'
        })));
      }

      setCvData({
        name: student.name || '',
        email: student.email || '',
        phone: student.phone || '',
        address: [student.street1, student.city, student.state, student.zip, student.country].filter(Boolean).join(', ') || '',
        dob: (student as any).dob ? new Date((student as any).dob).toLocaleDateString() : '',
        nationality: (student as any).nationality || '',
        education: educationList,
        experience: experienceList,
        skills: (student as any).skills || ['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'Python'],
        ielts: student.visaInformation?.universityApplication?.languageProficiency?.score || '7.5 overall',
        references: 'Available upon request'
      });
    }
  }, [student]);

  const handleGenerateCV = async () => {
    if (!student) {
      alert('Please select a student first');
      return;
    }
    try {
      setIsGenerating(true);
      const doc = new jsPDF();

      // Determine colors based on selected template
      let primaryColor = [42, 111, 151]; // Professional (Lyceum Blue)
      if (template === 'academic') {
        primaryColor = [26, 43, 76]; // Academic (Stately Navy Blue)
      } else if (template === 'minimalist') {
        primaryColor = [33, 37, 41]; // Minimalist (Clean Dark Charcoal)
      }

      const [r, g, b] = primaryColor;

      // HEADER
      doc.setFillColor(r, g, b);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(cvData.name, 20, 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Email: ${cvData.email} | Phone: ${cvData.phone} | Nationality: ${cvData.nationality}`, 20, 28);
      
      let y = 55;

      // EDUCATION SECTION
      doc.setFillColor(240, 240, 240);
      doc.rect(15, y, 180, 8, 'F');
      doc.setTextColor(r, g, b);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('EDUCATION', 20, y + 6);
      y += 16;

      cvData.education.forEach(edu => {
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`${edu.degree} in ${edu.major}`, 20, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`${edu.school} | Graduated: ${edu.year} | Score: ${edu.score}`, 20, y + 5);
        y += 12;
      });

      // EXPERIENCE SECTION
      if (cvData.experience && cvData.experience.length > 0) {
        y += 4;
        doc.setFillColor(240, 240, 240);
        doc.rect(15, y, 180, 8, 'F');
        doc.setTextColor(r, g, b);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('WORK EXPERIENCE', 20, y + 6);
        y += 16;

        cvData.experience.forEach(exp => {
          doc.setTextColor(50, 50, 50);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text(`${exp.role} - ${exp.company}`, 20, y);
          doc.setFont('helvetica', 'normal');
          doc.text(exp.duration, 20, y + 5);
          doc.text(exp.desc, 20, y + 10);
          y += 18;
        });
      }

      // SKILLS SECTION
      y += 4;
      doc.setFillColor(240, 240, 240);
      doc.rect(15, y, 180, 8, 'F');
      doc.setTextColor(r, g, b);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('KEY SKILLS & LANGUAGE', 20, y + 6);
      y += 16;

      doc.setTextColor(50, 50, 50);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Skills: ${cvData.skills.join(', ')}`, 20, y);
      doc.text(`English Language Proficiency: IELTS score ${cvData.ielts}`, 20, y + 6);
      
      // AUTO-UPLOAD & DOWNLOAD
      const pdfBlob = doc.output('blob');
      const filename = `CV_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
      const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });
      
      await api.uploadDocument(student.id, pdfFile, true, 'CV (Curriculum Vitae)');
      doc.save(filename);
      
      alert('CV successfully generated, downloaded, and auto-uploaded to student\'s private Documents CV section!');
    } catch (err: any) {
      console.error(err);
      alert('Failed to generate CV: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">CV Generator Panel</h2>
          <p className="text-xs text-gray-400 mt-1">Configure templates and edit student background fields.</p>
        </div>
        <div className="flex gap-2 bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-600">
          {(['academic', 'professional', 'minimalist'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTemplate(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${template === t ? 'bg-lyceum-blue text-white shadow-md' : 'text-gray-400 hover:text-gray-600 dark:hover:text-white'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {student ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* EDITOR SIDE */}
          <div className="flex flex-col gap-4">
            <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Edit size={16} className="text-lyceum-blue" /> Edit Profile Details
            </h3>
            
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
              <input
                type="text"
                value={cvData.name}
                onChange={(e) => setCvData({ ...cvData, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm outline-none dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contact Information</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Email"
                  value={cvData.email}
                  onChange={(e) => setCvData({ ...cvData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm outline-none dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={cvData.phone}
                  onChange={(e) => setCvData({ ...cvData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm outline-none dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Address</label>
              <input
                type="text"
                value={cvData.address}
                onChange={(e) => setCvData({ ...cvData, address: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm outline-none dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Key Skills (Comma Separated)</label>
              <input
                type="text"
                value={cvData.skills.join(', ')}
                onChange={(e) => setCvData({ ...cvData, skills: e.target.value.split(',').map(s => s.trim()) })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm outline-none dark:text-white"
              />
            </div>

            <button
              onClick={handleGenerateCV}
              disabled={isGenerating}
              className="w-full mt-4 py-4 bg-lyceum-blue text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-lyceum-blue/90 shadow-xl shadow-lyceum-blue/20"
            >
              {isGenerating ? <RefreshCw className="animate-spin" size={16} /> : <Download size={16} />}
              Generate & Upload CV
            </button>
          </div>

          {/* PREVIEW SIDE */}
          <div className="bg-slate-50 dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 flex flex-col gap-4">
            <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Eye size={16} className="text-emerald-500" /> Real-time Live Preview
            </h3>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-inner border border-gray-100 dark:border-gray-700 min-h-[300px]">
              <div className="border-b-4 border-lyceum-blue pb-4 mb-4">
                <h4 className="font-black text-lg text-gray-900 dark:text-white leading-none">{cvData.name || 'Student Name'}</h4>
                <p className="text-xs text-gray-400 mt-1.5">{cvData.email} | {cvData.phone}</p>
                {cvData.address && <p className="text-[10px] text-gray-400 mt-0.5">{cvData.address}</p>}
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <h5 className="font-bold text-xs text-lyceum-blue uppercase tracking-wider">Education</h5>
                  <div className="h-[2px] bg-gray-100 dark:bg-gray-700 mt-1 mb-2"></div>
                  {cvData.education.map((edu, idx) => (
                    <div key={idx} className="mb-2 last:mb-0">
                      <p className="font-black text-xs text-gray-900 dark:text-white">{edu.degree} in {edu.major}</p>
                      <p className="text-[10px] text-gray-400">{edu.school} ({edu.year}) | Grade: {edu.score}</p>
                    </div>
                  ))}
                </div>

                {cvData.experience && cvData.experience.length > 0 && (
                  <div>
                    <h5 className="font-bold text-xs text-lyceum-blue uppercase tracking-wider">Experience</h5>
                    <div className="h-[2px] bg-gray-100 dark:bg-gray-700 mt-1 mb-2"></div>
                    {cvData.experience.map((exp, idx) => (
                      <div key={idx} className="mb-2 last:mb-0">
                        <p className="font-black text-xs text-gray-900 dark:text-white">{exp.role} - {exp.company}</p>
                        <p className="text-[10px] text-gray-400">{exp.duration}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{exp.desc}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <h5 className="font-bold text-xs text-lyceum-blue uppercase tracking-wider">Skills</h5>
                  <div className="h-[2px] bg-gray-100 dark:bg-gray-700 mt-1 mb-2"></div>
                  <div className="flex flex-wrap gap-1.5">
                    {cvData.skills.map((skill, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-[9px] font-bold">{skill}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400 font-bold uppercase tracking-wider">
          Please select a student on the left sidebar to generate a CV
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   2. AI SOP GENERATOR SUB-COMPONENT
   ========================================================================= */
const SOPGenerator = ({ student }: { student: Contact | null }) => {
  const [universities, setUniversities] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedUni, setSelectedUni] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [customUni, setCustomUni] = useState('');
  const [customCourse, setCustomCourse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [sopText, setSopText] = useState('');

  // Fetch courses/universities
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const u = await api.getUniversityCourses();
        setUniversities(u);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUniversities();
  }, []);

  const availableUnis = useMemo(() => {
    const names = universities.map(u => u.university_name);
    return Array.from(new Set(names));
  }, [universities]);

  const availableCourses = useMemo(() => {
    if (!selectedUni) return [];
    return universities
      .filter(u => u.university_name === selectedUni)
      .map(u => u.course_name);
  }, [universities, selectedUni]);

  const handleGenerateAISOP = async () => {
    if (!student) {
      alert('Please select a student first');
      return;
    }
    const targetUni = selectedUni === 'Custom' ? customUni : selectedUni;
    const targetCourse = selectedCourse === 'Custom' ? customCourse : selectedCourse;

    if (!targetUni || !targetCourse) {
      alert('Please specify target University and Course');
      return;
    }

    try {
      setIsGenerating(true);
      setSopText('Drafting your customized Statement of Purpose...');

      const response = await api.generateAIStatementOfPurpose({
        studentName: student.name,
        degree: student.degree,
        gpa: student.gpa?.toString(),
        workExperience: (student as any).workExperience ? JSON.stringify((student as any).workExperience) : (student.visaInformation?.others?.workDetails ? JSON.stringify(student.visaInformation.others.workDetails) : undefined),
        examScore: student.visaInformation?.universityApplication?.languageProficiency?.score || '7.5 overall',
        university: targetUni,
        course: targetCourse
      });

      setSopText(response.sop);
    } catch (err: any) {
      console.error(err);
      setSopText('Failed to generate SOP: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveSOP = async () => {
    if (!student || !sopText) return;
    try {
      setIsGenerating(true);
      const doc = new jsPDF();
      
      // SOP HEADER
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(42, 111, 151);
      doc.text('STATEMENT OF PURPOSE', 20, 30);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Student: ${student.name} | Application File`, 20, 37);
      doc.line(20, 42, 190, 42);

      // Body rendering with autowrap
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      const splitSop = doc.splitTextToSize(sopText, 170);
      doc.text(splitSop, 20, 55);

      const pdfBlob = doc.output('blob');
      const filename = `SOP_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
      const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });
      
      await api.uploadDocument(student.id, pdfFile, true, 'SOP (Statement of Purpose)');
      doc.save(filename);
      
      alert('SOP successfully generated, downloaded, and auto-uploaded to student\'s private Documents SOP section!');
    } catch (err: any) {
      console.error(err);
      alert('Failed to save SOP: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-black text-gray-900 dark:text-white">AI-Powered SOP Generator</h2>
        <p className="text-xs text-gray-400 mt-1">Select university, course, and draftStatement of Purposes tailored dynamically.</p>
      </div>

      {student ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* CONTROL PANEL */}
          <div className="flex flex-col gap-4">
            <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders size={16} className="text-lyceum-blue" /> Target Preferences
            </h3>

            {/* University Selection */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">University Name</label>
              <select
                value={selectedUni}
                onChange={(e) => { setSelectedUni(e.target.value); setSelectedCourse(''); }}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm outline-none dark:text-white"
              >
                <option value="">-- Select University --</option>
                {availableUnis.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
                <option value="Custom">Custom Entry</option>
              </select>
              {selectedUni === 'Custom' && (
                <input
                  type="text"
                  placeholder="Enter custom university name"
                  value={customUni}
                  onChange={(e) => setCustomUni(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm outline-none dark:text-white"
                />
              )}
            </div>

            {/* Course Selection */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Course Name</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm outline-none dark:text-white"
                disabled={!selectedUni}
              >
                <option value="">-- Select Course --</option>
                {availableCourses.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
                <option value="Custom">Custom Entry</option>
              </select>
              {selectedCourse === 'Custom' && (
                <input
                  type="text"
                  placeholder="Enter custom course name"
                  value={customCourse}
                  onChange={(e) => setCustomCourse(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm outline-none dark:text-white"
                />
              )}
            </div>

            <button
              onClick={handleGenerateAISOP}
              disabled={isGenerating}
              className="w-full mt-4 py-4 bg-gradient-to-r from-lyceum-blue to-purple-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 shadow-xl shadow-lyceum-blue/20"
            >
              <Sparkles size={16} className="text-amber-300" />
              {isGenerating ? 'AI Generating...' : 'Draft SOP with AI'}
            </button>
          </div>

          {/* DRAFT PREVIEW PANEL */}
          <div className="flex flex-col gap-4 bg-slate-50 dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2"><FileText size={16} className="text-lyceum-blue" /> SOP Text Editor</span>
              {sopText && (
                <button 
                  onClick={handleSaveSOP} 
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all"
                >
                  Save & Download
                </button>
              )}
            </h3>

            <textarea
              value={sopText}
              onChange={(e) => setSopText(e.target.value)}
              placeholder="Your Statement of Purpose will be generated here. You can edit the text manually before exporting."
              className="w-full h-80 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm outline-none resize-none dark:text-white shadow-inner font-medium leading-relaxed"
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400 font-bold uppercase tracking-wider">
          Please select a student on the left sidebar to generate an SOP
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   3. ID CARD GENERATOR SUB-COMPONENT (WITH TEMPLATE BUILDER & BATCH EXPORT)
   ========================================================================= */
const IDCardGenerator = ({ student, students }: { student: Contact | null; students: Contact[] }) => {
  const [templates, setTemplates] = useState<IDCardTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<IDCardTemplate | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<number[]>([]);
  const [isBuildingTemplate, setIsBuildingTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState<IDCardTemplate>({
    name: '', background_image: '', zones: [], is_default: false
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [selectedZone, setSelectedZone] = useState<IDCardZone | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Load templates on load
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const t = await api.getIDCardTemplates();
        setTemplates(t);
        if (t.length > 0) {
          const def = t.find(x => x.is_default) || t[0];
          setActiveTemplate(def);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchTemplates();
  }, []);

  // Sync batch selected list
  useEffect(() => {
    if (student) {
      setSelectedBatch(prev => prev.includes(student.id) ? prev : [...prev, student.id]);
    }
  }, [student]);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewTemplate({ ...newTemplate, background_image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editorRef.current || !newTemplate.background_image) return;
    const rect = editorRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setStartPoint({ x, y });
    setIsDrawing(true);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !editorRef.current) return;
    const rect = editorRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const x1 = Math.min(startPoint.x, x);
    const y1 = Math.min(startPoint.y, y);
    const w = Math.abs(startPoint.x - x);
    const h = Math.abs(startPoint.y - y);

    if (w > 2 && h > 2) {
      const zone: IDCardZone = {
        id: `zone-${Date.now()}`,
        x: x1, y: y1, width: w, height: h,
        fieldName: 'name',
        fieldType: 'text',
        properties: { fontSize: 12, color: '#000000', alignment: 'center' }
      };
      setNewTemplate({ ...newTemplate, zones: [...newTemplate.zones, zone] });
      setSelectedZone(zone);
    }
    setIsDrawing(false);
  };

  const handleSaveTemplate = async () => {
    if (!newTemplate.name || !newTemplate.background_image) {
      alert('Please specify template name and background design');
      return;
    }
    try {
      const saved = await api.saveIDCardTemplate(newTemplate);
      setTemplates([saved, ...templates.filter(t => t.id !== saved.id)]);
      setActiveTemplate(saved);
      setIsBuildingTemplate(false);
      setNewTemplate({ name: '', background_image: '', zones: [], is_default: false });
      alert('ID Card Template saved successfully!');
    } catch (err: any) {
      console.error(err);
      alert('Failed to save ID Card Template: ' + err.message);
    }
  };

  const handleBatchGenerateIDCards = async () => {
    if (!activeTemplate || selectedBatch.length === 0) {
      alert('Please select a template and at least one student');
      return;
    }

    try {
      const doc = new jsPDF();
      let index = 0;

      for (const studentId of selectedBatch) {
        const student = students.find(s => s.id === studentId);
        if (!student) continue;

        if (index > 0) doc.addPage();

        // Render card background
        doc.addImage(activeTemplate.background_image, 'PNG', 15, 15, 85, 135);

        // Map zones
        activeTemplate.zones.forEach(zone => {
          const zX = 15 + (zone.x / 100) * 85;
          const zY = 15 + (zone.y / 100) * 135;
          const zW = (zone.width / 100) * 85;
          const zH = (zone.height / 100) * 135;

          if (zone.fieldType === 'text') {
            doc.setFontSize(zone.properties.fontSize || 10);
            doc.setTextColor(zone.properties.color || '#000000');
            doc.setFont('helvetica', 'bold');
            
            let val = '';
            if (zone.fieldName === 'name') val = student.name;
            else if (zone.fieldName === 'id') val = `ID: ${student.id}`;
            else if (zone.fieldName === 'course') val = student.degree || 'Student';

            doc.text(val, zX + zW / 2, zY + zH / 2, { align: 'center' });
          } else if (zone.fieldType === 'photo') {
            // Render placeholder or avatar
            doc.setFillColor(230, 230, 230);
            doc.rect(zX, zY, zW, zH, 'F');
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text('[PHOTO]', zX + zW / 2, zY + zH / 2, { align: 'center' });
          }
        });

        index++;
      }

      const pdfBlob = doc.output('blob');
      const filename = `IDCards_Batch_${new Date().toISOString().slice(0, 10)}.pdf`;
      const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });
      
      // Auto-upload for each student in the batch
      for (const studentId of selectedBatch) {
        await api.uploadDocument(studentId, pdfFile, true, 'ID Card');
      }
      
      doc.save(filename);
      alert('Batch ID Cards successfully generated, downloaded, and auto-uploaded to student records!');
    } catch (err: any) {
      console.error(err);
      alert('Failed to batch generate ID Cards: ' + err.message);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">ID Card Template system</h2>
          <p className="text-xs text-gray-400 mt-1">Design bespoke templates and batch generate student ID cards.</p>
        </div>
        <button
          onClick={() => setIsBuildingTemplate(!isBuildingTemplate)}
          className="px-4 py-2 bg-lyceum-blue hover:bg-lyceum-blue/90 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-lyceum-blue/10"
        >
          {isBuildingTemplate ? 'View Templates' : 'Template Builder'}
        </button>
      </div>

      {isBuildingTemplate ? (
        /* TEMPLATE CANVAS BUILDER */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-4">
            <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider">Configure Canvas</h3>
            
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Template Name</label>
              <input
                type="text"
                placeholder="e.g. Student ID 2026"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm outline-none dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Upload ID Card Background Design</label>
              <div className="relative border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-6 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 transition-all cursor-pointer">
                <input type="file" onChange={handleBgUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                <UploadCloud size={32} className="text-gray-400 mb-2" />
                <p className="text-xs text-gray-400 font-bold">PNG or JPG background layout</p>
              </div>
            </div>

            {selectedZone && (
              <div className="bg-slate-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col gap-3">
                <h4 className="font-bold text-xs text-lyceum-blue uppercase tracking-wider">Configure Selected Zone</h4>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedZone.fieldName}
                    onChange={(e) => {
                      const updated = { ...selectedZone, fieldName: e.target.value, fieldType: e.target.value === 'photo' ? 'photo' : 'text' };
                      setSelectedZone(updated);
                      setNewTemplate({ ...newTemplate, zones: newTemplate.zones.map(z => z.id === selectedZone.id ? (updated as any) : z) });
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 rounded-xl text-xs dark:text-white outline-none"
                  >
                    <option value="name">Student Name</option>
                    <option value="id">Student ID</option>
                    <option value="course">Course</option>
                    <option value="photo">Student Photo</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Font Size"
                    value={selectedZone.properties.fontSize}
                    onChange={(e) => {
                      const updated = { ...selectedZone, properties: { ...selectedZone.properties, fontSize: parseInt(e.target.value) } };
                      setSelectedZone(updated);
                      setNewTemplate({ ...newTemplate, zones: newTemplate.zones.map(z => z.id === selectedZone.id ? (updated as any) : z) });
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 rounded-xl text-xs dark:text-white outline-none"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleSaveTemplate}
              className="w-full mt-4 py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-600 shadow-xl shadow-emerald-500/10"
            >
              Save Template
            </button>
          </div>

          {/* VISUAL DRAG-TO-CREATE ZONE CANVAS */}
          <div className="flex flex-col gap-4">
            <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider">Design Canvas</h3>
            <div 
              ref={editorRef}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              className="relative w-full aspect-[5/8] max-w-[280px] border-2 border-dashed border-gray-200 rounded-3xl mx-auto overflow-hidden bg-slate-100 flex items-center justify-center cursor-crosshair shadow-inner"
            >
              {newTemplate.background_image ? (
                <>
                  <img src={newTemplate.background_image} alt="ID Card Background" className="w-full h-full object-cover pointer-events-none" />
                  {newTemplate.zones.map(zone => (
                    <div
                      key={zone.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedZone(zone); }}
                      style={{
                        position: 'absolute',
                        left: `${zone.x}%`,
                        top: `${zone.y}%`,
                        width: `${zone.width}%`,
                        height: `${zone.height}%`,
                        border: selectedZone?.id === zone.id ? '2px solid #2a6f97' : '1px dashed #333',
                        backgroundColor: 'rgba(42, 111, 151, 0.15)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '8px',
                        fontWeight: 'bold',
                        color: '#2a6f97'
                      }}
                    >
                      {zone.fieldName}
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Please upload a background image to draw zones</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* LIST AND BATCH EXPORT PANELS */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* SELECT TEMPLATES */}
          <div className="flex flex-col gap-4">
            <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Layout size={16} className="text-lyceum-blue" /> Choose Template
            </h3>

            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2">
              {templates.length > 0 ? (
                templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTemplate(t)}
                    className={`w-full text-left p-4 rounded-2xl flex items-center justify-between transition-all border ${activeTemplate?.id === t.id ? 'bg-lyceum-blue/5 border-lyceum-blue shadow-inner' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:bg-gray-50'}`}
                  >
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{t.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{t.zones.length} mapped zones</p>
                    </div>
                    {activeTemplate?.id === t.id && <CheckCircle size={18} className="text-lyceum-blue" />}
                  </button>
                ))
              ) : (
                <p className="text-xs text-gray-400 font-bold p-4 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">No templates created. Use the Template Builder to design one!</p>
              )}
            </div>

            {/* Batch Student List Checklist */}
            <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mt-4">
              <CheckCircle size={16} className="text-lyceum-blue" /> 2. Selected Batch ({selectedBatch.length} Students)
            </h3>
            
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-2xl p-3 bg-gray-50 dark:bg-gray-900 shadow-inner">
              {students.map(s => {
                const isChecked = selectedBatch.includes(s.id);
                return (
                  <label key={s.id} className="flex items-center gap-3 p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setSelectedBatch(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]);
                      }}
                      className="rounded text-lyceum-blue focus:ring-lyceum-blue h-4 w-4"
                    />
                    <div>
                      <p className="font-bold text-xs text-gray-900 dark:text-white">{s.name}</p>
                      <p className="text-[9px] text-gray-400">{s.degree || 'Unspecified program'}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <button
              onClick={handleBatchGenerateIDCards}
              className="w-full mt-4 py-4 bg-gradient-to-r from-lyceum-blue to-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 flex items-center justify-center gap-2 shadow-xl shadow-lyceum-blue/10"
            >
              <Download size={16} /> Batch Export Printable PDF
            </button>
          </div>

          {/* ACTIVE TEMPLATE LIVE VISUAL MOCKUP */}
          <div className="flex flex-col gap-4 bg-slate-50 dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider">Layout Preview</h3>
            
            {activeTemplate ? (
              <div className="relative w-full aspect-[5/8] max-w-[240px] rounded-2xl mx-auto overflow-hidden shadow-2xl border border-white/20 bg-white">
                <img src={activeTemplate.background_image} alt="Layout Background" className="w-full h-full object-cover" />
                {activeTemplate.zones.map(zone => (
                  <div
                    key={zone.id}
                    style={{
                      position: 'absolute',
                      left: `${zone.x}%`,
                      top: `${zone.y}%`,
                      width: `${zone.width}%`,
                      height: `${zone.height}%`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '8px',
                      fontWeight: 'bold',
                      color: zone.properties.color || '#333'
                    }}
                  >
                    {zone.fieldName === 'photo' ? (
                      <div className="w-full h-full bg-gray-200 border border-gray-300 flex items-center justify-center text-[7px] text-gray-400">
                        Photo
                      </div>
                    ) : (
                      <span>{zone.fieldName.toUpperCase()}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400 font-bold uppercase tracking-wider border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                Please select or create a template to preview layout
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentGeneratorView;
