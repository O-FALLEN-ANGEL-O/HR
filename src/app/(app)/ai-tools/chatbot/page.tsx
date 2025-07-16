'use client';

import * as React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { aiChatbot } from '@/ai/flows/ai-chatbot';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage, UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Bot, Loader2, Send, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/header';


const ChatSchema = z.object({
  query: z.string().min(1, 'Message cannot be empty.'),
});

export default function AIChatbotPage() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const { toast } = useToast();
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof ChatSchema>>({
    resolver: zodResolver(ChatSchema),
    defaultValues: { query: '' },
  });

  React.useEffect(() => {
    const fetchUser = async () => {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
            const { data: userProfile } = await supabase.from('users').select('*').eq('id', authUser.id).single();
            setCurrentUser(userProfile);
        }
    };
    fetchUser();
  }, []);

  React.useEffect(() => {
    if (currentUser) {
        setMessages([
          {
            id: 'init',
            role: 'assistant',
            content: `Hello ${currentUser.full_name?.split(' ')[0]}! I'm the HR+ AI Assistant. How can I help you today?`,
            timestamp: Date.now(),
          },
        ]);
    } else {
         setMessages([
          {
            id: 'init',
            role: 'assistant',
            content: "Hello! I'm the HR+ AI Assistant. How can I help you today?",
            timestamp: Date.now(),
          },
        ]);
    }
  }, [currentUser]);

  React.useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollableViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollableViewport) {
            scrollableViewport.scrollTop = scrollableViewport.scrollHeight;
        }
    }
  }, [messages]);

  const onSubmit: SubmitHandler<z.infer<typeof ChatSchema>> = async (data) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: data.query,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    form.reset();
    setIsLoading(true);

    try {
      const response = await aiChatbot({ 
          query: data.query,
          userContext: {
              fullName: currentUser?.full_name || 'Employee',
              role: currentUser?.role || 'employee'
          }
       });
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error with chatbot:', error);
      toast({
        title: 'Error',
        description: 'Could not get a response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header title="AI Chatbot" />
      <div className="flex-1 flex items-center justify-center p-4 md:p-6">
        <Card className="flex flex-col w-full max-w-2xl h-[calc(100vh-12rem)] shadow-xl">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                 <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>AI HR Assistant</CardTitle>
                <CardDescription>
                  Your personal AI assistant for HR-related questions.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full" ref={scrollAreaRef}>
              <div className="space-y-6 p-4 md:p-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex items-start gap-3',
                      message.role === 'user' && 'justify-end'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="h-8 w-8 border">
                        <AvatarFallback>
                          <Bot className="h-5 w-5 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'max-w-md rounded-lg px-4 py-2 shadow-sm',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={currentUser?.avatar_url || undefined} />
                        <AvatarFallback>{currentUser?.full_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isLoading && (
                     <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8 border">
                            <AvatarFallback>
                                <Bot className="h-5 w-5 text-primary" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted rounded-lg px-4 py-2 flex items-center shadow-sm">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="border-t p-4">
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex w-full items-center gap-2"
            >
              <Input {...form.register('query')} placeholder="Type your message..." autoComplete='off' className="flex-1" />
              <Button type="submit" disabled={isLoading} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
