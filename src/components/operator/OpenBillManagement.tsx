import { useState } from 'react';
import { FolderOpen, Printer, XCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNotification } from '@/contexts/NotificationContext';

const mockOpenBills = [
  {
    id: '1',
    ticketNo: 'TKT-2025-201',
    vehicleNo: 'MH-12-AB-1234',
    partyName: 'ABC Industries',
    productName: 'Steel Rods',
    grossWeight: 15000,
    date: '2025-01-10',
    time: '09:30',
    daysOpen: 5,
  },
  {
    id: '2',
    ticketNo: 'TKT-2025-198',
    vehicleNo: 'GJ-01-XY-9012',
    partyName: 'Metro Logistics',
    productName: 'Cement Bags',
    grossWeight: 18000,
    date: '2025-01-08',
    time: '14:15',
    daysOpen: 7,
  },
  {
    id: '3',
    ticketNo: 'TKT-2025-195',
    vehicleNo: 'MH-14-CD-5678',
    partyName: 'XYZ Corp',
    productName: 'Sand',
    grossWeight: 12000,
    date: '2025-01-05',
    time: '11:00',
    daysOpen: 10,
  },
];

export default function OpenBillManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const { success, error } = useNotification();

  const filteredBills = mockOpenBills.filter(
    (bill) =>
      bill.ticketNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.partyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClose = (ticketNo: string) => {
    success(`Ticket ${ticketNo} closed successfully`);
  };

  const handleCancel = (ticketNo: string) => {
    error(`Ticket ${ticketNo} cancelled`);
  };

  const handlePrint = (ticketNo: string) => {
    success(`Printing bill for ${ticketNo}`);
  };

  return (
    <div className="space-y-6">
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-warning" />
            Open Bills Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Open Bills</strong> are tickets where vehicles were weighed once but never returned
              for tare weighment. You can close or cancel these tickets as needed.
            </p>
          </div>

          <div className="mb-4">
            <Input
              placeholder="Search by ticket no, vehicle, or party..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket No</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Gross (kg)</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Days Open</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.ticketNo}</TableCell>
                    <TableCell>{bill.vehicleNo}</TableCell>
                    <TableCell>{bill.partyName}</TableCell>
                    <TableCell>{bill.productName}</TableCell>
                    <TableCell>{bill.grossWeight.toLocaleString()}</TableCell>
                    <TableCell>
                      {bill.date}
                      <div className="text-xs text-muted-foreground">{bill.time}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={bill.daysOpen > 7 ? 'destructive' : 'secondary'}>
                        {bill.daysOpen} days
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrint(bill.ticketNo)}
                          title="Print Bill"
                        >
                          <Printer className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleClose(bill.ticketNo)}
                          title="Close Ticket"
                        >
                          <CheckCircle className="h-3 w-3 text-success" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancel(bill.ticketNo)}
                          title="Cancel Ticket"
                        >
                          <XCircle className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredBills.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No open bills found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
