import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, CameraOff, Trash2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
  const [frontCameraActive, setFrontCameraActive] = useState(false);
  const [rearCameraActive, setRearCameraActive] = useState(false);
  
  const frontVideoRef = useRef<HTMLVideoElement>(null);
  const rearVideoRef = useRef<HTMLVideoElement>(null);
  const frontCanvasRef = useRef<HTMLCanvasElement>(null);
  const rearCanvasRef = useRef<HTMLCanvasElement>(null);
  const frontStreamRef = useRef<MediaStream | null>(null);
  const rearStreamRef = useRef<MediaStream | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      stopCamera('front');
      stopCamera('rear');
    };
  }, []);

  const startCamera = async (type: 'front' | 'rear') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        }
      });

      if (type === 'front' && frontVideoRef.current) {
        frontVideoRef.current.srcObject = stream;
        frontStreamRef.current = stream;
        setFrontCameraActive(true);
      } else if (type === 'rear' && rearVideoRef.current) {
        rearVideoRef.current.srcObject = stream;
        rearStreamRef.current = stream;
        setRearCameraActive(true);
      }

      toast({
        title: `${type === 'front' ? 'Front' : 'Rear'} Camera Started`,
        description: "Camera is now active"
      });
    } catch (error) {
      console.error(`Error accessing ${type} camera:`, error);
      toast({
        title: "Camera Error",
        description: `Could not access ${type} camera. Please check permissions.`,
        variant: "destructive"
      });
    }
  };

  const stopCamera = (type: 'front' | 'rear') => {
    if (type === 'front' && frontStreamRef.current) {
      frontStreamRef.current.getTracks().forEach(track => track.stop());
      frontStreamRef.current = null;
      setFrontCameraActive(false);
      if (frontVideoRef.current) {
        frontVideoRef.current.srcObject = null;
      }
    } else if (type === 'rear' && rearStreamRef.current) {
      rearStreamRef.current.getTracks().forEach(track => track.stop());
      rearStreamRef.current = null;
      setRearCameraActive(false);
      if (rearVideoRef.current) {
        rearVideoRef.current.srcObject = null;
      }
    }
  };

  const captureSnapshot = (type: 'front' | 'rear') => {
    const videoRef = type === 'front' ? frontVideoRef : rearVideoRef;
    const canvasRef = type === 'front' ? frontCanvasRef : rearCanvasRef;

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);

        if (type === 'front') {
          onCapture(imageData, capturedRearImage);
        } else {
          onCapture(capturedFrontImage, imageData);
        }

        toast({
          title: `${type === 'front' ? 'Front' : 'Rear'} Snapshot Captured`,
          description: "Image captured successfully"
        });
      }
    }
  };

  const captureAllActive = () => {
    let newFrontImage = capturedFrontImage;
    let newRearImage = capturedRearImage;

    // Capture from front camera if active
    if (frontCameraActive && frontVideoRef.current && frontCanvasRef.current) {
      const video = frontVideoRef.current;
      const canvas = frontCanvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        newFrontImage = canvas.toDataURL('image/jpeg', 0.8);
      }
    }

    // Capture from rear camera if active
    if (rearCameraActive && rearVideoRef.current && rearCanvasRef.current) {
      const video = rearVideoRef.current;
      const canvas = rearCanvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        newRearImage = canvas.toDataURL('image/jpeg', 0.8);
      }
    }

    onCapture(newFrontImage, newRearImage);

    if (frontCameraActive || rearCameraActive) {
      toast({
        title: "Cameras Captured",
        description: `${frontCameraActive && rearCameraActive ? 'Both cameras' : frontCameraActive ? 'Front camera' : 'Rear camera'} captured successfully`
      });
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
          frontCameraActive && "ring-2 ring-primary"
        )}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <Badge variant={frontCameraActive ? "default" : "secondary"}>
                {frontCameraActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="relative aspect-[4/3] bg-muted/50 rounded-lg overflow-hidden border">
              {capturedFrontImage ? (
                <img 
                  src={capturedFrontImage} 
                  alt="Front captured" 
                  className="w-full h-full object-cover"
                />
              ) : frontCameraActive ? (
                <video
                  ref={frontVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                  <CameraOff className="h-12 w-12 opacity-40" />
                  <p className="text-xs">Camera Inactive</p>
                </div>
              )}
            </div>

            <canvas ref={frontCanvasRef} className="hidden" />

            <div className="flex gap-2">
              {!frontCameraActive ? (
                <Button
                  onClick={() => startCamera('front')}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Start
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => stopCamera('front')}
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    <CameraOff className="h-4 w-4" />
                    Stop
                  </Button>
                  
                  {!capturedFrontImage && (
                    <Button
                      onClick={() => captureSnapshot('front')}
                      className="flex-1 gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      Capture
                    </Button>
                  )}
                </>
              )}

              {capturedFrontImage && (
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
          rearCameraActive && "ring-2 ring-primary"
        )}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <Badge variant={rearCameraActive ? "default" : "secondary"}>
                {rearCameraActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="relative aspect-[4/3] bg-muted/50 rounded-lg overflow-hidden border">
              {capturedRearImage ? (
                <img 
                  src={capturedRearImage} 
                  alt="Rear captured" 
                  className="w-full h-full object-cover"
                />
              ) : rearCameraActive ? (
                <video
                  ref={rearVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                  <CameraOff className="h-12 w-12 opacity-40" />
                  <p className="text-xs">Camera Inactive</p>
                </div>
              )}
            </div>

            <canvas ref={rearCanvasRef} className="hidden" />

            <div className="flex gap-2">
              {!rearCameraActive ? (
                <Button
                  onClick={() => startCamera('rear')}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Start
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => stopCamera('rear')}
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    <CameraOff className="h-4 w-4" />
                    Stop
                  </Button>
                  
                  {!capturedRearImage && (
                    <Button
                      onClick={() => captureSnapshot('rear')}
                      className="flex-1 gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      Capture
                    </Button>
                  )}
                </>
              )}

              {capturedRearImage && (
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
