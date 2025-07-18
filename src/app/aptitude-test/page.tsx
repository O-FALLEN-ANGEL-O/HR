
'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
    RadioGroup,
    RadioGroupItem
} from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ArrowRight, Clock, BrainCircuit, CheckCircle, Video, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useFullscreenLock } from '@/hooks/use-fullscreen-lock';
import { useTabFocus } from '@/hooks/use-tab-focus';
import { useProctoring } from '@/hooks/use-proctoring';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';


const TEST_QUESTIONS = [
  {
    question: "What is the next number in the series: 2, 4, 8, 16, ...?",
    options: ["24", "32", "64", "28"],
    answer: "32",
  },
  {
    question: "Which word is the odd one out?",
    options: ["Apple", "Banana", "Orange", "Carrot"],
    answer: "Carrot",
  },
  {
    question: "If a car travels at 60 km/h, how far will it travel in 2.5 hours?",
    options: ["120 km", "150 km", "180 km", "100 km"],
    answer: "150 km",
  },
  {
    question: "A man buys a TV for $800 and sells it for $1000. What is his profit percentage?",
    options: ["20%", "25%", "15%", "30%"],
    answer: "25%",
  },
  {
    question: "Complete the analogy: Pen is to Writer as Brush is to ...",
    options: ["Painter", "Canvas", "Paint", "Easel"],
    answer: "Painter",
  }
];

const TEST_DURATION_SECONDS = 300; // 5 minutes

