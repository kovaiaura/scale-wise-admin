import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Eye, RotateCcw, Hash, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSerialNumberConfig, updateSerialNumberConfig, previewSerialNumber } from '@/services/api/serialNumberService';

interface SerialNumberConfig {
  prefix: string;
  separator: string;
  includeYear: boolean;
  includeMonth: boolean;
  yearFormat: 'YYYY' | 'YY';
  counterStart: number;
  counterPadding: number;
  currentCounter: number;
  resetFrequency: 'yearly' | 'monthly' | 'never';
  lastResetDate?: string;
}

export default function SettingsSerialNumber() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SerialNumberConfig>({
    prefix: 'WB',
    separator: '-',
    includeYear: true,
    includeMonth: false,
    yearFormat: 'YYYY',
    counterStart: 1,
    counterPadding: 3,
    currentCounter: 1,
    resetFrequency: 'yearly',
  });
  const [preview, setPreview] = useState('WB-2025-001');

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    generatePreview();
  }, [config]);

  const loadConfig = async () => {
    setLoading(true);
    const { data, error } = await getSerialNumberConfig();
    if (data) {
      setConfig(data);
    } else if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load configuration',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const generatePreview = () => {
    const now = new Date();
    const year = config.yearFormat === 'YY' 
      ? String(now.getFullYear()).slice(-2) 
      : String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const counter = String(config.currentCounter).padStart(config.counterPadding, '0');

    let previewStr = config.prefix;
    if (config.includeYear) {
      previewStr += config.separator + year;
    }
    if (config.includeMonth) {
      previewStr += config.separator + month;
    }
    previewStr += config.separator + counter;

    setPreview(previewStr);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data, error } = await updateSerialNumberConfig(config);
    if (data) {
      toast({
        title: 'Success',
        description: 'Serial number configuration updated successfully',
      });
      setConfig(data);
    } else if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
    setSaving(false);
  };

  const handleResetCounter = async () => {
    if (!confirm('Are you sure you want to reset the counter? This will set it back to the starting number.')) {
      return;
    }
    
    setSaving(true);
    const { data, error } = await updateSerialNumberConfig({
      ...config,
      resetCounterNow: true,
    });
    
    if (data) {
      toast({
        title: 'Success',
        description: 'Counter reset successfully',
      });
      setConfig(data);
    } else if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
    setSaving(false);
  };

  const updateConfig = (field: keyof SerialNumberConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading configuration...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Serial Number Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Configure the format and behavior of bill serial numbers
        </p>
      </div>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Live Preview
          </CardTitle>
          <CardDescription>
            This is how your next bill number will look
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
            <div className="text-5xl font-mono font-bold text-primary">
              {preview}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Format Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Format Configuration
          </CardTitle>
          <CardDescription>
            Customize the structure of your serial numbers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="prefix">Prefix</Label>
              <Input
                id="prefix"
                value={config.prefix}
                onChange={(e) => updateConfig('prefix', e.target.value.toUpperCase())}
                placeholder="WB"
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                Text that appears at the start (e.g., WB, INV, BILL)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="separator">Separator</Label>
              <Input
                id="separator"
                value={config.separator}
                onChange={(e) => updateConfig('separator', e.target.value)}
                placeholder="-"
                maxLength={5}
              />
              <p className="text-xs text-muted-foreground">
                Character between components (e.g., -, /, _)
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="includeYear">Include Year</Label>
                <p className="text-sm text-muted-foreground">
                  Add year to the serial number
                </p>
              </div>
              <Switch
                id="includeYear"
                checked={config.includeYear}
                onCheckedChange={(checked) => updateConfig('includeYear', checked)}
              />
            </div>

            {config.includeYear && (
              <div className="ml-4 space-y-2">
                <Label htmlFor="yearFormat">Year Format</Label>
                <Select
                  value={config.yearFormat}
                  onValueChange={(value) => updateConfig('yearFormat', value)}
                >
                  <SelectTrigger id="yearFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YYYY">4 digits (2025)</SelectItem>
                    <SelectItem value="YY">2 digits (25)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="includeMonth">Include Month</Label>
                <p className="text-sm text-muted-foreground">
                  Add month to the serial number
                </p>
              </div>
              <Switch
                id="includeMonth"
                checked={config.includeMonth}
                onCheckedChange={(checked) => updateConfig('includeMonth', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Counter Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Counter Settings</CardTitle>
          <CardDescription>
            Configure the numeric counter behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="counterStart">Starting Number</Label>
              <Input
                id="counterStart"
                type="number"
                min={1}
                value={config.counterStart}
                onChange={(e) => updateConfig('counterStart', parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">
                First number in sequence
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="counterPadding">Number of Digits</Label>
              <Select
                value={String(config.counterPadding)}
                onValueChange={(value) => updateConfig('counterPadding', parseInt(value))}
              >
                <SelectTrigger id="counterPadding">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 (1, 2, 3...)</SelectItem>
                  <SelectItem value="2">2 (01, 02, 03...)</SelectItem>
                  <SelectItem value="3">3 (001, 002, 003...)</SelectItem>
                  <SelectItem value="4">4 (0001, 0002...)</SelectItem>
                  <SelectItem value="5">5 (00001, 00002...)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Leading zeros for padding
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentCounter">Current Value</Label>
              <Input
                id="currentCounter"
                type="number"
                value={config.currentCounter}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Next number to be used
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resetFrequency">Auto Reset Frequency</Label>
            <Select
              value={config.resetFrequency}
              onValueChange={(value) => updateConfig('resetFrequency', value)}
            >
              <SelectTrigger id="resetFrequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yearly">Reset Every Year</SelectItem>
                <SelectItem value="monthly">Reset Every Month</SelectItem>
                <SelectItem value="never">Never Reset (Continuous)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              When should the counter go back to the starting number?
            </p>
          </div>

          {config.lastResetDate && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Last reset: {new Date(config.lastResetDate).toLocaleDateString()}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleResetCounter}
              disabled={saving}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Counter Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={loadConfig}
          disabled={loading || saving}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}
