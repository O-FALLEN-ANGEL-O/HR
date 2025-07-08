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
import { Loader2, ArrowRight, Clock, BrainCircuit, CheckCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


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

export default function AptitudeTestPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const applicantId = searchParams.get('id');
  const { toast } = useToast();
  const supabase = createClient();

  const [testState, setTestState] = React.useState<'not-started' | 'in-progress' | 'finished'>('not-started');
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<{ [key: number]: string }>({});
  const [timeRemaining, setTimeRemaining] = React.useState(TEST_DURATION_SECONDS);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [finalScore, setFinalScore] = React.useState(0);

  const timerIntervalRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    if (testState === 'in-progress') {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerIntervalRef.current);
            finishTest();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [testState]);

  const startTest = () => setTestState('in-progress');

  const handleAnswerChange = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: value }));
  };
  
  const handleNext = () => {
    if (currentQuestionIndex < TEST_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishTest();
    }
  };

  const finishTest = () => {
    clearInterval(timerIntervalRef.current);
    setTestState('finished');
    let correctAnswers = 0;
    TEST_QUESTIONS.forEach((q, index) => {
      if (q.answer === answers[index]) {
        correctAnswers++;
      }
    });
    const score = Math.round((correctAnswers / TEST_QUESTIONS.length) * 100);
    setFinalScore(score);
  };
  
  const submitResults = async () => {
    if (!applicantId) {
        toast({ title: 'Error', description: 'No applicant ID found.', variant: 'destructive'});
        return;
    }
    setIsSubmitting(true);
    try {
        const { error } = await supabase
            .from('applicants')
            .update({ aptitude_score: finalScore })
            .eq('id', applicantId);

        if (error) throw error;
        
        toast({ title: 'Success', description: 'Your test results have been saved.'});
        router.push(`/portal/${applicantId}`);

    } catch (error) {
        console.error("Error saving results:", error);
        toast({ title: 'Error', description: 'Failed to save your results. Please contact HR.', variant: 'destructive'});
    } finally {
        setIsSubmitting(false);
    }
  }

  const renderContent = () => {
    if (testState === 'not-started') {
      return (
        <div className="text-center">
            <BrainCircuit className="mx-auto h-16 w-16 text-primary mb-4" />
            <p className="text-muted-foreground mb-6">You will have 5 minutes to answer 5 questions. The test will start as soon as you click the button below.</p>
            <Button onClick={startTest} size="lg">Start Aptitude Test</Button>
        </div>
      );
    }

    if (testState === 'finished') {
      return (
        <div className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <CardTitle>Test Complete!</CardTitle>
            <CardDescription className="my-2">Your final score is:</CardDescription>
            <p className="text-6xl font-bold text-primary my-4">{finalScore}%</p>
            <Button onClick={submitResults} disabled={isSubmitting} size="lg">
                {isSubmitting ? <Loader2 className="mr-2 animate-spin"/> : <ArrowRight className="mr-2"/>}
                Submit and Return to Portal
            </Button>
        </div>
      );
    }
    
    const currentQuestion = TEST_QUESTIONS[currentQuestionIndex];
    return (
        <>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Question {currentQuestionIndex + 1} of {TEST_QUESTIONS.length}</CardTitle>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>
                    </div>
                </div>
                <Progress value={(timeRemaining / TEST_DURATION_SECONDS) * 100} className="mt-2" />
            </CardHeader>
            <CardContent>
                <p className="font-semibold text-lg mb-4">{currentQuestion.question}</p>
                <RadioGroup onValueChange={handleAnswerChange} value={answers[currentQuestionIndex]}>
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
        </>
    )
  }

  return (
    <>
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-2xl">
        {testState !== 'in-progress' && (
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">Aptitude Test</CardTitle>
                <CardDescription>Assess your logical and problem-solving skills.</CardDescription>
            </CardHeader>
        )}
        {renderContent()}
      </Card>
    </div>
    <AlertDialog open={timeRemaining === 0 && testState !== 'finished'}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Time's Up!</AlertDialogTitle>
            <AlertDialogDescription>
                The time for the test has expired. Your submitted answers will be scored.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogAction onClick={finishTest}>See Results</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
