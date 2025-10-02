import { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, FileDown, FileSpreadsheet, FileText, Check, ChevronsUpDown, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { mockTickets } from '@/utils/mockData';
import { getVehicles, getParties } from '@/services/masterDataService';
import { getUniqueVehiclesFromBills, getUniquePartiesFromBills } from '@/services/dynamicDataService';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ExportFormat = 'excel' | 'pdf' | 'csv';

export default function Reports() {
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [partyOpen, setPartyOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedParty, setSelectedParty] = useState('');
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('excel');
  const { toast } = useToast();

  // Combine master data with walk-in entries from bills
  const allVehicles = useMemo(() => {
    const masterVehicles = getVehicles().map(v => ({ 
      ...v, 
      source: 'master' as const 
    }));
    const walkInVehicles = getUniqueVehiclesFromBills();
    
    // Filter out walk-in vehicles that already exist in master
    const masterVehicleNos = new Set(masterVehicles.map(v => v.vehicleNo));
    const uniqueWalkIn = walkInVehicles.filter(v => !masterVehicleNos.has(v.vehicleNo));
    
    return [...masterVehicles, ...uniqueWalkIn];
  }, []);

  const allParties = useMemo(() => {
    const masterParties = getParties().map(p => ({ 
      ...p, 
      source: 'master' as const 
    }));
    const walkInParties = getUniquePartiesFromBills();
    
    // Filter out walk-in parties that already exist in master
    const masterPartyNames = new Set(masterParties.map(p => p.partyName));
    const uniqueWalkIn = walkInParties.filter(p => !masterPartyNames.has(p.partyName));
    
    return [...masterParties, ...uniqueWalkIn];
  }, []);

  const generateFilteredData = () => {
    let filteredData = mockTickets.filter(t => t.status === 'completed');
    
    if (selectedVehicle) {
      const vehicle = allVehicles.find(v => v.id === selectedVehicle);
      filteredData = filteredData.filter(t => t.vehicleNo === vehicle?.vehicleNo);
    }
    
    if (selectedParty) {
      const party = allParties.find(p => p.id === selectedParty);
      filteredData = filteredData.filter(t => t.partyName === party?.partyName);
    }

    if (fromDate) {
      filteredData = filteredData.filter(t => new Date(t.date) >= fromDate);
    }
    if (toDate) {
      filteredData = filteredData.filter(t => new Date(t.date) <= toDate);
    }

    return filteredData;
  };

  const handleGenerateReport = () => {
    if (!selectedVehicle && !selectedParty) {
      toast({
        title: "Selection Required",
        description: "Please select either a vehicle or a party to generate the report",
        variant: "destructive"
      });
      return;
    }

    const filteredData = generateFilteredData();
    setReportData(filteredData);
    setReportDialogOpen(true);
  };

  const handleExportClick = (format: ExportFormat) => {
    if (!selectedVehicle && !selectedParty) {
      toast({
        title: "Selection Required",
        description: "Please select either a vehicle or a party to generate the report",
        variant: "destructive"
      });
      return;
    }

    const filteredData = generateFilteredData();
    setReportData(filteredData);
    setExportFormat(format);
    setReportDialogOpen(true);
  };

  const getTotalWeight = () => {
    return reportData.reduce((sum, item) => sum + item.netWeight, 0);
  };

  const getFileName = () => {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
    return `weighment_report_${timestamp}`;
  };

  const exportToExcel = () => {
    const worksheetData = [
      ['Weighment Report'],
      [''],
      ['Filter', selectedVehicle ? `Vehicle: ${allVehicles.find(v => v.id === selectedVehicle)?.vehicleNo}` : `Party: ${allParties.find(p => p.id === selectedParty)?.partyName}`],
      ['Date Range', fromDate && toDate ? `${format(fromDate, "PP")} - ${format(toDate, "PP")}` : fromDate ? `From ${format(fromDate, "PP")}` : toDate ? `Until ${format(toDate, "PP")}` : 'All dates'],
      ['Total Records', reportData.length],
      ['Total Net Weight', `${getTotalWeight()} KG`],
      [''],
      ['Ticket No', 'Date', 'Vehicle', 'Party', 'Material', 'Gross Wt (KG)', 'Tare Wt (KG)', 'Net Wt (KG)'],
      ...reportData.map(item => [
        item.ticketNo,
        item.date,
        item.vehicleNo,
        item.partyName,
        item.productName,
        item.grossWeight,
        item.tareWeight,
        item.netWeight
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    
    XLSX.writeFile(wb, `${getFileName()}.xlsx`);
    
    toast({
      title: "Excel Downloaded",
      description: "Your report has been exported to Excel"
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Weighment Report', 14, 20);
    
    doc.setFontSize(11);
    doc.text(`Filter: ${selectedVehicle ? `Vehicle: ${allVehicles.find(v => v.id === selectedVehicle)?.vehicleNo}` : `Party: ${allParties.find(p => p.id === selectedParty)?.partyName}`}`, 14, 30);
    doc.text(`Date Range: ${fromDate && toDate ? `${format(fromDate, "PP")} - ${format(toDate, "PP")}` : fromDate ? `From ${format(fromDate, "PP")}` : toDate ? `Until ${format(toDate, "PP")}` : 'All dates'}`, 14, 37);
    doc.text(`Total Records: ${reportData.length}`, 14, 44);
    doc.text(`Total Net Weight: ${getTotalWeight()} KG`, 14, 51);

    autoTable(doc, {
      startY: 60,
      head: [['Ticket No', 'Date', 'Vehicle', 'Party', 'Material', 'Gross', 'Tare', 'Net']],
      body: reportData.map(item => [
        item.ticketNo,
        item.date,
        item.vehicleNo,
        item.partyName,
        item.productName,
        item.grossWeight,
        item.tareWeight,
        item.netWeight
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`${getFileName()}.pdf`);
    
    toast({
      title: "PDF Downloaded",
      description: "Your report has been exported to PDF"
    });
  };

  const exportToCSV = () => {
    const headers = ['Ticket No', 'Date', 'Vehicle', 'Party', 'Material', 'Gross Wt (KG)', 'Tare Wt (KG)', 'Net Wt (KG)'];
    const csvData = [
      ['Weighment Report'],
      [''],
      ['Filter', selectedVehicle ? `Vehicle: ${allVehicles.find(v => v.id === selectedVehicle)?.vehicleNo}` : `Party: ${allParties.find(p => p.id === selectedParty)?.partyName}`],
      ['Date Range', fromDate && toDate ? `${format(fromDate, "PP")} - ${format(toDate, "PP")}` : fromDate ? `From ${format(fromDate, "PP")}` : toDate ? `Until ${format(toDate, "PP")}` : 'All dates'],
      ['Total Records', reportData.length],
      ['Total Net Weight', `${getTotalWeight()} KG`],
      [''],
      headers,
      ...reportData.map(item => [
        item.ticketNo,
        item.date,
        item.vehicleNo,
        item.partyName,
        item.productName,
        item.grossWeight,
        item.tareWeight,
        item.netWeight
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${getFileName()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "CSV Downloaded",
      description: "Your report has been exported to CSV"
    });
  };

  const handleDownloadReport = () => {
    switch (exportFormat) {
      case 'excel':
        exportToExcel();
        break;
      case 'pdf':
        exportToPDF();
        break;
      case 'csv':
        exportToCSV();
        break;
    }
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
                      ? allVehicles.find((vehicle) => vehicle.id === selectedVehicle)?.vehicleNo
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
                        {allVehicles.map((vehicle) => (
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
                            <div className="flex items-center gap-2">
                              {vehicle.vehicleNo}
                              {vehicle.source === 'walk-in' && (
                                <Badge variant="secondary" className="text-xs">Walk-in</Badge>
                              )}
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
                      ? allParties.find((party) => party.id === selectedParty)?.partyName
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
                        {allParties.map((party) => (
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
                            <div className="flex items-center gap-2">
                              {party.partyName}
                              {party.source === 'walk-in' && (
                                <Badge variant="secondary" className="text-xs">Walk-in</Badge>
                              )}
                            </div>
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
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleExportClick('excel')}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4 text-success" />
                Export to Excel
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleExportClick('pdf')}
              >
                <FileDown className="mr-2 h-4 w-4 text-destructive" />
                Export to PDF
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleExportClick('csv')}
              >
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
            <div className="flex items-center justify-between pr-8">
              <DialogTitle>Report Preview</DialogTitle>
              <Button onClick={handleDownloadReport} size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download {exportFormat === 'excel' ? 'Excel' : exportFormat === 'pdf' ? 'PDF' : 'CSV'}
              </Button>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Filter</p>
                  <p className="font-semibold">
                    {selectedVehicle && `Vehicle: ${allVehicles.find(v => v.id === selectedVehicle)?.vehicleNo}`}
                    {selectedParty && `Party: ${allParties.find(p => p.id === selectedParty)?.partyName}`}
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
