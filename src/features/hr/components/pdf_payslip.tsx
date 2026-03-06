import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface PayslipData {
    userName: string;
    month: string;
    year: number;
    baseSalary: number;
    workingDays: number;
    presentDays: number;
    paidLeaveDays: number;
    unpaidLeaveDays: number;
    lateMinutes: number;
    lateDeduction: number;
    absentDeduction: number;
    finalSalary: number;
}

export const generatePayslipPDF = (data: PayslipData) => {
    const doc = new jsPDF() as any;

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
    doc.text(`Employee Name: ${data.userName}`, 20, 50);
    doc.text(`Period: ${data.month} ${data.year}`, 140, 50);

    // Summary Table
    const tableData = [
        ['Base Salary', `INR ${data.baseSalary.toLocaleString()}`],
        ['Total Working Days', data.workingDays.toString()],
        ['Present Days', data.presentDays.toString()],
        ['Paid Leaves', data.paidLeaveDays.toString()],
        ['Unpaid Leaves', data.unpaidLeaveDays.toString()],
        ['Late Minutes (after 15m grace)', data.lateMinutes.toString()],
    ];

    doc.autoTable({
        startY: 60,
        head: [['Earnings / Info', 'Details']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    });

    // Deductions Table
    const deductionData = [
        ['Absent Deduction', `INR ${Math.round(data.absentDeduction).toLocaleString()}`],
        ['Late Deduction', `INR ${Math.round(data.lateDeduction).toLocaleString()}`],
        ['Other Deductions', 'INR 0'],
    ];

    doc.autoTable({
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
    doc.text('NET SALARY PAYABLE:', 25, finalY);
    doc.setTextColor(43, 120, 228);
    doc.text(`INR ${data.finalSalary.toLocaleString()}`, 185, finalY, { align: 'right' });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text('This is a computer-generated document and does not require a physical signature.', 105, 280, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });

    // Return blob for storage or save directly
    return doc;
};

export const downloadPayslip = (data: PayslipData) => {
    const doc = generatePayslipPDF(data);
    doc.save(`Payslip_${data.userName}_${data.month}_${data.year}.pdf`);
};
