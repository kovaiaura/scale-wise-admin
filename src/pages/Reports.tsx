import { Calendar, FileDown, FileSpreadsheet, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Reports() {
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
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All vehicles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Party</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All parties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Parties</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Product</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full">
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
