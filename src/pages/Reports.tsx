import { useState } from 'react';
import { Calendar, FileDown, FileSpreadsheet, FileText, Check, ChevronsUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { mockVehicles, mockParties } from '@/utils/mockData';
import { cn } from '@/lib/utils';

export default function Reports() {
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [partyOpen, setPartyOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedParty, setSelectedParty] = useState('');

  const handleGenerateReport = () => {
    // Report generation logic will go here
    console.log('Generating report for:', { selectedVehicle, selectedParty });
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
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Select date
                </Button>
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Select date
                </Button>
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
                <span className="font-bold">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Weight:</span>
                <span className="font-bold">0 KG</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Date Range:</span>
                <span className="font-bold">-</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
