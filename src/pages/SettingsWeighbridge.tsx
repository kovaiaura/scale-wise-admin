import { useState } from 'react';
import { Save, Wifi, WifiOff, TestTube2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export default function SettingsWeighbridge() {
  const { toast } = useToast();
  const [indicatorPort, setIndicatorPort] = useState('COM3');
  const [indicatorBaudRate, setIndicatorBaudRate] = useState('9600');
  const [cameraIp, setCameraIp] = useState('192.168.1.100');
  const [cameraPort, setCameraPort] = useState('8080');
  const [autoCapture, setAutoCapture] = useState(true);
  const [indicatorStatus, setIndicatorStatus] = useState<'online' | 'offline'>('online');
  const [cameraStatus, setCameraStatus] = useState<'online' | 'offline'>('offline');

  const handleTestIndicator = () => {
    toast({
      title: "Testing Indicator Connection",
      description: "Attempting to connect to weighbridge indicator...",
    });
    
    // Simulate connection test
    setTimeout(() => {
      const isOnline = Math.random() > 0.3;
      setIndicatorStatus(isOnline ? 'online' : 'offline');
      toast({
        title: isOnline ? "Connection Successful" : "Connection Failed",
        description: isOnline 
          ? "Weighbridge indicator is responding correctly" 
          : "Unable to connect to weighbridge indicator",
        variant: isOnline ? "default" : "destructive",
      });
    }, 1500);
  };

  const handleTestCamera = () => {
    toast({
      title: "Testing Camera Connection",
      description: "Attempting to connect to camera...",
    });
    
    // Simulate connection test
    setTimeout(() => {
      const isOnline = Math.random() > 0.3;
      setCameraStatus(isOnline ? 'online' : 'offline');
      toast({
        title: isOnline ? "Connection Successful" : "Connection Failed",
        description: isOnline 
          ? "Camera is responding correctly" 
          : "Unable to connect to camera",
        variant: isOnline ? "default" : "destructive",
      });
    }, 1500);
  };

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Weighbridge configuration has been updated successfully",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Weighbridge Setup</h1>
        <p className="text-muted-foreground">Configure hardware devices and connections</p>
      </div>

      {/* Weighbridge Indicator */}
      <Card className="card-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Weighbridge Indicator</CardTitle>
            <div className="flex items-center gap-2">
              {indicatorStatus === 'online' ? (
                <div className="flex items-center gap-2 text-green-500">
                  <Wifi className="h-4 w-4" />
                  <span className="text-sm font-medium">Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm font-medium">Offline</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="indicator-port">COM Port</Label>
              <Input
                id="indicator-port"
                value={indicatorPort}
                onChange={(e) => setIndicatorPort(e.target.value)}
                placeholder="e.g., COM3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="baud-rate">Baud Rate</Label>
              <Input
                id="baud-rate"
                value={indicatorBaudRate}
                onChange={(e) => setIndicatorBaudRate(e.target.value)}
                placeholder="e.g., 9600"
              />
            </div>
          </div>
          <Button onClick={handleTestIndicator} variant="outline" className="w-full">
            <TestTube2 className="mr-2 h-4 w-4" />
            Test Connection
          </Button>
        </CardContent>
      </Card>

      {/* Camera Configuration */}
      <Card className="card-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Camera Configuration</CardTitle>
            <div className="flex items-center gap-2">
              {cameraStatus === 'online' ? (
                <div className="flex items-center gap-2 text-green-500">
                  <Wifi className="h-4 w-4" />
                  <span className="text-sm font-medium">Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm font-medium">Offline</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="camera-ip">Camera IP Address</Label>
              <Input
                id="camera-ip"
                value={cameraIp}
                onChange={(e) => setCameraIp(e.target.value)}
                placeholder="e.g., 192.168.1.100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="camera-port">Camera Port</Label>
              <Input
                id="camera-port"
                value={cameraPort}
                onChange={(e) => setCameraPort(e.target.value)}
                placeholder="e.g., 8080"
              />
            </div>
          </div>
          <Button onClick={handleTestCamera} variant="outline" className="w-full">
            <TestTube2 className="mr-2 h-4 w-4" />
            Test Connection
          </Button>
        </CardContent>
      </Card>

      {/* Auto-Capture Settings */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Capture Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-capture">Auto-Capture on Stability</Label>
              <p className="text-sm text-muted-foreground">
                Automatically capture weight when reading becomes stable
              </p>
            </div>
            <Switch
              id="auto-capture"
              checked={autoCapture}
              onCheckedChange={setAutoCapture}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          <Save className="mr-2 h-4 w-4" />
          Save Configuration
        </Button>
      </div>
    </div>
  );
}
