
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
import { Loader2, ArrowRight, CheckCircle, SpellCheck } from 'lucide-react';

const TEST_QUESTIONS = [
  {
    question: "Choose the correct sentence: 'Each of the students ___ responsible for their own work.'",
    options: ["is", "are"],
    answer: "is",
  },
  {
    question: "Which word is a synonym for 'ephemeral'?",
    options: ["Everlasting", "Temporary", "Beautiful", "Strong"],
    answer: "Temporary",
  },
  {
    question: "Identify the correct use of 'its' or 'it's': 'The dog wagged ___ tail because ___ happy.'",
    options: ["its / it's", "it's / its", "its / its", "it's / it's"],
    answer: "its / it's",
  },
  {
    question: "He didn't know ___ to accept the offer or not.",
    options: ["weather", "whether", "wether"],
    answer: "whether",
  },
    {
    question: "I have ___ interest in politics.",
    options: ["less", "fewer"],
    answer: "less",
  }
];

export default function EnglishGrammarTestPage() {
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
            .update({ english_grammar_score: finalScore })
            .eq('id', applicantId);

        if (error) throw error;
        
        toast({ title: 'Success', description: 'Your test results have been saved.'});
        router.push(`/portal/${applicantId}`);

    } catch (error: any) {
        console.error("Error saving results:", error);
        toast({ title: 'Error', description: error.message || 'Failed to save your results. Please contact HR.', variant: 'destructive'});
    } finally {
        setIsSubmitting(false);
    }
  }

  const renderContent = () => {
    if (testState === 'not-started') {
      return (
        <CardContent className="text-center p-6">
            <SpellCheck className="mx-auto h-16 w-16 text-primary mb-4" />
            <p className="text-muted-foreground mb-6">You will have 5 questions to answer. The test will start as soon as you click the button below.</p>
            <Button onClick={startTest} size="lg">Start Grammar Test</Button>
        </CardContent>
      );
    }

    if (testState === 'finished') {
      return (
        <CardContent className="text-center p-6">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <CardTitle>Test Complete!</CardTitle>
            <CardDescription className="my-2">Your final score is:</CardDescription>
            <p className="text-6xl font-bold text-primary my-4">{finalScore}%</p>
            <Button onClick={submitResults} disabled={isSubmitting} size="lg">
                {isSubmitting ? <Loader2 className="mr-2 animate-spin"/> : <ArrowRight className="mr-2"/>}
                Submit and Return to Portal
            </Button>
        </CardContent>
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
    <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
            <CardTitle className="text-2xl">English Grammar Test</CardTitle>
            <CardDescription>Assess your command of the English language.</CardDescription>
        </CardHeader>
        {renderContent()}
    </Card>
  );
}
