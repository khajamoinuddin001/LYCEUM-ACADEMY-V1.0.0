
import type { ReactElement } from 'react';

export interface OdooApp {
  name: string;
  icon: ReactElement<{ size?: string | number }>;
  bgColor: string;
  iconColor: string;
}

export interface Message {
  id: number;
  author: string;
  avatar: string;
  text: string;
  timestamp: string;
  edited?: boolean;
  attachment?: {
    id: number;
    name: string;
    url: string;
    contentType?: string;
    size?: number;
  };
}

export interface Channel {
  id: string;
  name: string;
  messages: Message[];
  type: 'public' | 'private' | 'dm';
  members?: number[];
}

export type TodoStatus = 'todo' | 'inProgress' | 'done';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export type ActivityType = 'Call' | 'Meeting' | 'Start Application' | 'Email' | 'To-Do' | 'Upload Document' | 'Request Signature' | 'Grant Approval' | 'Other';

export interface TaskTimeLog {
  id: number;
  taskId: number;
  assignedTo: number;
  startTime: string;
  endTime: string | null;
  assigneeName?: string;
  duration?: string; // We'll calculate this on the frontend
}

export interface TodoTask {
  id: number;
  taskId?: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: 'To Do' | 'In Progress' | 'Done';
  assignedTo?: string;
  assignedBy?: string;
  priority?: 'Low' | 'Medium' | 'High';
  activityType?: ActivityType;
  isVisibleToStudent?: boolean;
  createdAt?: string;
  updatedAt?: string;
  replies?: TaskReply[];
  completedBy?: number;
  completedAt?: string;
  contactId?: number;
  contactName?: string;
  ticketId?: number;
  visibility_emails?: string[];
  recurringTaskId?: number;
}

export interface TaskReply {
  id: number;
  taskId: number;
  userId: number;
  userName: string;
  message: string;
  timestamp: string;
  attachments?: { name: string; url: string; size: number }[];
}

export interface TicketMessage {
  id: number;
  ticketId: number;
  senderId: number;
  senderName: string;
  message: string;
  createdAt: string;
}

export interface Ticket {
  id: number;
  ticketId: string;
  contactId: number;
  contactName?: string;
  subject: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignedTo?: number;
  assignedToName?: string;
  category?: string;
  createdBy: number;
  createdByName?: string;
  resolutionNotes?: string;
  attachments?: { id: number; name: string; size: number }[];
  linkedTasks?: TodoTask[];
  messages?: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}


export interface Document {
  id: number;
  name: string;
  size: string;
  uploadDate: string;
  is_private?: boolean;
  category?: string;
}

export interface UniversityApplicationDetails {
  universityName?: string;
  course?: string;
  applicationSubmissionDate?: string;
  status?: string;
  remarks?: string;
}

export interface WorkDetail {
  durationAndCompany: string;
}

export interface VisaInformation {
  slotBooking?: {
    username?: string;
    password?: string;
    securityQuestion1?: string;
    answer1?: string;
    securityQuestion2?: string;
    answer2?: string;
    securityQuestion3?: string;
    answer3?: string;
    oldDS160Number?: string;
    paymentReceipt?: string;
    paymentReceiptUrl?: string;
    interviewFeePaymentDate?: string;
  };
  visaInterview?: {
    vacPreference?: string;
    viPreference?: string;
    vacDate?: string;
    vacTime?: string;
    viDate?: string;
    viTime?: string;
    consulate?: string;
    slotBookedOn?: string;
    slotBookedBy?: string;
  };
  ds160?: {
    permittedToDS160?: boolean;
    omerSirSignature?: string;
    ds160StartDate?: string;
    ds160ExpiryDate?: string;
    ds160SubmissionDate?: string;
    ds160ConfirmationNumber?: string;
  };
  otherInformation?: {
    finalisedUniversity?: string;
    passportNo?: string;
    ds160FilledBy?: string;
    visaOutcome?: string;
  };
  acknowledgement?: {
    bondSign?: boolean;
    bondPaper?: string;
    onlineSignature?: boolean;
    interviewClassesCertificateNumber?: string;
    gap?: string;
    serviceFeeReceipt?: string;
    financialVerification?: boolean;
  };
  sevisInformation?: {
    sevisNo?: string;
    sevisPaymentDate?: string;
  };
  universityApplication?: {
    universities: UniversityApplicationDetails[];
    academicInformation?: {
      passingBodyUniversity?: string;
      passingYear?: string;
    };
    languageProficiency?: {
      languageProficiency?: string;
      score?: string;
      examDate?: string;
    };
  };
  adminControl?: {
    notices?: {
      generalTerms?: boolean;
      currentStatus?: boolean;
    };
    agentRelated?: {
      paymentStatus?: string;
      paymentDate?: string;
      screenshot?: string;
      screenshotUrl?: string;
    };
    warning?: {
      terminationDues?: boolean;
      terminationNonCompliance?: boolean;
    };
    others?: {
      finaliseAgent?: boolean;
      idCard?: boolean;
    };
  };
  others?: {
    gapDuration?: string;
    workDetails: WorkDetail[];
    submittedForApproval?: boolean;
  };
}

