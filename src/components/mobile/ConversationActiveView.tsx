import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Volume2, VolumeX, ChevronLeft } from 'lucide-react';
import { StillImageCapture } from '@/components/StillImageCapture';
import type { StillImageCaptureRef } from '@/components/StillImageCapture';
import type { VisualCaptureData } from '@/types/assessment';

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

const spectra = '#2D4C4C';
const pampas = '#FAF9F7';
const sinbad = '#99CCCE';
const buttercup = '#F59E0B';

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
      style={{
        minHeight: '100vh',
        backgroundColor: spectra,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 1000,
        isolation: 'isolate',
      }}
    >
      {/* Back / Finish — top left */}
      <div style={{ position: 'absolute', top: '56px', left: '24px', zIndex: 20 }}>
        <button
          onClick={onEndConversation}
          disabled={conversationState === 'processing'}
          style={{
            background: 'none', border: `2px solid ${sinbad}`,
            borderRadius: '12px', padding: '8px 20px',
            color: sinbad, fontSize: '14px', fontWeight: 500,
            cursor: conversationState === 'processing' ? 'default' : 'pointer',
            opacity: conversationState === 'processing' ? 0.3 : 0.7,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          Finish
        </button>
      </div>

      {/* Camera status — top right */}
      {cameraActive && (
        <div style={{
          position: 'absolute', top: '60px', right: '24px', zIndex: 20,
          display: 'flex', alignItems: 'center', gap: '6px',
          opacity: 0.4,
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ADE80' }} />
          <span style={{ fontSize: '11px', color: sinbad, fontFamily: 'Inter, system-ui, sans-serif' }}>Camera</span>
        </div>
      )}

      {/* ElevenLabs Widget Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', minHeight: '70vh' }}>
        <div style={{ flex: 1, position: 'relative', minHeight: '60vh' }}>
          {conversationState === 'processing' ? (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  backgroundColor: sinbad, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <MessageCircle size={32} color={spectra} />
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: 300, color: pampas, marginBottom: '8px', fontFamily: 'Lato, system-ui, sans-serif' }}>
                  Processing...
                </h3>
                <p style={{ fontSize: '15px', color: sinbad, opacity: 0.5 }}>
                  Analysing your conversation
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: '8px', height: '8px', borderRadius: '50%', backgroundColor: sinbad,
                      animation: 'bounce 1s infinite', animationDelay: `${i * 0.15}s`,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          ) : scriptLoaded ? (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <elevenlabs-convai key="mobile-widget" agent-id={agentId}></elevenlabs-convai>
            </div>
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  backgroundColor: `${sinbad}40`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <MessageCircle size={32} color={sinbad} />
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: 300, color: pampas, marginBottom: '8px', fontFamily: 'Lato, system-ui, sans-serif' }}>
                  Loading...
                </h3>
                <p style={{ fontSize: '15px', color: sinbad, opacity: 0.5 }}>
                  {isBaseline ? 'Preparing your baseline assessment' : 'Preparing your check-in'}
                </p>
              </div>
            </div>
          )}

          {cameraActive && (
            <div style={{ display: 'none' }}>
              <StillImageCapture
                ref={stillImageCaptureRef}
                isActive={true}
                onRecordingComplete={onVisualDataCapture}
                onRangeChange={() => {}}
                onFrameUpdate={() => {}}
              />
            </div>
          )}
        </div>
      </div>

      {/* Connection Error */}
      {connectionError && (
        <div style={{ padding: '16px 24px', backgroundColor: 'rgba(255,107,107,0.15)', borderTop: '1px solid rgba(255,107,107,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: 500, color: '#FF6B6B', margin: '0 0 2px' }}>Connection Issue</p>
              <p style={{ fontSize: '12px', color: 'rgba(255,107,107,0.7)', margin: 0 }}>{connectionError}</p>
            </div>
            <button onClick={onRetry} style={{
              padding: '8px 16px', backgroundColor: '#FF6B6B', color: '#ffffff',
              border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}>
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div style={{ padding: '20px 24px 40px', display: 'flex', gap: '10px' }}>
        <button
          onClick={onStartWidget}
          disabled={!scriptLoaded || conversationState === 'active' || !!connectionError}
          style={{
            flex: 1, height: '52px',
            backgroundColor: conversationState === 'active' ? sinbad : buttercup,
            color: spectra, border: 'none', borderRadius: '14px',
            fontSize: '16px', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif',
            opacity: (!scriptLoaded || conversationState === 'active' || !!connectionError) ? 0.4 : 1,
          }}
        >
          {conversationState === 'active' ? 'Active' : connectionError ? 'Retrying...' : 'Start'}
        </button>
        <button
          onClick={onToggleMute}
          style={{
            width: '52px', height: '52px',
            backgroundColor: `${sinbad}30`, color: sinbad,
            border: 'none', borderRadius: '14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <button
          onClick={onFinish}
          style={{
            padding: '0 20px', height: '52px',
            backgroundColor: 'transparent', color: sinbad,
            border: `2px solid ${sinbad}`, borderRadius: '14px',
            fontSize: '14px', fontWeight: 500, cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          Finish
        </button>
      </div>
    </div>
  );
};
