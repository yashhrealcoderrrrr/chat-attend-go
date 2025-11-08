import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { QrCode, ArrowLeft, Save } from "lucide-react";
import { z } from "zod";

const courseSchema = z.object({
  name: z.string().min(1, "Course name is required"),
  code: z.string().min(1, "Course code is required"),
  semester: z.string().optional(),
  year: z.string().optional(),
});

const CreateCourse = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
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
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      const data = courseSchema.parse({
        name: formData.get("name"),
        code: formData.get("code"),
        semester: formData.get("semester") || undefined,
        year: formData.get("year") || undefined,
      });

      const { error } = await supabase
        .from("courses")
        .insert({
          name: data.name,
          code: data.code,
          professor_id: user?.id,
          semester: data.semester || null,
          year: data.year ? parseInt(data.year) : null,
        });

      if (error) throw error;

      toast({
        title: "Course created!",
        description: `${data.name} has been successfully created.`,
      });

      navigate("/professor");
    } catch (error: any) {
      console.error("Error creating course:", error);
      toast({
        variant: "destructive",
        title: "Failed to create course",
        description: error.message || "Please check your input and try again.",
      });
    } finally {
      setLoading(false);
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
          <Button variant="ghost" onClick={() => navigate("/professor")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="container py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create New Course</CardTitle>
              <CardDescription>
                Add a new course to start tracking attendance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Course Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="e.g., Introduction to Computer Science"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Course Code *</Label>
                  <Input
                    id="code"
                    name="code"
                    type="text"
                    placeholder="e.g., CS101"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester</Label>
                    <Input
                      id="semester"
                      name="semester"
                      type="text"
                      placeholder="e.g., Fall, Spring"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    name="year"
                    type="number"
                    placeholder="e.g., 2024"
                    min="2000"
                    max="2100"
                    disabled={loading}
                  />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/professor")}
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      "Creating..."
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Create Course
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CreateCourse;