export type FileStatus = 'In progress' | 'Closed' | 'On hold' | '';

export interface ChecklistItem {
  id: number;
  text: string;
  type: 'checkbox' | 'text';
  completed: boolean;
  response?: string;
  isDefault?: boolean;
}

export interface StudentCourse {
  id: string;
  name: string;
  instructor: string;
  grade: 'A' | 'B' | 'C' | 'In Progress';
}

export interface DiscussionPost {
  id: string;
  authorId: number;
  authorName: string;
  timestamp: string;
  content: string;
}

export interface DiscussionThread {
  id: string;
  title: string;
  posts: DiscussionPost[];
}

export interface LessonAttachment {
  id: string;
  name: string;
  url: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface LmsLesson {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  attachments?: LessonAttachment[];
  quiz?: QuizQuestion[];
}

export interface LmsModule {
  id: string;
  title: string;
  lessons: LmsLesson[];
}

export interface LmsCourse {
  id: string;
  title: string;
  description: string;
  instructor: string;
  modules: LmsModule[];
  price?: number;
  discussions?: DiscussionThread[];
}

export type ContactActivityAction = 'created' | 'note' | 'status' | 'checklist' | 'video_add' | 'video_remove';

export interface ContactActivity {
  id: number;
  timestamp: string;
  action: ContactActivityAction;
  description: string;
}

export interface RecordedSession {
  id: number;
  timestamp: string;
}

export interface Contact {
  id: number;
  name: string;
  contactId: string;
  department: string;
  major: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  notes?: string;
  documents?: Document[];
  visaInformation?: VisaInformation;
  agentAssigned?: string;
  fileStatus?: FileStatus;
  userId?: number;
  checklist?: ChecklistItem[];
  recordedSessions?: RecordedSession[];
  activityLog?: ContactActivity[];

