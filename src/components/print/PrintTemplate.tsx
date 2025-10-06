import { forwardRef } from 'react';
import { Bill } from '@/types/weighment';
import { PrintTemplate } from '@/types/printTemplate';
import { format } from 'date-fns';

interface PrintTemplateProps {
  bill: Bill;
  template: PrintTemplate;
}

export const PrintTemplateComponent = forwardRef<HTMLDivElement, PrintTemplateProps>(
  ({ bill, template }, ref) => {
    const formatWeight = (weight: number | null) => {
      return weight ? `${weight.toFixed(2)} kg` : '-';
    };

    const formatCurrency = (amount: number) => {
      return `₹${amount.toLocaleString()}`;
    };

    const formatDateTime = (dateStr: string) => {
      return format(new Date(dateStr), 'dd/MM/yyyy HH:mm');
    };

    return (
      <div
        ref={ref}
        className="print-template"
        style={{
          width: `${template.pageWidth}px`,
          height: `${template.pageHeight}px`,
          position: 'relative',
          backgroundColor: 'white',
        }}
      >
        {/* Ticket Number */}
        <div
          style={{
            position: 'absolute',
            left: `${template.fields.ticketNo.x}px`,
            top: `${template.fields.ticketNo.y}px`,
            fontSize: `${template.fields.ticketNo.fontSize}px`,
            fontWeight: template.fields.ticketNo.fontWeight || 'normal',
            textAlign: template.fields.ticketNo.align || 'left',
          }}
        >
          {bill.ticketNo}
        </div>

        {/* Vehicle Number */}
        <div
          style={{
            position: 'absolute',
            left: `${template.fields.vehicleNo.x}px`,
            top: `${template.fields.vehicleNo.y}px`,
            fontSize: `${template.fields.vehicleNo.fontSize}px`,
            fontWeight: template.fields.vehicleNo.fontWeight || 'normal',
            textAlign: template.fields.vehicleNo.align || 'left',
          }}
        >
          {bill.vehicleNo}
        </div>

        {/* Customer Name */}
        <div
          style={{
            position: 'absolute',
            left: `${template.fields.customerName.x}px`,
            top: `${template.fields.customerName.y}px`,
            fontSize: `${template.fields.customerName.fontSize}px`,
            fontWeight: template.fields.customerName.fontWeight || 'normal',
            textAlign: template.fields.customerName.align || 'left',
          }}
        >
          {bill.partyName}
        </div>

        {/* Material */}
        <div
          style={{
            position: 'absolute',
            left: `${template.fields.material.x}px`,
            top: `${template.fields.material.y}px`,
            fontSize: `${template.fields.material.fontSize}px`,
            fontWeight: template.fields.material.fontWeight || 'normal',
            textAlign: template.fields.material.align || 'left',
          }}
        >
          {bill.productName}
        </div>

        {/* First Weight */}
        <div
          style={{
            position: 'absolute',
            left: `${template.fields.firstWeight.x}px`,
            top: `${template.fields.firstWeight.y}px`,
            fontSize: `${template.fields.firstWeight.fontSize}px`,
            fontWeight: template.fields.firstWeight.fontWeight || 'normal',
            textAlign: template.fields.firstWeight.align || 'left',
          }}
        >
          {formatWeight(bill.firstWeightType === 'gross' ? bill.grossWeight : bill.tareWeight)}
        </div>

        {/* Second Weight */}
        <div
          style={{
            position: 'absolute',
            left: `${template.fields.secondWeight.x}px`,
            top: `${template.fields.secondWeight.y}px`,
            fontSize: `${template.fields.secondWeight.fontSize}px`,
            fontWeight: template.fields.secondWeight.fontWeight || 'normal',
            textAlign: template.fields.secondWeight.align || 'left',
          }}
        >
          {formatWeight(bill.firstWeightType === 'gross' ? bill.tareWeight : bill.grossWeight)}
        </div>

        {/* Net Weight */}
        <div
          style={{
            position: 'absolute',
            left: `${template.fields.netWeight.x}px`,
            top: `${template.fields.netWeight.y}px`,
            fontSize: `${template.fields.netWeight.fontSize}px`,
            fontWeight: template.fields.netWeight.fontWeight || 'normal',
            textAlign: template.fields.netWeight.align || 'left',
          }}
        >
          {formatWeight(bill.netWeight)}
        </div>

        {/* Date & Time */}
        <div
          style={{
            position: 'absolute',
            left: `${template.fields.dateTime.x}px`,
            top: `${template.fields.dateTime.y}px`,
            fontSize: `${template.fields.dateTime.fontSize}px`,
            fontWeight: template.fields.dateTime.fontWeight || 'normal',
            textAlign: template.fields.dateTime.align || 'left',
          }}
        >
          {formatDateTime(bill.createdAt)}
        </div>

        {/* Amount */}
        <div
          style={{
            position: 'absolute',
            left: `${template.fields.amount.x}px`,
            top: `${template.fields.amount.y}px`,
            fontSize: `${template.fields.amount.fontSize}px`,
            fontWeight: template.fields.amount.fontWeight || 'normal',
            textAlign: template.fields.amount.align || 'left',
          }}
        >
          {formatCurrency(bill.charges)}
        </div>

        {/* Vehicle Image */}
        {(bill.frontImage || bill.rearImage) && (
          <img
            src={bill.frontImage || bill.rearImage || ''}
            alt="Vehicle"
            style={{
              position: 'absolute',
              left: `${template.image.x}px`,
              top: `${template.image.y}px`,
              width: `${template.image.width}px`,
              height: `${template.image.height}px`,
              objectFit: 'cover',
            }}
          />
        )}

        <style>{`
          @media print {
            .print-template {
              width: 148mm !important;
              height: 210mm !important;
            }
            @page {
              size: A5;
              margin: 0;
            }
          }
        `}</style>
      </div>
    );
  }
);

PrintTemplateComponent.displayName = 'PrintTemplateComponent';
