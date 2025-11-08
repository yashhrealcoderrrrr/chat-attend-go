import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Users, Mail, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ChatAnalyticsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: any[];
}

const ChatAnalytics = ({ open, onOpenChange, courses }: ChatAnalyticsProps) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmails, setSendingEmails] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadFakeData();
    }
  }, [open, courses]);

  const loadFakeData = () => {
    setLoading(true);
    
    // Generate fake student data
    const firstNames = ['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'James', 'Jessica', 'Robert', 'Amanda', 'William', 'Ashley', 'Richard', 'Melissa', 'Joseph', 'Nicole', 'Thomas', 'Michelle', 'Christopher', 'Kimberly'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee'];
    
    const allStudents: any[] = [];
    
    // Generate students for each course
    courses.forEach((course) => {
      const studentCount = Math.floor(Math.random() * 30) + 15; // 15-45 students per course
      for (let i = 0; i < studentCount; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const attendance = Math.floor(Math.random() * 50) + 40; // 40-90% attendance
        
        allStudents.push({
          id: `student-${course.id}-${i}`,
          name: `${firstName} ${lastName}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@student.edu`,
          attendance: attendance,
          courseName: course.name || course.code,
          courseCode: course.code,
        });
      }
    });
    
    setStudents(allStudents);
    setLoading(false);
  };

  const lowAttendanceStudents = students.filter(s => s.attendance < 75);

  // Calculate average attendance per course
  const courseAttendanceData = courses.map((course) => {
    const courseStudents = students.filter(s => s.courseCode === course.code);
    const avgAttendance = courseStudents.length > 0
      ? Math.round(courseStudents.reduce((sum, s) => sum + s.attendance, 0) / courseStudents.length)
      : 0;
    
    return {
      name: course.code || course.name,
      averageAttendance: avgAttendance,
      studentCount: courseStudents.length,
    };
  });

  const handleSendEmails = async () => {
    if (lowAttendanceStudents.length === 0) {
      toast({
        variant: "destructive",
        title: "No students to email",
        description: "There are no students with attendance below 75%.",
      });
      return;
    }

    setSendingEmails(true);

    // Simulate email sending (fake for now)
    await new Promise(resolve => setTimeout(resolve, 1500));

    setSendingEmails(false);

    toast({
      title: "Warning emails sent!",
      description: `Sent attendance warnings to ${lowAttendanceStudents.length} student(s).`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Student Attendance Statistics
          </DialogTitle>
          <DialogDescription>
            View student attendance data and statistics
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading statistics...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Students</CardDescription>
                  <CardTitle className="text-2xl">{students.length}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Low Attendance</CardDescription>
                  <CardTitle className="text-2xl text-orange-500">{lowAttendanceStudents.length}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Avg Attendance</CardDescription>
                  <CardTitle className="text-2xl">
                    {students.length > 0 
                      ? Math.round(students.reduce((sum, s) => sum + s.attendance, 0) / students.length)
                      : 0}%
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Courses</CardDescription>
                  <CardTitle className="text-2xl">{courses.length}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Average Attendance Chart */}
            {courseAttendanceData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Average Student Attendance by Course</CardTitle>
                  <CardDescription>
                    Average attendance percentage for each course
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={courseAttendanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        domain={[0, 100]}
                        label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value}%`, 'Average Attendance']}
                        labelFormatter={(label) => `Course: ${label}`}
                      />
                      <Bar dataKey="averageAttendance" radius={[8, 8, 0, 0]}>
                        {courseAttendanceData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              entry.averageAttendance >= 75 ? '#22c55e' :
                              entry.averageAttendance >= 60 ? '#eab308' : '#ef4444'
                            } 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Low Attendance Students */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      Students with Low Attendance (&lt; 75%)
                    </CardTitle>
                    <CardDescription>
                      Students who need to improve their attendance
                    </CardDescription>
                  </div>
                  {lowAttendanceStudents.length > 0 && (
                    <Button
                      onClick={handleSendEmails}
                      disabled={sendingEmails}
                      variant="default"
                    >
                      {sendingEmails ? (
                        <>
                          <Mail className="w-4 h-4 mr-2 animate-pulse" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Warning Emails ({lowAttendanceStudents.length})
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {lowAttendanceStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Great! All students have attendance above 75%.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Student Name</th>
                          <th className="text-left p-2">Email</th>
                          <th className="text-left p-2">Course</th>
                          <th className="text-right p-2">Attendance %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowAttendanceStudents.map((student) => (
                          <tr key={student.id} className="border-b hover:bg-accent/50">
                            <td className="p-2 font-medium">{student.name}</td>
                            <td className="p-2 text-muted-foreground">{student.email}</td>
                            <td className="p-2 text-muted-foreground">{student.courseName}</td>
                            <td className="p-2 text-right">
                              <span className={`font-semibold ${
                                student.attendance >= 60 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {student.attendance}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Students Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Students</CardTitle>
                <CardDescription>Complete list of all students and their attendance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Student Name</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Course</th>
                        <th className="text-right p-2">Attendance %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id} className="border-b hover:bg-accent/50">
                          <td className="p-2 font-medium">{student.name}</td>
                          <td className="p-2 text-muted-foreground">{student.email}</td>
                          <td className="p-2 text-muted-foreground">{student.courseName}</td>
                          <td className="p-2 text-right">
                            <span className={`font-semibold ${
                              student.attendance >= 75 ? 'text-green-600' :
                              student.attendance >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {student.attendance}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ChatAnalytics;

