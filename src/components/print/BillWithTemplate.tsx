import { useRef } from 'react';
import { Bill } from '@/types/weighment';
import { PrintTemplateComponent } from './PrintTemplate';
import { printTemplateService } from '@/services/printTemplateService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';

interface BillWithTemplateProps {
  bill: Bill;
  onPrintComplete?: () => void;
}

export default function BillWithTemplate({ bill, onPrintComplete }: BillWithTemplateProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const template = printTemplateService.loadTemplate();

  const handlePrint = async () => {
    if (!printRef.current) return;

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgWidth = 210; // A5 landscape width in mm
      const imgHeight = 148; // A5 landscape height in mm
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a5',
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Convert PDF to blob and open in new window for printing
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          // Clean up the object URL after a delay
          setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
        };
      }

      onPrintComplete?.();
      toast({
        title: "Bill Printed",
        description: `Bill ${bill.billNo} has been sent to printer`,
      });
    } catch (error) {
      console.error('Error printing:', error);
      toast({
        title: "Error",
        description: "Failed to print bill",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgWidth = 210; // A5 landscape width in mm
      const imgHeight = 148; // A5 landscape height in mm
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a5',
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Bill-${bill.billNo}.pdf`);

      toast({
        title: "PDF Downloaded",
        description: `Bill ${bill.billNo} has been downloaded`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  return {
    printRef,
    template,
    handlePrint,
    handleDownloadPDF,
    PrintComponent: () => (
      <div ref={printRef}>
        <PrintTemplateComponent
          bill={bill}
          template={template}
          editMode={false}
        />
      </div>
    ),
  };
}
