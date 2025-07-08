
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
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ArrowRight, CheckCircle, HeartHandshake } from 'lucide-react';

const TEST_QUESTIONS = [
  {
    question: "A customer is very angry because their service is not working. What should you do first?",
    options: ["Apologize and show empathy", "Explain why it's not your fault", "Tell them to calm down", "Transfer the call immediately"],
    answer: "Apologize and show empathy",
  },
  {
    question: "A customer asks a question you don't know the answer to. What is the best course of action?",
    options: ["Guess the answer", "Tell them you don't know and end the call", "Politely ask to put them on a brief hold while you find the correct information", "Give them a different phone number to call"],
    answer: "Politely ask to put them on a brief hold while you find the correct information",
  },
  {
    question: "What is the most important quality for a customer service professional?",
    options: ["Speed", "Patience", "Technical knowledge", "Sales skills"],
    answer: "Patience",
  },
  {
    question: "When ending a call, you should:",
    options: ["Hang up as soon as the problem is solved", "Ask if there's anything else you can help with and thank them for calling", "Summarize the company's latest offers", "Tell them to leave a good review"],
    answer: "Ask if there's anything else you can help with and thank them for calling",
  },
  {
    question: "A customer is using inappropriate language. You should:",
    options: ["Shout back at them", "Hang up immediately without warning", "Calmly state that you cannot continue the conversation if the language persists", "Ignore it"],
    answer: "Calmly state that you cannot continue the conversation if the language persists",
  }
];

export default function CustomerServiceTestPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const applicantId = searchParams.get('id');
  const { toast } = useToast();
  const supabase = createClient();

  const [testState, setTestState] = React.useState<'not-started' | 'in-progress' | 'finished'>('not-started');
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<{ [key: number]: string }>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [finalScore, setFinalScore] = React.useState(0);

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
    let correctAnswers = 0;
    TEST_QUESTIONS.forEach((q, index) => {
      if (q.answer === answers[index]) {
        correctAnswers++;
      }
    });
    const score = Math.round((correctAnswers / TEST_QUESTIONS.length) * 100);
    setFinalScore(score);
    setTestState('finished');
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
            .update({ customer_service_score: finalScore })
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
            <HeartHandshake className="mx-auto h-16 w-16 text-primary mb-4" />
            <p className="text-muted-foreground mb-6">This test contains 5 situational questions. The test will start as soon as you click the button below.</p>
            <Button onClick={startTest} size="lg">Start Test</Button>
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
                </div>
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
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-2xl">
        {testState !== 'in-progress' && (
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">Customer Service Skills Test</CardTitle>
                <CardDescription>Assess your customer service and situational judgment skills.</CardDescription>
            </CardHeader>
        )}
        {renderContent()}
      </Card>
    </div>
  );
}
