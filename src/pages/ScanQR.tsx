import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { QrCode, ArrowLeft, MapPin } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

const ScanQR = () => {
  const [user, setUser] = useState<User | null>(null);
  const [scanning, setScanning] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/auth");
      } else {
        setUser(user);
      }
    });

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            variant: "destructive",
            title: "Location access denied",
            description: "Please enable location access to verify attendance",
          });
        }
      );
    }

    return () => {
      stopScanning();
    };
  }, [navigate, toast]);

  const startScanning = async () => {
    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleQRCodeScanned(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors (they're frequent during scanning)
        }
      );

      setScanning(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      toast({
        variant: "destructive",
        title: "Camera error",
        description: "Could not access camera. Please check permissions.",
      });
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .then(() => {
          scannerRef.current = null;
          setScanning(false);
        })
        .catch((err) => {
          console.error("Error stopping scanner:", err);
        });
    }
  };

  const handleQRCodeScanned = async (qrData: string) => {
    try {
      // Parse QR code data (expected format: JSON with course_id)
      let courseData;
      try {
        courseData = JSON.parse(qrData);
      } catch {
        // If not JSON, try to extract course ID from URL or plain text
        courseData = { course_id: qrData };
      }

      const courseId = courseData.course_id || courseData.id;
      
      if (!courseId) {
        toast({
          variant: "destructive",
          title: "Invalid QR Code",
          description: "The scanned QR code does not contain valid course information.",
        });
        stopScanning();
        return;
      }

      // Verify course exists
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("id, name, code")
        .eq("id", courseId)
        .single();

      if (courseError || !course) {
        toast({
          variant: "destructive",
          title: "Course not found",
          description: "The scanned QR code references a course that doesn't exist.",
        });
        stopScanning();
        return;
      }

      // Check if already checked in today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: existingRecord } = await supabase
        .from("attendance_records")
        .select("id")
        .eq("student_id", user?.id)
        .eq("course_id", courseId)
        .gte("checked_in_at", today.toISOString())
        .lt("checked_in_at", tomorrow.toISOString())
        .single();

      if (existingRecord) {
        toast({
          variant: "destructive",
          title: "Already checked in",
          description: `You've already checked in to ${course.name} today.`,
        });
        stopScanning();
        return;
      }

      // Create attendance record
      const { error: insertError } = await supabase
        .from("attendance_records")
        .insert({
          student_id: user?.id,
          course_id: courseId,
          latitude: location?.lat || null,
          longitude: location?.lng || null,
          location_accuracy: location?.accuracy || null,
        });

      if (insertError) {
        throw insertError;
      }

      stopScanning();
      toast({
        title: "Check-in successful!",
        description: `You've been marked present for ${course.name} (${course.code}).`,
      });

      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        navigate("/student");
      }, 2000);
    } catch (error: any) {
      console.error("Error processing QR code:", error);
      toast({
        variant: "destructive",
        title: "Check-in failed",
        description: error.message || "An error occurred while processing your check-in.",
      });
      stopScanning();
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur shadow-soft">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-xl">
            <QrCode className="w-6 h-6 text-primary" />
            <span>AttendTrack</span>
          </div>
          <Button variant="ghost" onClick={() => navigate("/student")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="container py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Scan QR Code</h1>
            <p className="text-muted-foreground">
              Point your camera at the QR code displayed in class
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Camera Scanner</CardTitle>
              <CardDescription>
                {location ? (
                  <span className="flex items-center gap-2 text-green-600">
                    <MapPin className="w-4 h-4" />
                    Location verified
                  </span>
                ) : (
                  "Requesting location access..."
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                id="qr-reader"
                className="w-full rounded-lg overflow-hidden bg-black"
                style={{ minHeight: "300px" }}
              />

              {!scanning ? (
                <Button className="w-full" size="lg" onClick={startScanning}>
                  <QrCode className="w-4 h-4 mr-2" />
                  Start Scanning
                </Button>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  variant="destructive"
                  onClick={stopScanning}
                >
                  Stop Scanning
                </Button>
              )}

              <p className="text-sm text-muted-foreground text-center">
                Make sure you're in a well-lit area and hold your device steady
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ScanQR;

