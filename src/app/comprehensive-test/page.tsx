
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
import { Loader2, ArrowRight, CheckCircle, Library } from 'lucide-react';

const TEST_PASSAGE = "The rise of artificial intelligence (AI) is transforming industries worldwide. From automating repetitive tasks to providing deep insights from data, AI's applications are vast. However, its development also raises ethical questions about job displacement, privacy, and algorithmic bias. As we integrate AI more deeply into society, it is crucial to establish robust governance frameworks to ensure its benefits are maximized while its risks are mitigated. Striking this balance is one of the most significant challenges of our time.";

const TEST_QUESTIONS = [
  {
    question: "What is the main topic of the passage?",
    options: ["The history of computers", "The challenges and impact of AI", "The ethics of data privacy", "The future of automation"],
    answer: "The challenges and impact of AI",
  },
  {
    question: "According to the passage, what is one of the ethical questions raised by AI?",
    options: ["Data storage costs", "Software compatibility", "Algorithmic bias", "Network speed"],
    answer: "Algorithmic bias",
  },
  {
    question: "What does the passage suggest is crucial for the integration of AI into society?",
    options: ["Faster processing speeds", "Open-source software", "Robust governance frameworks", "Increased investment"],
    answer: "Robust governance frameworks",
  },
];

export default function ComprehensiveTestPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const applicantId = searchParams.get('id');
  const { toast } = useToast();
  const supabase = createClient();

  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<{ [key: number]: string }>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isFinished, setIsFinished] = React.useState(false);
  const [finalScore, setFinalScore] = React.useState(0);

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
    setIsFinished(true);
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
            .update({ comprehensive_score: finalScore })
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
    if (isFinished) {
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
                <CardTitle>Question {currentQuestionIndex + 1} of {TEST_QUESTIONS.length}</CardTitle>
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
        <CardHeader>
            <div className="flex justify-center mb-4"><Library className="h-10 w-10 text-primary" /></div>
            <CardTitle className="text-2xl text-center">Comprehensive Test</CardTitle>
            <CardDescription className="text-center">Read the passage and answer the questions.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="rounded-lg border bg-muted/50 p-4 mb-6">
                <p className="text-sm leading-relaxed">{TEST_PASSAGE}</p>
            </div>
            <div className="border-t pt-6">
                {renderContent()}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
