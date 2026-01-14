
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/sidebar';
import Header from './components/header';
import AppsGridView from './components/apps_grid_view';
import Dashboard from './components/dashboard';
import DiscussView from './components/discuss_view';
import AppView from './components/app_view';
import TodoView from './hooks/todo_view';
import ContactsView from './components/contacts_view';
import ProfileView from './components/profile_view';
import StudentProfileView from './components/student_profile_view';
import SettingsView from './components/settings_view';
import CalendarView from './components/calendar_view';
import CrmView from './components/crm_view';
import AccountingView from './components/accounting_view';
import ReceptionView from './components/reception_view';
import Loader from './components/loader';
import SearchModal from './components/search_modal';
import QuickCreateModal from './components/quick_create_modal';
import NewContactForm from './components/new_contact_form';
import ContactDocumentsView from './components/contact_documents_view';
import ContactVisaView from './components/contact_visa_view';
import LeadDetailsModal from './components/lead_details_modal';
import NewInvoiceModal from './components/new_invoice_modal';
import NewLeadModal from './components/new_lead_modal';
import NewQuotationPage from './components/new_quotation_modal';
import useLocalStorage from './components/use_local_storage';
import { saveVideo, deleteVideo } from './utils/db';
import * as api from './utils/api';
import type { CalendarEvent, Contact, CrmLead, AccountingTransaction, CrmStage, Quotation, User, UserRole, AppPermissions, ActivityLog, DocumentAnalysisResult, Document as Doc, ChecklistItem, QuotationTemplate, Visitor, TodoTask, PaymentActivityLog, LmsCourse, LmsLesson, LmsModule, Coupon, ContactActivity, ContactActivityAction, DiscussionPost, DiscussionThread, RecordedSession, Channel, Notification } from './types';
import LoginView from './components/login_view';
import StudentDashboard from './components/student_dashboard';
import AccessControlView from './components/access_control_view';
import { DEFAULT_PERMISSIONS, DEFAULT_CHECKLIST } from './components/constants';
import NewStaffModal from './components/new_staff_modal';
import ImpersonationBanner from './components/impersonation_banner';
import DocumentAnalysisModal from './components/document_analysis_modal';
import { analyzeDocument, draftEmail } from './utils/gemini';
import AIEmailComposerModal from './components/aiemail_composer_modal';
import ContactChecklistView from './components/contact_checklist_view';
import NewVisitorModal from './components/new_visitor_modal';
import NewAppointmentModal from './components/new_appointment_modal';
import ContactVisitsView from './components/contact_visits_view';
import ResetPasswordView from './components/reset_password_view';
import ForgotPasswordView from './components/forgot_password_view';
import ResetPasswordForm from './components/reset_password_form';
import LmsView from './components/lms_view';
import CourseDetailView from './components/course_detail_view';
import CourseEditModal from './components/course_edit_modal';
import LessonEditModal from './components/lesson_edit_modal';
import CertificateView from './components/certificate_view';
import PaymentGatewayView from './components/payment_gateway_view';
import LmsPlayerView from './components/lms_player_view';
import EventModal from './components/event_modal';
import LandingPage from './components/landing_page';
import AgentsView from './components/agents_view';
import VisitorDisplay from './components/visitor_display';
import DepartmentDashboard from './components/department_dashboard';
import AttendanceView from './components/attendance_view';


type ContactViewMode = 'details' | 'documents' | 'visaFiling' | 'checklist' | 'visits';

// ... (keep existing imports)
import { Routes, Route } from 'react-router-dom';
import VerifyEmail from './components/verify_email';

