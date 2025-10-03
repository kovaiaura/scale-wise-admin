import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, CameraOff, Trash2 } from 'lucide-react';
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Front Camera */}
        <Card className={cn("card-shadow", frontCameraActive && "ring-2 ring-primary")}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Front Camera
              </CardTitle>
              <Badge variant={frontCameraActive ? "default" : "secondary"}>
                {frontCameraActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
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
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <CameraOff className="h-12 w-12" />
                </div>
              )}
            </div>

            <canvas ref={frontCanvasRef} className="hidden" />

            <div className="flex gap-2">
              {!frontCameraActive ? (
                <Button
                  onClick={() => startCamera('front')}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Start
                </Button>
              ) : (
                <Button
                  onClick={() => stopCamera('front')}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <CameraOff className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              )}

              {frontCameraActive && !capturedFrontImage && (
                <Button
                  onClick={() => captureSnapshot('front')}
                  size="sm"
                  className="flex-1"
                >
                  Capture
                </Button>
              )}

              {capturedFrontImage && (
                <Button
                  onClick={onClearFront}
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rear Camera */}
        <Card className={cn("card-shadow", rearCameraActive && "ring-2 ring-primary")}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Rear Camera
              </CardTitle>
              <Badge variant={rearCameraActive ? "default" : "secondary"}>
                {rearCameraActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
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
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <CameraOff className="h-12 w-12" />
                </div>
              )}
            </div>

            <canvas ref={rearCanvasRef} className="hidden" />

            <div className="flex gap-2">
              {!rearCameraActive ? (
                <Button
                  onClick={() => startCamera('rear')}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Start
                </Button>
              ) : (
                <Button
                  onClick={() => stopCamera('rear')}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <CameraOff className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              )}

              {rearCameraActive && !capturedRearImage && (
                <Button
                  onClick={() => captureSnapshot('rear')}
                  size="sm"
                  className="flex-1"
                >
                  Capture
                </Button>
              )}

              {capturedRearImage && (
                <Button
                  onClick={onClearRear}
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Capture All Active Button */}
      {(frontCameraActive || rearCameraActive) && (
        <Button
          onClick={captureAllActive}
          size="lg"
          className="w-full"
        >
          <Camera className="h-5 w-5 mr-2" />
          Capture All Active Cameras
        </Button>
      )}
    </div>
  );
}
