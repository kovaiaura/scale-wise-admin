import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Server, HardDrive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export default function ModeToggle() {
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
  
  // Don't show this component in Tauri desktop app
  if (isTauri) {
    return null;
  }

  const [isOfflineMode, setIsOfflineMode] = useState(() => {
    return localStorage.getItem('developmentMode') === 'true';
  });

  const handleModeToggle = (checked: boolean) => {
    localStorage.setItem('developmentMode', checked.toString());
    setIsOfflineMode(checked);
    
    // Reload the page to apply the new mode
    window.location.reload();
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isOfflineMode ? (
            <HardDrive className="h-5 w-5 text-primary" />
          ) : (
            <Server className="h-5 w-5 text-primary" />
          )}
          Application Mode
        </CardTitle>
        <CardDescription>
          Switch between offline (localStorage) and online (API) data storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border-2 border-primary/20">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Label className="text-base font-semibold cursor-pointer">
                Offline Mode (Development)
              </Label>
              <Badge variant={isOfflineMode ? "default" : "outline"} className="gap-1">
                {isOfflineMode ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
                {isOfflineMode ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {isOfflineMode 
                ? "Using localStorage - No backend required" 
                : "Using API calls - Backend server must be running at localhost:8080"}
            </p>
          </div>
          <Switch 
            checked={isOfflineMode}
            onCheckedChange={handleModeToggle}
          />
        </div>

        {isOfflineMode ? (
          <Alert className="border-green-500/50 bg-green-500/10">
            <HardDrive className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-xs">
              <strong>Offline Mode Active:</strong> All data is stored in browser localStorage. Perfect for testing without a backend server.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-blue-500/50 bg-blue-500/10">
            <Server className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-xs">
              <strong>Online Mode Active:</strong> Data is saved via API calls to http://localhost:8080. Ensure your Spring Boot backend is running.
            </AlertDescription>
          </Alert>
        )}

        <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
          <p><strong>Note:</strong> Switching modes will reload the application.</p>
          <p>In desktop app builds, this toggle is hidden as the mode is automatically set to Offline.</p>
        </div>
      </CardContent>
    </Card>
  );
}
