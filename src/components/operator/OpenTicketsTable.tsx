import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer, X } from 'lucide-react';

const mockOpenTickets = [
  {
    id: '1',
    ticketNo: 'TKT-2025-101',
    vehicleNo: 'MH-12-AB-1234',
    partyName: 'ABC Industries',
    productName: 'Steel Rods',
    grossWeight: 15000,
    date: '2025-01-15',
    time: '09:30',
  },
  {
    id: '2',
    ticketNo: 'TKT-2025-102',
    vehicleNo: 'GJ-01-XY-9012',
    partyName: 'Metro Logistics',
    productName: 'Cement Bags',
    grossWeight: 18000,
    date: '2025-01-15',
    time: '10:15',
  },
];

export default function OpenTicketsTable() {
  return (
    <Card className="card-shadow">
      <CardHeader>
        <CardTitle>Open Tickets (Pending Tare)</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket No</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Party</TableHead>
              <TableHead>Gross (kg)</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockOpenTickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-medium">{ticket.ticketNo}</TableCell>
                <TableCell>{ticket.vehicleNo}</TableCell>
                <TableCell>{ticket.partyName}</TableCell>
                <TableCell>{ticket.grossWeight.toLocaleString()}</TableCell>
                <TableCell className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Printer className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <X className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
