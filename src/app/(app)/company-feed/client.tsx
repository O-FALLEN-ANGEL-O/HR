'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { PlusCircle, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CompanyPost, UserProfile } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { addCompanyPost } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';

type CompanyFeedClientProps = {
  user: UserProfile | null;
  initialPosts: CompanyPost[];
};

export default function CompanyFeedClient({ user, initialPosts }: CompanyFeedClientProps) {
  const [posts, setPosts] = React.useState(initialPosts);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);
  const canPost = user?.role === 'admin' || user?.role === 'hr_manager' || user?.role === 'super_hr';

  React.useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime-company-posts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'company_posts' },
        async () => {
          const { data } = await supabase
            .from('company_posts')
            .select('*, users (full_name, avatar_url)')
            .order('created_at', { ascending: false });
          setPosts(data || []);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleNewPost = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
        await addCompanyPost(formData);
        toast({ title: "Post Published!", description: "Your update is now live on the feed." });
        formRef.current?.reset();
    } catch(error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="space-y-6 pr-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={post.users?.avatar_url || undefined} />
                    <AvatarFallback>{post.users?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{post.users?.full_name}</CardTitle>
                    <CardDescription>
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 whitespace-pre-wrap">{post.content}</p>
                {post.image_url && (
                    <div className="relative aspect-video w-full">
                         <Image
                            src={post.image_url}
                            alt="Post image"
                            fill
                            className="rounded-md object-cover"
                            data-ai-hint="office celebration"
                        />
                    </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        </ScrollArea>
      </div>
      <div className="md:col-span-1">
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle>About The Feed</CardTitle>
            <CardDescription>This is your place for all official company announcements and updates.</CardDescription>
          </CardHeader>
          <CardContent>
             {canPost && (
                <Dialog onOpenChange={(open) => !open && formRef.current?.reset()}>
                    <DialogTrigger asChild>
                        <Button className="w-full">
                            <PlusCircle className="mr-2" /> New Post
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create a new post</DialogTitle>
                            <DialogDescription>Share an update with the rest of the company.</DialogDescription>
                        </DialogHeader>
                        <form action={handleNewPost} ref={formRef}>
                            <div className="grid gap-4 py-4">
                                <Textarea name="content" placeholder="What's happening?" required />
                                <Input name="imageUrl" placeholder="Image URL (optional)" />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" />}
                                        Post
                                    </Button>
                                </DialogClose>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