export default function SecureAptitudeTestPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const applicantId = searchParams.get('id');
  const { toast } = useToast();
  const supabase = createClient();
  const [testState, setTestState] = React.useState<'consent' | 'in-progress' | 'finished'>('consent');
  const [agreed, setAgreed] = React.useState(false);

  // Anti-cheating hooks
  const { elementRef, requestFullscreen, isFullscreen } = useFullscreenLock(handleFullscreenExit);
  const {
      permissions,
      isRecording,
      startRecording,
      stopRecording,
      getCombinedStream,
  } = useProctoring();

  // Test state
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<{ [key: number]: string }>({});
  const [timeRemaining, setTimeRemaining] = React.useState(TEST_DURATION_SECONDS);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [finalScore, setFinalScore] = React.useState(0);
  const [violation, setViolation] = React.useState<string | null>(null);

  const timerIntervalRef = React.useRef<NodeJS.Timeout>();
  
  function handleViolation(reason: string) {
      if (testState !== 'in-progress') return;
      console.warn(`Violation detected: ${reason}`);
      setViolation(reason);
      finishTest(true); // Disqualify
  }

  function handleFullscreenExit() {
      if (testState === 'in-progress') {
          handleViolation("You have exited fullscreen mode.");
      }
  }

  useTabFocus({ onBlur: () => handleViolation("You have switched tabs or windows.") });

  const startTest = async () => {
    if (!agreed) {
      toast({ title: "Consent Required", description: "You must agree to the terms to start.", variant: 'destructive'});
      return;
    }
    
    try {
      const stream = await getCombinedStream();
      if (!stream) {
          toast({ title: 'Permissions Error', description: 'Could not get required media permissions.', variant: 'destructive' });
          return;
      }
      requestFullscreen();
      startRecording(stream);
      setTestState('in-progress');
    } catch (err) {
      console.error(err);
      toast({ title: 'Error Starting Test', description: 'Please ensure you have granted all necessary permissions.', variant: 'destructive' });
    }
  };

  const finishTest = React.useCallback(async (isDisqualified = false) => {
    if (testState !== 'in-progress') return;

    clearInterval(timerIntervalRef.current);
    const recordingBlob = await stopRecording();
    setTestState('finished');
    
    if (isDisqualified) {
      setFinalScore(0);
      submitResults(0, recordingBlob, violation);
      return;
    }

    let correctAnswers = 0;
    TEST_QUESTIONS.forEach((q, index) => {
      if (q.answer === answers[index]) {
        correctAnswers++;
      }
    });
    const score = Math.round((correctAnswers / TEST_QUESTIONS.length) * 100);
    setFinalScore(score);
    submitResults(score, recordingBlob);
  }, [answers, stopRecording, testState, violation]);
  
  const submitResults = async (score: number, recording: Blob | null, remarks?: string | null) => {
    if (!applicantId) {
        toast({ title: 'Error', description: 'No applicant ID found.', variant: 'destructive'});
        return;
    }
    setIsSubmitting(true);
    toast({ title: 'Submitting results...', description: 'Please wait.' });

    try {
        let recordingUrl = null;
        if (recording) {
            const fileName = `aptitude-test-${applicantId}-${Date.now()}.webm`;
            const { data, error } = await supabase.storage.from('test-recordings').upload(fileName, recording, {
                contentType: 'video/webm'
            });
            if (error) {
                console.error("Storage Error:", error);
                toast({ title: "Recording Upload Failed", description: "Your test score was saved, but the recording failed to upload.", variant: "destructive" });
            } else {
                recordingUrl = data.path;
            }
        }

        const { error: updateError } = await supabase
            .from('applicants')
            .update({ 
                aptitude_score: score,
                rejection_reason: remarks || (recordingUrl ? `Recording: ${recordingUrl}` : null) 
            })
            .eq('id', applicantId);

        if (updateError) throw updateError;
        
        // No redirect here, show final confirmation screen
    } catch (error: any) {
        console.error("Error saving results:", error);
        toast({ title: 'Error', description: `Failed to save your results: ${error.message}`, variant: 'destructive'});
        setIsSubmitting(false); // Allow retry
    }
    // Don't set submitting to false on success, user will be on the final screen.
  };

  React.useEffect(() => {
    if (testState === 'in-progress') {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerIntervalRef.current);
            finishTest(false); // Time's up
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [testState, finishTest]);

  const handleNext = () => {
    if (currentQuestionIndex < TEST_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishTest(false); // Finished normally
    }
  };

  const renderConsentScreen = () => (
    <CardContent className="text-center p-6 space-y-4">
        <ShieldCheck className="mx-auto h-16 w-16 text-primary mb-4" />
        <p className="text-muted-foreground">This aptitude test will record your screen, microphone, and webcam during the session to ensure fairness.</p>
        <Alert>
            <AlertTitle>Test Rules</AlertTitle>
            <AlertDescription>
                <ul className="list-disc list-inside text-left">
                    <li>Do not switch tabs or windows.</li>
                    <li>Do not exit fullscreen mode.</li>
                    <li>Any violation will lead to automatic disqualification.</li>
                </ul>
            </AlertDescription>
        </Alert>
        <div className="flex items-center space-x-2 justify-center pt-4">
            <Checkbox id="terms" checked={agreed} onCheckedChange={(checked) => setAgreed(!!checked)} />
            <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                I consent to screen, mic, and webcam recording.
            </label>
        </div>
        <Button onClick={startTest} size="lg" disabled={!agreed} className="w-full">
            Start Test
        </Button>
    </CardContent>
  );

  const renderTestScreen = () => {
    const currentQuestion = TEST_QUESTIONS[currentQuestionIndex];
    return (
        <div ref={elementRef}>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                         <div className="relative flex items-center justify-center h-5 w-5">
                            <Video className="h-5 w-5 text-red-500" />
                            <div className="absolute h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        </div>
                        <span className="text-red-500 font-medium text-sm">Recording</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>
                    </div>
                </div>
                <Progress value={(timeRemaining / TEST_DURATION_SECONDS) * 100} className="mt-2" />
            </CardHeader>
            <CardContent>
                 <p className="font-semibold text-lg mb-2">Question {currentQuestionIndex + 1} of {TEST_QUESTIONS.length}</p>
                <p className="font-medium text-base mb-4">{currentQuestion.question}</p>
                <RadioGroup onValueChange={(value) => setAnswers(prev => ({...prev, [currentQuestionIndex]: value}))} value={answers[currentQuestionIndex]}>
                    {currentQuestion.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2 rounded-md border p-3 hover:bg-muted/50">
                            <RadioGroupItem value={option} id={`q${currentQuestionIndex}-o${index}`} />
                            <Label htmlFor={`q${currentQuestionIndex}-o${index}`} className="flex-1 cursor-pointer">{option}</Label>
                        </div>
                    ))}
                </RadioGroup>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleNext} className="w-full" disabled={!answers[currentQuestionIndex]}>
                    {currentQuestionIndex < TEST_QUESTIONS.length - 1 ? "Next Question" : "Finish Test"}
                    <ArrowRight className="ml-2" />
                 </Button>
            </CardFooter>
        </div>
    )
  }

  const renderFinishedScreen = () => (
    <CardContent className="text-center p-6 space-y-4">
        {violation ? (
            <>
                <ShieldAlert className="mx-auto h-16 w-16 text-destructive mb-4" />
                <CardTitle>Test Disqualified</CardTitle>
                <CardDescription className="my-2">{violation}</CardDescription>
            </>
        ) : (
            <>
                <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                <CardTitle>Test Complete!</CardTitle>
                <CardDescription className="my-2">Your final score is:</CardDescription>
                <p className="text-6xl font-bold text-primary my-4">{finalScore}%</p>
            </>
        )}
        {isSubmitting ? (
             <div className="flex flex-col items-center justify-center gap-2">
                <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">Submitting results and uploading recording...</p>
             </div>
        ) : (
            <>
            <p className="text-sm text-muted-foreground">Thank you for completing the assessment. You may now close this window.</p>
             <Button onClick={() => window.close()} className="w-full">Close Window</Button>
            </>
        )}
    </CardContent>
  );

  const renderContent = () => {
    switch (testState) {
      case 'consent': return renderConsentScreen();
      case 'in-progress': return renderTestScreen();
      case 'finished': return renderFinishedScreen();
      default: return null;
    }
  };

  return (
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
            <CardTitle className="text-2xl">Secure Aptitude Test</CardTitle>
            <CardDescription>Assess your logical and problem-solving skills.</CardDescription>
        </CardHeader>
        {renderContent()}
      </Card>
  );
}
