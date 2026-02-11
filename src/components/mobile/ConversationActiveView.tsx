import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Volume2, VolumeX } from 'lucide-react';
import { StillImageCapture } from '@/components/StillImageCapture';
import type { StillImageCaptureRef } from '@/components/StillImageCapture';
import type { VisualCaptureData } from '@/types/assessment';

// Declare the ElevenLabs custom element for JSX
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'agent-id'?: string;
          'auto-start'?: string;
          'conversation-mode'?: string;
          language?: string;
        },
        HTMLElement
      >;
    }
  }
}

interface ConversationActiveViewProps {
  isBaseline: boolean;
  agentId: string;
  scriptLoaded: boolean;
  conversationState: 'idle' | 'active' | 'processing';
  isMuted: boolean;
  cameraActive: boolean;
  connectionError: string | null;
  onToggleMute: () => void;
  onStartWidget: () => void;
  onEndConversation: () => void;
  onFinish: () => void;
  onVisualDataCapture: (data: VisualCaptureData) => void;
  onRetry: () => void;
}

/**
 * Full-screen active conversation view with ElevenLabs widget,
 * camera capture, and conversation controls.
 */
export const ConversationActiveView: React.FC<ConversationActiveViewProps> = ({
  isBaseline,
  agentId,
  scriptLoaded,
  conversationState,
  isMuted,
  cameraActive,
  connectionError,
  onToggleMute,
  onStartWidget,
  onEndConversation,
  onFinish,
  onVisualDataCapture,
  onRetry,
}) => {
  const stillImageCaptureRef = useRef<StillImageCaptureRef>(null);

  return (
    <div
      className="min-h-screen bg-white flex flex-col"
      style={{ position: 'relative', zIndex: 1000, isolation: 'isolate' }}
    >
      {/* Header — Mind Measure Logo and Title */}
      <div className="flex items-center justify-center gap-3 pt-8 pb-4 px-6">
        <div className="w-14 h-14 flex items-center justify-center">
          <img
            src="https://api.mindmeasure.co.uk/storage/marketing/MM%20logo%20square.png"
            alt="Mind Measure"
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
          Mind Measure
        </h1>
      </div>

      {/* ElevenLabs Widget Container */}
      <div className="flex-1 flex flex-col relative overflow-hidden" style={{ minHeight: '70vh' }}>
        <div className="flex-1 relative p-0" style={{ minHeight: '60vh' }}>
          {conversationState === 'processing' ? (
            <div className="absolute inset-0 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Results...</h3>
                <p className="text-gray-600 text-sm">Analyzing your conversation with Mind Measure GPT</p>
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
              </div>
            </div>
          ) : scriptLoaded ? (
            <div className="w-full h-full relative">
              <elevenlabs-convai key="mobile-widget" agent-id={agentId}></elevenlabs-convai>
            </div>
          ) : (
            <div className="absolute inset-0 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Conversation...</h3>
                <p className="text-gray-600 text-sm">
                  {isBaseline ? 'Preparing your baseline assessment' : 'Preparing your check-in conversation'}
                </p>
              </div>
            </div>
          )}

          {/* Hidden camera capture */}
          {cameraActive && (
            <div className="hidden">
              <StillImageCapture
                ref={stillImageCaptureRef}
                isActive={true}
                onRecordingComplete={onVisualDataCapture}
                onRangeChange={() => {}}
                onFrameUpdate={() => {}}
              />
            </div>
          )}

          {/* Camera status indicator */}
          {cameraActive && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-muted-foreground">Camera Active</span>
            </div>
          )}

          {/* End Conversation button */}
          <div className="absolute top-4 left-4 z-20">
            <Button
              size="sm"
              onClick={onEndConversation}
              disabled={conversationState === 'processing'}
              className="h-8 px-2 text-xs font-normal shadow-lg bg-purple-300 text-purple-900 hover:bg-purple-400"
            >
              Finish
            </Button>
          </div>
        </div>
      </div>

      {/* Connection Error Display */}
      {connectionError && (
        <div className="px-6 py-3 bg-red-50 border-t border-red-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-red-800 font-medium text-sm">Connection Issue</h3>
              <p className="text-red-600 text-xs">{connectionError}</p>
            </div>
            <Button onClick={onRetry} className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white text-xs">
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Bottom Control Buttons */}
      <div className="p-6 bg-white conversation-controls">
        <div className="flex gap-3">
          <Button
            onClick={onStartWidget}
            disabled={!scriptLoaded || conversationState === 'active' || !!connectionError}
            className="flex-1 h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl disabled:opacity-50"
          >
            {conversationState === 'active' ? 'Active' : connectionError ? 'Retrying...' : 'Start'}
          </Button>
          <Button
            onClick={onToggleMute}
            className="h-12 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Button
            onClick={onFinish}
            className="h-12 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            Finish
          </Button>
        </div>
      </div>
    </div>
  );
};
