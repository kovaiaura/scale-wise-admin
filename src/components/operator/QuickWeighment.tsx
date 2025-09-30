import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Check, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotification } from '@/contexts/NotificationContext';
import { mockVehicles, mockProducts } from '@/utils/mockData';

interface QuickWeighmentProps {
  liveWeight: number;
  isStable: boolean;
}

export default function QuickWeighment({ liveWeight, isStable }: QuickWeighmentProps) {
  const [vehicleNo, setVehicleNo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [productName, setProductName] = useState('');
  const { success } = useNotification();

  const handleCapture = () => {
    if (!vehicleNo || !customerName || !productName) return;
    success(`One-time weighment captured! Weight: ${liveWeight} kg. Bill generated (CLOSED).`);
    
    // Reset form
    setVehicleNo('');
    setCustomerName('');
    setProductName('');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-[30%]">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-warning" />
                Quick Weighment - Walk-In Customer
              </span>
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
              className={`text-center p-16 rounded-2xl ${
                isStable ? 'bg-success/10' : 'bg-warning/10'
              }`}
            >
              <div className={`led-display text-4xl md:text-5xl font-bold ${
                isStable ? 'text-success' : 'text-warning'
              }`}>
                {liveWeight.toLocaleString()}
              </div>
              <div className="text-xl font-medium text-muted-foreground mt-4">KG</div>
            </motion.div>

            <div className="mt-6 p-6 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Quick Weighment Mode
              </h4>
              <p className="text-sm text-muted-foreground">
                This mode is for one-time/walk-in customers. Bill is generated immediately as CLOSED.
                No return trip required.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="w-full lg:w-[70%]">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer Name</Label>
              <Input
                id="customer"
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle">Vehicle Number</Label>
              <Select value={vehicleNo} onValueChange={setVehicleNo}>
                <SelectTrigger id="vehicle">
                  <SelectValue placeholder="Select or enter vehicle" />
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
                <span className="text-muted-foreground">Weight:</span>
                <span className="font-mono font-bold">{liveWeight} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={isStable ? 'default' : 'secondary'}>
                  {isStable ? 'Ready' : 'Waiting'}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bill Status:</span>
                <Badge variant="outline">Will Close Immediately</Badge>
              </div>
            </div>

            <Button
              onClick={handleCapture}
              disabled={!isStable || !vehicleNo || !customerName || !productName}
              className="w-full"
            >
              <Check className="mr-2 h-4 w-4" />
              Capture & Generate Bill
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