// ... (keep existing types)

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useLocalStorage('sidebarOpen', true);
  const [darkMode, setDarkMode] = useLocalStorage<boolean>('darkMode', false);
  const [storedCurrentUser, setStoredCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [impersonatingUser, setImpersonatingUser] = useLocalStorage<User | null>('impersonatingUser', null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeApp, setActiveApp] = useState('Apps');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [paymentActivityLog, setPaymentActivityLog] = useState<PaymentActivityLog[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [transactions, setTransactions] = useState<AccountingTransaction[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [quotationTemplates, setQuotationTemplates] = useState<QuotationTemplate[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [rawEvents, setRawEvents] = useState<CalendarEvent[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [lmsCourses, setLmsCourses] = useState<LmsCourse[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [editingContact, setEditingContact] = useState<Contact | 'new' | null>(null);
  const [contactViewMode, setContactViewMode] = useState<ContactViewMode>('details');
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<CrmLead | 'new' | null>(null);
  const [isNewStaffModalOpen, setIsNewStaffModalOpen] = useState(false);
  const [leadForQuotation, setLeadForQuotation] = useState<CrmLead | null>(null);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [isNewVisitorModalOpen, setIsNewVisitorModalOpen] = useState(false);
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEventInfo, setSelectedEventInfo] = useState<{ event?: CalendarEvent, date?: Date } | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysisResult | null>(null);
  const [analyzedDocument, setAnalyzedDocument] = useState<Doc | null>(null);
  const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [emailTargetContact, setEmailTargetContact] = useState<Contact | null>(null);
  const [activeCourse, setActiveCourse] = useState<LmsCourse | null>(null);
  const [activeLesson, setActiveLesson] = useState<LmsLesson | null>(null);
  const [editingCourse, setEditingCourse] = useState<LmsCourse | 'new' | null>(null);
  const [editingLessonInfo, setEditingLessonInfo] = useState<{ courseId: string; moduleId: string; lesson: LmsLesson | 'new' } | null>(null);
  const [viewingCertificateForCourse, setViewingCertificateForCourse] = useState<LmsCourse | null>(null);
  const [courseToPurchase, setCourseToPurchase] = useState<LmsCourse | null>(null);

  const events = useMemo(() => rawEvents.map(e => ({ ...e, start: new Date(e.start), end: new Date(e.end) })), [rawEvents]);
  const setEvents = (newEvents: CalendarEvent[]) => api.saveEvents(newEvents).then(setRawEvents);
  const currentUser = impersonatingUser || storedCurrentUser;

  // Initialize showLandingPage based on whether there's a stored user
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [initialRegisterMode, setInitialRegisterMode] = useState(false);

  // Effect to sync session storage removed as user wants landing page every time

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Check if user is authenticated
        const token = localStorage.getItem('authToken');
        if (token) {
          try {
            const currentUserData = await api.getCurrentUser();
            setStoredCurrentUser(currentUserData);
          } catch (error) {
            console.error('Failed to refresh session:', error);
            // Only remove token if it's a 401, which api.ts handles usually, but safe to keep check
            if (localStorage.getItem('authToken')) {
              // checking if token is invalid or just network error? 
              // api.getCurrentUser throws if not ok.
              // let's rely on api.ts handling 401 redirect
            }
          }
        }

        if (storedCurrentUser || localStorage.getItem('authToken')) {
          const fetchWithFallback = async (promise: Promise<any>, fallback: any = []) => {
            try {
              return await promise;
            } catch (err) {
              console.error(`Data loading error:`, err);
              return fallback;
            }
          };

          const [
            usersData, activityLogData, paymentLogData, contactsData, transactionsData, leadsData,
            templatesData, visitorsData, tasksData, eventsData, channelsData, couponsData, lmsCoursesData, notificationsData
          ] = await Promise.all([
            fetchWithFallback(api.getUsers()),
            fetchWithFallback(api.getActivityLog()),
            fetchWithFallback(api.getPaymentActivityLog()),
            fetchWithFallback(api.getContacts()),
            fetchWithFallback(api.getTransactions()),
            fetchWithFallback(api.getLeads()),
            fetchWithFallback(api.getQuotationTemplates()),
            fetchWithFallback(api.getVisitors()),
            fetchWithFallback(api.getTasks()),
            fetchWithFallback(api.getEvents()),
            fetchWithFallback(api.getChannels()),
            fetchWithFallback(api.getCoupons()),
            fetchWithFallback(api.getLmsCourses()),
            fetchWithFallback(api.getNotifications())
          ]);
          setUsers(usersData); setActivityLog(activityLogData); setPaymentActivityLog(paymentLogData); setContacts(contactsData); setTransactions(transactionsData);
          setLeads(leadsData); setQuotationTemplates(templatesData); setVisitors(visitorsData); setTasks(tasksData); setRawEvents(eventsData);
          setChannels(channelsData); setCoupons(couponsData); setLmsCourses(lmsCoursesData); setNotifications(notificationsData);
        }
      } catch (error) {
        console.error("Failed to load initial data", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Set default app based on role upon initial load or user change
  useEffect(() => {
    if (!isLoading && currentUser) {
      if (activeApp === 'Apps') {
        if (currentUser.role === 'Student') {
          setActiveApp('student_dashboard');
        } else if (currentUser.role === 'Admin') {
          setActiveApp('dashboard');
        }
      }
    }
  }, [isLoading, currentUser]);

  const filteredNotifications = useMemo(() => {
    if (!currentUser) return [];
    return notifications.filter(n => {
      const forEveryone = !n.recipientUserIds?.length && !n.recipientRoles?.length;
      const forUser = n.recipientUserIds?.includes(currentUser.id);
      const forRole = n.recipientRoles?.includes(currentUser.role);

      if (forEveryone) {
        return currentUser.role !== 'Student';
      }

      return !!(forUser || forRole);
    });
  }, [notifications, currentUser]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [setSidebarOpen]);

  useEffect(() => {
    if (currentUser?.role === 'Student') {
      document.title = `Lyceum Academy | Portal`;
    } else {
      document.title = `Lyceum Academy | ${activeApp}`;
    }
  }, [activeApp, currentUser]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (activeCourse) {
      const freshCourse = lmsCourses.find(c => c.id === activeCourse.id);
      if (freshCourse) {
        setActiveCourse(freshCourse);
      } else {
        setActiveCourse(null);
        setActiveLesson(null);
      }
    }
  }, [lmsCourses, activeCourse]);
  useEffect(() => {
    const handleUnload = () => {
      lmsCourses.forEach(course => {
        course.modules.forEach(module => {
          module.lessons.forEach(lesson => {
            if (lesson.videoUrl && lesson.videoUrl.startsWith('blob:')) {
              URL.revokeObjectURL(lesson.videoUrl);
            }
          });
        });
      });
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [lmsCourses]);

  const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotifications = await api.addNotification(notification);
    setNotifications(newNotifications);
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;
    const newNotifications = await api.markAllNotificationsAsRead(currentUser);
    setNotifications(newNotifications);
  };

  const logActivity = async (action: string) => {
    if (!storedCurrentUser) return;
    const newLog = await api.logActivity(action, storedCurrentUser);
    setActivityLog(newLog);
  };

  const logContactActivity = (contactId: number, action: ContactActivityAction, description: string) => {
    const newActivity: ContactActivity = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action,
      description,
    };

    setContacts(prevContacts => prevContacts.map(c => {
      if (c.id === contactId) {
        const updatedLog = [newActivity, ...(c.activityLog || [])].slice(0, 20);
        const updatedContact = { ...c, activityLog: updatedLog };
        if (editingContact && typeof editingContact !== 'string' && editingContact.id === contactId) {
          setEditingContact(updatedContact);
        }
        api.saveContact(updatedContact, false);
        return updatedContact;
      }
      return c;
    }));
  };

  const handleLogin = async (email: string, password: string, rememberMe: boolean) => {
    try {
      const { user, token } = await api.login(email, password, rememberMe);
      setStoredCurrentUser(user);
      setImpersonatingUser(null);
      if (user.mustResetPassword) {
        return;
      }
      if (user.role === 'Student') {
        setActiveApp('student_dashboard');
      } else if (user.role === 'Staff') {
        setActiveApp('Apps');
      } else {
        setActiveApp('dashboard');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setStoredCurrentUser(null);
    setImpersonatingUser(null);
    setActiveApp('Apps');
    setShowLandingPage(true); // Show landing page after logout
  };

  const handleForgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.error || 'Failed to send reset email' };
      }

      return { success: true, message: data.message };
    } catch (error: any) {
      console.error('Forgot password error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const handleResetPassword = async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.error || 'Failed to reset password' };
      }

      return { success: true, message: data.message };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const handlePasswordReset = async (newPassword: string) => {
    if (!storedCurrentUser) return;

    const updatedUser = { ...storedCurrentUser, password: newPassword, mustResetPassword: false };
    const savedUser = await api.saveUser(updatedUser);

    setUsers(users.map(u => (u.id === savedUser.id ? savedUser : u)));

    setStoredCurrentUser(prev => {
      if (!prev) return null;
      const freshUser = { ...prev, password: newPassword, mustResetPassword: false };
      if (freshUser.role === 'Student') setActiveApp('student_dashboard');
      else if (freshUser.role === 'Staff') setActiveApp('Apps');
      else setActiveApp('dashboard');
      return freshUser;
    });
  };

  const handleRegisterStudent = async (name: string, email: string, password: string, adminKey?: string): Promise<{ success: boolean, message: string }> => {
    try {
      const response = await api.registerStudent(name, email, password, adminKey);
      return response;
    } catch (error: any) {
      return { success: false, message: error.message || 'Registration failed' };
    }
  };

  const handleStartImpersonation = (userToImpersonate: User) => {
    if (storedCurrentUser?.role === 'Admin' && storedCurrentUser.id !== userToImpersonate.id) {
      setImpersonatingUser(userToImpersonate);
      logActivity(`Started impersonating ${userToImpersonate.name}.`);
      if (userToImpersonate.role === 'Student') setActiveApp('student_dashboard');
      else if (userToImpersonate.role === 'Staff') setActiveApp('Apps');
      else setActiveApp('dashboard');
    }
  };

  const handleStopImpersonation = () => {
    if (impersonatingUser) {
      logActivity(`Stopped impersonating ${impersonatingUser.name}.`);
      setImpersonatingUser(null);
      setActiveApp('Access Control');
    }
  };

  const handleAppSelect = (appName: string) => {
    setActiveApp(appName);
    setEditingContact(null);
    setContactViewMode('details');
    setLeadForQuotation(null);
    setEditingQuotation(null);
    setActiveCourse(null);
    setActiveLesson(null);
    setViewingCertificateForCourse(null);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleContactSelect = (contact: Contact) => {
    setEditingContact(contact);
    setContactViewMode('details');
  };

  const handleNewContactClick = () => {
    setEditingContact('new');
    setContactViewMode('details');
  };

  const handleBackToContacts = () => {
    setEditingContact(null);
    setContactViewMode('details');
  };

  const handleSaveContact = async (updatedContact: Contact) => {
    if (currentUser?.role !== 'Admin') {
      if (editingContact === 'new' && !currentUser?.permissions?.['Contacts']?.create) return;
      if (editingContact !== 'new' && !currentUser?.permissions?.['Contacts']?.update) return;
    }

    const isNew = editingContact === 'new';
    const originalContact = isNew ? null : contacts.find(c => c.id === updatedContact.id);

    const savedContact = await api.saveContact(updatedContact, isNew);

    if (isNew) {
      // Refresh contacts from API to ensure we have the latest data
      const freshContacts = await api.getContacts();
      setContacts(freshContacts);
      logContactActivity(savedContact.id, 'created', 'Contact was created.');
      handleBackToContacts();
    } else {
      setContacts(prev => prev.map(c => c.id === savedContact.id ? savedContact : c));
      setEditingContact(savedContact);
      // Log changes
      if (originalContact && originalContact.notes !== savedContact.notes) {
        logContactActivity(savedContact.id, 'note', 'Notes were updated.');
      }
      if (originalContact && originalContact.fileStatus !== savedContact.fileStatus) {
        logContactActivity(savedContact.id, 'status', `Status changed to ${savedContact.fileStatus || 'Not Set'}.`);
      }
    }
  };

  const handleLeadSelect = (lead: CrmLead) => setSelectedLead(lead);
  const handleCloseLeadDetails = () => setSelectedLead(null);

  const handleSaveInvoice = async (newInvoice: Omit<AccountingTransaction, 'id'>) => {
    if (!currentUser?.permissions['Accounting']?.create) return;
    const { transaction: invoiceToAdd, allTransactions } = await api.saveInvoice(newInvoice);
    setTransactions(allTransactions);

    setIsNewInvoiceModalOpen(false);
    addNotification({
      title: 'New Invoice Created',
      description: `Invoice ${invoiceToAdd.id} for ${invoiceToAdd.customerName} has been created.`,
      recipientRoles: ['Admin', 'Staff']
    });

    const newPaymentLog = await api.logPaymentActivity(`Invoice ${invoiceToAdd.id} for ${invoiceToAdd.customerName} was created.`, invoiceToAdd.amount, 'invoice_created');
    setPaymentActivityLog(newPaymentLog);
  };

  const handleNewLeadClick = () => {
    setEditingLead('new');
    setIsNewLeadModalOpen(true);
  };

  const handleEditLeadClick = (lead: CrmLead) => {
    setSelectedLead(null);
    setEditingLead(lead);
    setIsNewLeadModalOpen(true);
  };

  const handleSaveLead = async (leadToSave: Omit<CrmLead, 'id' | 'stage' | 'quotations'> & { id?: number }) => {
    if (currentUser?.role !== 'Admin' && editingLead === 'new' && !currentUser?.permissions['CRM']?.create) {
      addNotification({ title: 'Permission Denied', description: 'You do not have permission to create leads.', type: 'error' });
      return;
    }
    if (currentUser?.role !== 'Admin' && editingLead !== 'new' && !currentUser?.permissions['CRM']?.update) {
      addNotification({ title: 'Permission Denied', description: 'You do not have permission to update leads.', type: 'error' });
      return;
    }

    const isNew = editingLead === 'new';
    const savedLead = await api.saveLead(leadToSave, isNew);

    if (isNew) {
      setLeads(prev => [savedLead, ...prev]);
      addNotification({
        title: 'New Lead Created',
        description: `A new lead "${savedLead.title}" for ${savedLead.company} has been created.`,
        linkTo: { type: 'lead', id: savedLead.id },
        recipientRoles: ['Admin', 'Staff']
      });
    } else {
      setLeads(prev => prev.map(l => l.id === savedLead.id ? savedLead : l));
    }
    setIsNewLeadModalOpen(false);
    setEditingLead(null);
  };

  const handleDeleteLead = async (leadId: number) => {
    console.log('🗑️ handleDeleteLead called for ID:', leadId);
    if (currentUser?.role !== 'Admin' && !currentUser?.permissions['CRM']?.delete) {
      console.log('❌ Permission denied');
      addNotification({ title: 'Permission Denied', description: 'You do not have permission to delete leads.', type: 'error' });
      return;
    }

    if (!window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      console.log('❌ Deletion cancelled by user');
      return;
    }

    try {
      console.log('🚀 Calling api.deleteLead...');
      await api.deleteLead(leadId);
      console.log('✅ api.deleteLead success');
      setLeads(prev => prev.filter(l => l.id !== leadId));
      addNotification({ title: 'Lead Deleted', description: 'The lead has been successfully deleted.', type: 'success' });
      logActivity(`Deleted lead ID ${leadId}`);
    } catch (error) {
      console.error('❌ Failed to delete lead:', error);
      addNotification({ title: 'Error', description: 'Failed to delete lead.', type: 'error' });
    }
  };

  const handleUpdateLeadStage = async (leadId: number, newStage: CrmStage) => {
    if (currentUser?.role !== 'Admin' && !currentUser?.permissions['CRM']?.update) return;
    const updatedLeads = await api.updateLeadStage(leadId, newStage);
    const lead = leads.find(l => l.id === leadId);
    if (lead && newStage === 'Won' && lead.stage !== 'Won') {
      addNotification({
        title: 'Lead Won!',
        description: `Congratulations! The lead "${lead.title}" has been moved to the 'Won' stage.`,
        linkTo: { type: 'lead', id: leadId },
        recipientRoles: ['Admin', 'Staff']
      });
    }
    setLeads(updatedLeads);
  };

  const handleNewQuotationClick = (lead: CrmLead) => {
    setLeadForQuotation(lead);
    setSelectedLead(null);
  };

  const handleEditQuotationClick = (lead: CrmLead, quotation: Quotation) => {
    setLeadForQuotation(lead);
    setEditingQuotation(quotation);
    setSelectedLead(null);
  };

  const handleCancelQuotation = () => {
    setLeadForQuotation(null);
    setEditingQuotation(null);
  };

  const handleSaveQuotation = async (quotationData: Omit<Quotation, 'id' | 'status' | 'date'> | Quotation) => {
    console.log('handleSaveQuotation called', { quotationData, currentUser, leadForQuotation });

    if (currentUser?.role !== 'Admin' && !currentUser?.permissions['CRM']?.create && !currentUser?.permissions['CRM']?.update) {
      console.error('Permission denied: User lacks CRM create/update permissions');
      alert('You do not have permission to save quotations');
      return;
    }

    if (!leadForQuotation) {
      console.error('No lead selected for quotation');
      alert('No lead selected. Please select a lead first.');
      return;
    }

    try {
      console.log('Calling api.saveQuotation...');
      const updatedLeads = await api.saveQuotation(leadForQuotation.id, quotationData);
      console.log('Quotation saved successfully', updatedLeads);
      setLeads(updatedLeads);

      setLeadForQuotation(null);
      setEditingQuotation(null);
      alert('Quotation saved successfully!');
    } catch (error: any) {
      console.error('Error saving quotation:', error);
      alert(`Failed to save quotation: ${error.message || 'Unknown error'}`);
    }
  };

  const handleUpdateUserRole = async (userId: number, role: UserRole) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (userToUpdate) {
      const updatedUsers = await api.updateUserRole(userId, role);
      setUsers(updatedUsers);
      logActivity(`Changed role for ${userToUpdate.name} from ${userToUpdate.role} to ${role}.`);
      addNotification({
        title: 'User Role Updated',
        description: `The role for ${userToUpdate.name} has been changed to ${role}.`,
        recipientRoles: ['Admin']
      });
    }
  };

  const handleUpdateUserPermissions = async (userId: number, permissions: { [key: string]: AppPermissions }) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (userToUpdate) {
      const updatedUsers = await api.updateUserPermissions(userId, permissions);
      setUsers(updatedUsers);
      logActivity(`Updated app permissions for ${userToUpdate.name}.`);
      addNotification({
        title: 'Permissions Updated',
        description: `App permissions for ${userToUpdate.name} have been updated.`,
        recipientRoles: ['Admin']
      });
    }
  };

  const handleAddNewUser = async (newUser: Omit<User, 'id' | 'permissions'>) => {
    if (!currentUser?.permissions['Access Control']?.create) return;
    const { allUsers, addedUser } = await api.addUser(newUser);
    setUsers(allUsers);
    logActivity(`Created new staff member: ${addedUser.name}.`);
    addNotification({
      title: 'New Staff Member',
      description: `${addedUser.name} has been added as a new ${addedUser.role}.`,
      recipientRoles: ['Admin']
    });
  };

  const handleUpdateProfile = async (userId: number, name: string, email: string) => {
    const savedUser = await api.saveUser({ ...users.find(u => u.id === userId)!, name, email });
    setUsers(users.map(u => (u.id === savedUser.id ? savedUser : u)));

    if (storedCurrentUser && storedCurrentUser.id === userId) {
      setStoredCurrentUser(savedUser);
    }
    if (impersonatingUser && impersonatingUser.id === userId) {
      setImpersonatingUser(savedUser);
    }
    logActivity(`Updated profile for ${name}.`);
    addNotification({
      title: 'Profile Updated',
      description: `Your profile information has been successfully updated.`,
      recipientUserIds: [userId]
    });
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean, message: string }> => {
    try {
      const result = await api.changePassword(currentPassword, newPassword);
      if (result.success) {
        logActivity(`Changed password.`);
        addNotification({
          title: 'Password Changed',
          description: 'Your password has been successfully updated.',
          type: 'success'
        });
      }
      return result;
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to change password' };
    }
  };

  const handleSaveQuotationTemplate = async (templateToSave: QuotationTemplate) => {
    const isNew = !templateToSave.id;
    const updatedTemplates = await api.saveQuotationTemplate(templateToSave, isNew);
    setQuotationTemplates(updatedTemplates);

    logActivity(`${isNew ? 'Created' : 'Updated'} quotation template: "${templateToSave.title}".`);
    addNotification({
      title: `Template ${isNew ? 'Created' : 'Updated'}`,
      description: `Quotation template "${templateToSave.title}" has been saved.`,
      recipientRoles: ['Admin', 'Staff']
    });
  };

  const handleDeleteQuotationTemplate = async (templateId: number) => {
    const templateToDelete = quotationTemplates.find(t => t.id === templateId);
    if (templateToDelete) {
      const updatedTemplates = await api.deleteQuotationTemplate(templateId);
      setQuotationTemplates(updatedTemplates);
      logActivity(`Deleted quotation template: "${templateToDelete.title}".`);
      addNotification({
        title: 'Template Deleted',
        description: `Quotation template "${templateToDelete.title}" has been removed.`,
        recipientRoles: ['Admin', 'Staff']
      });
    }
  };

  const handleSaveCoupon = async (couponToSave: Coupon) => {
    const updatedCoupons = await api.saveCoupon(couponToSave);
    setCoupons(updatedCoupons);
    logActivity(`Saved coupon: "${couponToSave.code}".`);
    addNotification({
      title: 'Coupon Saved',
      description: `Coupon code "${couponToSave.code}" has been saved.`,
      recipientRoles: ['Admin']
    });
  };

  const handleDeleteCoupon = async (couponCode: string) => {
    if (window.confirm(`Are you sure you want to delete the coupon "${couponCode}"?`)) {
      const updatedCoupons = await api.deleteCoupon(couponCode);
      setCoupons(updatedCoupons);
      logActivity(`Deleted coupon: "${couponCode}".`);
      addNotification({
        title: 'Coupon Deleted',
        description: `Coupon code "${couponCode}" has been deleted.`,
        recipientRoles: ['Admin']
      });
    }
  };

  const handleAnalyzeDocument = async (doc: Doc) => {
    const DUMMY_DOCUMENT_TEXT = `University Transcript - Alex Johnson...`;
    try {
      const result = await analyzeDocument(DUMMY_DOCUMENT_TEXT);
      setAnalyzedDocument(doc);
      setAnalysisResult(result);
      setIsAnalysisModalOpen(true);
    } catch (error) {
      alert("Failed to analyze document. Please check the console for details.");
    }
  };

  const handleApplyAnalysis = (analysisData: DocumentAnalysisResult) => {
    if (!editingContact || editingContact === 'new') return;

    const summary = Object.entries(analysisData)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
      .join('\n');

    const analysisHeader = `\n\n--- AI Analysis of ${analyzedDocument?.name} (${new Date().toLocaleDateString()}) ---\n`;
    const contactToUpdate = { ...editingContact, notes: (editingContact.notes || '') + analysisHeader + summary };

    handleSaveContact(contactToUpdate);

    logContactActivity(contactToUpdate.id, 'note', `AI analysis from ${analyzedDocument?.name} added to notes.`);
    setIsAnalysisModalOpen(false);
    setAnalysisResult(null);
    setAnalyzedDocument(null);
  };

  const handleGenerateEmailDraft = async (prompt: string, contact: Contact) => {
    setEmailTargetContact(contact);
    setIsEmailComposerOpen(true);
    setEmailDraft('Generating...');
    const draft = await draftEmail(prompt, contact.name);
    setEmailDraft(draft);
  };

  const handleUpdateChecklistItem = (contactId: number, itemId: number, completed: boolean) => {
    if (!currentUser?.permissions['Contacts']?.update) return;

    setContacts(prevContacts => {
      const contact = prevContacts.find(c => c.id === contactId);
      if (contact) {
        const item = contact?.checklist?.find(i => i.id === itemId);
        if (item) {
          if (completed) {
            addNotification({
              title: 'Checklist Item Completed',
              description: `"${item.text}" completed for ${contact.name}.`,
              linkTo: { type: 'contact', id: contactId },
              recipientRoles: ['Admin', 'Staff']
            });
            logContactActivity(contactId, 'checklist', `Checklist item completed: "${item.text}".`);
          }
        }
      }

      const updatedContacts = prevContacts.map(c => {
        if (c.id === contactId && c.checklist) {
          const newChecklist = c.checklist.map(item =>
            item.id === itemId ? { ...item, completed } : item
          );
          const updatedContact = { ...c, checklist: newChecklist };
          if (editingContact && editingContact !== 'new' && editingContact.id === contactId) {
            setEditingContact(updatedContact);
          }
          api.saveContact(updatedContact, false);
          return updatedContact;
        }
        return c;
      });
      return updatedContacts;
    });
  };

  const handleSearchResultSelect = (result: { type: string; id: any }) => {
    setIsSearchOpen(false);
    setNotificationsOpen(false);

    if (result.type === 'app') {
      handleAppSelect(result.id);
    } else if (result.type === 'contact') {
      const selectedContact = contacts.find(c => c.id === result.id);
      if (selectedContact) {
        handleAppSelect('Contacts');
        handleContactSelect(selectedContact);
      }
    } else if (result.type === 'lead') {
      const selectedLead = leads.find(l => l.id === result.id);
      if (selectedLead) {
        handleAppSelect('CRM');
        handleLeadSelect(selectedLead);
      }
    }
  };

  const handleSaveVisitor = async (visitorData: { id?: number; name: string; company: string; host: string; cardNumber: string; purpose?: string; }) => {
    if (currentUser?.role !== 'Admin' && !currentUser?.permissions['Reception']?.create && !visitorData.id) {
      addNotification({ title: 'Permission Denied', description: 'You do not have permission to create visitors.', type: 'error' });
      return;
    }
    if (currentUser?.role !== 'Admin' && visitorData.id && !currentUser?.permissions['Reception']?.update) {
      addNotification({ title: 'Permission Denied', description: 'You do not have permission to update visitors.', type: 'error' });
      return;
    }

    const updatedVisitors = await api.saveVisitor(visitorData);
    setVisitors(updatedVisitors);

    addNotification({
      title: visitorData.id ? 'Visitor Details Updated' : 'Visitor Checked In',
      description: visitorData.id ? `Details for ${visitorData.name} have been updated.` : `${visitorData.name} from ${visitorData.company} has checked in to see ${visitorData.host}.`,
      recipientRoles: ['Admin', 'Staff']
    });

    setIsNewVisitorModalOpen(false);
    setEditingVisitor(null);
  };

  const handleVisitorCheckOut = async (visitorId: number) => {
    if (currentUser?.role !== 'Admin' && !currentUser?.permissions['Reception']?.update) {
      addNotification({ title: 'Permission Denied', description: 'You do not have permission to check out visitors.', type: 'error' });
      return;
    }
    try {
      console.log('Checking out visitor:', visitorId);
      const { allVisitors, checkedOutVisitor } = await api.checkOutVisitor(visitorId);
      console.log('Check-out successful:', checkedOutVisitor);
      setVisitors(allVisitors);
      if (checkedOutVisitor) {
        addNotification({
          title: 'Visitor Checked Out',
          description: `${checkedOutVisitor.name} has checked out.`,
          recipientRoles: ['Admin', 'Staff']
        });
      }
    } catch (error) {
      console.error('Check-out failed:', error);
      alert('Failed to check out visitor: ' + (error instanceof Error ? error.message : 'Unknown error'));
      throw error; // Re-throw so modal can handle it
    }
  };

  const handleScheduleVisitor = async (name: string, company: string, host: string, scheduledCheckIn: string, purpose?: string) => {
    if (currentUser?.role !== 'Admin' && !currentUser?.permissions['Reception']?.create) {
      addNotification({ title: 'Permission Denied', description: 'You do not have permission to schedule visitors.', type: 'error' });
      return;
    }
    const updatedVisitors = await api.scheduleVisitor({ name, company, host, scheduledCheckIn, purpose });
    setVisitors(updatedVisitors);
    addNotification({
      title: 'Visitor Scheduled',
      description: `${name} has been scheduled to visit ${host}.`,
      recipientRoles: ['Admin', 'Staff']
    });
    setIsNewAppointmentModalOpen(false);
    logActivity(`Scheduled visitor ${name} to meet ${host}.`);
  };

  const handleEditVisitor = (visitor: Visitor) => {
    setEditingVisitor(visitor);
    setIsNewVisitorModalOpen(true);
  };

  const handleCheckInScheduledVisitor = async (visitorId: number) => {
    if (currentUser?.role !== 'Admin' && !currentUser?.permissions['Reception']?.update) {
      addNotification({ title: 'Permission Denied', description: 'You do not have permission to check in visitors.', type: 'error' });
      return;
    }
    const { allVisitors, checkedInVisitor } = await api.checkInScheduledVisitor(visitorId);
    setVisitors(allVisitors);
    if (checkedInVisitor) {
      addNotification({
        title: 'Visitor Arrived',
        description: `${checkedInVisitor.name} from ${checkedInVisitor.company} has arrived to see ${checkedInVisitor.host}.`,
        type: 'info'
      });
      logActivity(`Checked in scheduled visitor ${checkedInVisitor.name}.`);
    }
  };

  const handleDeleteVisitor = async (visitorId: number) => {
    if (currentUser?.role !== 'Admin' && !currentUser?.permissions['Reception']?.delete) {
      addNotification({ title: 'Permission Denied', description: 'You do not have permission to delete visitors.', type: 'error' });
      return;
    }
    if (window.confirm('Are you sure you want to delete this visitor?')) {
      const updatedVisitors = await api.deleteVisitor(visitorId);
      setVisitors(updatedVisitors);
      addNotification({ title: 'Visitor Deleted', description: 'The visitor record has been permanently deleted.', type: 'info' });
    }
  };

  const handleRecordPayment = async (transactionId: string) => {
    const { allTransactions, paidTransaction } = await api.recordPayment(transactionId);
    setTransactions(allTransactions);
    if (paidTransaction) {
      addNotification({
        title: 'Payment Recorded',
        description: `Payment for invoice ${paidTransaction.id} (${paidTransaction.customerName}) has been recorded.`,
        recipientRoles: ['Admin', 'Staff']
      });
      const newPaymentLog = await api.logPaymentActivity(`Payment of ₹${paidTransaction.amount.toLocaleString('en-IN')} received for Invoice ${paidTransaction.id}.`, paidTransaction.amount, 'payment_received');
      setPaymentActivityLog(newPaymentLog);
    }
  };
  const handleOpenNewEventModal = (date: Date) => {
    setSelectedEventInfo({ date });
    setIsEventModalOpen(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEventInfo({ event });
    setIsEventModalOpen(true);
  };

  const handleCloseEventModal = () => {
    setIsEventModalOpen(false);
    setSelectedEventInfo(null);
  };

  const handleSaveEvent = async (eventData: Omit<CalendarEvent, 'id'> & { id?: number }) => {
    const updatedEvents = await api.saveEvent(eventData);
    setRawEvents(updatedEvents);
    handleCloseEventModal();
  };

  const handleDeleteEvent = async (eventId: number) => {
    const updatedEvents = await api.deleteEvent(eventId);
    setRawEvents(updatedEvents);
    handleCloseEventModal();
  };
  const handleMarkLessonComplete = (courseId: string, lessonId: string) => {
    if (!currentUser) return;
    const studentContact = contacts.find(c => c.userId === currentUser.id);
    if (!studentContact) return;

    const newProgress = { ...(studentContact.lmsProgress || {}) };
    if (!newProgress[courseId]) newProgress[courseId] = { completedLessons: [] };
    if (!newProgress[courseId].completedLessons.includes(lessonId)) newProgress[courseId].completedLessons.push(lessonId);

    const updatedContact = { ...studentContact, lmsProgress: newProgress };
    handleSaveContact(updatedContact);

    addNotification({
      title: "Lesson Complete!",
      description: `You've completed a lesson in ${activeCourse?.title}. Keep up the great work!`,
      recipientUserIds: [currentUser.id]
    })
  };

  const handleInitiatePurchase = (course: LmsCourse) => {
    setCourseToPurchase(course);
  };

  const handlePurchaseCourse = (courseId: string) => {
    if (!currentUser) return;
    const studentContact = contacts.find(c => c.userId === currentUser.id);
    if (!studentContact) return;
    const courseToEnroll = lmsCourses.find(c => c.id === courseId);
    if (!courseToEnroll) return;

    const newProgress = { ...(studentContact.lmsProgress || {}), [courseId]: { completedLessons: [] } };
    const updatedContact = { ...studentContact, lmsProgress: newProgress };
    handleSaveContact(updatedContact);

    addNotification({
      title: "Enrollment Successful!",
      description: `You have successfully enrolled in "${courseToEnroll.title}". Happy learning!`,
      recipientUserIds: [currentUser.id]
    });
  };

  const handlePaymentSuccess = (courseId: string) => {
    handlePurchaseCourse(courseId);
    setCourseToPurchase(null);
  };

  const handleAddSessionVideo = async (contactId: number, videoBlob: Blob) => {
    if (!currentUser?.permissions['Contacts']?.update) return;

    const newSessionId = Date.now();
    await saveVideo(newSessionId, videoBlob);

    setContacts(prevContacts => prevContacts.map(c => {
      if (c.id === contactId) {
        const newSession: RecordedSession = { id: newSessionId, timestamp: new Date().toISOString() };
        const updatedSessions = [...(c.recordedSessions || []), newSession];
        const updatedContact = { ...c, recordedSessions: updatedSessions };
        if (editingContact && typeof editingContact !== 'string' && editingContact.id === contactId) {
          setEditingContact(updatedContact);
        }
        logContactActivity(contactId, 'video_add', 'A new session was recorded.');
        api.saveContact(updatedContact, false);
        return updatedContact;
      }
      return c;
    }));
  };

  const handleDeleteSessionVideo = async (contactId: number, sessionId: number) => {
    if (!currentUser?.permissions['Contacts']?.update) return;

    await deleteVideo(sessionId);

    setContacts(prevContacts => prevContacts.map(c => {
      if (c.id === contactId) {
        const updatedSessions = c.recordedSessions?.filter(s => s.id !== sessionId);
        const updatedContact = { ...c, recordedSessions: updatedSessions };

        if (editingContact && typeof editingContact !== 'string' && editingContact.id === contactId) {
          setEditingContact(updatedContact);
        }
        logContactActivity(contactId, 'video_remove', 'A recorded session was deleted.');
        api.saveContact(updatedContact, false);
        return updatedContact;
      }
      return c;
    }));
  };
  const handleSaveNote = (lessonId: string, note: string) => {
    const studentContact = contacts.find(c => c.userId === currentUser?.id);
    if (!currentUser || !studentContact) return;

    const updatedContact = { ...studentContact, lmsNotes: { ...(studentContact.lmsNotes || {}), [lessonId]: note } };
    handleSaveContact(updatedContact);
  };

  const handleSaveDiscussionPost = async (courseId: string, threadId: string | 'new', postContent: { title?: string; content: string }) => {
    if (!currentUser) return;
    const updatedCourses = await api.saveDiscussionPost(courseId, threadId, postContent, currentUser);
    setLmsCourses(updatedCourses);
  };

  const handleLmsCourseSave = async (courseData: Omit<LmsCourse, 'id' | 'modules'> | LmsCourse) => {
    const isNew = !('id' in courseData);
    const updatedCourses = await api.saveLmsCourse(courseData, isNew);
    setLmsCourses(updatedCourses);
    setEditingCourse(null);
  };

  const handleLmsCourseDelete = async (courseId: string) => {
    if (window.confirm("Are you sure you want to delete this course and all its content? This cannot be undone.")) {
      const updatedCourses = await api.deleteLmsCourse(courseId);
      setLmsCourses(updatedCourses);
    }
  };

  const handleLmsModuleCreate = async (courseId: string, moduleTitle: string) => {
    if (!moduleTitle.trim()) return;
    const updatedCourses = await api.createLmsModule(courseId, moduleTitle);
    setLmsCourses(updatedCourses);
  };

  const handleLmsModuleUpdate = async (courseId: string, moduleId: string, newTitle: string) => {
    const updatedCourses = await api.updateLmsModule(courseId, moduleId, newTitle);
    setLmsCourses(updatedCourses);
  };

  const handleLmsModuleDelete = async (courseId: string, moduleId: string) => {
    if (window.confirm("Are you sure you want to delete this module and all its lessons?")) {
      const updatedCourses = await api.deleteLmsModule(courseId, moduleId);
      setLmsCourses(updatedCourses);
    }
  };

  const handleLmsLessonSave = async (lessonData: Omit<LmsLesson, 'id' | 'videoUrl'> | LmsLesson) => {
    if (!editingLessonInfo) return;
    const { courseId, moduleId } = editingLessonInfo;
    const isNew = !('id' in lessonData);
    const updatedCourses = await api.saveLmsLesson(courseId, moduleId, lessonData, isNew);
    setLmsCourses(updatedCourses);
    setEditingLessonInfo(null);
  };

  const handleLmsLessonDelete = async (courseId: string, lessonId: string) => {
    if (window.confirm("Are you sure you want to delete this lesson?")) {
      const updatedCourses = await api.deleteLmsLesson(courseId, lessonId);
      setLmsCourses(updatedCourses);
    }
  };

  const handleUpdateLessonVideo = async (courseId: string, lessonId: string, videoUrl: string) => {
    const updatedCourses = await api.updateLessonVideo(courseId, lessonId, videoUrl);
    setLmsCourses(updatedCourses);
  };

  const handleCreateGroupChannel = async (name: string, memberIds: number[]) => {
    if (!currentUser) return;
    const updatedChannels = await api.createGroupChannel(name, memberIds, currentUser);
    setChannels(updatedChannels);
    addNotification({
      title: 'New Group Created',
      description: `You have created the group "${name}".`,
      recipientUserIds: [currentUser.id]
    });
  };

  const handleSaveTask = async (taskData: Omit<TodoTask, 'id'>) => {
    const updatedTasks = await api.saveTask(taskData);
    setTasks(updatedTasks);
    addNotification({
      title: 'New Task Created',
      description: `A new task "${taskData.title}" has been added to your to-do list.`, // Placeholder, need to read end of file first.
      recipientUserIds: [currentUser!.id]
    });
  };

  const handleQuickCreateSave = async (type: 'todo' | 'contact' | 'lead', data: any) => {
    if (type === 'todo') {
      await handleSaveTask({
        title: data.summary,
        description: data.details,
        dueDate: new Date().toISOString().split('T')[0],
        status: 'todo'
      });
    } else if (type === 'contact') {
      const newContact: Contact = {
        id: 0,
        name: data.name,
        email: data.email,
        phone: data.phone,
        contactId: '',
        department: 'Unassigned',
        major: 'Unassigned',
        notes: `Quick created on ${new Date().toLocaleDateString()}.`,
        checklist: DEFAULT_CHECKLIST,
        activityLog: [],
        recordedSessions: [],
      };
      const savedContact = await api.saveContact(newContact, true);
      setContacts(prev => [savedContact, ...prev]);
      logContactActivity(savedContact.id, 'created', 'Contact was created via Quick Create.');

    } else if (type === 'lead') {
      const newLeadData = {
        title: data.company,
        company: data.company,
        contact: data.contact,
        value: parseFloat(data.value) || 0,
      };
      const savedLead = await api.saveLead(newLeadData, true);
      setLeads(prev => [savedLead, ...prev]);
      addNotification({
        title: 'New Lead Created',
        description: `A new lead "${savedLead.title}" for ${savedLead.company} has been created via Quick Create.`,
        linkTo: { type: 'lead', id: savedLead.id },
        recipientRoles: ['Admin', 'Staff']
      });
    }
  };
  const renderAppContent = () => {
    if (!currentUser) return null;
    const studentContact = contacts.find(c => c.userId === currentUser.id);

    if (courseToPurchase) {
      return <PaymentGatewayView course={courseToPurchase} user={currentUser} coupons={coupons} onPaymentSuccess={() => handlePaymentSuccess(courseToPurchase.id)} onCancel={() => setCourseToPurchase(null)} />
    }

    if (viewingCertificateForCourse && studentContact) {
      return <CertificateView course={viewingCertificateForCourse} student={studentContact} onBack={() => setViewingCertificateForCourse(null)} />
    }

    switch (activeApp) {
      case 'Apps': return <AppsGridView onAppSelect={handleAppSelect} user={currentUser} />;
      case 'dashboard': return <Dashboard onNavigateBack={() => handleAppSelect('Apps')} transactions={transactions} user={currentUser} tasks={tasks} onAppSelect={handleAppSelect} paymentActivityLog={paymentActivityLog} contacts={contacts} leads={leads} />;
      case 'Discuss': return <DiscussView user={currentUser} users={users} isMobile={isMobile} channels={channels} setChannels={(value) => api.saveChannels(typeof value === 'function' ? value(channels) : value).then(setChannels)} onCreateGroup={handleCreateGroupChannel} />;
      case 'To-do': return <TodoView tasks={tasks} onSaveTask={handleSaveTask} />;
      case 'LMS':
        const isEnrolled = activeCourse && studentContact && studentContact.lmsProgress?.[activeCourse.id];
        if (isEnrolled) {
          return <LmsPlayerView course={activeCourse} student={studentContact} user={currentUser} users={users} onBack={() => { setActiveCourse(null); setActiveLesson(null); }} onMarkComplete={handleMarkLessonComplete} onSaveNote={handleSaveNote} onSavePost={handleSaveDiscussionPost} />;
        }
        if (activeCourse) {
          return <CourseDetailView course={activeCourse} student={studentContact} contacts={contacts} user={currentUser} users={users} onSelectLesson={() => { }} onBack={() => { setActiveCourse(null); setActiveLesson(null); setViewingCertificateForCourse(null); }} onModuleCreate={handleLmsModuleCreate} onModuleUpdate={handleLmsModuleUpdate} onModuleDelete={handleLmsModuleDelete} onLessonCreate={(moduleId) => setEditingLessonInfo({ courseId: activeCourse.id, moduleId, lesson: 'new' })} onLessonUpdate={(lesson) => setEditingLessonInfo({ courseId: activeCourse.id, moduleId: '', lesson })} onLessonDelete={handleLmsLessonDelete} onViewCertificate={setViewingCertificateForCourse} onInitiatePurchase={handleInitiatePurchase} onSavePost={handleSaveDiscussionPost} />;
        }
        return <LmsView courses={lmsCourses} onCourseSelect={setActiveCourse} user={currentUser} contacts={contacts} onNewCourse={() => setEditingCourse('new')} onEditCourse={setEditingCourse} onDeleteCourse={handleLmsCourseDelete} onInitiatePurchase={handleInitiatePurchase} />;
      case 'Contacts':
        if (editingContact) {
          const contactData = editingContact === 'new' ? undefined : editingContact;
          if (contactData && contactViewMode === 'documents') return <ContactDocumentsView contact={contactData} onNavigateBack={() => setContactViewMode('details')} onAnalyze={handleAnalyzeDocument} />;
          if (contactData && contactViewMode === 'visaFiling') return <ContactVisaView user={currentUser} contact={contactData} onNavigateBack={() => setContactViewMode('details')} onSave={handleSaveContact} />;
          if (contactData && contactViewMode === 'checklist') return <ContactChecklistView user={currentUser} contact={contactData} onNavigateBack={() => setContactViewMode('details')} onUpdateChecklistItem={handleUpdateChecklistItem} onSave={handleSaveContact} />;
          if (contactData && contactViewMode === 'visits') return <ContactVisitsView user={currentUser} contact={contactData} onNavigateBack={() => setContactViewMode('details')} />;

          // Render form if we have data OR if we are creating a new contact
          if (contactData || editingContact === 'new') {
            return <NewContactForm user={currentUser} contact={contactData} contacts={contacts} onNavigateBack={handleBackToContacts} onNavigateToDocuments={() => setContactViewMode('documents')} onNavigateToVisa={() => setContactViewMode('visaFiling')} onNavigateToChecklist={() => setContactViewMode('checklist')} onNavigateToVisits={() => setContactViewMode('visits')} onSave={handleSaveContact} onComposeAIEmail={handleGenerateEmailDraft} onAddSessionVideo={handleAddSessionVideo} onDeleteSessionVideo={handleDeleteSessionVideo} />;
          }
        }
        return <ContactsView contacts={contacts} onContactSelect={handleContactSelect} onNewContactClick={handleNewContactClick} user={currentUser} />;
      case 'Calendar': return <CalendarView events={events} onNewEvent={handleOpenNewEventModal} onSelectEvent={handleSelectEvent} />;
      case 'CRM':
        if (leadForQuotation) {
          return <NewQuotationPage user={currentUser} lead={leadForQuotation} onCancel={handleCancelQuotation} onSave={handleSaveQuotation} templates={quotationTemplates} quotationToEdit={editingQuotation} onSaveTemplate={handleSaveQuotationTemplate} onDeleteTemplate={handleDeleteQuotationTemplate} />;
        }
        return <CrmView user={currentUser} leads={leads} onLeadSelect={handleLeadSelect} onNewLeadClick={handleNewLeadClick} onUpdateLeadStage={handleUpdateLeadStage} onDeleteLead={handleDeleteLead} />;
      case 'Agents':
        return <AgentsView onNavigateBack={() => handleAppSelect('Apps')} />;
      case 'Reception': return <ReceptionView visitors={visitors} onNewVisitorClick={() => setIsNewVisitorModalOpen(true)} onScheduleVisitorClick={() => setIsNewAppointmentModalOpen(true)} onCheckOut={handleVisitorCheckOut} onCheckInScheduled={handleCheckInScheduledVisitor} onEditVisitor={handleEditVisitor} onDeleteVisitor={handleDeleteVisitor} user={currentUser} />;
      case 'Accounting': return <AccountingView user={currentUser} transactions={transactions} onNewInvoiceClick={() => setIsNewInvoiceModalOpen(true)} onRecordPayment={handleRecordPayment} />;
      case 'Profile':
        if (currentUser.role === 'Student' && studentContact) {
          return <StudentProfileView student={studentContact} user={currentUser} onNavigateBack={() => handleAppSelect('student_dashboard')} onUpdateProfile={handleUpdateProfile} onChangePassword={handleChangePassword} />;
        }
        return <ProfileView user={currentUser} onNavigateBack={() => handleAppSelect(currentUser.role === 'Admin' || currentUser.role === 'Staff' ? 'Apps' : 'student_dashboard')} />;
      case 'Settings': return <SettingsView user={currentUser} onNavigateBack={() => handleAppSelect('Apps')} quotationTemplates={quotationTemplates} onSaveTemplate={handleSaveQuotationTemplate} onDeleteTemplate={handleDeleteQuotationTemplate} onUpdateProfile={handleUpdateProfile} onChangePassword={handleChangePassword} darkMode={darkMode} setDarkMode={setDarkMode} coupons={coupons} onSaveCoupon={handleSaveCoupon} onDeleteCoupon={handleDeleteCoupon} courses={lmsCourses} />;
      case 'Access Control': return <AccessControlView users={users} activityLog={activityLog} onUpdateUserRole={handleUpdateUserRole} onUpdateUserPermissions={handleUpdateUserPermissions} onNavigateBack={() => handleAppSelect('Apps')} currentUser={currentUser} onNewStaffClick={() => setIsNewStaffModalOpen(true)} onStartImpersonation={handleStartImpersonation} />;
      case 'Visitor Display': return <VisitorDisplay />;
      case 'Department Dashboard': return <DepartmentDashboard user={currentUser} />;
      case 'Attendance': return <AttendanceView user={currentUser} />;
      default: return <AppView appName={activeApp} onNavigateBack={() => handleAppSelect('Apps')} />;
    }
  }

  if (isLoading) {
    return <Loader />;
  }



  // Password reset check - only if user is logged in
  if (storedCurrentUser && storedCurrentUser.mustResetPassword) {
    return <ResetPasswordView user={storedCurrentUser} onReset={handlePasswordReset} />;
  }

  const studentContact = contacts.find(c => c.userId === currentUser?.id);

  // Show loader while data is loading - but only if user is authenticated
  if (isLoading && currentUser) {
    return <Loader />;
  }

  // Show landing page if not logged in and landing page not dismissed
  if (!currentUser && showLandingPage) {
    return <LandingPage
      onLogin={() => {
        setInitialRegisterMode(false);
        setShowLandingPage(false);
      }}
      onRegister={() => {
        setInitialRegisterMode(true);
        setShowLandingPage(false);
      }}
    />;
  }

  // Show login/reset password views
  if (!currentUser) {
    // Check for reset token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');

    if (resetToken) {
      return (
        <ResetPasswordForm
          token={resetToken}
          onReset={handleResetPassword}
          onBackToLogin={() => {
            window.history.pushState({}, '', window.location.pathname);
            setActiveApp('Login');
          }}
        />
      );
    }

    if (activeApp === 'ForgotPassword') {
      return (
        <ForgotPasswordView
          onBack={() => setActiveApp('Login')}
          onSubmit={handleForgotPassword}
        />
      );
    }
    if (activeApp === 'ResetPassword') {
      return <ResetPasswordView onBack={() => setActiveApp('Login')} />;
    }
    return <LoginView onLogin={handleLogin} users={users} onRegister={handleRegisterStudent} onForgotPassword={() => setActiveApp('ForgotPassword')} onBackToLanding={() => setShowLandingPage(true)} initialIsRegister={initialRegisterMode} />;
  }

  return (
    <div className="flex h-screen bg-lyceum-light dark:bg-gray-900 font-sans overflow-hidden">
      {impersonatingUser && <ImpersonationBanner userName={impersonatingUser.name} onStop={handleStopImpersonation} />}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} activeApp={activeApp} onAppSelect={handleAppSelect} isMobile={isMobile} user={currentUser} onLogout={handleLogout} />
      <div className={`flex-1 flex flex-col overflow-hidden ${impersonatingUser ? 'pt-10' : ''}`}>
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeApp={activeApp} onAppSelect={handleAppSelect} onSearchClick={() => setIsSearchOpen(true)} onQuickCreateClick={() => setIsQuickCreateOpen(true)} user={currentUser} onLogout={handleLogout} notifications={filteredNotifications} onMarkAllNotificationsAsRead={markAllAsRead} onNotificationClick={handleSearchResultSelect} notificationsOpen={notificationsOpen} setNotificationsOpen={setNotificationsOpen} darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-lyceum-light dark:bg-gray-800 p-3 md:p-6">
          {currentUser.role === 'Student' ? (
            (() => { // Use an IIFE to allow if/return inside JSX
              if (activeApp === 'student_dashboard' || activeApp === 'dashboard') {
                // Robustly find the student contact
                console.log('🔍 [Student Dashboard] Looking for contact...');
                console.log('Current User ID:', currentUser.id);
                console.log('Current User Email:', currentUser.email);
                console.log('Total Contacts:', contacts.length);

                const studentContact = contacts.find(c =>
                  c.userId === currentUser.id ||
                  (c.email && currentUser.email && c.email.toLowerCase() === currentUser.email.toLowerCase())
                );

                console.log('Found Student Contact:', studentContact ? `Yes (ID: ${studentContact.id})` : 'No');
                if (!studentContact) {
                  console.log('Available contact user IDs:', contacts.map(c => ({ id: c.id, userId: c.userId, email: c.email })));
                }

                return <StudentDashboard student={studentContact} courses={lmsCourses} events={events} onAppSelect={handleAppSelect} />;
              }
              return renderAppContent();
            })()
          ) : (
            renderAppContent()
          )}
        </main>
      </div>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} contacts={contacts} leads={leads} onResultSelect={handleSearchResultSelect} />
      <QuickCreateModal isOpen={isQuickCreateOpen} onClose={() => setIsQuickCreateOpen(false)} onSave={handleQuickCreateSave} />

      {currentUser.role !== 'Student' && (
        <>
          <NewInvoiceModal isOpen={isNewInvoiceModalOpen} onClose={() => setIsNewInvoiceModalOpen(false)} onSave={handleSaveInvoice} contacts={contacts} user={currentUser} />
          <NewLeadModal isOpen={isNewLeadModalOpen} onClose={() => { setIsNewLeadModalOpen(false); setEditingLead(null); }} onSave={handleSaveLead} lead={editingLead === 'new' ? undefined : editingLead} agents={users.filter(u => u.role !== 'Student').map(u => u.name)} user={currentUser} />
          <LeadDetailsModal lead={selectedLead} onClose={handleCloseLeadDetails} onEdit={handleEditLeadClick} onNewQuotation={handleNewQuotationClick} onEditQuotation={handleEditQuotationClick} user={currentUser} />
          <NewStaffModal isOpen={isNewStaffModalOpen} onClose={() => setIsNewStaffModalOpen(false)} onSave={handleAddNewUser} user={currentUser} />
          <NewVisitorModal isOpen={isNewVisitorModalOpen} onClose={() => { setIsNewVisitorModalOpen(false); setEditingVisitor(null); }} onSave={handleSaveVisitor} visitorToEdit={editingVisitor} staff={users.filter(u => u.role === 'Admin' || u.role === 'Staff')} user={currentUser} contacts={contacts} />
          <NewAppointmentModal isOpen={isNewAppointmentModalOpen} onClose={() => setIsNewAppointmentModalOpen(false)} onSave={handleScheduleVisitor} staff={users.filter(u => u.role === 'Admin' || u.role === 'Staff')} user={currentUser} />
          <DocumentAnalysisModal isOpen={isAnalysisModalOpen} onClose={() => setIsAnalysisModalOpen(false)} onApply={handleApplyAnalysis} result={analysisResult} documentName={analyzedDocument?.name || ''} />
          <AIEmailComposerModal isOpen={isEmailComposerOpen} onClose={() => { setIsEmailComposerOpen(false); setEmailDraft(''); setEmailTargetContact(null); }} onGenerate={(prompt) => emailTargetContact && handleGenerateEmailDraft(prompt, emailTargetContact)} draft={emailDraft} contactName={emailTargetContact?.name || ''} />
          {isEventModalOpen && (<EventModal isOpen={isEventModalOpen} onClose={handleCloseEventModal} onSave={handleSaveEvent} onDelete={handleDeleteEvent} eventInfo={selectedEventInfo} user={currentUser} />)}
          {editingCourse && (<CourseEditModal course={editingCourse === 'new' ? null : editingCourse} onClose={() => setEditingCourse(null)} onSave={handleLmsCourseSave} />)}
          {editingLessonInfo && (<LessonEditModal lesson={editingLessonInfo.lesson === 'new' ? null : editingLessonInfo.lesson} onClose={() => setEditingLessonInfo(null)} onSave={handleLmsLessonSave} />)}
        </>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/*" element={<DashboardLayout />} />
    </Routes>
  );
};

export default App;
