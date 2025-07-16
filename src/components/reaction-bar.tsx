'use client';

import * as React from 'react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn } from '@/lib/utils';
import { SmilePlus } from 'lucide-react';

const availableReactions = ['❤️', '🔥', '👏', '💡', '🎉'];

export default function ReactionBar() {
  const [reactions, setReactions] = React.useState<Record<string, number>>({
    '❤️': 5,
    '🔥': 2,
    '👏': 8,
  });
  const [userReaction, setUserReaction] = React.useState<string | null>('❤️');

  const handleReaction = (emoji: string) => {
    setReactions((prev) => {
      const newReactions = { ...prev };
      // If user is changing reaction
      if (userReaction && userReaction !== emoji) {
        newReactions[userReaction] = (newReactions[userReaction] || 1) - 1;
        if (newReactions[userReaction] === 0) delete newReactions[userReaction];
      }
      // If user is adding or changing reaction
      if (userReaction !== emoji) {
        newReactions[emoji] = (newReactions[emoji] || 0) + 1;
        setUserReaction(emoji);
      } else { // If user is removing reaction
        newReactions[emoji] = (newReactions[emoji] || 1) - 1;
        if (newReactions[emoji] === 0) delete newReactions[emoji];
        setUserReaction(null);
      }
      return newReactions;
    });
  };

  return (
    <div className="flex items-center gap-1">
      {Object.entries(reactions).map(([emoji, count]) => (
        <TooltipProvider key={emoji} delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReaction(emoji)}
                className={cn(
                    "h-7 px-2 rounded-full",
                    userReaction === emoji && "bg-primary/10 border-primary"
                )}
              >
                <span className="text-base">{emoji}</span>
                <span className="text-xs ml-1.5">{count}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{emoji} Reaction</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      
      <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 group">
                    <SmilePlus className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </Button>
            </TooltipTrigger>
            <TooltipContent className="p-0">
                <div className="flex items-center">
                    {availableReactions.map(emoji => (
                        <Button key={emoji} variant="ghost" size="icon" className="h-8 w-8 text-lg" onClick={() => handleReaction(emoji)}>{emoji}</Button>
                    ))}
                </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
    </div>
  );
}
