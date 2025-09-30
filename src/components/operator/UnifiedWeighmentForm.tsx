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

interface UnifiedWeighmentFormProps {
  liveWeight: number;
  isStable: boolean;
}

type OperationType = 'new' | 'update' | 'use-existing' | 'stored-tare';

// Mock open tickets for Update and Use Existing operations
const mockOpenTickets = [
  { id: '1', ticketNo: 'TK-2025-001', vehicleNo: 'KA-01-AB-1234', partyName: 'ABC Traders', productName: 'Wheat', grossWeight: 15000, date: '2025-09-30 10:30 AM' },
  { id: '2', ticketNo: 'TK-2025-002', vehicleNo: 'KA-02-CD-5678', partyName: 'XYZ Industries', productName: 'Rice', grossWeight: 18000, date: '2025-09-30 11:15 AM' },
];

// Mock stored tare data
const mockStoredTares: Record<string, number> = {
  'KA-01-AB-1234': 5000,
  'KA-02-CD-5678': 5500,
};

export default function UnifiedWeighmentForm({ liveWeight, isStable }: UnifiedWeighmentFormProps) {
  const [operationType, setOperationType] = useState<OperationType>('new');
  const [vehicleNo, setVehicleNo] = useState('');
  const [partyName, setPartyName] = useState('');
  const [productName, setProductName] = useState('');
  const [weightType, setWeightType] = useState<'gross' | 'tare' | 'one-time'>('gross');
  const [selectedTicket, setSelectedTicket] = useState('');
  const { success } = useNotification();

  const handleCapture = () => {
    if (operationType === 'new') {
      if (!vehicleNo || !partyName || !productName) return;
      
      if (weightType === 'gross') {
        success(`Gross weight ${liveWeight} kg captured! Ticket created (OPEN).`);
      } else if (weightType === 'one-time') {
        success(`One-time weighment ${liveWeight} kg captured! Bill ready to print (CLOSED).`);
      }
    } else if (operationType === 'update') {
      if (!selectedTicket) return;
      const ticket = mockOpenTickets.find(t => t.id === selectedTicket);
      if (ticket) {
        const netWeight = ticket.grossWeight - liveWeight;
        success(`Tare weight ${liveWeight} kg captured! Net: ${netWeight} kg. Ticket closed, bill ready to print.`);
      }
    } else if (operationType === 'use-existing') {
      if (!selectedTicket) return;
      success(`Ticket closed successfully. Bill ready to print.`);
    } else if (operationType === 'stored-tare') {
      if (!vehicleNo || !partyName || !productName) return;
      
      const storedTare = mockStoredTares[vehicleNo];
      if (storedTare) {
        const netWeight = liveWeight - storedTare;
        success(`Gross weight ${liveWeight} kg captured! Net: ${netWeight} kg (using stored tare: ${storedTare} kg). Trip logged.`);
      } else {
        success(`Base Tare ${liveWeight} kg captured and stored for vehicle ${vehicleNo}.`);
      }
    }
    
    // Reset form
    setVehicleNo('');
    setPartyName('');
    setProductName('');
    setSelectedTicket('');
  };

  const handleCloseTicket = (ticketId: string) => {
    success('Ticket closed successfully!');
  };

  const handleCancelTicket = (ticketId: string) => {
    success('Ticket cancelled.');
  };

  const storedTare = vehicleNo ? mockStoredTares[vehicleNo] : null;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Side - 30% */}
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

      {/* Right Side - 70% */}
      <div className="w-full lg:w-[70%] space-y-6">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Capture Weighment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Operation Type Selector */}
            <div className="space-y-2">
              <Label htmlFor="operation-type">Operation Type</Label>
              <Select value={operationType} onValueChange={(v) => setOperationType(v as OperationType)}>
                <SelectTrigger id="operation-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New - Fresh weighment (Gross or One-Time)</SelectItem>
                  <SelectItem value="update">Update - Round-Trip Tare entry</SelectItem>
                  <SelectItem value="use-existing">Use Existing - Open Bill case</SelectItem>
                  <SelectItem value="stored-tare">Stored Tare - Shuttle trips</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic Fields Based on Operation Type */}
            
            {/* NEW Operation */}
            {operationType === 'new' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="weight-type">Weight Type</Label>
                  <Select value={weightType} onValueChange={(v) => setWeightType(v as 'gross' | 'tare' | 'one-time')}>
                    <SelectTrigger id="weight-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gross">Gross Weight (Round-Trip)</SelectItem>
                      <SelectItem value="one-time">One-Time (Walk-In)</SelectItem>
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
              </>
            )}

            {/* UPDATE Operation */}
            {operationType === 'update' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="open-ticket">Select Open Ticket</Label>
                  <Select value={selectedTicket} onValueChange={setSelectedTicket}>
                    <SelectTrigger id="open-ticket">
                      <SelectValue placeholder="Select ticket to update" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockOpenTickets.map((ticket) => (
                        <SelectItem key={ticket.id} value={ticket.id}>
                          {ticket.ticketNo} - {ticket.vehicleNo} - {ticket.partyName} - Gross: {ticket.grossWeight} kg
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTicket && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    {(() => {
                      const ticket = mockOpenTickets.find(t => t.id === selectedTicket);
                      return ticket ? (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Gross Weight:</span>
                            <span className="font-mono font-bold">{ticket.grossWeight} kg</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Current Tare:</span>
                            <span className="font-mono font-bold">{liveWeight} kg</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Net Weight:</span>
                            <span className="font-mono font-bold text-primary">{ticket.grossWeight - liveWeight} kg</span>
                          </div>
                        </>
                      ) : null;
                    })()}
                  </div>
                )}
              </>
            )}

            {/* USE EXISTING Operation */}
            {operationType === 'use-existing' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="existing-ticket">Select Open Ticket</Label>
                  <Select value={selectedTicket} onValueChange={setSelectedTicket}>
                    <SelectTrigger id="existing-ticket">
                      <SelectValue placeholder="Select ticket to close/cancel" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockOpenTickets.map((ticket) => (
                        <SelectItem key={ticket.id} value={ticket.id}>
                          {ticket.ticketNo} - {ticket.vehicleNo} - {ticket.partyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTicket && (
                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    {(() => {
                      const ticket = mockOpenTickets.find(t => t.id === selectedTicket);
                      return ticket ? (
                        <>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Ticket:</span>
                              <span className="font-bold">{ticket.ticketNo}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Vehicle:</span>
                              <span className="font-bold">{ticket.vehicleNo}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Party:</span>
                              <span className="font-bold">{ticket.partyName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Product:</span>
                              <span className="font-bold">{ticket.productName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Gross Weight:</span>
                              <span className="font-mono font-bold">{ticket.grossWeight} kg</span>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button onClick={() => handleCloseTicket(ticket.id)} className="flex-1">
                              Close Ticket
                            </Button>
                            <Button onClick={() => handleCancelTicket(ticket.id)} variant="destructive" className="flex-1">
                              Cancel Ticket
                            </Button>
                          </div>
                        </>
                      ) : null;
                    })()}
                  </div>
                )}
              </>
            )}

            {/* STORED TARE Operation */}
            {operationType === 'stored-tare' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="shuttle-vehicle">Vehicle Number</Label>
                  <Select value={vehicleNo} onValueChange={setVehicleNo}>
                    <SelectTrigger id="shuttle-vehicle">
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockVehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.vehicleNo}>
                          {vehicle.vehicleNo}
                          {mockStoredTares[vehicle.vehicleNo] && ` (Stored Tare: ${mockStoredTares[vehicle.vehicleNo]} kg)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {storedTare && (
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Stored Tare for {vehicleNo}:</span>
                      <span className="font-mono font-bold text-primary">{storedTare} kg</span>
                    </div>
                  </div>
                )}

                {!storedTare && vehicleNo && (
                  <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                    <p className="text-sm text-warning">No stored tare found. Capture empty weight to set base tare.</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="shuttle-party">Party Name</Label>
                  <Select value={partyName} onValueChange={setPartyName}>
                    <SelectTrigger id="shuttle-party">
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
                  <Label htmlFor="shuttle-product">Product</Label>
                  <Select value={productName} onValueChange={setProductName}>
                    <SelectTrigger id="shuttle-product">
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

                {storedTare && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Gross:</span>
                      <span className="font-mono font-bold">{liveWeight} kg</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Stored Tare:</span>
                      <span className="font-mono font-bold">{storedTare} kg</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Net Weight:</span>
                      <span className="font-mono font-bold text-primary">{liveWeight - storedTare} kg</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Weight Status Display */}
            {operationType !== 'use-existing' && (
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
            )}

            {/* Capture Button */}
            {operationType !== 'use-existing' && (
              <Button
                onClick={handleCapture}
                disabled={
                  !isStable ||
                  (operationType === 'new' && (!vehicleNo || !partyName || !productName)) ||
                  (operationType === 'update' && !selectedTicket) ||
                  (operationType === 'stored-tare' && (!vehicleNo || !partyName || !productName))
                }
                className="w-full"
              >
                <Check className="mr-2 h-4 w-4" />
                {operationType === 'new' && weightType === 'gross' && 'Capture Gross Weight'}
                {operationType === 'new' && weightType === 'one-time' && 'Capture One-Time Weight'}
                {operationType === 'update' && 'Capture Tare & Close Ticket'}
                {operationType === 'stored-tare' && !storedTare && 'Capture & Store Base Tare'}
                {operationType === 'stored-tare' && storedTare && 'Capture Gross & Log Trip'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Open Tickets Table - Show for Update operation */}
        {operationType === 'update' && <OpenTicketsTable />}
      </div>
    </div>
  );
}
