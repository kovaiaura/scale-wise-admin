import { Bill } from '@/types/weighment';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Excel Export
export const exportBillsToExcel = (bills: Bill[], filename: string = 'weighment-bills') => {
  const data = bills.map(bill => ({
    'Bill No': bill.billNo,
    'Ticket No': bill.ticketNo,
    'Date': new Date(bill.createdAt).toLocaleDateString('en-IN'),
    'Time': new Date(bill.createdAt).toLocaleTimeString('en-IN'),
    'Vehicle No': bill.vehicleNo,
    'Party Name': bill.partyName,
    'Product': bill.productName,
    'Gross Weight (KG)': bill.grossWeight || 'N/A',
    'Tare Weight (KG)': bill.tareWeight || 'N/A',
    'Net Weight (KG)': bill.netWeight || 'N/A',
    'Charges (₹)': bill.charges,
    'Status': bill.status
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bills');
  
  // Auto-size columns
  const maxWidth = 20;
  const wscols = Object.keys(data[0] || {}).map(() => ({ wch: maxWidth }));
  ws['!cols'] = wscols;
  
  XLSX.writeFile(wb, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
};

// CSV Export
export const exportBillsToCSV = (bills: Bill[], filename: string = 'weighment-bills') => {
  const data = bills.map(bill => ({
    'Bill No': bill.billNo,
    'Ticket No': bill.ticketNo,
    'Date': new Date(bill.createdAt).toLocaleDateString('en-IN'),
    'Time': new Date(bill.createdAt).toLocaleTimeString('en-IN'),
    'Vehicle No': bill.vehicleNo,
    'Party Name': bill.partyName,
    'Product': bill.productName,
    'Gross Weight (KG)': bill.grossWeight || 'N/A',
    'Tare Weight (KG)': bill.tareWeight || 'N/A',
    'Net Weight (KG)': bill.netWeight || 'N/A',
    'Charges (₹)': bill.charges,
    'Status': bill.status
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// PDF Report Export
export const exportBillsToPDF = (bills: Bill[], filename: string = 'weighment-report') => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text('Weighment Bills Report', 14, 22);
  
  // Date range
  doc.setFontSize(11);
  doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 32);
  doc.text(`Total Bills: ${bills.length}`, 14, 38);
  
  // Table
  const tableData = bills.map(bill => [
    bill.billNo,
    new Date(bill.createdAt).toLocaleDateString('en-IN'),
    bill.vehicleNo,
    bill.partyName,
    bill.netWeight ? `${bill.netWeight.toLocaleString()} KG` : 'N/A',
    bill.status
  ]);
  
  (doc as any).autoTable({
    head: [['Bill No', 'Date', 'Vehicle', 'Party', 'Net Weight', 'Status']],
    body: tableData,
    startY: 45,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 139, 202] }
  });
  
  // Summary
  const finalY = (doc as any).lastAutoTable.finalY || 45;
  const totalNet = bills.reduce((sum, bill) => sum + (bill.netWeight || 0), 0);
  const totalCharges = bills.reduce((sum, bill) => sum + bill.charges, 0);
  
  doc.setFontSize(12);
  doc.text(`Total Net Weight: ${totalNet.toLocaleString()} KG`, 14, finalY + 15);
  doc.text(`Total Charges: ₹${totalCharges.toFixed(2)}`, 14, finalY + 22);
  
  doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
};
