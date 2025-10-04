import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Printer, Loader2, Camera, CameraOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { mockVehicles, mockParties, mockProducts } from '@/utils/mockData';
import OpenTicketsTable from './OpenTicketsTable';
import BillPrintView from './BillPrintView';
import DualCameraFeed from './DualCameraFeed';
import { Bill, OpenTicket, OperationType } from '@/types/weighment';
import { 
  saveBill, 
  updateBillStatus
} from '@/services/api/billService';
import { 
  saveOpenTicket, 
  getOpenTickets, 
  removeOpenTicket,
  getOpenTicketById
} from '@/services/api/openTicketService';
import {
  getStoredTareByVehicle,
  getValidStoredTare,
  getTareExpiryInfo,
  isTareExpired,
  saveStoredTare
} from '@/services/api/storedTareService';
import { getNextSerialNo } from '@/services/api/masterDataService';
import { captureBothCameras } from '@/services/cameraService';
import { format } from 'date-fns';
interface UnifiedWeighmentFormProps {
  liveWeight: number;
  isStable: boolean;
}
export default function UnifiedWeighmentForm({
  liveWeight,
  isStable
}: UnifiedWeighmentFormProps) {
  const [operationType, setOperationType] = useState<OperationType>('new');
  const [vehicleNo, setVehicleNo] = useState('');
  const [partyName, setPartyName] = useState('');
  const [productName, setProductName] = useState('');
  const [vehicleStatus, setVehicleStatus] = useState<'load' | 'empty'>('load');
  const [currentVehicleStatus, setCurrentVehicleStatus] = useState<'load' | 'empty'>('empty');
  const [weightType, setWeightType] = useState<'gross' | 'tare' | 'one-time'>('gross');
  const [selectedTicket, setSelectedTicket] = useState('');
  const [ticketSearchOpen, setTicketSearchOpen] = useState(false);
  const [vehicleSearchOpen, setVehicleSearchOpen] = useState(false);
  const [partySearchOpen, setPartySearchOpen] = useState(false);
  const [serialNo, setSerialNo] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [charges, setCharges] = useState('');
  const [capturedFrontImage, setCapturedFrontImage] = useState<string | null>(null);
  const [capturedRearImage, setCapturedRearImage] = useState<string | null>(null);
  const [billToPrint, setBillToPrint] = useState<Bill | null>(null);
  const [openTickets, setOpenTickets] = useState<OpenTicket[]>([]);
  const [manualTareEntry, setManualTareEntry] = useState(false);
  const [manualTareWeight, setManualTareWeight] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [storedTare, setStoredTare] = useState<any>(null);
  const [validTare, setValidTare] = useState<any>(null);
  const [expiredTare, setExpiredTare] = useState<any>(null);
  const [tareExpiryInfo, setTareExpiryInfo] = useState<any>(null);
  const [cameraEnabled, setCameraEnabled] = useState(() => {
    const saved = localStorage.getItem('cameraEnabledByDefault');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const { toast } = useToast();

  // Initialize serial number and load open tickets
  useEffect(() => {
    initializeData();

    // Update date/time every second
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    
    return () => {
      clearInterval(timer);
    };
  }, []);

  // Reload open tickets when operation type changes to 'update'
  useEffect(() => {
    if (operationType === 'update') {
      loadOpenTickets();
    }
  }, [operationType]);

  // Load tare info when vehicle number changes
  useEffect(() => {
    if (vehicleNo && operationType === 'stored-tare') {
      loadTareInfo();
    }
  }, [vehicleNo, operationType]);

  const initializeData = async () => {
    const nextSerial = await getNextSerialNo();
    setSerialNo(nextSerial);
    loadOpenTickets();
  };

  const loadOpenTickets = async () => {
    const tickets = await getOpenTickets();
    setOpenTickets(tickets);
  };

  const loadTareInfo = async () => {
    if (!vehicleNo) return;
    
    const stored = await getStoredTareByVehicle(vehicleNo);
    const valid = await getValidStoredTare(vehicleNo);
    const expired = stored && !valid ? stored : null;
    const expiryInfo = valid ? await getTareExpiryInfo(vehicleNo) : null;

    setStoredTare(stored);
    setValidTare(valid);
    setExpiredTare(expired);
    setTareExpiryInfo(expiryInfo);
  };

  const handleDualCameraCapture = (frontImage: string | null, rearImage: string | null) => {
    setCapturedFrontImage(frontImage);
    setCapturedRearImage(rearImage);
  };

  const clearFrontImage = () => {
    setCapturedFrontImage(null);
  };

  const clearRearImage = () => {
    setCapturedRearImage(null);
  };

  const handleCapture = async () => {
    if (!isStable) {
      toast({
        title: "Weight Not Stable",
        description: "Please wait for the weight to stabilize",
        variant: "destructive"
      });
      return;
    }

    setIsCapturing(true);

    let frontImage: string | null = null;
    let rearImage: string | null = null;

    // Auto-capture from CCTV cameras if enabled
    if (cameraEnabled) {
      toast({
        title: "Capturing Images",
        description: "Fetching snapshots from CCTV cameras...",
      });

      const cameraResult = await captureBothCameras();
      frontImage = cameraResult.frontImage;
      rearImage = cameraResult.rearImage;
      
      if (cameraResult.error && !frontImage && !rearImage) {
        toast({
          title: "Camera Capture Failed",
          description: cameraResult.error + ". Proceeding without images.",
          variant: "default"
        });
      } else {
        // Update captured images
        if (frontImage) setCapturedFrontImage(frontImage);
        if (rearImage) setCapturedRearImage(rearImage);

        if (cameraResult.error) {
          toast({
            title: "Partial Capture",
            description: cameraResult.error,
            variant: "default"
          });
        }
      }
    } else {
      // Skip camera capture
      setCapturedFrontImage(null);
      setCapturedRearImage(null);
    }

    const chargesAmount = charges ? parseFloat(charges) : 0;
    const timestamp = new Date().toISOString();

    // NEW OPERATION - Two-Trip or Single-Trip
    if (operationType === 'new') {
      if (!vehicleNo || !partyName || !productName) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      if (weightType === 'gross') {
        // Two-Trip: First weighment (Gross weight) - Create OPEN bill
        const ticketId = `TKT-${Date.now()}`;
        const billId = `BILL-${Date.now()}`;
        
        const openTicket: OpenTicket = {
          id: ticketId,
          ticketNo: serialNo,
          vehicleNo,
          partyName,
          productName,
          vehicleStatus: 'load',
          grossWeight: liveWeight,
          tareWeight: null,
          firstWeightType: 'gross',
          date: new Date().toLocaleString('en-IN'),
          charges: chargesAmount,
          capturedImage: capturedFrontImage || capturedRearImage,
          frontImage: capturedFrontImage,
          rearImage: capturedRearImage
        };

        const bill: Bill = {
          id: billId,
          billNo: serialNo,
          ticketNo: serialNo,
          vehicleNo,
          partyName,
          productName,
          grossWeight: liveWeight,
          tareWeight: null,
          netWeight: null,
          charges: chargesAmount,
          capturedImage: capturedFrontImage || capturedRearImage,
          frontImage: capturedFrontImage,
          rearImage: capturedRearImage,
          status: 'OPEN',
          createdAt: timestamp,
          updatedAt: timestamp,
          firstWeightType: 'gross'
        };

        saveOpenTicket(openTicket);
        saveBill(bill);
        loadOpenTickets(); // Refresh the open tickets list
        setBillToPrint(bill); // Show print dialog for OPEN bill
        
        toast({
          title: "Ticket Created (OPEN)",
          description: `Gross weight ${liveWeight.toLocaleString()} KG captured. Bill ready to print!`
        });
      } else if (weightType === 'one-time') {
        // Single-Trip: Walk-in - Create CLOSED bill immediately
        const billId = `BILL-${Date.now()}`;
        
        const bill: Bill = {
          id: billId,
          billNo: serialNo,
          ticketNo: serialNo,
          vehicleNo,
          partyName,
          productName,
          grossWeight: liveWeight,
          tareWeight: 0,
          netWeight: liveWeight,
          charges: chargesAmount,
          capturedImage: frontImage || rearImage,
          frontImage: frontImage,
          rearImage: rearImage,
          status: 'CLOSED',
          createdAt: timestamp,
          updatedAt: timestamp,
          closedAt: timestamp,
          firstWeightType: 'one-time'
        };

        const result = await saveBill(bill);

        if (result.error) {
          toast({
            title: "Save Failed",
            description: result.error,
            variant: "destructive"
          });
          setIsCapturing(false);
          return;
        }

        setBillToPrint(bill);
        
        toast({
          title: "Bill Created (CLOSED)",
          description: `One-time weighment ${liveWeight.toLocaleString()} KG. Bill ready to print!`
        });
      }
    }

    // UPDATE OPERATION - Second weighment to close ticket
    else if (operationType === 'update') {
      if (!selectedTicket) {
        toast({
          title: "No Ticket Selected",
          description: "Please select an open ticket to update",
          variant: "destructive"
        });
        setIsCapturing(false);
        return;
      }

      const ticket = await getOpenTicketById(selectedTicket);
      if (!ticket) {
        setIsCapturing(false);
        return;
      }

      let netWeight: number;
      let grossWeight: number;
      let tareWeight: number;

      if (ticket.firstWeightType === 'gross') {
        // First was gross, now capturing tare
        grossWeight = ticket.grossWeight!;
        tareWeight = liveWeight;
        netWeight = grossWeight - tareWeight;
      } else {
        // First was tare, now capturing gross
        tareWeight = ticket.tareWeight!;
        grossWeight = liveWeight;
        netWeight = grossWeight - tareWeight;
      }

      // Create CLOSED bill with second weighment details
      const billId = `BILL-${Date.now()}`;
      const secondWeightTimestamp = new Date().toISOString();
      const bill: Bill = {
        id: billId,
        billNo: ticket.ticketNo,
        ticketNo: ticket.ticketNo,
        vehicleNo: ticket.vehicleNo,
        partyName: ticket.partyName,
        productName: ticket.productName,
        grossWeight,
        tareWeight,
        netWeight,
        charges: ticket.charges,
        capturedImage: frontImage || rearImage || ticket.capturedImage,
        frontImage: frontImage || ticket.frontImage,
        rearImage: rearImage || ticket.rearImage,
        status: 'CLOSED',
        createdAt: timestamp,
        updatedAt: timestamp,
        closedAt: timestamp,
        firstWeightType: ticket.firstWeightType,
        firstVehicleStatus: ticket.vehicleStatus,
        secondVehicleStatus: currentVehicleStatus,
        secondWeightTimestamp
      };

      const billResult = await saveBill(bill);
      const removeResult = await removeOpenTicket(selectedTicket);

      if (billResult.error || removeResult.error) {
        toast({
          title: "Save Failed",
          description: billResult.error || removeResult.error || "Failed to close ticket",
          variant: "destructive"
        });
        setIsCapturing(false);
        return;
      }

      await loadOpenTickets(); // Refresh the open tickets list
      setBillToPrint(bill);

      toast({
        title: "Ticket Closed",
        description: `Net Weight: ${netWeight.toLocaleString()} KG. Bill ready to print!`
      });
    }

    // STORED TARE OPERATION
    else if (operationType === 'stored-tare') {
      if (!vehicleNo) {
        toast({
          title: "Vehicle Required",
          description: "Please enter vehicle number",
          variant: "destructive"
        });
        setIsCapturing(false);
        return;
      }

      // Mode 1: Store/Update Tare (when manual entry is active or no valid tare exists)
      if (manualTareEntry || (!validTare && !partyName && !productName)) {
        const tareToStore = manualTareEntry && manualTareWeight 
          ? parseFloat(manualTareWeight) 
          : liveWeight;

        const result = await saveStoredTare({
          vehicleNo,
          tareWeight: tareToStore,
          storedAt: expiredTare ? expiredTare.storedAt : timestamp,
          updatedAt: timestamp
        });

        if (result.error) {
          toast({
            title: "Save Failed",
            description: result.error,
            variant: "destructive"
          });
          setIsCapturing(false);
          return;
        }

        setManualTareEntry(false);
        setManualTareWeight('');

        toast({
          title: expiredTare ? "Tare Weight Updated" : "Tare Weight Stored",
          description: `Tare ${tareToStore.toLocaleString()} KG ${expiredTare ? 'updated' : 'stored'} for ${vehicleNo}. Valid for 2 days.`
        });
        setIsCapturing(false);
        return;
      }

      // Mode 2: Generate Bill using valid tare
      if (validTare) {
        if (!partyName || !productName) {
          toast({
            title: "Missing Information",
            description: "Please fill in party and product details",
            variant: "destructive"
          });
          setIsCapturing(false);
          return;
        }

        const netWeight = liveWeight - validTare.tareWeight;
        const billId = `BILL-${Date.now()}`;

        const bill: Bill = {
          id: billId,
          billNo: serialNo,
          ticketNo: serialNo,
          vehicleNo,
          partyName,
          productName,
          grossWeight: liveWeight,
          tareWeight: validTare.tareWeight,
          netWeight,
          charges: chargesAmount,
          capturedImage: frontImage || rearImage,
          frontImage: frontImage,
          rearImage: rearImage,
          status: 'CLOSED',
          createdAt: timestamp,
          updatedAt: timestamp,
          closedAt: timestamp,
          firstWeightType: 'gross'
        };

        const result = await saveBill(bill);

        if (result.error) {
          toast({
            title: "Save Failed",
            description: result.error,
            variant: "destructive"
          });
          setIsCapturing(false);
          return;
        }

        setBillToPrint(bill);

        toast({
          title: "Trip Completed",
          description: `Net Weight: ${netWeight.toLocaleString()} KG (Stored Tare: ${validTare.tareWeight.toLocaleString()} KG)`
        });
      }
    }

    // Reset form after successful capture
    const nextSerial = await getNextSerialNo();
    setSerialNo(nextSerial);
    setVehicleNo('');
    setPartyName('');
    setProductName('');
    setVehicleStatus('load');
    setSelectedTicket('');
    setCharges('');
    setCapturedFrontImage(null);
    setCapturedRearImage(null);
    setManualTareEntry(false);
    setManualTareWeight('');
    setIsCapturing(false);
  };
  // Update form fields when ticket is selected
  const handleTicketSelect = async (ticketId: string) => {
    setSelectedTicket(ticketId);
    setTicketSearchOpen(false);
    const ticket = await getOpenTicketById(ticketId);
    if (ticket) {
      setVehicleNo(ticket.vehicleNo);
      setPartyName(ticket.partyName);
      setProductName(ticket.productName);
      setVehicleStatus(ticket.vehicleStatus);
      // Auto-suggest opposite status for second weighment
      setCurrentVehicleStatus(ticket.vehicleStatus === 'load' ? 'empty' : 'load');
    }
  };

  const handlePrintComplete = async (bill: Bill) => {
    await updateBillStatus(bill.id, 'PRINTED');
    setBillToPrint(null);
    toast({
      title: "Bill Status Updated",
      description: `Bill ${bill.billNo} marked as PRINTED`
    });
  };
  return <div className="flex flex-col lg:flex-row gap-6">
      {/* Right Side - Form 58% */}
      <div className="w-full lg:w-[58%] space-y-6 order-2 lg:order-1">
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
              <div className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-lg">
                <Button type="button" variant={operationType === 'new' ? 'default' : 'ghost'} onClick={() => setOperationType('new')} className="flex-1">
                  New
                </Button>
                <Button type="button" variant={operationType === 'update' ? 'default' : 'ghost'} onClick={() => setOperationType('update')} className="flex-1">
                  Update
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
                  <Label>Vehicle Number</Label>
                  <Popover open={vehicleSearchOpen} onOpenChange={setVehicleSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={vehicleSearchOpen}
                        className="w-full justify-between uppercase font-normal"
                      >
                        {vehicleNo || "Type or select vehicle..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Search or type vehicle number..." 
                          className="h-9"
                          value={vehicleNo}
                          onValueChange={setVehicleNo}
                        />
                        <CommandList>
                          {vehicleNo && !mockVehicles.some(v => v.vehicleNo.toLowerCase() === vehicleNo.toLowerCase()) ? (
                            <CommandItem
                              value={vehicleNo}
                              onSelect={() => {
                                setVehicleNo(vehicleNo.toUpperCase());
                                setVehicleSearchOpen(false);
                              }}
                              className="bg-primary/10 font-semibold uppercase"
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Add new vehicle: {vehicleNo.toUpperCase()}
                            </CommandItem>
                          ) : (
                            <CommandEmpty>Start typing to add new vehicle</CommandEmpty>
                          )}
                          <CommandGroup heading="Recent Vehicles (Latest 5)">
                            {mockVehicles.slice(-5).reverse().map((vehicle) => (
                              <CommandItem
                                key={vehicle.id}
                                value={vehicle.vehicleNo}
                                onSelect={(value) => {
                                  setVehicleNo(value.toUpperCase());
                                  setVehicleSearchOpen(false);
                                }}
                                className="uppercase"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    vehicleNo === vehicle.vehicleNo ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-semibold">{vehicle.vehicleNo}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {vehicle.vehicleType} - {vehicle.ownerName}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Party Name</Label>
                  <Popover open={partySearchOpen} onOpenChange={setPartySearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={partySearchOpen}
                        className="w-full justify-between font-normal"
                      >
                        {partyName || "Type or select party..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Search or type party name..." 
                          className="h-9"
                          value={partyName}
                          onValueChange={(value) => setPartyName(value.toUpperCase())}
                        />
                        <CommandList>
                          {partyName && !mockParties.some(p => p.partyName.toLowerCase() === partyName.toLowerCase()) ? (
                            <CommandItem
                              value={partyName}
                              onSelect={() => {
                                setPartyName(partyName.toUpperCase());
                                setPartySearchOpen(false);
                              }}
                              className="bg-primary/10 font-semibold"
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Add new party: {partyName}
                            </CommandItem>
                          ) : (
                            <CommandEmpty>Start typing to add new party</CommandEmpty>
                          )}
                          <CommandGroup heading="Recent Parties (Latest 5)">
                            {mockParties.slice(-5).reverse().map((party) => (
                              <CommandItem
                                key={party.id}
                                value={party.partyName}
                                onSelect={(value) => {
                                  setPartyName(value.toUpperCase());
                                  setPartySearchOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    partyName === party.partyName ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-semibold">{party.partyName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {party.contactPerson} - {party.contactNo}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product">Material</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="vehicle-status">Vehicle Status</Label>
                  <Select value={vehicleStatus} onValueChange={v => setVehicleStatus(v as 'load' | 'empty')}>
                    <SelectTrigger id="vehicle-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="load">Load</SelectItem>
                      <SelectItem value="empty">Empty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>}

            {/* UPDATE Operation */}
            {operationType === 'update' && <>
                <div className="space-y-2">
                  <Label>Select Open Ticket</Label>
                  <Popover open={ticketSearchOpen} onOpenChange={setTicketSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={ticketSearchOpen}
                        className="w-full justify-between font-mono"
                      >
                        {selectedTicket
                          ? (() => {
                              const ticket = openTickets.find((t) => t.id === selectedTicket);
                              return ticket ? `${ticket.ticketNo} - ${ticket.vehicleNo} - ${ticket.partyName}` : "Select ticket...";
                            })()
                          : openTickets.length === 0
                          ? "No open tickets available"
                          : "Search and select ticket..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Search by Serial No./Vehicle/Party..." 
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>
                            {openTickets.length === 0 ? "No open tickets available" : "No tickets found"}
                          </CommandEmpty>
                          <CommandGroup>
                            {openTickets.map((ticket) => (
                              <CommandItem
                                key={ticket.id}
                                value={`${ticket.ticketNo} ${ticket.vehicleNo} ${ticket.partyName}`}
                                onSelect={() => handleTicketSelect(ticket.id)}
                                className="font-mono"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedTicket === ticket.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-semibold">{ticket.ticketNo}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {ticket.vehicleNo} - {ticket.partyName}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {openTickets.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {openTickets.length} open ticket{openTickets.length !== 1 ? 's' : ''} available
                    </p>
                  )}
                </div>

                {selectedTicket && openTickets.find(t => t.id === selectedTicket) && <div className="space-y-3">
                    {(() => {
                const ticket = openTickets.find(t => t.id === selectedTicket);
                return ticket ? <>
                          <div className="p-4 bg-muted rounded-lg space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Ticket No:</span>
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
                              <span className="text-muted-foreground">Vehicle Status:</span>
                              <Badge variant={ticket.vehicleStatus === 'load' ? 'default' : 'secondary'}>
                                {ticket.vehicleStatus === 'load' ? 'Load' : 'Empty'}
                              </Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">First Weight Captured:</span>
                              <span className="font-bold">{ticket.firstWeightType === 'gross' ? 'Gross' : 'Tare'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{ticket.firstWeightType === 'gross' ? 'Gross' : 'Tare'} Weight:</span>
                              <span className="font-mono font-bold">{ticket.firstWeightType === 'gross' ? ticket.grossWeight : ticket.tareWeight} kg</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Current {ticket.firstWeightType === 'gross' ? 'Tare' : 'Gross'}:</span>
                              <span className="font-mono font-bold">{liveWeight} kg</span>
                            </div>
                             <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Net Weight:</span>
                              <span className="font-mono font-bold text-primary">
                                {ticket.firstWeightType === 'gross' 
                                  ? (ticket.grossWeight! - liveWeight) 
                                  : (liveWeight - ticket.tareWeight!)} kg
                              </span>
                            </div>
                          </div>
                        </> : null;
              })()}
                  </div>}

                {selectedTicket && <div className="space-y-2">
                    <Label htmlFor="current-vehicle-status">Current Vehicle Status</Label>
                    <Select value={currentVehicleStatus} onValueChange={v => setCurrentVehicleStatus(v as 'load' | 'empty')}>
                      <SelectTrigger id="current-vehicle-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="load">Load</SelectItem>
                        <SelectItem value="empty">Empty</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Current vehicle status at second weighment (timestamp will be auto-captured)
                    </p>
                  </div>}
              </>}


            {/* STORED TARE Operation */}
            {operationType === 'stored-tare' && <>
                <div className="space-y-2">
                  <Label>Vehicle Number</Label>
                  <Popover open={vehicleSearchOpen} onOpenChange={setVehicleSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={vehicleSearchOpen}
                        className="w-full justify-between uppercase font-normal"
                      >
                        {vehicleNo || "Type or select vehicle..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Search or type vehicle number..." 
                          className="h-9"
                          value={vehicleNo}
                          onValueChange={setVehicleNo}
                        />
                        <CommandList>
                          {vehicleNo && !mockVehicles.some(v => v.vehicleNo.toLowerCase() === vehicleNo.toLowerCase()) ? (
                            <CommandItem
                              value={vehicleNo}
                              onSelect={() => {
                                setVehicleNo(vehicleNo.toUpperCase());
                                setVehicleSearchOpen(false);
                              }}
                              className="bg-primary/10 font-semibold uppercase"
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Add new vehicle: {vehicleNo.toUpperCase()}
                            </CommandItem>
                          ) : (
                            <CommandEmpty>Start typing to add new vehicle</CommandEmpty>
                          )}
                          <CommandGroup heading="Recent Vehicles (Latest 5)">
                            {mockVehicles.slice(-5).reverse().map((vehicle) => (
                              <CommandItem
                                key={vehicle.id}
                                value={vehicle.vehicleNo}
                                onSelect={(value) => {
                                  setVehicleNo(value.toUpperCase());
                                  setVehicleSearchOpen(false);
                                }}
                                className="uppercase"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    vehicleNo === vehicle.vehicleNo ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-semibold">{vehicle.vehicleNo}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {vehicle.vehicleType} - {vehicle.ownerName}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Tare Status Display - Valid Tare */}
                {validTare && tareExpiryInfo && (
                  <div className="p-4 bg-success/10 border border-success/30 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-success text-success-foreground">Valid Tare</Badge>
                        <span className="text-sm font-medium">for {vehicleNo}</span>
                      </div>
                      <span className="font-mono font-bold text-xl">{validTare.tareWeight.toLocaleString()} KG</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Recorded: {format(new Date(validTare.updatedAt), 'dd MMM yyyy, hh:mm a')}
                      </span>
                      <span className="font-medium text-success">
                        Expires in {tareExpiryInfo.hoursRemaining < 24 
                          ? `${tareExpiryInfo.hoursRemaining}h` 
                          : `${tareExpiryInfo.daysRemaining} day${tareExpiryInfo.daysRemaining !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                    {!partyName && !productName && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setManualTareEntry(true)}
                      >
                        Update Tare Weight
                      </Button>
                    )}
                  </div>
                )}

                {/* Tare Status Display - Expired Tare */}
                {expiredTare && (
                  <Alert variant="destructive" className="bg-destructive/10">
                    <AlertDescription>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive">Tare Expired</Badge>
                            <span className="text-sm font-medium">for {vehicleNo}</span>
                          </div>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Last Tare:</span>
                            <span className="font-mono font-semibold">{expiredTare.tareWeight.toLocaleString()} KG</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Recorded:</span>
                            <span>{format(new Date(expiredTare.updatedAt), 'dd MMM yyyy')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Expired:</span>
                            <span className="text-destructive font-medium">
                              {format(new Date(new Date(expiredTare.updatedAt).getTime() + 2 * 24 * 60 * 60 * 1000), 'dd MMM yyyy')}
                            </span>
                          </div>
                        </div>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            if (!isStable) {
                              toast({
                                title: "Weight Not Stable",
                                description: "Please wait for weight to stabilize",
                                variant: "destructive"
                              });
                              return;
                            }

                            const timestamp = new Date().toISOString();
                            saveStoredTare({
                              vehicleNo,
                              tareWeight: liveWeight,
                              storedAt: expiredTare ? expiredTare.storedAt : timestamp,
                              updatedAt: timestamp
                            });

                            toast({
                              title: "Tare Weight Stored",
                              description: `Tare ${liveWeight.toLocaleString()} KG stored for ${vehicleNo}. Valid for 2 days.`
                            });

                            // Force UI refresh to show valid tare
                            setManualTareEntry(false);
                            setManualTareWeight('');
                          }}
                        >
                          Weigh Empty Vehicle Now
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* No Tare Found */}
                {!validTare && !expiredTare && vehicleNo && (
                  <Alert className="bg-warning/10 border-warning/30">
                    <AlertDescription>
                      <div className="space-y-3">
                        <p className="text-sm font-medium">No stored tare found for {vehicleNo}</p>
                        <div className="flex gap-2">
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              if (!isStable) {
                                toast({
                                  title: "Weight Not Stable",
                                  description: "Please wait for weight to stabilize",
                                  variant: "destructive"
                                });
                                return;
                              }

                              const timestamp = new Date().toISOString();
                              saveStoredTare({
                                vehicleNo,
                                tareWeight: liveWeight,
                                storedAt: timestamp,
                                updatedAt: timestamp
                              });

                              toast({
                                title: "Tare Weight Stored",
                                description: `Tare ${liveWeight.toLocaleString()} KG stored for ${vehicleNo}. Valid for 2 days.`
                              });

                              // Force UI refresh to show valid tare
                              setManualTareEntry(false);
                              setManualTareWeight('');
                            }}
                          >
                            Weigh Empty Vehicle
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => setManualTareEntry(true)}
                          >
                            Enter Manually
                          </Button>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Manual Tare Entry */}
                {manualTareEntry && (
                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="manual-tare">Manual Tare Weight (KG)</Label>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setManualTareEntry(false);
                          setManualTareWeight('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                    <Input
                      id="manual-tare"
                      type="number"
                      value={manualTareWeight}
                      onChange={(e) => setManualTareWeight(e.target.value)}
                      placeholder="Enter tare weight"
                    />
                    <p className="text-xs text-muted-foreground">
                      Or capture current live weight: {liveWeight.toLocaleString()} KG
                    </p>
                  </div>
                )}

                {/* Party and Product fields - Only show when tare is ready */}
                {(validTare || manualTareEntry) && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="shuttle-party">Party Name</Label>
                      <Input id="shuttle-party" type="text" value={partyName} onChange={e => setPartyName(e.target.value.toUpperCase())} placeholder="Type or select party name" list="shuttle-party-list" />
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
                  </>
                )}

                {/* Net Weight Preview - Only when valid tare exists */}
                {validTare && partyName && productName && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Gross:</span>
                      <span className="font-mono font-bold">{liveWeight.toLocaleString()} KG</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Stored Tare:</span>
                      <span className="font-mono font-bold">{validTare.tareWeight.toLocaleString()} KG</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-muted-foreground font-semibold">Net Weight:</span>
                      <span className="font-mono font-bold text-primary text-lg">{(liveWeight - validTare.tareWeight).toLocaleString()} KG</span>
                    </div>
                  </div>
                )}
              </>}

            {/* Weight Status Display */}
            {operationType !== 'update' && operationType !== 'stored-tare' && <div className="p-4 bg-muted rounded-lg space-y-2">
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

            {/* Camera Toggle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-3">
                  {cameraEnabled ? (
                    <Camera className="h-5 w-5 text-primary" />
                  ) : (
                    <CameraOff className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <Label className="text-sm font-semibold">Camera Capture</Label>
                    <p className="text-xs text-muted-foreground">
                      {cameraEnabled ? "Enabled - Images will be captured" : "Disabled - No images will be captured"}
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={cameraEnabled}
                  onCheckedChange={setCameraEnabled}
                />
              </div>
              
              {!cameraEnabled && (
                <Alert className="bg-warning/10 border-warning/30">
                  <AlertDescription className="text-sm">
                    Camera capture is disabled. Bills will be generated without images.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Charges Field - Special Styling */}
            <div className="space-y-2">
                <Label htmlFor="charges" className="text-base font-semibold">Charges</Label>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-lg blur-sm"></div>
                  <div className="relative bg-card border-2 border-primary/30 rounded-lg p-4 shadow-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold text-primary">₹</span>
                      <Input id="charges" type="number" step="0.01" min="0" value={charges} onChange={e => setCharges(e.target.value)} placeholder="Enter charges" className="text-xl font-semibold border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent" />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">INR</span>
                    </div>
                  </div>
                </div>
              </div>

            {/* Capture Button */}
            <Button onClick={handleCapture} disabled={isCapturing || !isStable || !serialNo || operationType === 'new' && (!vehicleNo || !partyName || !productName) || operationType === 'update' && !selectedTicket || operationType === 'stored-tare' && (!vehicleNo || validTare && (!partyName || !productName))} className="w-full">
                {isCapturing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                {isCapturing ? 'Capturing from CCTV...' : (
                  <>
                    {operationType === 'new' && weightType === 'gross' && 'Capture Gross Weight'}
                    {operationType === 'new' && weightType === 'one-time' && 'Capture One-Time Weight'}
                    {operationType === 'update' && (() => {
                      const ticket = openTickets.find(t => t.id === selectedTicket);
                      return ticket?.firstWeightType === 'gross' ? 'Capture Tare & Close Ticket' : 'Capture Gross & Close Ticket';
                    })()}
                  </>
                )}
                {operationType === 'stored-tare' && !validTare && !manualTareEntry && 'Capture & Store Tare'}
                {operationType === 'stored-tare' && manualTareEntry && 'Save Manual Tare'}
                {operationType === 'stored-tare' && validTare && 'Capture Gross & Generate Bill'}
              </Button>
          </CardContent>
        </Card>

        {/* Open Tickets Table - Show for Update operation */}
        {operationType === 'update' && (
          <OpenTicketsTable 
            tickets={openTickets} 
            onRefresh={loadOpenTickets} 
          />
        )}
      </div>

      {/* Bill Print Modal */}
      {billToPrint && (
        <BillPrintView 
          bill={billToPrint} 
          onClose={() => setBillToPrint(null)}
          onPrintComplete={() => handlePrintComplete(billToPrint)}
        />
      )}

      {/* Left Side - Weight & Cameras 42% */}
      <div className="w-full lg:w-[42%] space-y-4 order-1 lg:order-2">
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <motion.div animate={{
            scale: isStable ? 1 : [1, 1.02, 1]
          }} transition={{
            duration: 0.5,
            repeat: isStable ? 0 : Infinity
          }} className="flex flex-col items-center justify-center py-8">
              <div className="text-sm font-medium text-muted-foreground mb-2">Live Weight</div>
              <div className="text-4xl lg:text-5xl font-bold">
                {liveWeight.toLocaleString()}
              </div>
              <div className="text-xl font-medium text-muted-foreground mt-2">KG</div>
              <Badge variant={isStable ? "default" : "secondary"} className="mt-3">
                {isStable ? "Stable" : "Measuring"}
              </Badge>
            </motion.div>
          </CardContent>
        </Card>

        {cameraEnabled ? (
          <Card className="card-shadow">
            <CardContent className="pt-6">
              <DualCameraFeed
                onCapture={handleDualCameraCapture}
                capturedFrontImage={capturedFrontImage}
                capturedRearImage={capturedRearImage}
                onClearFront={clearFrontImage}
                onClearRear={clearRearImage}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="card-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CameraOff className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Camera Disabled</h3>
                <p className="text-sm text-muted-foreground">
                  Enable camera capture to take snapshots from CCTV cameras
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>;
}