import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Check, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
const mockOpenTickets = [{
  id: '1',
  ticketNo: 'TK-2025-001',
  vehicleNo: 'KA-01-AB-1234',
  partyName: 'ABC Traders',
  productName: 'Wheat',
  grossWeight: 15000,
  date: '2025-09-30 10:30 AM'
}, {
  id: '2',
  ticketNo: 'TK-2025-002',
  vehicleNo: 'KA-02-CD-5678',
  partyName: 'XYZ Industries',
  productName: 'Rice',
  grossWeight: 18000,
  date: '2025-09-30 11:15 AM'
}];

// Mock stored tare data
const mockStoredTares: Record<string, number> = {
  'KA-01-AB-1234': 5000,
  'KA-02-CD-5678': 5500
};
export default function UnifiedWeighmentForm({
  liveWeight,
  isStable
}: UnifiedWeighmentFormProps) {
  const [operationType, setOperationType] = useState<OperationType>('new');
  const [vehicleNo, setVehicleNo] = useState('');
  const [partyName, setPartyName] = useState('');
  const [productName, setProductName] = useState('');
  const [weightType, setWeightType] = useState<'gross' | 'tare' | 'one-time'>('gross');
  const [selectedTicket, setSelectedTicket] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [charges, setCharges] = useState('');
  const {
    success
  } = useNotification();

  // Initialize serial number from localStorage and update date/time
  useEffect(() => {
    // Get the last serial number from localStorage
    const lastSerialNo = localStorage.getItem('lastSerialNo');
    let nextSerialNo: string;
    if (lastSerialNo) {
      // Parse the serial number (format: WB-2025-001)
      const parts = lastSerialNo.split('-');
      const year = new Date().getFullYear().toString();
      const lastYear = parts[1];
      if (lastYear === year) {
        // Same year, increment the number
        const lastNumber = parseInt(parts[2]);
        nextSerialNo = `WB-${year}-${String(lastNumber + 1).padStart(3, '0')}`;
      } else {
        // New year, reset to 001
        nextSerialNo = `WB-${year}-001`;
      }
    } else {
      // First time, start with 001
      const year = new Date().getFullYear().toString();
      nextSerialNo = `WB-${year}-001`;
    }
    setSerialNo(nextSerialNo);

    // Update date/time every second
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const handleCapture = () => {
    // Save bill data to localStorage
    const billData = {
      serialNo,
      operationType,
      vehicleNo,
      partyName,
      productName,
      weight: liveWeight,
      weightType,
      timestamp: currentDateTime.toISOString(),
      selectedTicket,
      charges: charges ? parseFloat(charges) : 0
    };

    // Get existing bills and add the new one
    const existingBills = JSON.parse(localStorage.getItem('weighmentBills') || '[]');
    existingBills.push(billData);
    localStorage.setItem('weighmentBills', JSON.stringify(existingBills));

    // Update the last serial number
    localStorage.setItem('lastSerialNo', serialNo);
    if (operationType === 'new') {
      if (!vehicleNo || !partyName || !productName) return;
      if (weightType === 'gross') {
        success(`Gross weight ${liveWeight} kg captured! Ticket ${serialNo} created (OPEN).`);
      } else if (weightType === 'one-time') {
        success(`One-time weighment ${liveWeight} kg captured! Bill ${serialNo} ready to print (CLOSED).`);
      }
    } else if (operationType === 'update') {
      if (!selectedTicket) return;
      const ticket = mockOpenTickets.find(t => t.id === selectedTicket);
      if (ticket) {
        const netWeight = ticket.grossWeight - liveWeight;
        success(`Tare weight ${liveWeight} kg captured! Net: ${netWeight} kg. Ticket ${serialNo} closed, bill ready to print.`);
      }
    } else if (operationType === 'use-existing') {
      if (!selectedTicket) return;
      success(`Ticket closed successfully. Bill ${serialNo} ready to print.`);
    } else if (operationType === 'stored-tare') {
      if (!vehicleNo || !partyName || !productName) return;
      const storedTare = mockStoredTares[vehicleNo];
      if (storedTare) {
        const netWeight = liveWeight - storedTare;
        success(`Gross weight ${liveWeight} kg captured! Net: ${netWeight} kg (using stored tare: ${storedTare} kg). Trip ${serialNo} logged.`);
      } else {
        success(`Base Tare ${liveWeight} kg captured and stored for vehicle ${vehicleNo}. ${serialNo}`);
      }
    }

    // Generate next serial number
    const parts = serialNo.split('-');
    const year = new Date().getFullYear().toString();
    const currentNumber = parseInt(parts[2]);
    const nextSerialNo = `WB-${year}-${String(currentNumber + 1).padStart(3, '0')}`;

    // Reset form
    setVehicleNo('');
    setPartyName('');
    setProductName('');
    setSelectedTicket('');
    setCharges('');
    setSerialNo(nextSerialNo);
  };
  const handleCloseTicket = (ticketId: string) => {
    success('Ticket closed successfully!');
  };
  const handleCancelTicket = (ticketId: string) => {
    success('Ticket cancelled.');
  };
  const storedTare = vehicleNo ? mockStoredTares[vehicleNo] : null;
  return <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Side - 30% */}
      <div className="w-full lg:w-[30%] space-y-6">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Live Weight Display
              
            </CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div animate={{
            scale: isStable ? 1 : [1, 1.02, 1]
          }} transition={{
            duration: 0.5,
            repeat: isStable ? 0 : Infinity
          }} className={`flex flex-col items-center justify-center p-8 md:p-12 rounded-2xl min-h-[200px] ${isStable ? 'bg-success/10' : 'bg-warning/10'}`}>
              <div className={`led-display text-5xl md:text-6xl lg:text-7xl font-bold text-sidebar ${isStable ? 'opacity-100' : 'opacity-90'}`}>
                {liveWeight.toLocaleString()}
              </div>
              <div className="text-xl md:text-2xl font-medium text-muted-foreground mt-3">KG</div>
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
            {/* Date, Time, Serial Number - Always Visible */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg border">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Date</Label>
                <div className="font-mono font-semibold">
                  {currentDateTime.toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Time</Label>
                <div className="font-mono font-semibold">
                  {currentDateTime.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                })}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="serial-no" className="text-xs text-muted-foreground">Serial No. *</Label>
                <div className="w-full px-3 py-1.5 text-sm font-mono font-semibold bg-muted/50 border rounded-md">
                  {serialNo || 'Generating...'}
                </div>
              </div>
            </div>

            {/* Operation Type Selector */}
            <div className="space-y-3">
              <Label>Operation Type</Label>
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <Button type="button" variant={operationType === 'new' ? 'default' : 'ghost'} onClick={() => setOperationType('new')} className="flex-1">
                  New
                </Button>
                <Button type="button" variant={operationType === 'update' ? 'default' : 'ghost'} onClick={() => setOperationType('update')} className="flex-1">
                  Update
                </Button>
                <Button type="button" variant={operationType === 'use-existing' ? 'default' : 'ghost'} onClick={() => setOperationType('use-existing')} className="flex-1">
                  Use Existing
                </Button>
                <Button type="button" variant={operationType === 'stored-tare' ? 'default' : 'ghost'} onClick={() => setOperationType('stored-tare')} className="flex-1">
                  Stored Tare
                </Button>
              </div>
            </div>

            {/* Dynamic Fields Based on Operation Type */}
            
            {/* NEW Operation */}
            {operationType === 'new' && <>
                <div className="space-y-2">
                  <Label htmlFor="weight-type">Weight Type</Label>
                  <Select value={weightType} onValueChange={v => setWeightType(v as 'gross' | 'tare' | 'one-time')}>
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
                  <Input id="vehicle" type="text" value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} placeholder="Type or select vehicle number" list="vehicle-list" className="uppercase" />
                  <datalist id="vehicle-list">
                    {mockVehicles.map(vehicle => <option key={vehicle.id} value={vehicle.vehicleNo} />)}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="party">Party Name</Label>
                  <Input id="party" type="text" value={partyName} onChange={e => setPartyName(e.target.value)} placeholder="Type or select party name" list="party-list" />
                  <datalist id="party-list">
                    {mockParties.map(party => <option key={party.id} value={party.partyName} />)}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product">Product</Label>
                  <Select value={productName} onValueChange={setProductName}>
                    <SelectTrigger id="product">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockProducts.map(product => <SelectItem key={product.id} value={product.productName}>
                          {product.productName}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>}

            {/* UPDATE Operation */}
            {operationType === 'update' && <>
                <div className="space-y-2">
                  <Label htmlFor="open-ticket">Select Open Ticket (by Serial No.)</Label>
                  <Select value={selectedTicket} onValueChange={setSelectedTicket} disabled={!serialNo}>
                    <SelectTrigger id="open-ticket">
                      <SelectValue placeholder={serialNo ? "Select ticket to update" : "Enter serial no. first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {mockOpenTickets.filter(ticket => serialNo ? ticket.ticketNo.includes(serialNo) : true).map(ticket => <SelectItem key={ticket.id} value={ticket.id}>
                            {ticket.ticketNo} - {ticket.vehicleNo} - {ticket.partyName} - Gross: {ticket.grossWeight} kg
                          </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTicket && <div className="p-4 bg-muted rounded-lg space-y-2">
                    {(() => {
                const ticket = mockOpenTickets.find(t => t.id === selectedTicket);
                return ticket ? <>
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
                        </> : null;
              })()}
                  </div>}
              </>}

            {/* USE EXISTING Operation */}
            {operationType === 'use-existing' && <>
                <div className="space-y-2">
                  <Label htmlFor="existing-ticket">Select Open Ticket (by Serial No.)</Label>
                  <Select value={selectedTicket} onValueChange={setSelectedTicket} disabled={!serialNo}>
                    <SelectTrigger id="existing-ticket">
                      <SelectValue placeholder={serialNo ? "Select ticket to close/cancel" : "Enter serial no. first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {mockOpenTickets.filter(ticket => serialNo ? ticket.ticketNo.includes(serialNo) : true).map(ticket => <SelectItem key={ticket.id} value={ticket.id}>
                            {ticket.ticketNo} - {ticket.vehicleNo} - {ticket.partyName}
                          </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTicket && <div className="p-4 bg-muted rounded-lg space-y-3">
                    {(() => {
                const ticket = mockOpenTickets.find(t => t.id === selectedTicket);
                return ticket ? <>
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
                        </> : null;
              })()}
                  </div>}
              </>}

            {/* STORED TARE Operation */}
            {operationType === 'stored-tare' && <>
                <div className="space-y-2">
                  <Label htmlFor="shuttle-vehicle">Vehicle Number</Label>
                  <Input id="shuttle-vehicle" type="text" value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} placeholder="Type or select vehicle number" list="shuttle-vehicle-list" className="uppercase" />
                  <datalist id="shuttle-vehicle-list">
                    {mockVehicles.map(vehicle => <option key={vehicle.id} value={vehicle.vehicleNo}>
                        {mockStoredTares[vehicle.vehicleNo] ? `Stored Tare: ${mockStoredTares[vehicle.vehicleNo]} kg` : ''}
                      </option>)}
                  </datalist>
                </div>

                {storedTare && <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Stored Tare for {vehicleNo}:</span>
                      <span className="font-mono font-bold text-primary">{storedTare} kg</span>
                    </div>
                  </div>}

                {!storedTare && vehicleNo && <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                    <p className="text-sm text-warning">No stored tare found. Capture empty weight to set base tare.</p>
                  </div>}

                <div className="space-y-2">
                  <Label htmlFor="shuttle-party">Party Name</Label>
                  <Input id="shuttle-party" type="text" value={partyName} onChange={e => setPartyName(e.target.value)} placeholder="Type or select party name" list="shuttle-party-list" />
                  <datalist id="shuttle-party-list">
                    {mockParties.map(party => <option key={party.id} value={party.partyName} />)}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shuttle-product">Product</Label>
                  <Select value={productName} onValueChange={setProductName}>
                    <SelectTrigger id="shuttle-product">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockProducts.map(product => <SelectItem key={product.id} value={product.productName}>
                          {product.productName}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {storedTare && <div className="p-4 bg-muted rounded-lg space-y-2">
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
                  </div>}
              </>}

            {/* Weight Status Display */}
            {operationType !== 'use-existing' && <div className="p-4 bg-muted rounded-lg space-y-2">
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
              </div>}

            {/* Charges Field - Special Styling */}
            {operationType !== 'use-existing' && <div className="space-y-2">
                <Label htmlFor="charges" className="text-base font-semibold">Charges</Label>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-lg blur-sm"></div>
                  <div className="relative bg-card border-2 border-primary/30 rounded-lg p-4 shadow-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold text-primary">₹</span>
                      <Input
                        id="charges"
                        type="number"
                        step="0.01"
                        min="0"
                        value={charges}
                        onChange={(e) => setCharges(e.target.value)}
                        placeholder="Enter charges"
                        className="text-xl font-semibold border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">INR</span>
                    </div>
                  </div>
                </div>
              </div>}

            {/* Capture Button */}
            {operationType !== 'use-existing' && <Button onClick={handleCapture} disabled={!isStable || !serialNo || operationType === 'new' && (!vehicleNo || !partyName || !productName) || operationType === 'update' && !selectedTicket || operationType === 'stored-tare' && (!vehicleNo || !partyName || !productName)} className="w-full">
                <Check className="mr-2 h-4 w-4" />
                {operationType === 'new' && weightType === 'gross' && 'Capture Gross Weight'}
                {operationType === 'new' && weightType === 'one-time' && 'Capture One-Time Weight'}
                {operationType === 'update' && 'Capture Tare & Close Ticket'}
                {operationType === 'stored-tare' && !storedTare && 'Capture & Store Base Tare'}
                {operationType === 'stored-tare' && storedTare && 'Capture Gross & Log Trip'}
              </Button>}
          </CardContent>
        </Card>

        {/* Open Tickets Table - Show for Update operation */}
        {operationType === 'update' && <OpenTicketsTable />}
      </div>
    </div>;
}