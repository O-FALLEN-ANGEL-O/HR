'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import type { CompanyPost, UserProfile } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { NewPostDialog } from '@/components/new-post-dialog';
import FeedPostCard from '@/components/feed-post-card';

type CompanyFeedClientProps = {
  user: UserProfile | null;
  initialPosts: CompanyPost[];
};

export default function CompanyFeedClient({ user, initialPosts }: CompanyFeedClientProps) {
  const [posts, setPosts] = React.useState(initialPosts);
  const { toast } = useToast();
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
          toast({ title: 'New post!', description: 'The feed has been updated.' });
          const { data } = await supabase
            .from('company_posts')
            .select('*, users (full_name, avatar_url, role, department), post_comments(*, users(full_name, avatar_url))')
            .order('created_at', { ascending: false });
          setPosts(data || []);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_comments' },
        async (payload) => {
           const { data } = await supabase
            .from('company_posts')
            .select('*, users (full_name, avatar_url, role, department), post_comments(*, users(full_name, avatar_url))')
            .order('created_at', { ascending: false });
           
           if(data) {
             const commentedPostId = (payload.new as any)?.post_id;
             if(commentedPostId) {
                toast({ title: 'New comment added.' });
             }
             setPosts(data);
           }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return (
    <div className="space-y-6">
        {canPost && (
            <Card>
                <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={user?.avatar_url || undefined} />
                            <AvatarFallback>{user?.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <NewPostDialog>
                            <div className="flex-1 text-left text-sm text-muted-foreground p-2 rounded-lg border cursor-pointer hover:bg-muted/50">
                                What's happening in the company?
                            </div>
                        </NewPostDialog>
                    </div>
                </CardContent>
            </Card>
        )}
        <div className="space-y-6">
          {posts.map((post) => (
            <FeedPostCard key={post.id} post={post} currentUser={user} />
          ))}
        </div>
    </div>
  );
}
