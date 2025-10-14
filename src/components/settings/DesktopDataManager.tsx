import { useState } from 'react';
import { HardDrive, Download, Upload, Trash2, FileSpreadsheet, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { exportBillsToExcel } from '@/utils/exportUtils';
import { getBills } from '@/services/unifiedServices';

export default function DesktopDataManager() {
  const { toast } = useToast();
  const [dbSize, setDbSize] = useState(() => {
    // Calculate approximate localStorage size
    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return (total / 1024).toFixed(2); // KB
  });

  const handleBackupDatabase = () => {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        data: { ...localStorage }
      };
      
      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `weighbridge-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Backup Created",
        description: "Database backup downloaded successfully"
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Failed to create backup",
        variant: "destructive"
      });
    }
  };

  const handleRestoreDatabase = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const backup = JSON.parse(event.target?.result as string);
          
          // Clear existing data
          localStorage.clear();
          
          // Restore backup
          for (const key in backup.data) {
            localStorage.setItem(key, backup.data[key]);
          }

          toast({
            title: "Restore Complete",
            description: "Database restored successfully. Please reload the page."
          });
          
          setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
          toast({
            title: "Restore Failed",
            description: "Invalid backup file",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleExportToExcel = async () => {
    try {
      const bills = await getBills();
      exportBillsToExcel(bills, `weighbridge-data`);
      
      toast({
        title: "Export Successful",
        description: "Data exported to Excel successfully"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data",
        variant: "destructive"
      });
    }
  };

  const handleClearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      localStorage.clear();
      toast({
        title: "Data Cleared",
        description: "All data has been cleared. Please reload the page."
      });
      setTimeout(() => window.location.reload(), 2000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Local Data Storage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Desktop mode stores all data locally on this computer. Regular backups are recommended.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Storage Location</span>
            </div>
            <p className="text-xs text-muted-foreground">Browser LocalStorage</p>
          </div>

          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Database Size</span>
            </div>
            <p className="text-xs text-muted-foreground">{dbSize} KB</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button onClick={handleBackupDatabase} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Backup Data
          </Button>

          <Button onClick={handleRestoreDatabase} variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Restore Data
          </Button>

          <Button onClick={handleExportToExcel} variant="outline">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>

          <Button onClick={handleClearAllData} variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
