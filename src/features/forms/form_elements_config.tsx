import React from 'react';
import { 
  Type, 
  AlignLeft, 
  Mail, 
  Phone, 
  Calendar, 
  ChevronDown, 
  CheckCircle2, 
  Square, 
  Hash, 
  Paperclip, 
  PenTool 
} from '@/components/common/icons';
import { FormElementType } from '@/types';

export interface FormElementDef {
  type: FormElementType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export const FORM_ELEMENTS: FormElementDef[] = [
  { type: 'text', label: 'Short Text', icon: <Type size={20} />, description: 'Single-line input for names, IDs, etc.' },
  { type: 'long-text', label: 'Long Text', icon: <AlignLeft size={20} />, description: 'Multi-line area for addresses, history, etc.' },
  { type: 'email', label: 'Email', icon: <Mail size={20} />, description: 'Email field with validation' },
  { type: 'phone', label: 'Phone', icon: <Phone size={20} />, description: 'Phone number with country code' },
  { type: 'date', label: 'Date', icon: <Calendar size={20} />, description: 'Date picker' },
  { type: 'dropdown', label: 'Dropdown', icon: <ChevronDown size={20} />, description: 'Select from a list' },
  { type: 'radio', label: 'Radio Buttons', icon: <CheckCircle2 size={20} />, description: 'Single-select options' },
  { type: 'checkbox', label: 'Checkboxes', icon: <Square size={20} />, description: 'Multi-select options' },
  { type: 'number', label: 'Number', icon: <Hash size={20} />, description: 'Numeric input only' },
  { type: 'file-upload-note', label: 'File Upload Note', icon: <Paperclip size={20} />, description: 'Redirects student to Documents Manager' },
  { type: 'signature', label: 'Signature Pad', icon: <PenTool size={20} />, description: 'Digital signature canvas' },
];
