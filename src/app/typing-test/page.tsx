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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ArrowRight } from 'lucide-react';

const TEST_TEXT = "The quick brown fox jumps over the lazy dog. This sentence contains all the letters of the alphabet. In the world of technology, speed and accuracy are paramount for success. Developers often spend hours honing their skills, writing clean, efficient code. A good typist can significantly improve productivity, whether they are drafting an email, documenting a project, or coding the next big thing. Practice is the key to improvement, turning repetitive motions into muscle memory. Every keystroke counts in the digital age.";

export default function TypingTestPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const applicantId = searchParams.get('id');
  const { toast } = useToast();
  const supabase = createClient();

  const [userInput, setUserInput] = React.useState('');
  const [startTime, setStartTime] = React.useState<number | null>(null);
  const [isFinished, setIsFinished] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [results, setResults] = React.useState({ wpm: 0, accuracy: 0 });

  const textToType = React.useMemo(() => TEST_TEXT.split(''), []);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isFinished) return;
    const { value } = e.target;
    if (!startTime) {
      setStartTime(Date.now());
    }
    setUserInput(value);

    if (value.length >= textToType.length) {
      finishTest(value);
    }
  };

  const finishTest = (finalInput: string) => {
    if (!startTime || isFinished) return;

    setIsFinished(true);
    const endTime = Date.now();
    const durationInMinutes = (endTime - startTime) / 1000 / 60;
    
    const wordsTyped = finalInput.trim().split(/\s+/).length;
    const wpm = Math.round(wordsTyped / durationInMinutes);
    
    let correctChars = 0;
    finalInput.split('').forEach((char, index) => {
        if (char === textToType[index]) {
            correctChars++;
        }
    });
    const accuracy = Math.round((correctChars / textToType.length) * 100);
    
    setResults({ wpm, accuracy });
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
            .update({ wpm: results.wpm, accuracy: results.accuracy })
            .eq('id', applicantId);

        if (error) throw error;
        
        toast({ title: 'Success', description: 'Your typing test results have been saved.'});
        router.push(`/portal/${applicantId}`);

    } catch (error) {
        console.error("Error saving results:", error);
        toast({ title: 'Error', description: 'Failed to save your results. Please contact HR.', variant: 'destructive'});
    } finally {
        setIsSubmitting(false);
    }
  }

  React.useEffect(() => {
    if (!isFinished) {
      inputRef.current?.focus();
    }
  }, [isFinished]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Typing Speed & Accuracy Test</CardTitle>
          <CardDescription>
            Type the text below as quickly and accurately as possible. The test will end automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border bg-secondary/30 p-4 font-mono text-muted-foreground">
            {textToType.map((char, index) => {
              let color = 'text-muted-foreground';
              if (index < userInput.length) {
                color = char === userInput[index] ? 'text-green-500' : 'text-red-500 bg-red-500/10';
              }
              return <span key={index} className={color}>{char}</span>;
            })}
          </div>
          <Textarea
            ref={inputRef}
            value={userInput}
            onChange={handleInputChange}
            className="font-mono h-32"
            placeholder="Start typing here..."
            disabled={isFinished}
          />
        </CardContent>
        {isFinished && (
            <CardFooter className="flex-col items-start gap-4">
                 <div className="w-full rounded-lg border p-4 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Words Per Minute (WPM)</p>
                        <p className="text-3xl font-bold text-primary">{results.wpm}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Accuracy</p>
                        <p className="text-3xl font-bold text-primary">{results.accuracy}%</p>
                    </div>
                 </div>
                 <Button onClick={submitResults} disabled={isSubmitting} className="w-full">
                    {isSubmitting ? <Loader2 className="mr-2 animate-spin"/> : <ArrowRight className="mr-2"/>}
                    Submit Results and Continue
                 </Button>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
