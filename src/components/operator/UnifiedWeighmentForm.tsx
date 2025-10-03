import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, X, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Bill, OpenTicket, OperationType } from '@/types/weighment';
import { 
  getNextSerialNo, 
  updateSerialNo, 
  saveBill, 
  saveOpenTicket, 
  getOpenTickets, 
  removeOpenTicket,
  getOpenTicketById,
  getStoredTareByVehicle,
  saveStoredTare,
  updateBillStatus
} from '@/services/billService';
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
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [billToPrint, setBillToPrint] = useState<Bill | null>(null);
  const [openTickets, setOpenTickets] = useState<OpenTicket[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Initialize serial number and load open tickets
  useEffect(() => {
    setSerialNo(getNextSerialNo());
    loadOpenTickets();

    // Update date/time every second
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    
    return () => {
      clearInterval(timer);
      stopCamera();
    };
  }, []);

  // Reload open tickets when operation type changes to 'update'
  useEffect(() => {
    if (operationType === 'update') {
      loadOpenTickets();
    }
  }, [operationType]);

  const loadOpenTickets = () => {
    const tickets = getOpenTickets();
    setOpenTickets(tickets);
    console.log('Loaded open tickets:', tickets); // Debug log
  };
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        toast({
          title: "Camera Started",
          description: "Camera is now active"
        });
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setCameraActive(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const captureSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        
        toast({
          title: "Snapshot Captured",
          description: "Image captured successfully"
        });
      }
    }
  };

  const clearSnapshot = () => {
    setCapturedImage(null);
  };

  const handleCapture = () => {
    if (!isStable) {
      toast({
        title: "Weight Not Stable",
        description: "Please wait for the weight to stabilize",
        variant: "destructive"
      });
      return;
    }

    // Auto-capture camera image if camera is active
    let finalCapturedImage = capturedImage;
    if (cameraActive && !capturedImage && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        finalCapturedImage = canvas.toDataURL('image/jpeg');
        
        toast({
          title: "Camera Captured",
          description: "Live camera feed captured with weighment"
        });
      }
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
          capturedImage: finalCapturedImage
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
          capturedImage: finalCapturedImage,
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
          capturedImage: finalCapturedImage,
          status: 'CLOSED',
          createdAt: timestamp,
          updatedAt: timestamp,
          closedAt: timestamp,
          firstWeightType: 'one-time'
        };

        saveBill(bill);
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
        return;
      }

      const ticket = getOpenTicketById(selectedTicket);
      if (!ticket) return;

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
        capturedImage: finalCapturedImage || ticket.capturedImage,
        status: 'CLOSED',
        createdAt: timestamp,
        updatedAt: timestamp,
        closedAt: timestamp,
        firstWeightType: ticket.firstWeightType,
        firstVehicleStatus: ticket.vehicleStatus,
        secondVehicleStatus: currentVehicleStatus,
        secondWeightTimestamp
      };

      saveBill(bill);
      removeOpenTicket(selectedTicket);
      loadOpenTickets(); // Refresh the open tickets list
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
        return;
      }

      const existingTare = getStoredTareByVehicle(vehicleNo);

      if (!existingTare) {
        // First time - Store tare weight
        saveStoredTare({
          vehicleNo,
          tareWeight: liveWeight,
          storedAt: timestamp,
          updatedAt: timestamp
        });

        toast({
          title: "Tare Weight Stored",
          description: `Base tare ${liveWeight.toLocaleString()} KG stored for ${vehicleNo}`
        });
      } else {
        // Subsequent trips - Use stored tare
        if (!partyName || !productName) {
          toast({
            title: "Missing Information",
            description: "Please fill in party and product details",
            variant: "destructive"
          });
          return;
        }

        const netWeight = liveWeight - existingTare.tareWeight;
        const billId = `BILL-${Date.now()}`;

        const bill: Bill = {
          id: billId,
          billNo: serialNo,
          ticketNo: serialNo,
          vehicleNo,
          partyName,
          productName,
          grossWeight: liveWeight,
          tareWeight: existingTare.tareWeight,
          netWeight,
          charges: chargesAmount,
          capturedImage: finalCapturedImage,
          status: 'CLOSED',
          createdAt: timestamp,
          updatedAt: timestamp,
          closedAt: timestamp,
          firstWeightType: 'gross'
        };

        saveBill(bill);
        setBillToPrint(bill);

        toast({
          title: "Trip Completed",
          description: `Net Weight: ${netWeight.toLocaleString()} KG (Stored Tare: ${existingTare.tareWeight.toLocaleString()} KG)`
        });
      }
    }

    // Update serial number and reset form
    updateSerialNo(serialNo);
    setSerialNo(getNextSerialNo());
    setVehicleNo('');
    setPartyName('');
    setProductName('');
    setVehicleStatus('load');
    setSelectedTicket('');
    setCharges('');
    setCapturedImage(null);
  };
  // Update form fields when ticket is selected
  const handleTicketSelect = (ticketId: string) => {
    setSelectedTicket(ticketId);
    setTicketSearchOpen(false);
    const ticket = getOpenTicketById(ticketId);
    if (ticket) {
      setVehicleNo(ticket.vehicleNo);
      setPartyName(ticket.partyName);
      setProductName(ticket.productName);
      setVehicleStatus(ticket.vehicleStatus);
      // Auto-suggest opposite status for second weighment
      setCurrentVehicleStatus(ticket.vehicleStatus === 'load' ? 'empty' : 'load');
    }
  };

  const storedTare = vehicleNo ? getStoredTareByVehicle(vehicleNo) : null;

  const handlePrintComplete = (bill: Bill) => {
    updateBillStatus(bill.id, 'PRINTED');
    setBillToPrint(null);
    toast({
      title: "Bill Status Updated",
      description: `Bill ${bill.billNo} marked as PRINTED`
    });
  };
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
          }} className="flex flex-col items-center justify-center p-8 md:p-12 min-h-[200px]">
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold whitespace-nowrap">
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
          <CardContent className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
              {!cameraActive && !capturedImage && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Camera not active</p>
                  </div>
                </div>
              )}
              
              {cameraActive && !capturedImage && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}
              
              {capturedImage && (
                <div className="relative w-full h-full">
                  <img 
                    src={capturedImage} 
                    alt="Captured snapshot" 
                    className="w-full h-full object-cover"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={clearSnapshot}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <canvas ref={canvasRef} className="hidden" />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {!cameraActive ? (
                <Button 
                  onClick={startCamera} 
                  className="col-span-2"
                  variant="outline"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Start Camera
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={captureSnapshot}
                    disabled={!!capturedImage}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Capture
                  </Button>
                  <Button 
                    onClick={stopCamera}
                    variant="outline"
                  >
                    Stop Camera
                  </Button>
                </>
              )}
            </div>
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

                {selectedTicket && <div className="space-y-3">
                    {(() => {
                const ticket = getOpenTicketById(selectedTicket);
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

                {storedTare && <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Stored Tare for {vehicleNo}:</span>
                      <span className="font-mono font-bold text-primary">{storedTare.tareWeight} kg</span>
                    </div>
                  </div>}

                {!storedTare && vehicleNo && <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                    <p className="text-sm text-warning">No stored tare found. Capture empty weight to set base tare.</p>
                  </div>}

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

                {storedTare && <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Gross:</span>
                      <span className="font-mono font-bold">{liveWeight} kg</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Stored Tare:</span>
                      <span className="font-mono font-bold">{storedTare.tareWeight} kg</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Net Weight:</span>
                      <span className="font-mono font-bold text-primary">{liveWeight - storedTare.tareWeight} kg</span>
                    </div>
                  </div>}
              </>}

            {/* Weight Status Display */}
            {operationType !== 'update' && <div className="p-4 bg-muted rounded-lg space-y-2">
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
            <Button onClick={handleCapture} disabled={!isStable || !serialNo || operationType === 'new' && (!vehicleNo || !partyName || !productName) || operationType === 'update' && !selectedTicket || operationType === 'stored-tare' && (!vehicleNo || !partyName || !productName)} className="w-full">
                <Check className="mr-2 h-4 w-4" />
                {operationType === 'new' && weightType === 'gross' && 'Capture Gross Weight'}
                {operationType === 'new' && weightType === 'one-time' && 'Capture One-Time Weight'}
                {operationType === 'update' && (() => {
                  const ticket = getOpenTicketById(selectedTicket);
                  return ticket?.firstWeightType === 'gross' ? 'Capture Tare & Close Ticket' : 'Capture Gross & Close Ticket';
                })()}
                {operationType === 'stored-tare' && !storedTare && 'Capture & Store Base Tare'}
                {operationType === 'stored-tare' && storedTare && 'Capture Gross & Log Trip'}
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
    </div>;
}