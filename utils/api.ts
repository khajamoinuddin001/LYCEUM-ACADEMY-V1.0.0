import type { CalendarEvent, Contact, CrmLead, AccountingTransaction, CrmStage, Quotation, User, UserRole, AppPermissions, ActivityLog, DocumentAnalysisResult, Document as Doc, ChecklistItem, QuotationTemplate, Visitor, TodoTask, Ticket, PaymentActivityLog, LmsCourse, LmsLesson, LmsModule, Coupon, ContactActivity, ContactActivityAction, DiscussionPost, DiscussionThread, RecordedSession, Channel, Notification } from '../types';
import { DEFAULT_PERMISSIONS, DEFAULT_CHECKLIST } from '../components/constants';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Get auth token from storage
export function getToken(): string | null {
  // Check localStorage first
  const localData = localStorage.getItem('authToken');
  if (localData) {
    try {
      const { token, expiry } = JSON.parse(localData);
      if (expiry && Date.now() > expiry) {
        localStorage.removeItem('authToken');
        return null;
      }
      return token;
    } catch (e) {
      // Handle legacy plain string tokens
      return localData;
    }
  }

  // Check sessionStorage
  return sessionStorage.getItem('authToken');
}

// Set auth token
function setToken(token: string, remember: boolean = true): void {
  if (remember) {
    const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    localStorage.setItem('authToken', JSON.stringify({ token, expiry }));
    sessionStorage.removeItem('authToken');
  } else {
    sessionStorage.setItem('authToken', token);
    localStorage.removeItem('authToken');
  }
}

// Remove auth token
function removeToken(): void {
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('authToken');
}

// API request helper
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      removeToken();
      window.location.href = '/';
    }
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth functions
export const login = async (email: string, password: string, remember: boolean = true): Promise<{ user: User; token: string }> => {
  const data = await apiRequest<{ user: User; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token, remember);
  return data;
};

export const registerStudent = async (name: string, email: string, password: string, adminKey?: string): Promise<{ success: boolean; message: string }> => {
  return apiRequest<{ success: boolean; message: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, ...(adminKey && { adminKey }) }),
  });
};

export const getCurrentUser = async (): Promise<User> => {
  const data = await apiRequest<{ user: User }>('/auth/me');
  return data.user;
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  return apiRequest('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
};

export const createUser = async (name: string, email: string, role: string, permissions: any): Promise<{ success: boolean; user: User; temporaryPassword: string }> => {
  return apiRequest('/auth/create-user', {
    method: 'POST',
    body: JSON.stringify({ name, email, role, permissions }),
  });
};

export const deleteUser = async (userId: number): Promise<{ success: boolean; message: string }> => {
  return apiRequest(`/users/${userId}`, {
    method: 'DELETE',
  });
};



// Users
export const getUsers = async (): Promise<User[]> => {
  return apiRequest<User[]>('/users');
};

export const saveUser = async (userToSave: User): Promise<User> => {
  if (userToSave.id) {
    return apiRequest<User>(`/users/${userToSave.id}`, {
      method: 'PUT',
      body: JSON.stringify(userToSave),
    });
  } else {
    return apiRequest<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userToSave),
    });
  }
};

export const updateUserRole = async (userId: number, role: UserRole): Promise<User[]> => {
  await apiRequest(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ role, permissions: DEFAULT_PERMISSIONS[role] || {} }),
  });
  return getUsers();
};

export const updateUserPermissions = async (userId: number, permissions: { [key: string]: AppPermissions }): Promise<User[]> => {
  await apiRequest(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ permissions }),
  });
  return getUsers();
};

export const addUser = async (newUser: Omit<User, 'id' | 'permissions'>): Promise<{ allUsers: User[]; addedUser: User }> => {
  const addedUser = await apiRequest<User>('/users', {
    method: 'POST',
    body: JSON.stringify(newUser),
  });
  const allUsers = await getUsers();
  return { allUsers, addedUser };
};

