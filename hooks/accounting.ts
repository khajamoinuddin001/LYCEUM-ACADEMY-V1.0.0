

import type { AccountingTransaction } from '../types';

const getDateString = (daysAgo: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
};

export const SAMPLE_TRANSACTIONS: AccountingTransaction[] = [];
