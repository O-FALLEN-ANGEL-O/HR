'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Send, Award, Star, Loader2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { Kudo, UserProfile, WeeklyAward } from '@/lib/types';
import { addKudo, addWeeklyAward } from '@/app/actions';

type KudosClientProps = {
  currentUser: UserProfile | null;
  initialKudos: Kudo[];
  initialUsers: UserProfile[];
  initialWeeklyAward: WeeklyAward | null;
};

export default function KudosClient({
  currentUser,
  initialKudos,
  initialUsers,
  initialWeeklyAward,
}: KudosClientProps) {
  const { toast } = useToast();
  const [isKudoSubmitting, setIsKudoSubmitting] = React.useState(false);
  const [isAwardSubmitting, setIsAwardSubmitting] = React.useState(false);
  const kudosFormRef = React.useRef<HTMLFormElement>(null);
  const awardFormRef = React.useRef<HTMLFormElement>(null);

  const canGiveAward = currentUser?.role === 'admin' || currentUser?.role === 'super_hr' || currentUser?.role === 'hr_manager';

  const handleGiveKudos = async (formData: FormData) => {
    setIsKudoSubmitting(true);
    try {
      await addKudo(formData);
      toast({ title: 'Kudos Sent!', description: `Your recognition has been posted.` });
      kudosFormRef.current?.reset();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsKudoSubmitting(false);
    }
  };

  const handleGiveAward = async (formData: FormData) => {
    setIsAwardSubmitting(true);
    try {
      await addWeeklyAward(formData);
      toast({ title: 'Employee of the Week Awarded!', description: `The new award has been posted.` });
      awardFormRef.current?.reset();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsAwardSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Tabs defaultValue="give-kudos" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="give-kudos">Give Kudos</TabsTrigger>
            {canGiveAward && <TabsTrigger value="give-award">Weekly Award</TabsTrigger>}
          </TabsList>
          <TabsContent value="give-kudos">
            <Card>
              <CardHeader>
                <CardTitle>Give Kudos</CardTitle>
                <CardDescription>Recognize a colleague for their outstanding contribution.</CardDescription>
              </CardHeader>
              <CardContent>
                <form ref={kudosFormRef} action={handleGiveKudos} className="space-y-4">
                  <div>
                    <label htmlFor="toUser" className="text-sm font-medium">To</label>
                    <Select name="toUser" required>
                      <SelectTrigger id="toUser"><SelectValue placeholder="Select an employee" /></SelectTrigger>
                      <SelectContent>
                        {initialUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>{user.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="value" className="text-sm font-medium">For</label>
                    <Select name="value" required>
                      <SelectTrigger id="value"><SelectValue placeholder="Select a company value" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Team Player">Team Player</SelectItem>
                        <SelectItem value="Innovation">Innovation</SelectItem>
                        <SelectItem value="Customer First">Customer First</SelectItem>
                        <SelectItem value="Ownership">Ownership</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="message" className="text-sm font-medium">Message</label>
                    <Textarea id="message" name="message" placeholder="Why are you giving them kudos?" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isKudoSubmitting}>
                    {isKudoSubmitting ? <Loader2 className="animate-spin" /> : <Send className="mr-2" />} Send Kudos
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          {canGiveAward && (
            <TabsContent value="give-award">
              <Card>
                <CardHeader>
                  <CardTitle>Employee of the Week</CardTitle>
                  <CardDescription>Select an employee for the weekly public recognition award.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form ref={awardFormRef} action={handleGiveAward} className="space-y-4">
                    <div>
                      <label htmlFor="toUserAward" className="text-sm font-medium">Employee</label>
                      <Select name="toUser" required>
                        <SelectTrigger id="toUserAward"><SelectValue placeholder="Select an employee" /></SelectTrigger>
                        <SelectContent>
                          {initialUsers.map(user => (
                            <SelectItem key={user.id} value={user.id}>{user.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label htmlFor="reason" className="text-sm font-medium">Reason for Award</label>
                      <Textarea id="reason" name="reason" placeholder="Describe their outstanding contribution..." required />
                    </div>
                    <Button type="submit" className="w-full" disabled={isAwardSubmitting}>
                      {isAwardSubmitting ? <Loader2 className="animate-spin" /> : <Award className="mr-2" />} Give Award
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
      <div className="lg:col-span-2 space-y-6">
        {initialWeeklyAward ? (
            <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Star className="text-yellow-400 fill-yellow-400"/> Employee of the Week</CardTitle>
                    <CardDescription>Week of {format(new Date(initialWeeklyAward.week_of), "MMMM do")}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary">
                        <AvatarImage src={initialWeeklyAward.users?.avatar_url || undefined} />
                        <AvatarFallback>{initialWeeklyAward.users?.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-bold text-xl">{initialWeeklyAward.users?.full_name}</p>
                        <p className="text-muted-foreground mt-2">"{initialWeeklyAward.reason}"</p>
                        <p className="text-xs text-muted-foreground mt-2">- {initialWeeklyAward.awarded_by?.full_name}</p>
                    </div>
                </CardContent>
            </Card>
        ) : (
            <Card className="bg-gradient-to-br from-muted/30 to-background border-border">
                 <CardContent className="p-6 text-center text-muted-foreground">
                    No weekly award has been given out yet.
                 </CardContent>
            </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Recognition Feed</CardTitle>
            <CardDescription>See all the great work happening across the company.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
            {initialKudos.map(kudo => (
              <Card key={kudo.id} className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={kudo.users_to?.avatar_url || undefined} />
                    <AvatarFallback>{kudo.users_to?.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{kudo.users_from?.full_name}</span> recognized <span className="font-semibold">{kudo.users_to?.full_name}</span>
                    </p>
                    <p className="text-lg font-medium my-2 p-3 bg-muted/50 rounded-md">"{kudo.message}"</p>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-primary">{kudo.value}</span>
                      </div>
                      <span>{formatDistanceToNow(new Date(kudo.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
