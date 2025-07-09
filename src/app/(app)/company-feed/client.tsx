'use client';

import * as React from 'react';
import { faker } from '@faker-js/faker';
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
import { PlusCircle, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CompanyPost, UserRole } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

const mockPosts: CompanyPost[] = [
  {
    id: 'post-1',
    authorName: 'HR Department',
    authorAvatar: 'https://i.pravatar.cc/150?u=hr',
    content: "Big welcome to our new summer interns! We're so excited to have you join the team. Let's make this a great summer!",
    imageUrl: 'https://placehold.co/600x400.png',
    timestamp: faker.date.recent({ days: 1 }).toISOString(),
  },
  {
    id: 'post-2',
    authorName: 'Alex Johnson',
    authorAvatar: 'https://i.pravatar.cc/150?u=alex',
    content: "The Q2 All-Hands meeting is scheduled for this Friday at 10 AM in the main conference room. See you all there!",
    timestamp: faker.date.recent({ days: 2 }).toISOString(),
  },
   {
    id: 'post-3',
    authorName: 'Samantha Lee',
    authorAvatar: 'https://i.pravatar.cc/150?u=samantha',
    content: "Amazing job to the engineering team for the successful launch of Project Phoenix! Your hard work has paid off. Time to celebrate!",
    imageUrl: 'https://placehold.co/600x400.png',
    timestamp: faker.date.recent({ days: 5 }).toISOString(),
  },
];

type CompanyFeedClientProps = {
  userRole?: UserRole;
};

export default function CompanyFeedClient({ userRole }: CompanyFeedClientProps) {
  const [posts, setPosts] = React.useState(mockPosts);
  const { toast } = useToast();
  const canPost = userRole === 'admin' || userRole === 'hr_manager' || userRole === 'super_hr';

  const handleNewPost = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const content = formData.get('content') as string;
    const imageUrl = formData.get('imageUrl') as string;

    if (!content) {
        toast({ title: "Post content cannot be empty.", variant: "destructive" });
        return;
    }

    const newPost: CompanyPost = {
        id: faker.string.uuid(),
        authorName: "Admin User", // In a real app, get this from current user context
        authorAvatar: "https://i.pravatar.cc/150?u=admin",
        content,
        imageUrl,
        timestamp: new Date().toISOString()
    };
    
    setPosts(prev => [newPost, ...prev]);
    toast({ title: "Post Published!", description: "Your update is now live on the feed." });
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
                    <AvatarImage src={post.authorAvatar} />
                    <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{post.authorName}</CardTitle>
                    <CardDescription>
                      {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              {post.imageUrl && (
                <CardContent>
                    <p className="mb-4">{post.content}</p>
                    <div className="relative aspect-video w-full">
                         <Image
                            src={post.imageUrl}
                            alt="Post image"
                            fill
                            className="rounded-md object-cover"
                            data-ai-hint="office celebration"
                        />
                    </div>
                </CardContent>
              )}
              {!post.imageUrl && (
                 <CardContent>
                    <p>{post.content}</p>
                </CardContent>
              )}
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
                <Dialog>
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
                        <form onSubmit={handleNewPost}>
                            <div className="grid gap-4 py-4">
                                <Textarea name="content" placeholder="What's happening?" required />
                                <Input name="imageUrl" placeholder="Image URL (optional)" />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="submit"><Send className="mr-2" />Post</Button>
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
