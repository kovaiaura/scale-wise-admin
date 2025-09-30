import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Check, X, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNotification } from '@/contexts/NotificationContext';
import { mockVehicles, mockParties, mockProducts } from '@/utils/mockData';

export default function OperatorConsole() {
  const [liveWeight, setLiveWeight] = useState(0);
  const [isStable, setIsStable] = useState(false);
  const [vehicleNo, setVehicleNo] = useState('');
  const [partyName, setPartyName] = useState('');
  const [productName, setProductName] = useState('');
  const [containerType, setContainerType] = useState<'Load' | 'Empty'>('Load');
  const { success } = useNotification();

  // Simulate live weight updates
  useEffect(() => {
    const interval = setInterval(() => {
      const baseWeight = 12000;
      const variation = isStable ? Math.random() * 10 : Math.random() * 500;
      setLiveWeight(Math.round(baseWeight + variation));
    }, 500);

    return () => clearInterval(interval);
  }, [isStable]);

  const handleCapture = () => {
    if (!vehicleNo || !partyName || !productName) {
      return;
    }
    success('Weighment ticket captured successfully!');
    // Reset form
    setVehicleNo('');
    setPartyName('');
    setProductName('');
  };

  const toggleStability = () => {
    setIsStable(!isStable);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Operator Console</h1>
        <p className="text-muted-foreground">Live weighing operations</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Live Weight Display
                <Badge variant={isStable ? 'default' : 'destructive'} className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  {isStable ? 'Stable' : 'Unstable'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div
                animate={{
                  scale: isStable ? 1 : [1, 1.02, 1],
                }}
                transition={{
                  duration: 0.5,
                  repeat: isStable ? 0 : Infinity,
                }}
                className={`text-center p-12 rounded-2xl ${
                  isStable ? 'bg-success/10' : 'bg-warning/10'
                }`}
              >
                <div className={`led-display text-7xl font-bold ${
                  isStable ? 'text-success' : 'text-warning'
                }`}>
                  {liveWeight.toLocaleString()}
                </div>
                <div className="text-2xl font-medium text-muted-foreground mt-2">KG</div>
              </motion.div>

              <div className="flex gap-4 mt-6">
                <Button onClick={toggleStability} variant="outline" className="flex-1">
                  {isStable ? (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Simulate Unstable
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Simulate Stable
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>Camera Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Camera feed placeholder</p>
                  <p className="text-sm text-muted-foreground mt-2">Live video stream will appear here</p>
                </div>
              </div>
              <Button className="w-full mt-4">
                <Camera className="mr-2 h-4 w-4" />
                Capture Snapshot
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>Ticket Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle">Vehicle Number</Label>
                <Select value={vehicleNo} onValueChange={setVehicleNo}>
                  <SelectTrigger id="vehicle">
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.vehicleNo}>
                        {vehicle.vehicleNo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="party">Party Name</Label>
                <Select value={partyName} onValueChange={setPartyName}>
                  <SelectTrigger id="party">
                    <SelectValue placeholder="Select party" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockParties.map((party) => (
                      <SelectItem key={party.id} value={party.partyName}>
                        {party.partyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product">Product</Label>
                <Select value={productName} onValueChange={setProductName}>
                  <SelectTrigger id="product">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProducts.map((product) => (
                      <SelectItem key={product.id} value={product.productName}>
                        {product.productName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="container">Container Type</Label>
                <Select
                  value={containerType}
                  onValueChange={(value) => setContainerType(value as 'Load' | 'Empty')}
                >
                  <SelectTrigger id="container">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Load">Load</SelectItem>
                    <SelectItem value="Empty">Empty</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Weight:</span>
                  <span className="font-mono font-bold">{liveWeight} kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={isStable ? 'default' : 'secondary'}>
                    {isStable ? 'Ready' : 'Waiting'}
                  </Badge>
                </div>
              </div>

              <Button
                onClick={handleCapture}
                disabled={!isStable || !vehicleNo || !partyName || !productName}
                className="w-full"
              >
                <Check className="mr-2 h-4 w-4" />
                Capture Weighment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
