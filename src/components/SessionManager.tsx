import { useState } from 'react';
import type { VisualCaptureData, SessionTextData } from '@/types/assessment';

export interface Session {
  id: string;
  startTime: Date;
  text_data?: {
    transcripts: string[];
    conversationData: Array<{ role: string; text: string; timestamp: number }>;
  };
  visual_data?: VisualCaptureData | null;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);

  const startSession = () => {
    setSession({ id: String(Date.now()), startTime: new Date() });
  };

  const endSession = () => {
    setSession(null);
  };

  const createSession = async (_type: string): Promise<string | null> => {
    const id = String(Date.now());
    setSession({ id, startTime: new Date() });
    return id;
  };

  const updateSessionData = (
    data: Partial<Session> & { text_data?: SessionTextData; visual_data?: VisualCaptureData | null }
  ) => {
    setSession((prev) => (prev ? { ...prev, ...data } : prev));
  };

  return {
    session,
    currentSession: session,
    startSession,
    endSession,
    createSession,
    updateSessionData,
  };
}

export function SessionManager() {
  return (
    <div className="session-manager">
      <p>Session Manager Component</p>
    </div>
  );
}
