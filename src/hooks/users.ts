import type { User } from '../types';
import { DEFAULT_PERMISSIONS } from '@/lib/constants';

export const SAMPLE_USERS: User[] = [
  {
    id: 1,
    name: 'aliceadmin',
    email: 'aliceadmin@gmail.com',
    role: 'Admin',
    password: 'Alice@123',
    permissions: DEFAULT_PERMISSIONS['Admin'],
  },
  {
    id: 2,
    name: 'alicestaff',
    email: 'alicestaff@gmail.com',
    role: 'Staff',
    password: 'Alice@123',
    permissions: DEFAULT_PERMISSIONS['Staff'],
  },
  {
    id: 3,
    name: 'alicestudent',
    email: 'alicestudent@gmail.com',
    role: 'Student',
    password: 'Alice@123',
    permissions: DEFAULT_PERMISSIONS['Student'],
  },
];
