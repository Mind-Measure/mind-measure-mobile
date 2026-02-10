import { useState } from 'react';

export interface CheckinConversation {
  isActive: boolean;
  messages: any[];
}

export function useCheckinConversation(onEnd?: () => void) {
  const [conversation, setConversation] = useState<CheckinConversation>({
    isActive: false,
    messages: [],
  });

  const startConversation = () => {
    setConversation((prev) => ({ ...prev, isActive: true }));
  };

  const endConversation = () => {
    setConversation((prev) => ({ ...prev, isActive: false }));
  };

  const endCheckin = () => {
    setConversation((prev) => ({ ...prev, isActive: false }));
    onEnd?.();
  };

  return {
    conversation,
    startConversation,
    endConversation,
    endCheckin,
  };
}
