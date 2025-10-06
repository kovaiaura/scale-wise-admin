import { forwardRef, useState, useCallback } from 'react';
import { Bill } from '@/types/weighment';
import { PrintTemplate } from '@/types/printTemplate';
import { format } from 'date-fns';
import { Move } from 'lucide-react';

interface PrintTemplateProps {
  bill: Bill;
  template: PrintTemplate;
  editMode?: boolean;
  onFieldUpdate?: (field: keyof PrintTemplate['fields'], x: number, y: number) => void;
  onImageUpdate?: (x: number, y: number, width?: number, height?: number) => void;
}

export const PrintTemplateComponent = forwardRef<HTMLDivElement, PrintTemplateProps>(
  ({ bill, template, editMode = false, onFieldUpdate, onImageUpdate }, ref) => {
    const [dragging, setDragging] = useState<{ type: 'field' | 'image'; key: string } | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const formatWeight = (weight: number | null) => {
      return weight ? `${weight.toFixed(2)} kg` : '-';
    };

    const formatCurrency = (amount: number) => {
      return `₹${amount.toLocaleString()}`;
    };

    const formatDateTime = (dateStr: string) => {
      return format(new Date(dateStr), 'dd/MM/yyyy HH:mm');
    };

    const handleMouseDown = useCallback(
      (e: React.MouseEvent, type: 'field' | 'image', key: string, currentX: number, currentY: number) => {
        if (!editMode) return;
        e.preventDefault();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        setDragging({ type, key });
      },
      [editMode]
    );

    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (!dragging || !editMode) return;
        const container = (e.currentTarget as HTMLElement);
        const rect = container.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, template.pageWidth));
        const y = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, template.pageHeight));

        if (dragging.type === 'field' && onFieldUpdate) {
          onFieldUpdate(dragging.key as keyof PrintTemplate['fields'], Math.round(x), Math.round(y));
        } else if (dragging.type === 'image' && onImageUpdate) {
          onImageUpdate(Math.round(x), Math.round(y));
        }
      },
      [dragging, editMode, dragOffset, template.pageWidth, template.pageHeight, onFieldUpdate, onImageUpdate]
    );

    const handleMouseUp = useCallback(() => {
      setDragging(null);
    }, []);

    const renderField = (
      key: keyof PrintTemplate['fields'],
      content: string | number,
      label: string
    ) => {
      const field = template.fields[key];
      return (
        <div
          onMouseDown={(e) => handleMouseDown(e, 'field', key, field.x, field.y)}
          style={{
            position: 'absolute',
            left: `${field.x}px`,
            top: `${field.y}px`,
            fontSize: `${field.fontSize}px`,
            fontWeight: field.fontWeight || 'normal',
            textAlign: field.align || 'left',
            cursor: editMode ? 'move' : 'default',
            padding: editMode ? '4px 8px' : '0',
            border: editMode ? '2px dashed hsl(var(--primary))' : 'none',
            backgroundColor: editMode ? 'hsl(var(--primary) / 0.05)' : 'transparent',
            borderRadius: editMode ? '4px' : '0',
            userSelect: 'none',
            transition: editMode ? 'none' : 'all 0.2s',
          }}
          className={editMode ? 'hover:bg-primary/10' : ''}
        >
          {editMode && (
            <div className="text-xs text-primary font-normal mb-1 opacity-70">{label}</div>
          )}
          {content}
        </div>
      );
    };

    return (
      <div
        ref={ref}
        className="print-template"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          width: `${template.pageWidth}px`,
          height: `${template.pageHeight}px`,
          position: 'relative',
          backgroundColor: 'white',
          cursor: dragging ? 'grabbing' : 'default',
        }}
      >
        {renderField('ticketNo', bill.ticketNo, 'Ticket No')}
        {renderField('vehicleNo', bill.vehicleNo, 'Vehicle No')}
        {renderField('customerName', bill.partyName, 'Customer')}
        {renderField('material', bill.productName, 'Material')}
        {renderField(
          'firstWeight',
          formatWeight(bill.firstWeightType === 'gross' ? bill.grossWeight : bill.tareWeight),
          '1st Weight'
        )}
        {renderField(
          'secondWeight',
          formatWeight(bill.firstWeightType === 'gross' ? bill.tareWeight : bill.grossWeight),
          '2nd Weight'
        )}
        {renderField('netWeight', formatWeight(bill.netWeight), 'Net Weight')}
        {renderField('dateTime', formatDateTime(bill.createdAt), 'Date & Time')}
        {renderField('amount', formatCurrency(bill.charges), 'Amount')}

        {/* Vehicle Image */}
        {(bill.frontImage || bill.rearImage) && (
          <div
            onMouseDown={(e) => handleMouseDown(e, 'image', 'image', template.image.x, template.image.y)}
            style={{
              position: 'absolute',
              left: `${template.image.x}px`,
              top: `${template.image.y}px`,
              width: `${template.image.width}px`,
              height: `${template.image.height}px`,
              cursor: editMode ? 'move' : 'default',
              border: editMode ? '2px dashed hsl(var(--primary))' : 'none',
              padding: editMode ? '4px' : '0',
              borderRadius: editMode ? '4px' : '0',
            }}
            className={editMode ? 'hover:border-primary' : ''}
          >
            {editMode && (
              <div className="absolute -top-6 left-0 text-xs text-primary font-medium bg-background px-2 py-1 rounded">
                <Move className="inline h-3 w-3 mr-1" />
                Vehicle Image
              </div>
            )}
            <img
              src={bill.frontImage || bill.rearImage || ''}
              alt="Vehicle"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                pointerEvents: 'none',
              }}
            />
          </div>
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
