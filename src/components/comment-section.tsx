'use client';

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import type { PostComment, UserProfile } from '@/lib/types';
import { addPostComment } from '@/app/actions';

type CommentSectionProps = {
  comments: PostComment[];
  postId: string;
  currentUser: UserProfile | null;
};

export default function CommentSection({ comments, postId, currentUser }: CommentSectionProps) {
  const [commentText, setCommentText] = React.useState('');
  const [isCommenting, setIsCommenting] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  const [isClient, setIsClient] = React.useState(false);

    React.useEffect(() => {
        setIsClient(true);
    }, []);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser) return;

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
  };

  return (
    <div className="w-full pt-2 space-y-4">
      {/* Post a comment form */}
      <form onSubmit={handleCommentSubmit} ref={formRef} className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={currentUser?.avatar_url || undefined} />
          <AvatarFallback>{currentUser?.full_name?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <Input
          name="comment"
          placeholder="Write a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          autoComplete="off"
          className="h-9"
        />
        <Button type="submit" size="icon" disabled={isCommenting || !commentText.trim()} className="h-9 w-9">
          {isCommenting ? <Loader2 className="animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
      
      {/* List of comments */}
      <div className="space-y-3">
        {comments
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map((comment) => (
            <div key={comment.id} className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.users.avatar_url || undefined} />
                <AvatarFallback>{comment.users.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 rounded-md bg-muted/50 p-2 text-sm">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="font-semibold text-xs">{comment.users.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {isClient ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }) : ''}
                  </p>
                </div>
                <p className="text-sm">{comment.comment}</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