  gpa?: number;
  advisor?: string;
  courses?: StudentCourse[];
  lmsProgress?: {
    [courseId: string]: {
      completedLessons: string[];
    };
  };
  lmsNotes?: {
    [lessonId: string]: string;
  };
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  gstin?: string;
  pan?: string;
  tags?: string;
  visaType?: string;
  countryOfApplication?: string;
  source?: string;
  contactType?: string;
  stream?: string;
  intake?: string;
  counselorAssigned?: string;
  counselorAssigned2?: string;
  counselorDetails?: {
    email?: string;
    phone?: string;
    shiftStart?: string;
    shiftEnd?: string;
    workingDays?: string[];
  };
  counselorDetails2?: {
    email?: string;
    phone?: string;
    shiftStart?: string;
    shiftEnd?: string;
    workingDays?: string[];
  };
  applicationEmail?: string;
  applicationPassword?: string;
  createdAt?: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  color: 'blue' | 'green' | 'purple' | 'red';
  description?: string;
}

export type CrmStage = 'New' | 'Qualified' | 'Proposal' | 'Won' | 'Lost';

export type QuotationStatus = 'Draft' | 'Sent' | 'In Review' | 'Accepted by Student' | 'Agreed' | 'Rejected';

export interface Quotation {
  id: number | string;
  quotationNumber?: string;
  title: string;
  description: string;
  lineItems: QuotationLineItem[];
  total: number;
  discount?: number; // Added discount
  subtotal?: number; // Added subtotal
  status: QuotationStatus;
  studentAccepted?: boolean;
  studentAcceptedAt?: string;
  date: string;
}

export interface QuotationLineItem {
  description: string;
  price: number;
  quantity?: number;
}

export interface QuotationTemplate {
  id: number;
  title: string;
  description: string;
  lineItems: QuotationLineItem[];
  total: number;
}

export interface CrmLead {
  id: number;
  title: string;
  company: string;
  value: number;
  contact: string;
  stage: CrmStage;
  email?: string;
  phone?: string;
  source?: string;
  assignedTo?: string;
  notes?: string;
  quotations?: Quotation[];
  metadata?: {
    accountsReceivable?: any[];
    [key: string]: any;
  };
  createdAt?: string;
}

export interface RecurringTask {
  id: number;
  taskId?: string;
  leadId?: number;
  contactId?: number;
  title: string;
  description?: string;
  frequencyDays: number;
  lastGeneratedAt?: string;
  nextGenerationAt?: string;
  isActive: boolean;
  assignedTo?: number;
  contactName?: string;
  visibilityEmails: string[];
  createdAt: string;
}

export interface LeadDetailsModalProps {
  lead: CrmLead | null;
  onClose: () => void;
  onEdit: (lead: CrmLead) => void;
  onNewQuotation: (lead: CrmLead) => void;
  onEditQuotation: (lead: CrmLead, quotation: Quotation) => void;
  user: User;
}

export type TransactionType = 'Income' | 'Purchase' | 'Expense' | 'Transfer' | 'Invoice' | 'Bill' | 'Due';
export type TransactionStatus = 'Paid' | 'Pending' | 'Overdue';

export interface AccountingTransaction {
  id: string; // Already string, good
  contactId?: number;
  customerName: string;
  date: string;
  description: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  paymentMethod?: 'Cash' | 'Online';
  invoiceNumber?: string;
  contact?: string;
  dueDate?: string;
  additionalDiscount?: number;
  metadata?: any;
}
export type UserRole = 'Admin' | 'Staff' | 'Student';

export interface AppPermissions {
  read?: boolean;
  create?: boolean;
  update?: boolean;
  delete?: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  permissions: {
    [appName: string]: AppPermissions;
  };
  mustResetPassword?: boolean;
  joining_date?: string;
  base_salary?: number;
  shift_start?: string;
  shift_end?: string;
  working_days?: string[];
  phone?: string;
  shiftStart?: string;
  shiftEnd?: string;
  workingDays?: string[];
}

export interface ActivityLog {
  id: number;
  timestamp: string;
  adminName: string;
  action: string;
}

export interface PaymentActivityLog {
  id: number;
  timestamp: string;
  text: string;
  amount: number;
  type: 'invoice_created' | 'payment_received';
}

export interface DocumentAnalysisResult {
  [key: string]: string | string[];
}

export interface Notification {
  id: number;
  timestamp: string;
  title: string;
  description: string;
  read: boolean;
  type?: 'info' | 'error' | 'success';
  linkTo?: {
    type: 'contact' | 'lead' | 'user';
    id: number;
  };
  recipientUserIds?: number[];
  recipientRoles?: UserRole[];
}

export interface Visitor {
  id: number;
  name: string;
  company: string; // Used for mobile number
  scheduledCheckIn: string;
  checkIn?: string;
  checkOut?: string;
  status: 'Scheduled' | 'Checked-in' | 'Checked-out' | 'Called';
  host: string; // Used for department
  cardNumber?: string;
  purpose?: string;
  contactId?: number;
  dailySequenceNumber?: number;
  staffEmail?: string; // Email of assigned staff member from Access Control
  staffName?: string; // Name of assigned staff member
  createdAt?: string;
  visitSegments?: {
    department: string;
    purpose: string;
    action?: string;
    timestamp?: string;
  }[];
  calledAt?: string;
}

export interface Coupon {
  code: string;
  discountPercentage: number;
  isActive: boolean;
  applicableCourseIds?: string[];
}

export interface VisaOperation {
  id: number;
  vopNumber: string;
  contactId: number;
  name: string;
  phone: string;
  country: string;
  status: string;
  userId: number;
  createdAt: string;
  cgiData?: {
    username?: string;
    password?: string;
    securityQuestion1?: string;
    securityAnswer1?: string;
    securityQuestion2?: string;
    securityAnswer2?: string;
    securityQuestion3?: string;
    securityAnswer3?: string;
  };
  slotBookingData?: {
    vacConsulate?: string;
    viConsulate?: string;
    vacDate?: string;
    vacTime?: string;
    viDate?: string;
    viTime?: string;
    bookedOn?: string;
    bookedBy?: string;
    vacPreferred?: string[];
    viPreferred?: string[];
    preferencesLocked?: boolean;
  };
  visaInterviewData?: {
    visaOutcome?: string;
    remarks?: string;
  };
  dsData?: {
    confirmationNumber?: string;
    securityQuestion?: string;
    securityAnswer?: string;
    startDate?: string;
    expiryDate?: string;
    basicDsBox?: string;
    documentId?: number;
    documentName?: string;
    fillingDocumentId?: number;
    fillingDocumentName?: string;
    fillingDocuments?: { id: number; name: string }[];
    studentStatus?: 'pending' | 'accepted' | 'rejected';
    adminStatus?: 'pending' | 'accepted' | 'rejected';
    rejectionReason?: string;
    adminName?: string;
  };
  showCgiOnPortal?: boolean;
}
