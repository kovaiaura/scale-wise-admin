import { useState, useEffect } from 'react';
import { Save, Wifi, WifiOff, TestTube2, Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

  // Development Mode State
  const [developmentMode, setDevelopmentMode] = useState(() => {
    const saved = localStorage.getItem('developmentMode');
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Weighbridge Indicator Configuration
  const [connectionType, setConnectionType] = useState(() => 
    localStorage.getItem('weighbridgeConnectionType') || 'serial'
  );
  const [serialPort, setSerialPort] = useState(() => 
    localStorage.getItem('weighbridgeSerialPort') || 'COM1'
  );
  const [baudRate, setBaudRate] = useState(() => 
    localStorage.getItem('weighbridgeBaudRate') || '9600'
  );
  const [dataBits, setDataBits] = useState(() => 
    localStorage.getItem('weighbridgeDataBits') || '8'
  );
  const [parity, setParity] = useState(() => 
    localStorage.getItem('weighbridgeParity') || 'none'
  );
  const [stopBits, setStopBits] = useState(() => 
    localStorage.getItem('weighbridgeStopBits') || '1'
  );
  const [networkIp, setNetworkIp] = useState(() => 
    localStorage.getItem('weighbridgeNetworkIp') || '192.168.1.50'
  );
  const [networkPort, setNetworkPort] = useState(() => 
    localStorage.getItem('weighbridgeNetworkPort') || '4001'
  );
  const [protocol, setProtocol] = useState(() => 
    localStorage.getItem('weighbridgeProtocol') || 'generic-ascii'
  );
  const [weightUnit, setWeightUnit] = useState(() => 
    localStorage.getItem('weighbridgeUnit') || 'KG'
  );
  const [decimalPlaces, setDecimalPlaces] = useState(() => 
    localStorage.getItem('weighbridgeDecimalPlaces') || '0'
  );
  const [stabilityThreshold, setStabilityThreshold] = useState(() => 
    localStorage.getItem('weighbridgeStabilityThreshold') || '5'
  );

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

  const handleToggleDevelopmentMode = (enabled: boolean) => {
    setDevelopmentMode(enabled);
    localStorage.setItem('developmentMode', JSON.stringify(enabled));
    
    toast({
      title: enabled ? "Development Mode Enabled" : "Development Mode Disabled",
      description: enabled 
        ? "Using localStorage for data storage. No backend required." 
        : "Using Spring Boot API. Backend connection required.",
    });
  };

  const handleSaveWeighbridgeConfig = () => {
    localStorage.setItem('weighbridgeConnectionType', connectionType);
    localStorage.setItem('weighbridgeSerialPort', serialPort);
    localStorage.setItem('weighbridgeBaudRate', baudRate);
    localStorage.setItem('weighbridgeDataBits', dataBits);
    localStorage.setItem('weighbridgeParity', parity);
    localStorage.setItem('weighbridgeStopBits', stopBits);
    localStorage.setItem('weighbridgeNetworkIp', networkIp);
    localStorage.setItem('weighbridgeNetworkPort', networkPort);
    localStorage.setItem('weighbridgeProtocol', protocol);
    localStorage.setItem('weighbridgeUnit', weightUnit);
    localStorage.setItem('weighbridgeDecimalPlaces', decimalPlaces);
    localStorage.setItem('weighbridgeStabilityThreshold', stabilityThreshold);

    toast({
      title: "Weighbridge Configuration Saved",
      description: "Weight indicator settings updated successfully",
    });

    // Trigger reload of weighbridge service
    window.dispatchEvent(new Event('weighbridgeConfigChanged'));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Weighbridge Setup</h1>
        <p className="text-muted-foreground">Configure backend API and camera connections</p>
      </div>

      {/* Development Mode Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Development Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Enable Development Mode</Label>
              <p className="text-sm text-muted-foreground">
                Test frontend UI without backend connection. Uses localStorage for data storage.
              </p>
            </div>
            <Switch
              checked={developmentMode}
              onCheckedChange={handleToggleDevelopmentMode}
            />
          </div>
          
          {developmentMode && (
            <Alert>
              <AlertDescription>
                Development mode is active. All data is stored locally in your browser. 
                Backend API calls are bypassed.
              </AlertDescription>
            </Alert>
          )}

          {!developmentMode && (
            <Alert variant="destructive">
              <AlertDescription>
                Production mode requires Spring Boot backend running on the configured API URL below.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

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

      {/* Weighbridge Indicator Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            <CardTitle>Weighbridge Indicator Settings</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Connection Type</Label>
            <Select value={connectionType} onValueChange={setConnectionType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="serial">Serial Port (RS-232)</SelectItem>
                <SelectItem value="network">Network (TCP/IP)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {connectionType === 'serial' && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <h3 className="font-semibold">Serial Port Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Port Name</Label>
                  <Input 
                    value={serialPort} 
                    onChange={(e) => setSerialPort(e.target.value)} 
                    placeholder="COM1 or /dev/ttyUSB0" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Baud Rate</Label>
                  <Select value={baudRate} onValueChange={setBaudRate}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9600">9600</SelectItem>
                      <SelectItem value="19200">19200</SelectItem>
                      <SelectItem value="38400">38400</SelectItem>
                      <SelectItem value="57600">57600</SelectItem>
                      <SelectItem value="115200">115200</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data Bits</Label>
                  <Select value={dataBits} onValueChange={setDataBits}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Parity</Label>
                  <Select value={parity} onValueChange={setParity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="even">Even</SelectItem>
                      <SelectItem value="odd">Odd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Stop Bits</Label>
                  <Select value={stopBits} onValueChange={setStopBits}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {connectionType === 'network' && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <h3 className="font-semibold">Network Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>IP Address</Label>
                  <Input 
                    value={networkIp} 
                    onChange={(e) => setNetworkIp(e.target.value)} 
                    placeholder="192.168.1.50" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input 
                    value={networkPort} 
                    onChange={(e) => setNetworkPort(e.target.value)} 
                    placeholder="4001" 
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold">Indicator Protocol & Units</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Protocol</Label>
                <Select value={protocol} onValueChange={setProtocol}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="generic-ascii">Generic ASCII</SelectItem>
                    <SelectItem value="toledo">Toledo</SelectItem>
                    <SelectItem value="mettler-toledo">Mettler Toledo</SelectItem>
                    <SelectItem value="avery">Avery Weigh-Tronix</SelectItem>
                    <SelectItem value="rice-lake">Rice Lake</SelectItem>
                    <SelectItem value="cardinal">Cardinal Scale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Weight Unit</Label>
                <Select value={weightUnit} onValueChange={setWeightUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KG">Kilogram (KG)</SelectItem>
                    <SelectItem value="LB">Pound (LB)</SelectItem>
                    <SelectItem value="TON">Ton (TON)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Decimal Places</Label>
                <Select value={decimalPlaces} onValueChange={setDecimalPlaces}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Stability Threshold (KG)</Label>
                <Input 
                  type="number"
                  value={stabilityThreshold} 
                  onChange={(e) => setStabilityThreshold(e.target.value)} 
                  placeholder="5" 
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSaveWeighbridgeConfig} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Save Weighbridge Configuration
          </Button>
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
