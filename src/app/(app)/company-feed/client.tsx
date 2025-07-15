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
import { PlusCircle, Send, Loader2, MessageSquare, Share2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CompanyPost, UserProfile, PostComment } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { addCompanyPost, addPostComment } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';
import { Separator } from '@/components/ui/separator';

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
            .select('*, users (full_name, avatar_url), post_comments(*, users(full_name, avatar_url))')
            .order('created_at', { ascending: false });
          setPosts(data || []);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_comments' },
        async () => {
             const { data } = await supabase
            .from('company_posts')
            .select('*, users (full_name, avatar_url), post_comments(*, users(full_name, avatar_url))')
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
            <PostCard key={post.id} post={post} currentUser={user} />
          ))}
        </div>
        </ScrollArea>
      </div>
      <div className="md:col-span-1">
        <Card className="sticky top-4 md:top-20">
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
                                <Input name="image" type="file" accept="image/*" />
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


function PostCard({ post, currentUser }: { post: CompanyPost, currentUser: UserProfile | null }) {
    const { toast } = useToast();
    const handleShare = () => {
        navigator.clipboard.writeText(`${window.location.origin}/company-feed#post-${post.id}`);
        toast({ title: "Link Copied!", description: "A link to this post has been copied." });
    }
    
    return (
        <Card id={`post-${post.id}`}>
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
            <CardFooter className="flex-col items-start gap-4">
                 <div className="flex gap-4">
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.post_comments.length} Comment{post.post_comments.length !== 1 && 's'}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={handleShare}>
                        <Share2 className="h-4 w-4" />
                        <span>Share</span>
                    </Button>
                </div>
                <Separator />
                <CommentSection comments={post.post_comments} postId={post.id} currentUser={currentUser} />
            </CardFooter>
        </Card>
    )
}

function CommentSection({ comments, postId, currentUser }: { comments: PostComment[], postId: string, currentUser: UserProfile | null }) {
    const [commentText, setCommentText] = React.useState('');
    const [isCommenting, setIsCommenting] = React.useState(false);
    const formRef = React.useRef<HTMLFormElement>(null);
    const { toast } = useToast();

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        
        setIsCommenting(true);
        const formData = new FormData();
        formData.append('postId', postId);
        formData.append('comment', commentText);

        try {
            await addPostComment(formData);
            setCommentText('');
            formRef.current?.reset();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsCommenting(false);
        }
    }
    
    return (
        <div className="w-full space-y-4">
            {comments.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map(comment => (
                <div key={comment.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.users.avatar_url || undefined} />
                        <AvatarFallback>{comment.users.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 rounded-md bg-muted/50 p-3 text-sm">
                        <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold">{comment.users.full_name}</p>
                            <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</p>
                        </div>
                        <p>{comment.comment}</p>
                    </div>
                </div>
            ))}
            <form onSubmit={handleCommentSubmit} ref={formRef} className="flex items-center gap-2 pt-2">
                 <Avatar className="h-9 w-9">
                    <AvatarImage src={currentUser?.avatar_url || undefined} />
                    <AvatarFallback>{currentUser?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <Input name="comment" placeholder="Write a comment..." value={commentText} onChange={e => setCommentText(e.target.value)} autoComplete="off" />
                <Button type="submit" size="icon" disabled={isCommenting || !commentText.trim()}>
                    {isCommenting ? <Loader2 className="animate-spin" /> : <Send />}
                </Button>
            </form>
        </div>
    )
}
