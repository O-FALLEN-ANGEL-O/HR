
'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import type { CompanyPost, UserProfile } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { NewPostDialog } from '@/components/new-post-dialog';
import FeedPostCard from '@/components/feed-post-card';
import { ScrollArea } from '@/components/ui/scroll-area';

type CompanyFeedClientProps = {
  user: UserProfile | null;
  initialPosts: CompanyPost[];
};

export default function CompanyFeedClient({ user, initialPosts }: CompanyFeedClientProps) {
  const [posts, setPosts] = React.useState(initialPosts);
  const { toast } = useToast();
  const supabase = createClient();
  const canPost = user?.role === 'admin' || user?.role === 'hr_manager' || user?.role === 'super_hr';

  const fetchPosts = React.useCallback(async () => {
    const { data } = await supabase
      .from('company_posts')
      .select('*, users (full_name, avatar_url, role, department), post_comments(*, users(full_name, avatar_url))')
      .order('created_at', { ascending: false });
    setPosts(data || []);
  }, [supabase]);

  React.useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  React.useEffect(() => {
    const postsChannel = supabase
      .channel('realtime-company-posts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'company_posts' },
        () => {
          toast({ title: 'New post!', description: 'The feed has been updated.' });
          fetchPosts();
        }
      )
      .subscribe();
      
    const commentsChannel = supabase
       .channel('realtime-post-comments')
       .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_comments' },
        (payload) => {
           if((payload.new as any)?.post_id) {
             toast({ title: 'New comment added.' });
           }
           fetchPosts();
        }
       ).subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [toast, supabase, fetchPosts]);

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
                        <NewPostDialog onPostAdded={fetchPosts}>
                            <div className="flex-1 text-left text-sm text-muted-foreground p-2 rounded-lg border cursor-pointer hover:bg-muted/50">
                                What's happening in the company?
                            </div>
                        </NewPostDialog>
                    </div>
                </CardContent>
            </Card>
        )}
        <ScrollArea className="h-[calc(100vh-20rem)]">
          <div className="space-y-6 pr-4">
            {posts.map((post) => (
              <FeedPostCard key={post.id} post={post} currentUser={user} />
            ))}
          </div>
        </ScrollArea>
    </div>
  );
}
