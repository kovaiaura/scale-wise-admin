import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, CameraOff, Trash2, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { captureSnapshot, CameraType } from '@/services/cameraService';

interface DualCameraFeedProps {
  onCapture: (frontImage: string | null, rearImage: string | null) => void;
  capturedFrontImage: string | null;
  capturedRearImage: string | null;
  onClearFront: () => void;
  onClearRear: () => void;
}

export default function DualCameraFeed({
  onCapture,
  capturedFrontImage,
  capturedRearImage,
  onClearFront,
  onClearRear
}: DualCameraFeedProps) {
  const [isCapturingFront, setIsCapturingFront] = useState(false);
  const [isCapturingRear, setIsCapturingRear] = useState(false);
  
  const { toast } = useToast();

  const handleCaptureSnapshot = async (type: CameraType) => {
    const setLoading = type === 'front' ? setIsCapturingFront : setIsCapturingRear;
    setLoading(true);

    try {
      const { data, error } = await captureSnapshot(type);

      if (error) {
        toast({
          title: "Camera Capture Failed",
          description: error,
          variant: "destructive"
        });
        return;
      }

      if (data) {
        if (type === 'front') {
          onCapture(data, capturedRearImage);
        } else {
          onCapture(capturedFrontImage, data);
        }

        toast({
          title: `${type === 'front' ? 'Front' : 'Rear'} Camera Captured`,
          description: "Image captured successfully from CCTV"
        });
      }
    } catch (error) {
      toast({
        title: "Capture Error",
        description: `Failed to capture ${type} camera snapshot`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tabs defaultValue="front" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="front" className="gap-2">
          <Camera className="h-4 w-4" />
          Front Camera
          {capturedFrontImage && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
              <Check className="h-3 w-3" />
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="rear" className="gap-2">
          <Camera className="h-4 w-4" />
          Rear Camera
          {capturedRearImage && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
              <Check className="h-3 w-3" />
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      {/* Front Camera Tab */}
      <TabsContent value="front" className="mt-4">
        <Card className={cn(
          "overflow-hidden transition-all",
          capturedFrontImage && "ring-2 ring-primary"
        )}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <Badge variant={capturedFrontImage ? "default" : "secondary"}>
                {capturedFrontImage ? 'Captured' : 'Not Captured'}
              </Badge>
            </div>

            <div className="relative aspect-[4/3] bg-muted/50 rounded-lg overflow-hidden border">
              {capturedFrontImage ? (
                <img 
                  src={capturedFrontImage} 
                  alt="Front camera captured from CCTV" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                  <CameraOff className="h-12 w-12 opacity-40" />
                  <p className="text-xs text-center px-4">
                    Click Capture to get snapshot from CCTV
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {!capturedFrontImage ? (
                <Button
                  onClick={() => handleCaptureSnapshot('front')}
                  variant="default"
                  className="flex-1 gap-2"
                  disabled={isCapturingFront}
                >
                  {isCapturingFront ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Capturing...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4" />
                      Capture from CCTV
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={onClearFront}
                  variant="destructive"
                  className="flex-1 gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Rear Camera Tab */}
      <TabsContent value="rear" className="mt-4">
        <Card className={cn(
          "overflow-hidden transition-all",
          capturedRearImage && "ring-2 ring-primary"
        )}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <Badge variant={capturedRearImage ? "default" : "secondary"}>
                {capturedRearImage ? 'Captured' : 'Not Captured'}
              </Badge>
            </div>

            <div className="relative aspect-[4/3] bg-muted/50 rounded-lg overflow-hidden border">
              {capturedRearImage ? (
                <img 
                  src={capturedRearImage} 
                  alt="Rear camera captured from CCTV" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                  <CameraOff className="h-12 w-12 opacity-40" />
                  <p className="text-xs text-center px-4">
                    Click Capture to get snapshot from CCTV
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {!capturedRearImage ? (
                <Button
                  onClick={() => handleCaptureSnapshot('rear')}
                  variant="default"
                  className="flex-1 gap-2"
                  disabled={isCapturingRear}
                >
                  {isCapturingRear ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Capturing...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4" />
                      Capture from CCTV
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={onClearRear}
                  variant="destructive"
                  className="flex-1 gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
