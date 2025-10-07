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
  pageWidth: number; // A5 Landscape width in pixels (for 72dpi: 842px)
  pageHeight: number; // A5 Landscape height in pixels (for 72dpi: 595px)
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
  frontImage: ImagePosition;
  rearImage: ImagePosition;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_TEMPLATE: PrintTemplate = {
  id: 'default',
  name: 'Default A5 Landscape Template',
  pageWidth: 842, // A5 Landscape at 72dpi (for screen preview)
  pageHeight: 595,
  fields: {
    ticketNo: { x: 50, y: 50, fontSize: 14, fontWeight: 'bold', align: 'left' },
    vehicleNo: { x: 50, y: 80, fontSize: 14, fontWeight: 'bold', align: 'left' },
    customerName: { x: 50, y: 110, fontSize: 12, align: 'left' },
    material: { x: 50, y: 140, fontSize: 12, align: 'left' },
    firstWeight: { x: 50, y: 200, fontSize: 16, fontWeight: 'bold', align: 'left' },
    secondWeight: { x: 250, y: 200, fontSize: 16, fontWeight: 'bold', align: 'left' },
    netWeight: { x: 450, y: 200, fontSize: 18, fontWeight: 'bold', align: 'left' },
    dateTime: { x: 50, y: 500, fontSize: 10, align: 'left' },
    amount: { x: 50, y: 530, fontSize: 14, fontWeight: 'bold', align: 'left' },
  },
  frontImage: {
    x: 500,
    y: 250,
    width: 150,
    height: 120,
  },
  rearImage: {
    x: 670,
    y: 250,
    width: 150,
    height: 120,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
