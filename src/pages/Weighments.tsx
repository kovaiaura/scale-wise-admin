import { useState, useEffect } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getBills } from '@/services/billService';
import { Bill } from '@/types/weighment';
import BillPrintView from '@/components/operator/BillPrintView';

export default function Weighments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = () => {
    const allBills = getBills();
    setBills(allBills.reverse()); // Show newest first
  };

  const filteredBills = bills.filter(
    (bill) =>
      bill.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.billNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Weighments</h1>
          <p className="text-muted-foreground">Manage all weighment tickets</p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <Card className="card-shadow">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ticket, vehicle, or party..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Bill No</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Date/Time</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Vehicle</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Party</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Product</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Gross</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Tare</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Net</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Charges</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center text-muted-foreground py-8">
                      No bills found
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((bill) => (
                    <tr
                      key={bill.id}
                      onClick={() => setSelectedBill(bill)}
                      className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <td className="p-3 text-sm font-mono font-semibold">{bill.billNo}</td>
                      <td className="p-3 text-sm">
                        <div>
                          <div>{new Date(bill.createdAt).toLocaleDateString('en-IN')}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(bill.createdAt).toLocaleTimeString('en-IN', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-sm font-semibold">{bill.vehicleNo}</td>
                      <td className="p-3 text-sm">{bill.partyName}</td>
                      <td className="p-3 text-sm">{bill.productName}</td>
                      <td className="p-3 text-sm text-right font-mono">
                        {bill.grossWeight !== null ? `${bill.grossWeight.toLocaleString()} KG` : '-'}
                      </td>
                      <td className="p-3 text-sm text-right font-mono">
                        {bill.tareWeight !== null ? `${bill.tareWeight.toLocaleString()} KG` : '-'}
                      </td>
                      <td className="p-3 text-sm text-right font-mono font-bold">
                        {bill.netWeight !== null ? `${bill.netWeight.toLocaleString()} KG` : '-'}
                      </td>
                      <td className="p-3 text-sm text-right font-semibold">
                        ₹{bill.charges.toFixed(2)}
                      </td>
                      <td className="p-3 text-right">
                        <Badge
                          variant={
                            bill.status === 'CLOSED' || bill.status === 'PRINTED'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {bill.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bill Print View Modal */}
      {selectedBill && (
        <BillPrintView 
          bill={selectedBill} 
          onClose={() => setSelectedBill(null)}
        />
      )}
    </div>
  );
}
