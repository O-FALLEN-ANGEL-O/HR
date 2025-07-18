
'use client';

import * as React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import { processResume, type ProcessResumeOutput } from '@/ai/flows/process-resume';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileUp, UserPlus, Camera, Zap, ImageUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Job, College } from '@/lib/types';
import { cn } from '@/lib/utils';

const FormSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().min(10, 'Phone number seems too short.'),
  job_id: z.string().optional(),
  college_id: z.string().optional(),
  resumeFile: z.any().optional(),
  profilePic: z.any().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

export default function RegisterPage() {
  const [isParsing, setIsParsing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showCamera, setShowCamera] = React.useState(false);
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [openJobs, setOpenJobs] = React.useState<Pick<Job, 'id' | 'title'>[]>([]);
  const [colleges, setColleges] = React.useState<Pick<College, 'id' | 'name'>[]>([]);
  const [resumeData, setResumeData] = React.useState<ProcessResumeOutput | null>(null);
  const [profilePicFile, setProfilePicFile] = React.useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = React.useState<string | null>(null);
  
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      job_id: '',
      college_id: '',
    },
  });

  React.useEffect(() => {
    const supabase = createClient();
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title')
        .eq('status', 'Open');
      
      if (error) {
        console.error("Error fetching open jobs", error);
        toast({ title: 'Error', description: 'Could not load job positions.', variant: 'destructive'});
      } else {
        setOpenJobs(data || []);
      }
    };
    const fetchColleges = async () => {
      const { data, error } = await supabase
        .from('colleges')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error("Error fetching colleges", error);
      } else {
        setColleges(data || []);
      }
    };
    fetchJobs();
    fetchColleges();
  }, [toast]);

  React.useEffect(() => {
    if (showCamera) {
      const getCameraPermission = async () => {
        try {
          // Prefer the back camera for scanning documents
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing back camera, trying front:', error);
           try {
              // Fallback to any available camera if the back one fails
              const stream = await navigator.mediaDevices.getUserMedia({ video: true });
              setHasCameraPermission(true);
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
              }
           } catch (fallbackError) {
              console.error('Error accessing any camera:', fallbackError);
              setHasCameraPermission(false);
              setShowCamera(false);
              toast({
                variant: 'destructive',
                title: 'Camera Access Denied',
                description: 'Please enable camera permissions in your browser settings.',
              });
           }
        }
      };
      getCameraPermission();
    } else {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [showCamera, toast]);

  const processDataUri = async (dataUri: string) => {
    setIsParsing(true);
    toast({ title: 'Processing Resume', description: 'AI is extracting information...' });
    try {
      const result = await processResume({ resumeDataUri: dataUri });
      setResumeData(result);
      form.setValue('fullName', result.fullName, { shouldValidate: true });
      form.setValue('email', result.email, { shouldValidate: true });
      form.setValue('phone', result.phone, { shouldValidate: true });
      toast({ title: 'Success!', description: 'Resume processed. Please verify the details.' });
    } catch (error) {
      console.error('Error processing resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to process resume. Please enter details manually.',
        variant: 'destructive',
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleResumeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => processDataUri(reader.result as string);
    reader.onerror = () => {
      toast({ title: 'Error reading file', variant: 'destructive' });
    };
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        setShowCamera(false);
        processDataUri(dataUri);
      }
    }
  };

  const handleProfilePicUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setProfilePicFile(null);
      setProfilePicPreview(null);
      return;
    }
    setProfilePicFile(file);
    setProfilePicPreview(URL.createObjectURL(file));
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true);
    const supabase = createClient();
    try {
      let avatarUrl: string | undefined = undefined;

      if (profilePicFile) {
        const fileName = `${Date.now()}-${profilePicFile.name.replace(/\s/g, '-')}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, profilePicFile);
        
        if (uploadError) {
          console.error('Storage Error:', JSON.stringify(uploadError, null, 2));
          throw new Error(`Failed to upload profile picture. Please ensure storage policies are correct.`);
        }

        if (uploadData?.path) {
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(uploadData.path);
          avatarUrl = urlData.publicUrl;
        }
      }
      
      const collegeId = data.college_id === '_none_' ? null : data.college_id;
      
      const { data: newApplicant, error: insertError } = await supabase
        .from('applicants')
        .insert([{
          name: data.fullName,
          email: data.email,
          phone: data.phone,
          job_id: data.job_id || null,
          college_id: collegeId,
          stage: 'Applied',
          source: data.college_id ? 'college' : 'walk-in',
          applied_date: new Date().toISOString(),
          resume_data: resumeData,
          avatar: avatarUrl,
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Database Insert Error:', JSON.stringify(insertError, null, 2));
        throw new Error(`Database error: ${insertError.message}`);
      }

      if (!newApplicant) {
        throw new Error('Applicant record was not created successfully.');
      }

      toast({ title: 'Registration Successful!', description: 'Your profile has been created.' });
      router.push(`/portal/${newApplicant.id}`);
    } catch (error: any) {
      console.error('Error creating applicant:', error);
      toast({
        title: 'Submission Failed',
        description: error.message || 'Could not create your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isParsing || isSubmitting;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Applicant Registration</CardTitle>
          <CardDescription>
            Welcome! Use your resume to get started, or fill out the form manually.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
               <FormField
                  control={form.control}
                  name="profilePic"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-center">
                        <Avatar className="w-24 h-24 mb-2">
                            <AvatarImage src={profilePicPreview || undefined} />
                            <AvatarFallback><UserPlus className="w-10 h-10 text-muted-foreground" /></AvatarFallback>
                        </Avatar>
                        <FormLabel htmlFor="profile-pic-upload" className="sr-only">Upload Profile Picture</FormLabel>
                        <Button size="sm" asChild variant="outline">
                            <label htmlFor="profile-pic-upload" className="cursor-pointer">
                                <ImageUp className="mr-2" /> Upload Picture
                            </label>
                        </Button>
                        <FormControl>
                          <Input
                            type="file"
                            id="profile-pic-upload"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => {
                              field.onChange(e.target.files);
                              handleProfilePicUpload(e);
                            }}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                  )}
                />

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Resume (Optional)</span></div>
              </div>

              {showCamera ? (
                <div className="relative space-y-2">
                  <video ref={videoRef} className="w-full aspect-video rounded-md bg-black object-cover" autoPlay muted playsInline />
                  <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
                    <div className="w-full h-full border-4 border-dashed border-white/50 rounded-lg" />
                  </div>
                  {hasCameraPermission === false && (
                    <Alert variant="destructive">
                      <AlertTitle>Camera Access Required</AlertTitle>
                      <AlertDescription>Please allow camera access to use this feature.</AlertDescription>
                    </Alert>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={handleCapture} disabled={!hasCameraPermission} className="w-full">
                      <Zap className="mr-2 h-4 w-4" /> Capture
                    </Button>
                     <Button variant="outline" onClick={() => setShowCamera(false)} className="w-full">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="resumeFile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="resume-upload" className="sr-only">Upload Resume</FormLabel>
                        <Button asChild variant="outline" className="w-full h-12">
                          <label htmlFor="resume-upload" className="cursor-pointer">
                            <FileUp className="mr-2" /> Upload File
                          </label>
                        </Button>
                        <FormControl>
                          <Input
                            type="file"
                            id="resume-upload"
                            accept=".pdf,image/*"
                            className="sr-only"
                            onChange={(e) => {
                              field.onChange(e.target.files);
                              handleResumeUpload(e);
                            }}
                            disabled={isLoading}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button variant="outline" onClick={() => setShowCamera(true)} className="w-full h-12">
                    <Camera className="mr-2" /> Scan Resume
                  </Button>
                </div>
              )}
               <canvas ref={canvasRef} className="hidden" />

              {isParsing && (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="animate-spin" /> Parsing resume with AI...
                  </div>
              )}

              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input placeholder="e.g. Jane Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input placeholder="e.g. jane.doe@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl><Input placeholder="e.g. (555) 123-4567" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="job_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position Applying For</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a position" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {openJobs.map(job => (
                             <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="college_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>College / University (Optional)</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your college" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="_none_">None</SelectItem>
                          {colleges.map(college => (
                             <SelectItem key={college.id} value={college.id}>{college.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                Submit Registration
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
