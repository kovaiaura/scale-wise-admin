import { useState } from 'react';
import { Calendar as CalendarIcon, FileDown, FileSpreadsheet, FileText, Check, ChevronsUpDown, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { mockVehicles, mockParties, mockTickets } from '@/utils/mockData';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function Reports() {
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [partyOpen, setPartyOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedParty, setSelectedParty] = useState('');
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const { toast } = useToast();

  const handleGenerateReport = () => {
    if (!selectedVehicle && !selectedParty) {
      toast({
        title: "Selection Required",
        description: "Please select either a vehicle or a party to generate the report",
        variant: "destructive"
      });
      return;
    }

    // Filter tickets based on selection
    let filteredData = mockTickets.filter(t => t.status === 'completed');
    
    if (selectedVehicle) {
      const vehicle = mockVehicles.find(v => v.id === selectedVehicle);
      filteredData = filteredData.filter(t => t.vehicleNo === vehicle?.vehicleNo);
    }
    
    if (selectedParty) {
      const party = mockParties.find(p => p.id === selectedParty);
      filteredData = filteredData.filter(t => t.partyName === party?.partyName);
    }

    // Filter by date range if dates are selected
    if (fromDate) {
      filteredData = filteredData.filter(t => new Date(t.date) >= fromDate);
    }
    if (toDate) {
      filteredData = filteredData.filter(t => new Date(t.date) <= toDate);
    }

    setReportData(filteredData);
    setReportDialogOpen(true);
  };

  const getTotalWeight = () => {
    return reportData.reduce((sum, item) => sum + item.netWeight, 0);
  };

  const handleDownloadReport = () => {
    toast({
      title: "Download Started",
      description: "Your report is being downloaded"
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Generate and export weighment reports</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="card-shadow lg:col-span-2">
          <CardHeader>
            <CardTitle>Report Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? format(fromDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={setFromDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {toDate ? format(toDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={toDate}
                      onSelect={setToDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Vehicle</Label>
              <Popover open={vehicleOpen} onOpenChange={setVehicleOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={vehicleOpen}
                    className="w-full justify-between"
                  >
                    {selectedVehicle
                      ? mockVehicles.find((vehicle) => vehicle.id === selectedVehicle)?.vehicleNo
                      : "Search vehicle..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search vehicle..." />
                    <CommandList>
                      <CommandEmpty>No vehicle found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setSelectedVehicle('');
                            setVehicleOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedVehicle === '' ? "opacity-100" : "opacity-0"
                            )}
                          />
                          All Vehicles
                        </CommandItem>
                        {mockVehicles.map((vehicle) => (
                          <CommandItem
                            key={vehicle.id}
                            value={vehicle.vehicleNo}
                            onSelect={() => {
                              setSelectedVehicle(vehicle.id);
                              setVehicleOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedVehicle === vehicle.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {vehicle.vehicleNo}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Party</Label>
              <Popover open={partyOpen} onOpenChange={setPartyOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={partyOpen}
                    className="w-full justify-between"
                  >
                    {selectedParty
                      ? mockParties.find((party) => party.id === selectedParty)?.partyName
                      : "Search party..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search party..." />
                    <CommandList>
                      <CommandEmpty>No party found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setSelectedParty('');
                            setPartyOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedParty === '' ? "opacity-100" : "opacity-0"
                            )}
                          />
                          All Parties
                        </CommandItem>
                        {mockParties.map((party) => (
                          <CommandItem
                            key={party.id}
                            value={party.partyName}
                            onSelect={() => {
                              setSelectedParty(party.id);
                              setPartyOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedParty === party.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {party.partyName}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <Button className="w-full" onClick={handleGenerateReport}>
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <FileSpreadsheet className="mr-2 h-4 w-4 text-success" />
                Export to Excel
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileDown className="mr-2 h-4 w-4 text-destructive" />
                Export to PDF
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4 text-primary" />
                Export to CSV
              </Button>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>Report Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Records:</span>
                <span className="font-bold">{reportData.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Weight:</span>
                <span className="font-bold">{getTotalWeight()} KG</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Date Range:</span>
                <span className="font-bold">-</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Report Preview</DialogTitle>
              <Button onClick={handleDownloadReport} size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download Report
              </Button>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Filter</p>
                  <p className="font-semibold">
                    {selectedVehicle && `Vehicle: ${mockVehicles.find(v => v.id === selectedVehicle)?.vehicleNo}`}
                    {selectedParty && `Party: ${mockParties.find(p => p.id === selectedParty)?.partyName}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date Range</p>
                  <p className="font-semibold">
                    {fromDate && toDate 
                      ? `${format(fromDate, "PP")} - ${format(toDate, "PP")}`
                      : fromDate 
                        ? `From ${format(fromDate, "PP")}`
                        : toDate 
                          ? `Until ${format(toDate, "PP")}`
                          : "All dates"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Records</p>
                  <p className="font-semibold">{reportData.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Net Weight</p>
                  <p className="font-semibold">{getTotalWeight()} KG</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Ticket No</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Vehicle</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Party</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Material</th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">Gross Wt</th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">Tare Wt</th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">Net Wt</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center p-8 text-muted-foreground">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    reportData.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 text-sm font-mono">{item.ticketNo}</td>
                        <td className="p-3 text-sm">{item.date}</td>
                        <td className="p-3 text-sm font-mono">{item.vehicleNo}</td>
                        <td className="p-3 text-sm">{item.partyName}</td>
                        <td className="p-3 text-sm">{item.productName}</td>
                        <td className="p-3 text-sm text-right">{item.grossWeight}</td>
                        <td className="p-3 text-sm text-right">{item.tareWeight}</td>
                        <td className="p-3 text-sm text-right font-semibold">{item.netWeight}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
