


import React from 'react';
import type { OdooApp, UserRole, AppPermissions, ChecklistItem, QuotationTemplate } from '../types';
import {
  MessagesSquare,
  Calendar,
  Contact,
  ClipboardList,
  BarChart3,
  Cog,
  FileText,
  ShoppingCart,
  DollarSign,
  Users,
  Warehouse,
  Wrench,
  MonitorPlay,
  Share2,
  KeyRound,
  ConciergeBell,
  BookOpen,
  UserCheck,
  CheckCircle,
  Clock,
} from './icons';

export const ODOO_APPS: OdooApp[] = [
  {
    name: 'dashboard',
    icon: <BarChart3 size={36} />,
    bgColor: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
  },
  {
    name: 'Contacts',
    icon: <Contact size={36} />,
    bgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
  },
  {
    name: 'LMS',
    icon: <BookOpen size={36} />,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    name: 'CRM',
    icon: <Users size={36} />,
    bgColor: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
  {
    name: 'Agents',
    icon: <UserCheck size={36} />,
    bgColor: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    name: 'Calendar',
    icon: <Calendar size={36} />,
    bgColor: 'bg-rose-100',
    iconColor: 'text-rose-600',
  },
  {
    name: 'Discuss',
    icon: <MessagesSquare size={36} />,
    bgColor: 'bg-teal-100',
    iconColor: 'text-teal-600',
  },
  {
    name: 'Accounting',
    icon: <FileText size={36} />,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    name: 'Sales',
    icon: <ShoppingCart size={36} />,
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    name: 'Inventory',
    icon: <Warehouse size={36} />,
    bgColor: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    name: 'Manufacturing',
    icon: <Wrench size={36} />,
    bgColor: 'bg-gray-200',
    iconColor: 'text-gray-700',
  },
  {
    name: 'Website',
    icon: <MonitorPlay size={36} />,
    bgColor: 'bg-fuchsia-100',
    iconColor: 'text-fuchsia-600',
  },
  {
    name: 'Point of Sale',
    icon: <DollarSign size={36} />,
    bgColor: 'bg-lime-100',
    iconColor: 'text-lime-600',
  },
  {
    name: 'Marketing',
    icon: <Share2 size={36} />,
    bgColor: 'bg-pink-100',
    iconColor: 'text-pink-600',
  },
  {
    name: 'To-do',
    icon: <ClipboardList size={36} />,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    name: 'Reception',
    icon: <ConciergeBell size={36} />,
    bgColor: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    name: 'Settings',
    icon: <Cog size={36} />,
    bgColor: 'bg-slate-200',
    iconColor: 'text-slate-600',
  },
  {
    name: 'Access Control',
    icon: <KeyRound size={36} />,
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  {
    name: 'Visitor Display',
    icon: <Users size={36} />,
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    name: 'Department Dashboard',
    icon: <CheckCircle size={36} />,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    name: 'Attendance',
    icon: <Clock size={36} />,
    bgColor: 'bg-pink-100',
    iconColor: 'text-pink-600',
  },
];

export const STAFF_ROLES: UserRole[] = ['Admin', 'Staff'];

const fullAccess: AppPermissions = { read: true, create: true, update: true, delete: true };
const readOnly: AppPermissions = { read: true };

const adminPermissions = ODOO_APPS.reduce((acc, app) => {
  acc[app.name] = { ...fullAccess };
  return acc;
}, {} as { [appName: string]: AppPermissions });

const employeeFullAccessApps = new Set(['Contacts', 'CRM', 'Agents', 'Calendar', 'Discuss', 'To-do', 'Reception', 'Sales', 'Marketing', 'LMS', 'Visitor Display', 'Department Dashboard', 'Attendance']);
const employeeReadOnlyApps = new Set(['dashboard', 'Accounting', 'Inventory', 'Manufacturing', 'Website', 'Point of Sale']);
const employeePermissions: { [appName: string]: AppPermissions } = ODOO_APPS.reduce((acc, app) => {
  if (employeeFullAccessApps.has(app.name)) {
    acc[app.name] = { ...fullAccess };
  } else if (employeeReadOnlyApps.has(app.name)) {
    acc[app.name] = { ...readOnly };
  }
  return acc;
}, {} as { [appName: string]: AppPermissions });

export const DEFAULT_PERMISSIONS: Record<UserRole, { [appName: string]: AppPermissions }> = {
  'Admin': adminPermissions,
  'Staff': employeePermissions,
  'Student': {
    'LMS': readOnly,
  },
};

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: 0, text: 'University Checklist - documents', completed: false, type: 'checkbox' },
  { id: 1, text: 'University Checklist - university applied', completed: false, type: 'checkbox' },
  { id: 2, text: 'University Checklist - Remark', completed: false, type: 'text', response: '' },
  { id: 3, text: 'DS 160 - DS 160 started', completed: false, type: 'checkbox' },
  { id: 4, text: 'DS 160 - DS 160 filled', completed: false, type: 'checkbox' },
  { id: 5, text: 'DS 160 - DS 160 submitted', completed: false, type: 'checkbox' },
  { id: 6, text: 'CGI - credentials created', completed: false, type: 'checkbox' },
  { id: 7, text: 'CGI - paid interview fees', completed: false, type: 'checkbox' },
  { id: 8, text: 'CGI - ready to book slot', completed: false, type: 'checkbox' },
  { id: 9, text: 'Sevis fee - sevis fee received', completed: false, type: 'checkbox' },
  { id: 10, text: 'Sevis fee - sevis fee paid', completed: false, type: 'checkbox' },
  { id: 11, text: 'Visa Interview Preparation - sevis fee received', completed: false, type: 'checkbox' },
  { id: 12, text: 'Visa Interview Preparation - online classes', completed: false, type: 'checkbox' },
  { id: 13, text: 'Post visa guidance - projects', completed: false, type: 'checkbox' },
];

export const INITIAL_QUOTATION_TEMPLATES: QuotationTemplate[] = [];
