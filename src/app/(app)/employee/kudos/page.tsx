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
import { Send, Award } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Kudo } from '@/lib/types';
import { currentUser } from '@/lib/data';

const mockUsers = Array.from({ length: 15 }, () => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  avatar: faker.image.avatar(),
}));

const mockKudos: Kudo[] = Array.from({ length: 8 }, () => {
    const fromUser = faker.helpers.arrayElement(mockUsers);
    const toUser = faker.helpers.arrayElement(mockUsers.filter(u => u.id !== fromUser.id));
    return {
        id: faker.string.uuid(),
        fromName: fromUser.name,
        fromAvatar: fromUser.avatar,
        toName: toUser.name,
        toAvatar: toUser.avatar,
        message: faker.lorem.sentence(),
        value: faker.helpers.arrayElement(['Team Player', 'Innovation', 'Customer First', 'Ownership']),
        timestamp: faker.date.recent().toISOString(),
    }
});


export default function KudosPage() {
  const { toast } = useToast();
  const [kudos, setKudos] = React.useState(mockKudos);

  const handleGiveKudos = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const toUserId = formData.get('toUser');
    const message = formData.get('message');
    const value = formData.get('value');

    const toUser = mockUsers.find(u => u.id === toUserId);
    
    if (!toUser || !message || !value) {
        toast({ title: 'Please fill out all fields.', variant: 'destructive' });
        return;
    }

    const newKudo: Kudo = {
        id: faker.string.uuid(),
        fromName: currentUser.name,
        fromAvatar: currentUser.avatar,
        toName: toUser.name,
        toAvatar: toUser.avatar,
        message: message as string,
        value: value as Kudo['value'],
        timestamp: new Date().toISOString()
    };
    
    setKudos(prev => [newKudo, ...prev]);
    toast({ title: 'Kudos Sent!', description: `You recognized ${toUser.name} for their great work.`});
    (event.target as HTMLFormElement).reset();
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="Kudos & Recognition" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
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
                        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
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
        </div>
        <div className="lg:col-span-2">
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
