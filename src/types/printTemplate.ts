// Print template configuration types

export interface FieldPosition {
  x: number; // pixels from left
  y: number; // pixels from top
  fontSize: number; // in pixels
  fontWeight?: 'normal' | 'bold';
  align?: 'left' | 'center' | 'right';
}

export interface ImagePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PrintTemplate {
  id: string;
  name: string;
  pageWidth: number; // A5 width in pixels (for 300dpi: 1748px)
  pageHeight: number; // A5 height in pixels (for 300dpi: 2480px)
  fields: {
    ticketNo: FieldPosition;
    vehicleNo: FieldPosition;
    customerName: FieldPosition;
    material: FieldPosition;
    firstWeight: FieldPosition;
    secondWeight: FieldPosition;
    netWeight: FieldPosition;
    dateTime: FieldPosition;
    amount: FieldPosition;
  };
  image: ImagePosition;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_TEMPLATE: PrintTemplate = {
  id: 'default',
  name: 'Default A5 Template',
  pageWidth: 595, // A5 at 72dpi (for screen preview)
  pageHeight: 842,
  fields: {
    ticketNo: { x: 200, y: 100, fontSize: 14, fontWeight: 'bold', align: 'left' },
    vehicleNo: { x: 200, y: 130, fontSize: 14, fontWeight: 'bold', align: 'left' },
    customerName: { x: 200, y: 160, fontSize: 12, align: 'left' },
    material: { x: 200, y: 190, fontSize: 12, align: 'left' },
    firstWeight: { x: 80, y: 300, fontSize: 16, fontWeight: 'bold', align: 'center' },
    secondWeight: { x: 80, y: 450, fontSize: 16, fontWeight: 'bold', align: 'center' },
    netWeight: { x: 80, y: 600, fontSize: 18, fontWeight: 'bold', align: 'center' },
    dateTime: { x: 400, y: 700, fontSize: 10, align: 'left' },
    amount: { x: 200, y: 750, fontSize: 14, fontWeight: 'bold', align: 'left' },
  },
  image: {
    x: 200,
    y: 350,
    width: 250,
    height: 180,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
