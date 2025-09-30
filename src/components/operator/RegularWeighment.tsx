import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Check, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotification } from '@/contexts/NotificationContext';
import { mockVehicles, mockParties, mockProducts } from '@/utils/mockData';
import OpenTicketsTable from './OpenTicketsTable';

interface RegularWeighmentProps {
  liveWeight: number;
  isStable: boolean;
}

export default function RegularWeighment({ liveWeight, isStable }: RegularWeighmentProps) {
  const [vehicleNo, setVehicleNo] = useState('');
  const [partyName, setPartyName] = useState('');
  const [productName, setProductName] = useState('');
  const [weightType, setWeightType] = useState<'gross' | 'tare'>('gross');
  const { success } = useNotification();

  const handleCapture = () => {
    if (!vehicleNo || !partyName || !productName) {
      return;
    }
    
    if (weightType === 'gross') {
      success(`Gross weight ${liveWeight} kg captured! Ticket created (OPEN).`);
    } else {
      success(`Tare weight ${liveWeight} kg captured! Ticket closed, bill ready to print.`);
    }
    
    // Reset form
    setVehicleNo('');
    setPartyName('');
    setProductName('');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-[30%] space-y-6">
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
              animate={{ scale: isStable ? 1 : [1, 1.02, 1] }}
              transition={{ duration: 0.5, repeat: isStable ? 0 : Infinity }}
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
              </div>
            </div>
            <Button className="w-full mt-4">
              <Camera className="mr-2 h-4 w-4" />
              Capture Snapshot
            </Button>
          </CardContent>
        </Card>

      </div>

      <div className="w-full lg:w-[70%] space-y-6">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Capture Weighment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weight-type">Weight Type</Label>
              <Select value={weightType} onValueChange={(v) => setWeightType(v as 'gross' | 'tare')}>
                <SelectTrigger id="weight-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gross">Gross Weight</SelectItem>
                  <SelectItem value="tare">Tare Weight</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
              Capture {weightType === 'gross' ? 'Gross' : 'Tare'} Weight
            </Button>
          </CardContent>
        </Card>

        <OpenTicketsTable />
      </div>
    </div>
  );
}
