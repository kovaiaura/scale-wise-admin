import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PrintTemplate, FieldPosition } from '@/types/printTemplate';
import { printTemplateService } from '@/services/printTemplateService';
import { PrintTemplateComponent } from '@/components/print/PrintTemplate';
import { Bill } from '@/types/weighment';
import { Save, RotateCcw, Printer, Edit3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const SAMPLE_BILL: Bill = {
  id: '1',
  billNo: 'B001',
  ticketNo: 'T12345',
  vehicleNo: 'KA-01-AB-1234',
  partyName: 'Sample Customer',
  productName: 'Rice',
  grossWeight: 2500,
  tareWeight: 500,
  netWeight: 2000,
  charges: 150,
  capturedImage: null,
  frontImage: 'https://images.unsplash.com/photo-1511527844068-006b95d162c8?w=400',
  rearImage: null,
  status: 'CLOSED',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  firstWeightType: 'gross',
};

export default function PrintSettings() {
  const [template, setTemplate] = useState<PrintTemplate>(() => printTemplateService.loadTemplate());
  const [selectedField, setSelectedField] = useState<keyof PrintTemplate['fields'] | 'image' | null>(null);
  const [editMode, setEditMode] = useState(false);
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const handleSave = () => {
    printTemplateService.saveTemplate(template);
    toast({
      title: 'Template Saved',
      description: 'Print template configuration has been saved successfully.',
    });
  };

  const handleReset = () => {
    const defaultTemplate = printTemplateService.resetTemplate();
    setTemplate(defaultTemplate);
    toast({
      title: 'Template Reset',
      description: 'Print template has been reset to default settings.',
    });
  };

  const handleTestPrint = () => {
    window.print();
  };

  const updateFieldPosition = (
    field: keyof PrintTemplate['fields'],
    property: keyof FieldPosition,
    value: number | string
  ) => {
    setTemplate((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [field]: {
          ...prev.fields[field],
          [property]: property === 'align' || property === 'fontWeight' ? value : Number(value),
        },
      },
    }));
  };

  const updateImagePosition = (property: 'x' | 'y' | 'width' | 'height', value: number) => {
    setTemplate((prev) => ({
      ...prev,
      image: {
        ...prev.image,
        [property]: value,
      },
    }));
  };

  const handleFieldDrag = (field: keyof PrintTemplate['fields'], x: number, y: number) => {
    setTemplate((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [field]: {
          ...prev.fields[field],
          x,
          y,
        },
      },
    }));
  };

  const handleImageDrag = (x: number, y: number) => {
    setTemplate((prev) => ({
      ...prev,
      image: {
        ...prev.image,
        x,
        y,
      },
    }));
  };

  const fieldLabels: Record<keyof PrintTemplate['fields'], string> = {
    ticketNo: 'Ticket Number',
    vehicleNo: 'Vehicle Number',
    customerName: 'Customer Name',
    material: 'Material',
    firstWeight: '1st Weight',
    secondWeight: '2nd Weight',
    netWeight: 'Net Weight',
    dateTime: 'Date & Time',
    amount: 'Amount',
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Print Template Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure print positions for your pre-printed A5 bills
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleReset} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Print Preview</CardTitle>
                <CardDescription>
                  {editMode
                    ? 'Drag fields to reposition them on the template'
                    : 'This shows how the bill will be printed'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="edit-mode" className="text-sm cursor-pointer">
                    Edit Mode
                  </Label>
                  <Switch id="edit-mode" checked={editMode} onCheckedChange={setEditMode} />
                </div>
              </div>
            </div>
            {!editMode && (
              <Button onClick={handleTestPrint} className="mt-2">
                <Printer className="mr-2 h-4 w-4" />
                Test Print
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editMode && (
              <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
                <div className="flex items-start gap-2">
                  <Edit3 className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-primary">Drag & Drop Mode Active</p>
                    <p className="text-muted-foreground mt-1">
                      Click and drag any field or image to reposition. Coordinates update automatically.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="border rounded-lg overflow-auto" style={{ maxHeight: '800px' }}>
              <PrintTemplateComponent
                ref={printRef}
                bill={SAMPLE_BILL}
                template={template}
                editMode={editMode}
                onFieldUpdate={handleFieldDrag}
                onImageUpdate={handleImageDrag}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Field Positions</CardTitle>
            <CardDescription>
              Adjust X, Y coordinates and font sizes for each field
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="fields" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="fields">Text Fields</TabsTrigger>
                <TabsTrigger value="image">Image</TabsTrigger>
              </TabsList>

              <TabsContent value="fields" className="space-y-4 mt-4">
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {(Object.keys(template.fields) as Array<keyof PrintTemplate['fields']>).map((fieldKey) => (
                    <Card key={fieldKey} className="p-4">
                      <h3 className="font-semibold mb-3">{fieldLabels[fieldKey]}</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`${fieldKey}-x`}>X Position (px)</Label>
                          <Input
                            id={`${fieldKey}-x`}
                            type="number"
                            value={template.fields[fieldKey].x}
                            onChange={(e) => updateFieldPosition(fieldKey, 'x', Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`${fieldKey}-y`}>Y Position (px)</Label>
                          <Input
                            id={`${fieldKey}-y`}
                            type="number"
                            value={template.fields[fieldKey].y}
                            onChange={(e) => updateFieldPosition(fieldKey, 'y', Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`${fieldKey}-fontSize`}>Font Size (px)</Label>
                          <Input
                            id={`${fieldKey}-fontSize`}
                            type="number"
                            value={template.fields[fieldKey].fontSize}
                            onChange={(e) => updateFieldPosition(fieldKey, 'fontSize', Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`${fieldKey}-fontWeight`}>Font Weight</Label>
                          <Select
                            value={template.fields[fieldKey].fontWeight || 'normal'}
                            onValueChange={(value) => updateFieldPosition(fieldKey, 'fontWeight', value)}
                          >
                            <SelectTrigger id={`${fieldKey}-fontWeight`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="bold">Bold</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="image" className="space-y-4 mt-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Vehicle Image</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="image-x">X Position (px)</Label>
                      <Input
                        id="image-x"
                        type="number"
                        value={template.image.x}
                        onChange={(e) => updateImagePosition('x', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="image-y">Y Position (px)</Label>
                      <Input
                        id="image-y"
                        type="number"
                        value={template.image.y}
                        onChange={(e) => updateImagePosition('y', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="image-width">Width (px)</Label>
                      <Input
                        id="image-width"
                        type="number"
                        value={template.image.width}
                        onChange={(e) => updateImagePosition('width', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="image-height">Height (px)</Label>
                      <Input
                        id="image-height"
                        type="number"
                        value={template.image.height}
                        onChange={(e) => updateImagePosition('height', Number(e.target.value))}
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
