'use client';

import * as React from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, MoreHorizontal } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { CompanyPost, UserProfile } from '@/lib/types';
import CommentSection from './comment-section';
import ReactionBar from './reaction-bar';

type FeedPostCardProps = {
  post: CompanyPost;
  currentUser: UserProfile | null;
};

export default function FeedPostCard({ post, currentUser }: FeedPostCardProps) {
  const [showComments, setShowComments] = React.useState(false);

  return (
    <Card id={`post-${post.id}`} className="overflow-hidden">
      <CardHeader className="p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={post.users?.avatar_url || undefined} />
            <AvatarFallback>{post.users?.full_name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-base font-semibold">{post.users?.full_name}</CardTitle>
            <CardDescription className="text-xs">
              {post.users?.role ? post.users.role.replace(/_/g, ' ') : 'User'} &bull; {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-2">
        <p className="mb-4 whitespace-pre-wrap text-sm">{post.content}</p>
      </CardContent>
      {post.image_url && (
        <div className="relative aspect-video w-full bg-muted">
          <Image
            src={post.image_url}
            alt="Post image"
            fill
            className="object-contain"
            data-ai-hint="office celebration"
          />
        </div>
      )}
      <CardFooter className="flex-col items-start gap-2 p-4">
        <div className="w-full flex justify-between items-center text-sm text-muted-foreground">
            <ReactionBar />
            <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}>
                {post.post_comments.length} Comment{post.post_comments.length !== 1 && 's'}
            </Button>
        </div>
        <Separator />
        {showComments && <CommentSection comments={post.post_comments} postId={post.id} currentUser={currentUser} />}
      </CardFooter>
    </Card>
  );
}
