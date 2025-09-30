import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Check, Save, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNotification } from '@/contexts/NotificationContext';
import { mockVehicles, mockParties, mockProducts } from '@/utils/mockData';

interface ShuttleWeighmentProps {
  liveWeight: number;
  isStable: boolean;
}

const mockShuttleTrips = [
  { id: '1', tripNo: 1, grossWeight: 15000, netWeight: 10000, time: '09:30' },
  { id: '2', tripNo: 2, grossWeight: 14500, netWeight: 9500, time: '11:15' },
];

export default function ShuttleWeighment({ liveWeight, isStable }: ShuttleWeighmentProps) {
  const [vehicleNo, setVehicleNo] = useState('');
  const [partyName, setPartyName] = useState('');
  const [productName, setProductName] = useState('');
  const [baseTare, setBaseTare] = useState<number | null>(5000);
  const { success } = useNotification();

  const handleCaptureBaseTare = () => {
    if (!vehicleNo) return;
    setBaseTare(liveWeight);
    success(`Base tare ${liveWeight} kg saved for ${vehicleNo}`);
  };

  const handleCaptureGross = () => {
    if (!vehicleNo || !partyName || !productName || !baseTare) return;
    const netWeight = liveWeight - baseTare;
    success(`Trip captured! Gross: ${liveWeight} kg, Net: ${netWeight} kg`);
  };

  const handleUpdateBaseTare = () => {
    if (!isStable) return;
    setBaseTare(liveWeight);
    success(`Base tare updated to ${liveWeight} kg`);
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
              <div className={`led-display text-4xl md:text-5xl font-bold ${
                isStable ? 'text-success' : 'text-warning'
              }`}>
                {liveWeight.toLocaleString()}
              </div>
              <div className="text-xl font-medium text-muted-foreground mt-2">KG</div>
            </motion.div>

            {baseTare && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Base Tare Weight</p>
                    <p className="text-2xl font-bold">{baseTare.toLocaleString()} kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Net</p>
                    <p className="text-2xl font-bold text-primary">
                      {(liveWeight - baseTare).toLocaleString()} kg
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      <div className="w-full lg:w-[70%] space-y-6">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Shuttle Setup</CardTitle>
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

            {!baseTare && (
              <Button
                onClick={handleCaptureBaseTare}
                disabled={!isStable || !vehicleNo}
                className="w-full"
                variant="outline"
              >
                <Save className="mr-2 h-4 w-4" />
                Capture Base Tare
              </Button>
            )}

            {baseTare && (
              <>
                <Button
                  onClick={handleCaptureGross}
                  disabled={!isStable || !vehicleNo || !partyName || !productName}
                  className="w-full"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Capture Trip
                </Button>

                <Button
                  onClick={handleUpdateBaseTare}
                  disabled={!isStable}
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Update Base Tare
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Shuttle Trip History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip</TableHead>
                  <TableHead>Gross (kg)</TableHead>
                  <TableHead>Net (kg)</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockShuttleTrips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell>Trip #{trip.tripNo}</TableCell>
                    <TableCell>{trip.grossWeight.toLocaleString()}</TableCell>
                    <TableCell className="font-bold text-primary">
                      {trip.netWeight.toLocaleString()}
                    </TableCell>
                    <TableCell>{trip.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
