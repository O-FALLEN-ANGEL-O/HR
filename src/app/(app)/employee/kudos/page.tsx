'use client';

import * as React from 'react';
import { faker } from '@faker-js/faker';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Send, Award, Star } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { Kudo, UserProfile, WeeklyAward } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

const mockUsers: Pick<UserProfile, 'id' | 'full_name' | 'avatar_url'>[] = Array.from({ length: 15 }, () => ({
  id: faker.string.uuid(),
  full_name: faker.person.fullName(),
  avatar_url: faker.image.avatar(),
}));

const mockKudos: Kudo[] = Array.from({ length: 8 }, () => {
    const fromUser = faker.helpers.arrayElement(mockUsers);
    const toUser = faker.helpers.arrayElement(mockUsers.filter(u => u.id !== fromUser.id));
    return {
        id: faker.string.uuid(),
        fromName: fromUser.full_name!,
        fromAvatar: fromUser.avatar_url!,
        toName: toUser.full_name!,
        toAvatar: toUser.avatar_url!,
        message: faker.lorem.sentence(),
        value: faker.helpers.arrayElement(['Team Player', 'Innovation', 'Customer First', 'Ownership']),
        timestamp: faker.date.recent().toISOString(),
    }
});

const mockWeeklyAward: WeeklyAward = {
    id: faker.string.uuid(),
    employeeName: "Liam Johnson",
    employeeAvatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    reason: "For going above and beyond on the Project Phoenix launch, working late hours and mentoring junior developers. Your dedication was instrumental to our success!",
    weekOf: "2024-07-22",
    awardedByName: "HR Department"
}

export default function KudosPage() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [kudos, setKudos] = React.useState(mockKudos);
  const [weeklyAward, setWeeklyAward] = React.useState(mockWeeklyAward);
  
  const canGiveAward = currentUser?.role === 'admin' || currentUser?.role === 'super_hr' || currentUser?.role === 'hr_manager';

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

  const handleGiveKudos = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const toUserId = formData.get('toUser');
    const message = formData.get('message');
    const value = formData.get('value');
    const toUser = mockUsers.find(u => u.id === toUserId);
    
    if (!currentUser || !toUser || !message || !value) {
        toast({ title: 'Please fill out all fields.', variant: 'destructive' });
        return;
    }

    const newKudo: Kudo = {
        id: faker.string.uuid(),
        fromName: currentUser.full_name!,
        fromAvatar: currentUser.avatar_url!,
        toName: toUser.full_name!,
        toAvatar: toUser.avatar_url!,
        message: message as string,
        value: value as Kudo['value'],
        timestamp: new Date().toISOString()
    };
    
    setKudos(prev => [newKudo, ...prev]);
    toast({ title: 'Kudos Sent!', description: `You recognized ${toUser.full_name} for their great work.`});
    (event.target as HTMLFormElement).reset();
  };

  const handleGiveAward = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const toUserId = formData.get('toUser');
    const reason = formData.get('reason');
    const toUser = mockUsers.find(u => u.id === toUserId);

    if (!currentUser || !toUser || !reason) {
         toast({ title: 'Please fill out all fields.', variant: 'destructive' });
        return;
    }

    const newAward: WeeklyAward = {
        id: faker.string.uuid(),
        employeeName: toUser.full_name!,
        employeeAvatar: toUser.avatar_url!,
        reason: reason as string,
        weekOf: new Date().toISOString(),
        awardedByName: currentUser.full_name!
    };

    setWeeklyAward(newAward);
    toast({ title: 'Employee of the Week Awarded!', description: `${toUser.full_name} has been recognized.` });
    (event.target as HTMLFormElement).reset();
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="Kudos & Recognition" />
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
                    <form onSubmit={handleGiveKudos} className="space-y-4">
                        <div>
                        <label htmlFor="toUser" className="text-sm font-medium">To</label>
                        <Select name="toUser" required>
                            <SelectTrigger id="toUser"><SelectValue placeholder="Select an employee" /></SelectTrigger>
                            <SelectContent>
                            {mockUsers.map(user => (
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
                        <Button type="submit" className="w-full">
                        <Send className="mr-2" /> Send Kudos
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
                           <form onSubmit={handleGiveAward} className="space-y-4">
                                <div>
                                <label htmlFor="toUserAward" className="text-sm font-medium">Employee</label>
                                <Select name="toUser" required>
                                    <SelectTrigger id="toUserAward"><SelectValue placeholder="Select an employee" /></SelectTrigger>
                                    <SelectContent>
                                    {mockUsers.map(user => (
                                        <SelectItem key={user.id} value={user.id}>{user.full_name}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                </div>
                                <div>
                                <label htmlFor="reason" className="text-sm font-medium">Reason for Award</label>
                                <Textarea id="reason" name="reason" placeholder="Describe their outstanding contribution..." required />
                                </div>
                                <Button type="submit" className="w-full">
                                <Award className="mr-2" /> Give Award
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            )}
          </Tabs>
        </div>
        <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Star className="text-yellow-400 fill-yellow-400"/> Employee of the Week</CardTitle>
                    <CardDescription>Week of {format(new Date(weeklyAward.weekOf), "MMMM do")}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary">
                        <AvatarImage src={weeklyAward.employeeAvatar} />
                        <AvatarFallback>{weeklyAward.employeeName.charAt(0)}</AvatarFallback>
                    </Avatar>
                     <div className="flex-1">
                        <p className="font-bold text-xl">{weeklyAward.employeeName}</p>
                        <p className="text-muted-foreground mt-2">"{weeklyAward.reason}"</p>
                        <p className="text-xs text-muted-foreground mt-2">- {weeklyAward.awardedByName}</p>
                     </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Recognition Feed</CardTitle>
                    <CardDescription>See all the great work happening across the company.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
                    {kudos.map(kudo => (
                        <Card key={kudo.id} className="p-4">
                            <div className="flex items-start gap-4">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={kudo.toAvatar} />
                                    <AvatarFallback>{kudo.toName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="text-sm">
                                        <span className="font-semibold">{kudo.fromName}</span> recognized <span className="font-semibold">{kudo.toName}</span>
                                    </p>
                                    <p className="text-lg font-medium my-2 p-3 bg-muted/50 rounded-md">"{kudo.message}"</p>
                                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Award className="h-4 w-4 text-primary" />
                                            <span className="font-semibold text-primary">{kudo.value}</span>
                                        </div>
                                        <span>{formatDistanceToNow(new Date(kudo.timestamp), { addSuffix: true })}</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
