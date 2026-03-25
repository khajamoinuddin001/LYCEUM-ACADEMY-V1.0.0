import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PayslipData {
    name?: string;
    userName?: string;
    month?: string | number;
    year?: number;
    baseSalary?: number;
    workingDays?: number;
    presentDays?: number;
    absentDays?: number;
    paidLeaveDays?: number;
    unpaidLeaveDays?: number;
    lateMinutes?: number;
    lateDeduction?: number;
    absentDeduction?: number;
    finalSalary?: number;
    shiftStart?: string;
    shiftEnd?: string;
    shiftHours?: number;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const generatePayslipPDF = (data: PayslipData) => {
    const doc = new jsPDF() as any;

    const employeeName = data.name || data.userName || 'Staff';
    const monthLabel = typeof data.month === 'number' ? (MONTHS[data.month - 1] ?? `Month ${data.month}`) : (data.month ?? '');

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text('LYCEUM ACADEMY', 105, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text('Monthly Salary Slip', 105, 30, { align: 'center' });

    doc.setDrawColor(200, 200, 200);
    doc.line(20, 35, 190, 35);

    // Employee Info
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Employee Name: ${employeeName}`, 20, 50);
    doc.text(`Period: ${monthLabel} ${data.year ?? ''}`, 140, 50);
    if (data.shiftStart && data.shiftEnd) {
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Shift: ${data.shiftStart} – ${data.shiftEnd} (${data.shiftHours ?? 8}h/day)`, 20, 58);
    }

    const workingDaysList = Array.isArray((data as any).working_days)
        ? (data as any).working_days.join(', ')
        : 'Mon, Tue, Wed, Thu, Fri';

    const bonus = (data as any).bonus || 0;
    const otPay = (data as any).overtime_pay || 0;
    const otHours = (data as any).overtime_hours || 0;

    const tableData = [
        ['Working Days', workingDaysList],
        ['Base Salary', `INR ${(data.baseSalary ?? 0).toLocaleString()}`],
        ['Bonus Earned', `INR ${bonus.toLocaleString()}`],
        [`Overtime (${otHours}h)`, `INR ${otPay.toLocaleString()}`],
        ['Total Working Days', (data.workingDays ?? 0).toString()],
        ['Present Days', (data.presentDays ?? 0).toString()],
        ['Absent Days', (data.absentDays ?? 0).toString()],
        ['Paid Leaves', (data.paidLeaveDays ?? 0).toString()],
        ['Unpaid Leaves', (data.unpaidLeaveDays ?? 0).toString()],
        ['Late Minutes', (data.lateMinutes ?? 0).toString()],
        ['Missing Checkouts (Half-Day)', ((data as any).missingCheckouts || 0).toString()],
    ];

    autoTable(doc, {
        startY: 65,
        head: [['Earnings / Info', 'Details']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    });

    // Deductions Table
    const deductionData = [
        ['Absent Deduction', `INR ${Math.round(data.absentDeduction ?? 0).toLocaleString()}`],
        ['Late Deduction', `INR ${Math.round(data.lateDeduction ?? 0).toLocaleString()}`],
        ['Other Deductions', 'INR 0'],
    ];

    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Deductions', 'Amount']],
        body: deductionData,
        theme: 'grid',
        headStyles: { fillColor: [192, 57, 43], textColor: 255 },
    });

    // Net Pay
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFillColor(245, 245, 245);
    doc.rect(20, finalY - 8, 170, 12, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text('NET SALARY PAYABLE:', 25, finalY);
    doc.setTextColor(43, 120, 228);
    doc.text(`INR ${(data.finalSalary ?? 0).toLocaleString()}`, 185, finalY, { align: 'right' });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text('This is a computer-generated document and does not require a physical signature.', 105, 280, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });

    return doc;
};

export const downloadPayslip = (data: PayslipData) => {
    const doc = generatePayslipPDF(data);
    const employeeName = data.name || data.userName || 'Staff';
    const monthLabel = typeof data.month === 'number' ? (MONTHS[data.month - 1] ?? `Month${data.month}`) : (data.month ?? '');
    doc.save(`Payslip_${employeeName}_${monthLabel}_${data.year}.pdf`);
};
