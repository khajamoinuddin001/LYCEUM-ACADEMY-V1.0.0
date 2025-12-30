import React, { useState } from 'react';
import type { Contact, StudentCourse, User } from '../types';
import { ArrowLeft, GraduationCap, UserCircle, BookOpen, LayoutDashboard, BookCopy, Cog, CheckCircle2, Circle, Lock } from './icons';

interface StudentProfileViewProps {
  student: Contact;
  user: User;
  onNavigateBack: () => void;
  onUpdateProfile: (userId: number, name: string, email: string) => void;
  onChangePassword: (userId: number, current: string, newPass: string) => Promise<{ success: boolean; message: string; }>;
}

const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number | undefined }> = ({ icon, label, value }) => (
    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg flex items-center">
        <div className="p-2 rounded-full bg-lyceum-blue/10 dark:bg-lyceum-blue/20 text-lyceum-blue mr-4">{icon}</div>
        <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{value || 'N/A'}</p>
        </div>
    </div>
);

const CourseListItem: React.FC<{ course: StudentCourse }> = ({ course }) => {
    const gradeColor = course.grade === 'A' ? 'text-green-600' : course.grade === 'B' ? 'text-blue-600' : 'text-yellow-600';
    return (
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between">
            <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{course.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{course.instructor}</p>
            </div>
            {course.grade === 'In Progress' ? (
                 <span className="text-sm font-medium text-gray-500 dark:text-gray-400">In Progress</span>
            ) : (
                <span className={`text-2xl font-bold ${gradeColor}`}>{course.grade}</span>
            )}
        </div>
    );
};

const OverviewTab: React.FC<{ student: Contact }> = ({ student }) => (
    <div className="p-6 space-y-6">
        <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Enrolled Courses</h3>
            <div className="space-y-3">
                {(student.courses || []).map(course => <CourseListItem key={course.id} course={course} />)}
            </div>
        </div>
    </div>
);

const AcademicsTab: React.FC<{ student: Contact }> = ({ student }) => (
    <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Course History</h3>
        <div className="space-y-4">
            {(student.courses || []).map(course => <CourseListItem key={course.id} course={course} />)}
        </div>
    </div>
);

const SettingsTab: React.FC<Pick<StudentProfileViewProps, 'user' | 'onUpdateProfile' | 'onChangePassword'>> = ({ user, onUpdateProfile, onChangePassword }) => {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [profileMessage, setProfileMessage] = useState('');
    const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    
    const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
    
    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateProfile(user.id, name, email);
        setProfileMessage('Profile updated successfully!');
        setTimeout(() => setProfileMessage(''), 3000);
    };
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);
        if (passwords.newPass !== passwords.confirm) {
            setPasswordMessage({ type: 'error', text: "New passwords do not match." }); return;
        }
        if (passwords.newPass.length < 6) {
            setPasswordMessage({ type: 'error', text: "New password must be at least 6 characters long." }); return;
        }
        const result = await onChangePassword(user.id, passwords.current, passwords.newPass);
        setPasswordMessage({ type: result.success ? 'success' : 'error', text: result.message });
        if (result.success) setPasswords({ current: '', newPass: '', confirm: '' });
    };

    return (
        <div className="p-6 space-y-8">
            <form onSubmit={handleProfileSubmit} className="space-y-4">
                 <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-b dark:border-gray-700 pb-2">Profile Information</h3>
                 <div>
                    <label htmlFor="profile-name" className={labelClasses}>Full Name</label>
                    <input type="text" id="profile-name" value={name} onChange={e => setName(e.target.value)} className={inputClasses} />
                </div>
                <div>
                    <label htmlFor="profile-email" className={labelClasses}>Email Address</label>
                    <input type="email" id="profile-email" value={email} onChange={e => setEmail(e.target.value)} className={inputClasses} />
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-sm text-green-600 transition-opacity duration-300">{profileMessage}</p>
                    <button type="submit" className="px-4 py-2 bg-lyceum-blue text-white rounded-md shadow-sm text-sm font-medium hover:bg-lyceum-blue-dark">Save Changes</button>
                </div>
            </form>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-b dark:border-gray-700 pb-2">Change Password</h3>
                <div>
                    <label htmlFor="current-password" className={labelClasses}>Current Password</label>
                    <input type="password" id="current-password" value={passwords.current} onChange={e => setPasswords(p => ({...p, current: e.target.value}))} className={inputClasses} />
                </div>
                <div>
                    <label htmlFor="new-password" className={labelClasses}>New Password</label>
                    <input type="password" id="new-password" value={passwords.newPass} onChange={e => setPasswords(p => ({...p, newPass: e.target.value}))} className={inputClasses} />
                </div>
                <div>
                    <label htmlFor="confirm-password" className={labelClasses}>Confirm New Password</label>
                    <input type="password" id="confirm-password" value={passwords.confirm} onChange={e => setPasswords(p => ({...p, confirm: e.target.value}))} className={inputClasses} />
                </div>
                <div className="flex items-center justify-between">
                    {passwordMessage && <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{passwordMessage.text}</p>}
                    {!passwordMessage && <div></div>}
                    <button type="submit" className="px-4 py-2 bg-lyceum-blue text-white rounded-md shadow-sm text-sm font-medium hover:bg-lyceum-blue-dark">Update Password</button>
                </div>
            </form>
        </div>
    );
};