// Document endpoints
export const uploadDocument = async (contactId: number, file: File, isPrivate: boolean = false): Promise<any> => {
  const formData = new FormData();
  formData.append('contactId', contactId.toString());
  formData.append('file', file);
  formData.append('isPrivate', isPrivate.toString());

  const token = getToken();
  const headers: HeadersInit = {
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  const response = await fetch(`${API_BASE_URL}/documents`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to upload document' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
};

export const getContactDocuments = async (contactId: number): Promise<any> => {
  return apiRequest(`/contacts/${contactId}/documents`);
};

export const downloadDocument = async (documentId: number, filename: string): Promise<void> => {
  const token = getToken();
  const headers: HeadersInit = {
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
    headers,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to download document' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const deleteDocument = async (documentId: number): Promise<void> => {
  return apiRequest(`/documents/${documentId}`, {
    method: 'DELETE',
  });
};

// Contacts
export const getContacts = async (): Promise<Contact[]> => {
  return apiRequest<Contact[]>('/contacts');
};

export const saveContact = async (contactToSave: Contact, isNew: boolean): Promise<Contact> => {
  if (isNew) {
    return apiRequest<Contact>('/contacts', {
      method: 'POST',
      body: JSON.stringify(contactToSave),
    });
  } else {
    return apiRequest<Contact>(`/contacts/${contactToSave.id}`, {
      method: 'PUT',
      body: JSON.stringify(contactToSave),
    });
  }
};

export const mergeContacts = async (primaryId: number, targetId: number): Promise<{ success: boolean; mergedContact: Contact; recordsUpdated: any }> => {
  return apiRequest(`/contacts/${primaryId}/merge`, {
    method: 'POST',
    body: JSON.stringify({ targetContactId: targetId }),
  });
};

// Leads
export const getLeads = async (): Promise<CrmLead[]> => {
  return apiRequest<CrmLead[]>('/leads');
};

export const saveLead = async (leadToSave: Omit<CrmLead, 'id' | 'stage'> & { id?: number }, isNew: boolean): Promise<CrmLead> => {
  if (isNew) {
    return apiRequest<CrmLead>('/leads', {
      method: 'POST',
      body: JSON.stringify({ ...leadToSave, stage: 'New', quotations: [] }),
    });
  } else {
    return apiRequest<CrmLead>(`/leads/${leadToSave.id}`, {
      method: 'PUT',
      body: JSON.stringify(leadToSave),
    });
  }
};

export const deleteLead = async (leadId: number): Promise<void> => {
  await apiRequest(`/leads/${leadId}`, { method: 'DELETE' });
};

export const updateLeadStage = async (leadId: number, newStage: CrmStage): Promise<CrmLead[]> => {
  const lead = await apiRequest<CrmLead>(`/leads/${leadId}`, { method: 'GET' });
  await apiRequest(`/leads/${leadId}`, {
    method: 'PUT',
    body: JSON.stringify({ ...lead, stage: newStage }),
  });
  return getLeads();
};

export const saveQuotation = async (leadId: number, quotationData: Omit<Quotation, 'id' | 'status' | 'date'> | Quotation): Promise<CrmLead[]> => {
  const lead = await apiRequest<CrmLead>(`/leads/${leadId}`, { method: 'GET' });
  const isEditing = 'id' in quotationData;
  const quotations = lead.quotations || [];

  let updatedQuotations;
  if (isEditing) {
    updatedQuotations = quotations.map(q => q.id === quotationData.id ? { ...q, ...quotationData, status: 'Draft' as const } : q);
  } else {
    const newQuotation: Quotation = { ...quotationData, id: Date.now(), status: 'Draft', date: new Date().toISOString().split('T')[0] };
    updatedQuotations = [...quotations, newQuotation];
  }

  await apiRequest(`/leads/${leadId}`, {
    method: 'PUT',
    body: JSON.stringify({ ...lead, quotations: updatedQuotations }),
  });
  return getLeads();
};

// Accept quotation (student action)
export const acceptQuotation = async (quotationId: number): Promise<void> => {
  // Find the lead and quotation
  const leads = await getLeads();
  let targetLead: CrmLead | null = null;
  let quotationIndex = -1;

  for (const lead of leads) {
    const index = (lead.quotations || []).findIndex(q => q.id === quotationId);
    if (index !== -1) {
      targetLead = lead;
      quotationIndex = index;
      break;
    }
  }

  if (!targetLead || quotationIndex === -1) {
    throw new Error('Quotation not found');
  }

  const quotations = [...(targetLead.quotations || [])];
  const quotation = quotations[quotationIndex];

  // Update quotation with student acceptance
  quotations[quotationIndex] = {
    ...quotation,
    studentAccepted: true,
    studentAcceptedAt: new Date().toISOString(),
    // Check if lead is Won - if yes, mark as Agreed, otherwise Accepted by Student
    status: targetLead.stage === 'Won' ? 'Agreed' : 'Accepted by Student'
  };

  await apiRequest(`/leads/${targetLead.id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...targetLead, quotations }),
  });

  // If both conditions met (student accepted + Won), create AR entry
  if (targetLead.stage === 'Won') {
    await createAccountsReceivable(targetLead.id, quotationId);
  }
};

// Mark quotation as accepted (staff action for offline acceptance)
export const markQuotationAccepted = async (leadId: number, quotationId: number): Promise<CrmLead[]> => {
  const lead = await apiRequest<CrmLead>(`/leads/${leadId}`, { method: 'GET' });
  const quotations = [...(lead.quotations || [])];
  const quotationIndex = quotations.findIndex(q => q.id === quotationId);

  if (quotationIndex === -1) {
    throw new Error('Quotation not found');
  }

  quotations[quotationIndex] = {
    ...quotations[quotationIndex],
    studentAccepted: true,
    studentAcceptedAt: new Date().toISOString(),
    status: lead.stage === 'Won' ? 'Agreed' : 'Accepted by Student'
  };

  await apiRequest(`/leads/${leadId}`, {
    method: 'PUT',
    body: JSON.stringify({ ...lead, quotations }),
  });

  // If both conditions met, create AR
  if (lead.stage === 'Won') {
    await createAccountsReceivable(leadId, quotationId);
  }

  return getLeads();
};

// Update quotation status to In Review (when sharing with student)
export const shareQuotation = async (leadId: number, quotationId: number): Promise<CrmLead[]> => {
  const lead = await apiRequest<CrmLead>(`/leads/${leadId}`, { method: 'GET' });
  const quotations = [...(lead.quotations || [])];
  const quotationIndex = quotations.findIndex(q => q.id === quotationId);

  if (quotationIndex === -1) {
    throw new Error('Quotation not found');
  }

  quotations[quotationIndex] = {
    ...quotations[quotationIndex],
    status: 'In Review'
  };

  await apiRequest(`/leads/${leadId}`, {
    method: 'PUT',
    body: JSON.stringify({ ...lead, quotations }),
  });

  return getLeads();
};

// Create Accounts Receivable entry
const createAccountsReceivable = async (leadId: number, quotationId: number): Promise<void> => {
  const lead = await apiRequest<CrmLead>(`/leads/${leadId}`, { method: 'GET' });
  const quotation = (lead.quotations || []).find(q => q.id === quotationId);

  if (!quotation) {
    throw new Error('Quotation not found');
  }

  // Get contact from lead
  const contacts = await getContacts();
  const contact = contacts.find(c => c.name === lead.contact || c.email === lead.email);

  if (!contact) {
    throw new Error('Contact not found');
  }

  // Create AR entry (stored in contact metadata for now)
  const arEntry = {
    id: Date.now(),
    quotationId: quotation.id,
    quotationRef: quotation.quotationNumber || `QUO-${quotation.id}`,
    leadId: lead.id,
    totalAmount: quotation.total,
    paidAmount: 0,
    remainingAmount: quotation.total,
    status: 'Outstanding',
    createdAt: new Date().toISOString(),
    agreedAt: new Date().toISOString()
  };

  // Store AR in contact metadata (using type assertion for metadata)
  const updatedContact = {
    ...contact,
    metadata: {
      ...((contact as any).metadata || {}),
      accountsReceivable: [...(((contact as any).metadata?.accountsReceivable as any[]) || []), arEntry]
    }
  } as Contact;

  await apiRequest(`/contacts/${contact.id}`, {
    method: 'PUT',
    body: JSON.stringify(updatedContact),
  });
};

// Transactions
export const getTransactions = async (): Promise<AccountingTransaction[]> => {
  return apiRequest<AccountingTransaction[]>('/transactions');
};

export const saveTransaction = async (newTransaction: Omit<AccountingTransaction, 'id'>): Promise<{ transaction: AccountingTransaction; allTransactions: AccountingTransaction[] }> => {
  const transaction = await apiRequest<AccountingTransaction>('/transactions', {
    method: 'POST',
    body: JSON.stringify(newTransaction),
  });
  const allTransactions = await getTransactions();
  return { transaction, allTransactions };
};

export const saveInvoice = saveTransaction; // Alias for backward compatibility

export const updateTransaction = async (id: string, updates: Partial<AccountingTransaction>): Promise<{ transaction: AccountingTransaction; allTransactions: AccountingTransaction[] }> => {
  const transaction = await apiRequest<AccountingTransaction>(`/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  const allTransactions = await getTransactions();
  return { transaction, allTransactions };
};

export const deleteTransaction = async (id: string): Promise<AccountingTransaction[]> => {
  await apiRequest<{ success: boolean }>(`/transactions/${id}`, { method: 'DELETE' });
  return getTransactions();
};

export const recordPayment = async (id: string): Promise<{ allTransactions: AccountingTransaction[]; paidTransaction?: AccountingTransaction }> => {
  const transaction = await apiRequest<AccountingTransaction>(`/transactions/${id}`, { method: 'GET' });
  const { transaction: paidTransaction, allTransactions } = await updateTransaction(id, { ...transaction, status: 'Paid' });
  return { allTransactions, paidTransaction };
};

// Events
export const getEvents = async (): Promise<CalendarEvent[]> => {
  return apiRequest<CalendarEvent[]>('/events');
};

// User management
export const updateUser = async (userId: number, updates: Partial<User>): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(updates)
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update user' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
};
// Attendance API
export const checkIn = async (location?: { lat: number; lng: number }) => {
  return await apiRequest('/attendance/check-in', {
    method: 'POST',
    body: JSON.stringify(location || {})
  });
};

export const checkOut = async (location?: { lat: number; lng: number }) => {
  return await apiRequest('/attendance/check-out', {
    method: 'POST',
    body: JSON.stringify(location || {})
  });
};

export const getAttendanceHistory = async () => {
  return await apiRequest('/attendance/me', { method: 'GET' });
};

export const getHolidays = async () => {
  return await apiRequest('/holidays', { method: 'GET' });
};

export const saveHoliday = async (holiday: { date: string; description: string }) => {
  return await apiRequest('/holidays', {
    method: 'POST',
    body: JSON.stringify(holiday)
  });
};

export const deleteHoliday = async (id: number) => {
  return await apiRequest(`/holidays/${id}`, { method: 'DELETE' });
};

export const getPayrollReport = async (month: number, year: number) => {
  return await apiRequest(`/attendance/payroll?month=${month}&year=${year}`, { method: 'GET' });
};

export const saveOfficeLocation = async (location: { lat: number; lng: number }) => {
  return await apiRequest('/settings/office-location', {
    method: 'POST',
    body: JSON.stringify(location)
  });
};

export const getOfficeLocation = async () => {
  return await apiRequest<{ lat: number; lng: number } | null>('/settings/office-location', { method: 'GET' });
};

export const applyLeave = async (leave: { startDate: string; endDate: string; reason: string }) => {
  return await apiRequest('/leaves', {
    method: 'POST',
    body: JSON.stringify(leave)
  });
};

export const getLeaves = async () => {
  return await apiRequest('/leaves', { method: 'GET' });
};

export const updateLeaveStatus = async (id: number, status: 'Approved' | 'Rejected') => {
  return await apiRequest(`/leaves/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
};

export const saveEvents = async (events: CalendarEvent[]): Promise<CalendarEvent[]> => {
  // Save each event individually
  for (const event of events) {
    if (event.id) {
      await apiRequest(`/events/${event.id}`, {
        method: 'PUT',
        body: JSON.stringify(event),
      });
    } else {
      await apiRequest('/events', {
        method: 'POST',
        body: JSON.stringify(event),
      });
    }
  }
  return getEvents();
};

export const saveEvent = async (eventData: Omit<CalendarEvent, 'id'> & { id?: number }): Promise<CalendarEvent[]> => {
  if (eventData.id) {
    await apiRequest(`/events/${eventData.id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  } else {
    await apiRequest('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }
  return getEvents();
};

export const deleteEvent = async (eventId: number): Promise<CalendarEvent[]> => {
  await apiRequest(`/events/${eventId}`, { method: 'DELETE' });
  return getEvents();
};

// Tasks
export const getTasks = async (filters?: { userId?: number; all?: boolean }): Promise<TodoTask[]> => {
  const params = new URLSearchParams();
  if (filters?.userId) params.append('userId', filters.userId.toString());
  if (filters?.all) params.append('all', 'true');

  const queryString = params.toString();
  return apiRequest<TodoTask[]>(`/tasks${queryString ? `?${queryString}` : ''}`);
};

export const saveTask = async (task: Partial<TodoTask>): Promise<TodoTask> => {
  if (task.id) {
    return apiRequest<TodoTask>(`/tasks/${task.id}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    });
  } else {
    return apiRequest<TodoTask>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }
};

export const deleteTask = async (taskId: number): Promise<void> => {
  await apiRequest(`/tasks/${taskId}`, { method: 'DELETE' });
};

// ===== TICKETS API =====

export const getTickets = async (): Promise<Ticket[]> => {
  return apiRequest<Ticket[]>('/tickets');
};

export const getTicket = async (ticketId: number): Promise<Ticket> => {
  return apiRequest<Ticket>(`/tickets/${ticketId}`);
};

export const createTicket = async (ticketData: {
  contactId: number;
  subject: string;
  description: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
}): Promise<Ticket> => {
  return apiRequest<Ticket>('/tickets', {
    method: 'POST',
    body: JSON.stringify(ticketData),
  });
};

export const updateTicket = async (ticketId: number, updates: {
  status?: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignedTo?: number;
  resolutionNotes?: string;
}): Promise<Ticket> => {
  return apiRequest<Ticket>(`/tickets/${ticketId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

export const deleteTicket = async (ticketId: number): Promise<void> => {
  await apiRequest(`/tickets/${ticketId}`, { method: 'DELETE' });
};

// ===== END TICKETS API =====

export const getStaffMembers = async (): Promise<{ id: number; name: string; role: string }[]> => {
  return apiRequest('/staff-members');
};

// Channels
export const getChannels = async (): Promise<Channel[]> => {
  return apiRequest<Channel[]>('/channels');
};

export const saveChannels = async (channels: Channel[]): Promise<Channel[]> => {
  // Save each channel individually
  for (const channel of channels) {
    if (channel.id) {
      await apiRequest(`/channels/${channel.id}`, {
        method: 'PUT',
        body: JSON.stringify(channel),
      });
    } else {
      await apiRequest('/channels', {
        method: 'POST',
        body: JSON.stringify(channel),
      });
    }
  }
  return getChannels();
};

export const createGroupChannel = async (name: string, memberIds: number[], user: User): Promise<Channel[]> => {
  await apiRequest('/channels', {
    method: 'POST',
    body: JSON.stringify({
      name,
      type: 'public',
      members: Array.from(new Set([...memberIds, user.id])),
      messages: [{ id: Date.now(), author: 'System', avatar: 'System', text: `${user.name} created the group "${name}".`, timestamp: new Date().toISOString() }],
    }),
  });
  return getChannels();
};

// Coupons
export const getCoupons = async (): Promise<Coupon[]> => {
  return apiRequest<Coupon[]>('/coupons');
};

export const saveCoupon = async (coupon: Coupon): Promise<Coupon[]> => {
  await apiRequest('/coupons', {
    method: 'POST',
    body: JSON.stringify(coupon),
  });
  return getCoupons();
};

export const deleteCoupon = async (code: string): Promise<Coupon[]> => {
  await apiRequest(`/coupons/${code}`, { method: 'DELETE' });
  return getCoupons();
};

// LMS Courses
export const getLmsCourses = async (): Promise<LmsCourse[]> => {
  return apiRequest<LmsCourse[]>('/lms-courses');
};

export const saveLmsCourses = async (courses: LmsCourse[]): Promise<LmsCourse[]> => {
  for (const course of courses) {
    await apiRequest('/lms-courses', {
      method: 'POST',
      body: JSON.stringify(course),
    });
  }
  return getLmsCourses();
};

export const saveLmsCourse = async (courseData: any, isNew: boolean): Promise<LmsCourse[]> => {
  await apiRequest('/lms-courses', {
    method: 'POST',
    body: JSON.stringify(courseData),
  });
  return getLmsCourses();
};

export const deleteLmsCourse = async (id: string): Promise<LmsCourse[]> => {
  await apiRequest(`/lms-courses/${id}`, { method: 'DELETE' });
  return getLmsCourses();
};

export const createLmsModule = async (courseId: string, title: string): Promise<LmsCourse[]> => {
  const courses = await getLmsCourses();
  const course = courses.find(c => c.id === courseId);
  if (course) {
    const newModule: LmsModule = { id: `module-${Date.now()}`, title: title.trim(), lessons: [] };
    await apiRequest('/lms-courses', {
      method: 'POST',
      body: JSON.stringify({ ...course, modules: [...course.modules, newModule] }),
    });
  }
  return getLmsCourses();
};

export const updateLmsModule = async (courseId: string, moduleId: string, title: string): Promise<LmsCourse[]> => {
  const courses = await getLmsCourses();
  const course = courses.find(c => c.id === courseId);
  if (course) {
    const updatedModules = course.modules.map(m => m.id === moduleId ? { ...m, title } : m);
    await apiRequest('/lms-courses', {
      method: 'POST',
      body: JSON.stringify({ ...course, modules: updatedModules }),
    });
  }
  return getLmsCourses();
};

export const deleteLmsModule = async (courseId: string, moduleId: string): Promise<LmsCourse[]> => {
  const courses = await getLmsCourses();
  const course = courses.find(c => c.id === courseId);
  if (course) {
    const updatedModules = course.modules.filter(m => m.id !== moduleId);
    await apiRequest('/lms-courses', {
      method: 'POST',
      body: JSON.stringify({ ...course, modules: updatedModules }),
    });
  }
  return getLmsCourses();
};

export const saveLmsLesson = async (courseId: string, moduleId: string, lessonData: any, isNew: boolean): Promise<LmsCourse[]> => {
  const courses = await getLmsCourses();
  const course = courses.find(c => c.id === courseId);
  if (course) {
    const updatedModules = course.modules.map(m => {
      if (isNew && m.id === moduleId) {
        const newLesson = { ...lessonData, id: `lesson-${Date.now()}` };
        return { ...m, lessons: [...m.lessons, newLesson] };
      }
      if (!isNew) {
        const lessonIndex = m.lessons.findIndex(l => l.id === lessonData.id);
        if (lessonIndex > -1) {
          const updatedLessons = [...m.lessons];
          updatedLessons[lessonIndex] = { ...updatedLessons[lessonIndex], ...lessonData };
          return { ...m, lessons: updatedLessons };
        }
      }
      return m;
    });
    await apiRequest('/lms-courses', {
      method: 'POST',
      body: JSON.stringify({ ...course, modules: updatedModules }),
    });
  }
  return getLmsCourses();
};

export const deleteLmsLesson = async (courseId: string, lessonId: string): Promise<LmsCourse[]> => {
  const courses = await getLmsCourses();
  const course = courses.find(c => c.id === courseId);
  if (course) {
    const updatedModules = course.modules.map(m => ({ ...m, lessons: m.lessons.filter(l => l.id !== lessonId) }));
    await apiRequest('/lms-courses', {
      method: 'POST',
      body: JSON.stringify({ ...course, modules: updatedModules }),
    });
  }
  return getLmsCourses();
};

export const updateLessonVideo = async (courseId: string, lessonId: string, videoUrl: string): Promise<LmsCourse[]> => {
  const courses = await getLmsCourses();
  const course = courses.find(c => c.id === courseId);
  if (course) {
    const updatedModules = course.modules.map(m => ({ ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, videoUrl } : l) }));
    await apiRequest('/lms-courses', {
      method: 'POST',
      body: JSON.stringify({ ...course, modules: updatedModules }),
    });
  }
  return getLmsCourses();
};

export const saveDiscussionPost = async (courseId: string, threadId: string | 'new', postContent: { title?: string; content: string }, user: User): Promise<LmsCourse[]> => {
  const courses = await getLmsCourses();
  const course = courses.find(c => c.id === courseId);
  if (course) {
    const newPost: DiscussionPost = { id: `post-${Date.now()}`, authorId: user.id, authorName: user.name, timestamp: new Date().toISOString(), content: postContent.content };
    const newDiscussions = [...(course.discussions || [])];
    if (threadId === 'new' && postContent.title) {
      const newThread: DiscussionThread = { id: `thread-${Date.now()}`, title: postContent.title, posts: [newPost] };
      newDiscussions.push(newThread);
    } else {
      const threadIndex = newDiscussions.findIndex(t => t.id === threadId);
      if (threadIndex > -1) newDiscussions[threadIndex].posts.push(newPost);
    }
    await apiRequest('/lms-courses', {
      method: 'POST',
      body: JSON.stringify({ ...course, discussions: newDiscussions }),
    });
  }
  return getLmsCourses();
};

// Visitors
export const getVisitors = async (): Promise<Visitor[]> => {
  return apiRequest<Visitor[]>('/visitors');
};

// Get visitors assigned to current staff member
export const getMyVisitors = async (status?: string): Promise<Visitor[]> => {
  let url = '/visitors/my-visitors';
  if (status) {
    url += `?status=${encodeURIComponent(status)}`;
  }
  return apiRequest<Visitor[]>(url);
};

export const deleteVisitor = async (id: number): Promise<Visitor[]> => {
  return await apiRequest<Visitor[]>(`/visitors/${id}`, { method: 'DELETE' });
};

export const saveVisitor = async (data: {
  id?: number;
  name: string;
  company: string;
  host: string;
  cardNumber?: string;
  purpose?: string;
  status?: 'Scheduled' | 'Checked-in' | 'Checked-out' | 'Called';
  checkIn?: string;
  checkOut?: string;
  scheduledCheckIn?: string;
  visitSegments?: { department: string; purpose: string; action?: string; timestamp?: string }[];
  calledAt?: string;
  staffEmail?: string;
  staffName?: string;
}): Promise<Visitor[]> => {
  // Get current time in IST
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

  if (data.id) {
    // When editing, fetch current visitor to preserve status and timestamps
    const currentVisitor = await apiRequest<Visitor>(`/visitors/${data.id}`, { method: 'GET' });

    await apiRequest(`/visitors/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...data,
        status: data.status || currentVisitor.status,
        checkIn: data.checkIn || currentVisitor.checkIn,
        checkOut: data.checkOut || currentVisitor.checkOut,
        scheduledCheckIn: data.scheduledCheckIn || currentVisitor.scheduledCheckIn,
        visitSegments: data.visitSegments || currentVisitor.visitSegments,
        calledAt: data.calledAt || currentVisitor.calledAt,
        staffEmail: data.staffEmail !== undefined ? data.staffEmail : currentVisitor.staffEmail,
        staffName: data.staffName !== undefined ? data.staffName : currentVisitor.staffName
      }),
    });
  } else {
    await apiRequest('/visitors', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        checkIn: data.checkIn || istTime.toISOString(),
        status: data.status || 'Checked-in'
      }),
    });
  }
  return getVisitors();
};

export const checkOutVisitor = async (id: number): Promise<{ allVisitors: Visitor[]; checkedOutVisitor?: Visitor }> => {
  console.log('API: Fetching visitor', id);
  const visitor = await apiRequest<Visitor>(`/visitors/${id}`, { method: 'GET' });
  console.log('API: Visitor fetched:', visitor);

  // Get current time in IST
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

  // Update visitor with checkout time and status
  const updateData = {
    name: visitor.name,
    company: visitor.company,
    host: visitor.host,
    scheduledCheckIn: visitor.scheduledCheckIn,
    checkIn: visitor.checkIn,
    checkOut: istTime.toISOString(),
    status: 'Checked-out',
    cardNumber: visitor.cardNumber,
    purpose: visitor.purpose // Preserve purpose
  };
  console.log('API: Updating visitor with:', updateData);

  const updatedVisitor = await apiRequest<Visitor>(`/visitors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
  console.log('API: Visitor updated:', updatedVisitor);

  const allVisitors = await getVisitors();
  console.log('API: All visitors refreshed, count:', allVisitors.length);
  return { allVisitors, checkedOutVisitor: updatedVisitor };
};

export const scheduleVisitor = async (data: { name: string; company: string; host: string; scheduledCheckIn: string; purpose?: string; }): Promise<Visitor[]> => {
  await apiRequest('/visitors', {
    method: 'POST',
    body: JSON.stringify({ ...data, status: 'Scheduled' }),
  });
  return getVisitors();
};

export const getContactVisits = async (contactId: number): Promise<Visitor[]> => {
  return apiRequest<Visitor[]>(`/contacts/${contactId}/visits`);
};

export const updateVisitorPurpose = async (visitorId: number, purpose: string): Promise<Visitor> => {
  return apiRequest<Visitor>(`/visitors/${visitorId}`, {
    method: 'PUT',
    body: JSON.stringify({ purpose })
  });
};

export const checkInScheduledVisitor = async (id: number): Promise<{ allVisitors: Visitor[]; checkedInVisitor?: Visitor }> => {
  const visitor = await apiRequest<Visitor>(`/visitors/${id}`, { method: 'GET' });

  // Get current time in IST
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

  await apiRequest(`/visitors/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...visitor, status: 'Checked-in', checkIn: istTime.toISOString() }),
  });
  const allVisitors = await getVisitors();
  return { allVisitors, checkedInVisitor: { ...visitor, status: 'Checked-in', checkIn: istTime.toISOString() } };
};

// Quotation Templates
export const getQuotationTemplates = async (): Promise<QuotationTemplate[]> => {
  return apiRequest<QuotationTemplate[]>('/quotation-templates');
};

export const saveQuotationTemplate = async (template: QuotationTemplate, isNew: boolean): Promise<QuotationTemplate[]> => {
  if (isNew) {
    await apiRequest('/quotation-templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  } else {
    await apiRequest(`/quotation-templates/${template.id}`, {
      method: 'PUT',
      body: JSON.stringify(template),
    });
  }
  return getQuotationTemplates();
};

export const deleteQuotationTemplate = async (templateId: number): Promise<QuotationTemplate[]> => {
  await apiRequest(`/quotation-templates/${templateId}`, { method: 'DELETE' });
  return getQuotationTemplates();
};

// Activity Log
export const getActivityLog = async (): Promise<ActivityLog[]> => {
  return apiRequest<ActivityLog[]>('/activity-log');
};

export const logActivity = async (action: string, currentUser: User): Promise<ActivityLog[]> => {
  await apiRequest('/activity-log', {
    method: 'POST',
    body: JSON.stringify({ adminName: currentUser.name, action }),
  });
  return getActivityLog();
};

// Payment Activity Log
export const getPaymentActivityLog = async (): Promise<PaymentActivityLog[]> => {
  return apiRequest<PaymentActivityLog[]>('/payment-activity-log');
};

export const logPaymentActivity = async (text: string, amount: number, type: 'invoice_created' | 'payment_received'): Promise<PaymentActivityLog[]> => {
  await apiRequest('/payment-activity-log', {
    method: 'POST',
    body: JSON.stringify({ text, amount, type }),
  });
  return getPaymentActivityLog();
};

// Notifications
export const getNotifications = async (): Promise<Notification[]> => {
  return apiRequest<Notification[]>('/notifications');
};

export const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Promise<Notification[]> => {
  await apiRequest('/notifications', {
    method: 'POST',
    body: JSON.stringify(notification),
  });
  return getNotifications();
};

export const markAllNotificationsAsRead = async (currentUser: User): Promise<Notification[]> => {
  await apiRequest('/notifications/mark-all-read', {
    method: 'PUT',
  });
  return getNotifications();
};

// Gemini functions (mock for now)
export const summarizeWithGemini = async (text: string): Promise<{ summary: string }> => {
  return { summary: `This is a simulated AI summary for the provided text, which starts with: "${text.substring(0, 50)}...". The full text has been processed.` };
};

export const analyzeDocumentWithGemini = async (documentText: string): Promise<{ analysis: any }> => {
  const mockAnalysis = {
    "Student Name": "Alex Johnson (Simulated)",
    "GPA": "3.8/4.0",
    "Major": "Software Engineering",
    "Graduation Date": "May 2024",
    "Key Courses": ["Data Structures (A)", "Web Development (B+)"],
  };
  return { analysis: mockAnalysis };
};

export const draftEmailWithGemini = async (prompt: string, studentName: string): Promise<{ draft: string }> => {
  const mockDraft = `Dear ${studentName},\n\nThis is a simulated email draft based on your prompt: "${prompt}".\n\nPlease review and edit this content as needed before sending.\n\nBest regards,\nThe Lyceum Academy Team`;
  return { draft: mockDraft };
};
