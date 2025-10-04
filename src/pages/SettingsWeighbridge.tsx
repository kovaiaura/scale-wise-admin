import { useState, useEffect } from 'react';
import { Save, Wifi, WifiOff, TestTube2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getApiBaseUrl, setApiBaseUrl } from '@/config/api';
import { testApiConnection } from '@/services/apiClient';
import { saveCameraConfig } from '@/services/cameraService';

export default function SettingsWeighbridge() {
  const { toast } = useToast();
  const [apiBaseUrl, setApiBaseUrlState] = useState(getApiBaseUrl());
  const [apiStatus, setApiStatus] = useState<'online' | 'offline'>('offline');
  
  // Camera configuration
  const [frontCameraIp, setFrontCameraIp] = useState('');
  const [frontUsername, setFrontUsername] = useState('admin');
  const [frontPassword, setFrontPassword] = useState('');
  const [rearCameraIp, setRearCameraIp] = useState('');
  const [rearUsername, setRearUsername] = useState('admin');
  const [rearPassword, setRearPassword] = useState('');
  const [cameraBrand, setCameraBrand] = useState('hikvision');
  const [cameraEnabledByDefault, setCameraEnabledByDefault] = useState(() => {
    const saved = localStorage.getItem('cameraEnabledByDefault');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    handleTestApi();
  }, []);

  const handleTestApi = async () => {
    const isConnected = await testApiConnection();
    setApiStatus(isConnected ? 'online' : 'offline');
  };

  const handleSaveApiUrl = () => {
    setApiBaseUrl(apiBaseUrl);
    toast({
      title: "API URL Saved",
      description: "Spring Boot backend URL updated",
    });
    handleTestApi();
  };

  const handleSaveCameraConfig = async () => {
    const result = await saveCameraConfig({
      frontIp: frontCameraIp,
      frontUsername,
      frontPassword,
      rearIp: rearCameraIp,
      rearUsername,
      rearPassword,
      brand: cameraBrand
    });

    // Save camera default setting to localStorage
    localStorage.setItem('cameraEnabledByDefault', JSON.stringify(cameraEnabledByDefault));

    if (result.success) {
      toast({
        title: "Camera Configuration Saved",
        description: "CCTV camera settings updated successfully",
      });
    } else {
      toast({
        title: "Save Failed",
        description: result.error || "Failed to save camera configuration",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Weighbridge Setup</h1>
        <p className="text-muted-foreground">Configure backend API and camera connections</p>
      </div>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Spring Boot Backend API</CardTitle>
            <div className="flex items-center gap-2">
              {apiStatus === 'online' ? (
                <div className="flex items-center gap-2 text-green-500">
                  <Wifi className="h-4 w-4" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm font-medium">Disconnected</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-url">API Base URL</Label>
            <Input
              id="api-url"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrlState(e.target.value)}
              placeholder="http://localhost:8080"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleTestApi} variant="outline" className="flex-1">
              <TestTube2 className="mr-2 h-4 w-4" />
              Test Connection
            </Button>
            <Button onClick={handleSaveApiUrl} className="flex-1">
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Camera Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>CCTV Camera Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Camera Brand</Label>
            <Select value={cameraBrand} onValueChange={setCameraBrand}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hikvision">HikVision</SelectItem>
                <SelectItem value="dahua">Dahua</SelectItem>
                <SelectItem value="cpplus">CP Plus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Front Camera</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>IP Address</Label>
                <Input value={frontCameraIp} onChange={(e) => setFrontCameraIp(e.target.value)} placeholder="192.168.1.100" />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={frontUsername} onChange={(e) => setFrontUsername(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={frontPassword} onChange={(e) => setFrontPassword(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Rear Camera</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>IP Address</Label>
                <Input value={rearCameraIp} onChange={(e) => setRearCameraIp(e.target.value)} placeholder="192.168.1.101" />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={rearUsername} onChange={(e) => setRearUsername(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={rearPassword} onChange={(e) => setRearPassword(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <Label className="text-base font-semibold">Camera Capture Default</Label>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Enable Camera Capture by Default</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {cameraEnabledByDefault 
                    ? "Camera capture will be enabled for new weighments" 
                    : "Camera capture will be disabled for new weighments"}
                </p>
              </div>
              <Switch 
                checked={cameraEnabledByDefault}
                onCheckedChange={setCameraEnabledByDefault}
              />
            </div>
          </div>

          <Button onClick={handleSaveCameraConfig} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Save Camera Configuration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