const StudentProfileView: React.FC<StudentProfileViewProps> = (props) => {
  const { student, user, onNavigateBack } = props;
  const [activeTab, setActiveTab] = useState<'overview' | 'academics' | 'settings'>('overview');
  
  const checklist = student.checklist || [];
  const completedCount = checklist.filter(item => item.completed).length;
  const totalCount = checklist.length;
  const checklistProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="animate-fade-in">
        <button onClick={onNavigateBack} className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-lyceum-blue mb-4">
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
        </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <main className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 flex items-center">
            {student.avatarUrl ? (
                <img src={student.avatarUrl} alt={student.name} className="w-24 h-24 rounded-full mr-6" />
            ) : (
                <div className="w-24 h-24 rounded-full bg-lyceum-blue flex items-center justify-center text-white text-4xl font-bold mr-6 flex-shrink-0">
                    {getInitials(student.name)}
                </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{student.name}</h1>
              <p className="text-gray-500 dark:text-gray-400">{student.major}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Student ID: {student.contactId}</p>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-4 px-6">
                <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 ${activeTab === 'overview' ? 'border-lyceum-blue text-lyceum-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><LayoutDashboard size={16}/>Overview</button>
                <button onClick={() => setActiveTab('academics')} className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 ${activeTab === 'academics' ? 'border-lyceum-blue text-lyceum-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><BookCopy size={16}/>Academics</button>
                <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 ${activeTab === 'settings' ? 'border-lyceum-blue text-lyceum-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><Cog size={16}/>Settings</button>
            </nav>
          </div>
          {activeTab === 'overview' && <OverviewTab student={student} />}
          {activeTab === 'academics' && <AcademicsTab student={student} />}
          {activeTab === 'settings' && <SettingsTab {...props} />}
        </main>
        
        <aside className="lg:col-span-1 space-y-6">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
                <StatCard icon={<GraduationCap size={20} />} label="Current GPA" value={student.gpa?.toFixed(2)} />
                <StatCard icon={<UserCircle size={20} />} label="Advisor" value={student.advisor} />
                <StatCard icon={<BookOpen size={20} />} label="Courses Enrolled" value={student.courses?.length} />
            </div>
             <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-3">Application Checklist</h3>
                 {checklist.length > 0 ? (
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-lyceum-blue">Progress</span>
                            <span className="text-sm font-medium text-lyceum-blue">{completedCount} of {totalCount} complete</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700"><div className="bg-lyceum-blue h-2.5 rounded-full" style={{ width: `${checklistProgress}%` }}></div></div>
                        <ul className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-2">
                            {checklist.map(item => (
                                <li key={item.id} className="flex items-center text-sm">
                                    {item.completed ? <CheckCircle2 size={16} className="text-green-500 mr-2 flex-shrink-0" /> : <Circle size={16} className="text-gray-300 dark:text-gray-600 mr-2 flex-shrink-0" />}
                                    <span className={`${item.completed ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>{item.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : <p className="text-sm text-gray-500 dark:text-gray-400">Checklist not available.</p>}
            </div>
        </aside>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default StudentProfileView;