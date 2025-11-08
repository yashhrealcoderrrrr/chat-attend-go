import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, Download, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRCodeGeneratorProps {
  courseId: string;
  courseName: string;
  courseCode: string;
}

const QRCodeGenerator = ({ courseId, courseName, courseCode }: QRCodeGeneratorProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Generate QR code data as JSON
  const qrData = JSON.stringify({
    course_id: courseId,
    course_name: courseName,
    course_code: courseCode,
    timestamp: new Date().toISOString(),
  });

  const handleDownload = () => {
    const svg = document.getElementById(`qr-code-${courseId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${courseCode}-qr-code.png`;
          link.click();
          URL.revokeObjectURL(url);
          toast({
            title: "QR Code downloaded",
            description: "The QR code has been saved to your device.",
          });
        }
      });
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrData);
      toast({
        title: "QR data copied",
        description: "The QR code data has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Could not copy to clipboard.",
      });
    }
  };

  return (
    <>
      <Button 
        size="default" 
        className="w-full" 
        onClick={() => setOpen(true)}
      >
        <QrCode className="w-4 h-4 mr-2" />
        Generate QR
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code for {courseCode}</DialogTitle>
          <DialogDescription>
            Display this QR code in class for students to scan
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-center p-4 bg-secondary/30 rounded-lg">
            <QRCodeSVG
              id={`qr-code-${courseId}`}
              value={qrData}
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">{courseName}</p>
            <p className="text-xs text-muted-foreground">Course Code: {courseCode}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Data
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Students can scan this code to check in to your class
          </p>
        </div>
      </DialogContent>
      </Dialog>
    </>
  );
};

export default QRCodeGenerator;

