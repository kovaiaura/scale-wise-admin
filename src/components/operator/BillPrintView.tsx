import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, Download, X } from 'lucide-react';
import { Bill } from '@/types/weighment';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

interface BillPrintViewProps {
  bill: Bill;
  onClose: () => void;
  onPrintComplete?: () => void;
}

export default function BillPrintView({ bill, onClose, onPrintComplete }: BillPrintViewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handlePrint = () => {
    window.print();
    onPrintComplete?.();
    toast({
      title: "Bill Printed",
      description: `Bill ${bill.billNo} has been sent to printer`
    });
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('WEIGHMENT BILL', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Bill No: ${bill.billNo}`, 20, 40);
    doc.text(`Ticket No: ${bill.ticketNo}`, 20, 50);
    
    // Date and Time
    const date = new Date(bill.createdAt);
    doc.text(`Date: ${date.toLocaleDateString('en-IN')}`, 140, 40);
    doc.text(`Time: ${date.toLocaleTimeString('en-IN')}`, 140, 50);
    
    // Line separator
    doc.line(20, 55, 190, 55);
    
    // Details
    doc.setFontSize(11);
    let yPos = 70;
    
    doc.text(`Vehicle Number: ${bill.vehicleNo.toUpperCase()}`, 20, yPos);
    yPos += 10;
    doc.text(`Party Name: ${bill.partyName.toUpperCase()}`, 20, yPos);
    yPos += 10;
    doc.text(`Product: ${bill.productName.toUpperCase()}`, 20, yPos);
    yPos += 10;
    
    // Line separator
    doc.line(20, yPos + 5, 190, yPos + 5);
    yPos += 15;
    
    // Weights
    doc.setFontSize(12);
    doc.text('WEIGHT DETAILS', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(11);
    if (bill.grossWeight !== null) {
      doc.text(`Gross Weight: ${bill.grossWeight.toLocaleString()} KG`, 20, yPos);
      yPos += 10;
    }
    if (bill.tareWeight !== null) {
      doc.text(`Tare Weight: ${bill.tareWeight.toLocaleString()} KG`, 20, yPos);
      yPos += 10;
    }
    if (bill.netWeight !== null) {
      doc.setFontSize(14);
      doc.text(`Net Weight: ${bill.netWeight.toLocaleString()} KG`, 20, yPos);
      yPos += 12;
      doc.setFontSize(11);
    }
    
    // Charges
    if (bill.charges > 0) {
      doc.line(20, yPos, 190, yPos);
      yPos += 10;
      doc.setFontSize(12);
      doc.text(`Charges: ₹${bill.charges.toFixed(2)}`, 20, yPos);
    }
    
    // Footer
    yPos = 270;
    doc.setFontSize(10);
    doc.text('This is a computer generated bill', 105, yPos, { align: 'center' });
    doc.text(`Status: ${bill.status}`, 105, yPos + 5, { align: 'center' });
    
    doc.save(`Bill-${bill.billNo}.pdf`);
    
    toast({
      title: "PDF Downloaded",
      description: `Bill ${bill.billNo} has been downloaded`
    });
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between print:hidden">
          <CardTitle>Bill Preview</CardTitle>
          <div className="flex gap-2">
            <Button onClick={handleDownloadPDF} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handlePrint} size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div ref={printRef} className="space-y-6 p-8 bg-white text-black">
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-4">
              <h1 className="text-3xl font-bold">WEIGHMENT BILL</h1>
              <p className="text-sm mt-2">Computer Generated Bill</p>
            </div>
            
            {/* Bill Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Bill Number</p>
                <p className="text-lg font-bold">{bill.billNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ticket Number</p>
                <p className="text-lg font-bold">{bill.ticketNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="text-lg font-semibold">
                  {new Date(bill.createdAt).toLocaleDateString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Time</p>
                <p className="text-lg font-semibold">
                  {new Date(bill.createdAt).toLocaleTimeString('en-IN')}
                </p>
              </div>
            </div>
            
            {/* Details */}
            <div className="border-t border-b border-gray-300 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Vehicle Number</p>
                  <p className="text-xl font-bold">{bill.vehicleNo.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-xl font-bold">{bill.status}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Party Name</p>
                <p className="text-lg font-semibold">{bill.partyName.toUpperCase()}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Product/Material</p>
                <p className="text-lg font-semibold">{bill.productName.toUpperCase()}</p>
              </div>
            </div>
            
            {/* Weight Details */}
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <h2 className="text-xl font-bold border-b border-gray-300 pb-2">WEIGHT DETAILS</h2>
              
              {bill.grossWeight !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Gross Weight:</span>
                  <span className="text-2xl font-bold">{bill.grossWeight.toLocaleString()} KG</span>
                </div>
              )}
              
              {bill.tareWeight !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tare Weight:</span>
                  <span className="text-2xl font-bold">{bill.tareWeight.toLocaleString()} KG</span>
                </div>
              )}
              
              {bill.netWeight !== null && (
                <div className="flex justify-between items-center border-t-2 border-black pt-4 mt-4">
                  <span className="text-xl font-semibold">NET WEIGHT:</span>
                  <span className="text-3xl font-bold text-green-700">{bill.netWeight.toLocaleString()} KG</span>
                </div>
              )}
            </div>
            
            {/* Charges */}
            {bill.charges > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Charges:</span>
                  <span className="text-2xl font-bold">₹{bill.charges.toFixed(2)}</span>
                </div>
              </div>
            )}
            
            {/* Captured Image */}
            {bill.capturedImage && (
              <div className="mt-6">
                <p className="text-sm text-gray-600 mb-2">Captured Image:</p>
                <img 
                  src={bill.capturedImage} 
                  alt="Weighment" 
                  className="w-full max-w-md mx-auto border border-gray-300 rounded"
                />
              </div>
            )}
            
            {/* Footer */}
            <div className="text-center text-sm text-gray-500 mt-8 pt-4 border-t border-gray-300">
              <p>Thank you for your business</p>
              <p className="mt-2">
                Generated on: {new Date().toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
