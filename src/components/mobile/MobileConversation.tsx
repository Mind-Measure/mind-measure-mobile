import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BackendServiceFactory } from '@/services/database/BackendServiceFactory';
import { useCheckinConversation } from '@/hooks/useCheckinConversation';
import { useSession } from '@/components/SessionManager';
import { useCostTracking } from '@/hooks/useCostTracking';
import { ConversationWelcome } from './ConversationWelcome';
import { ConversationActiveView } from './ConversationActiveView';
import type { VisualCaptureData, ConversationMessage, SessionTextData } from '@/types/assessment';
import type { ElevenLabsWidgetElement } from '@/types/elevenlabs';

/** Shape of the user context loaded for personalised conversations. */
interface UserContextData {
  user: {
    name: string;
    fullName: string;
    university?: string;
    course?: string;
    yearOfStudy?: string;
  };
  assessmentHistory: Array<{ created_at: string; [key: string]: unknown }>;
  wellnessTrends: Array<{ score: number; created_at: string }>;
  isFirstTime: boolean;
  platform: string;
}
/** When false (default), skip assessment_sessions writes in widget path to avoid schema coupling. */
const ENABLE_ASSESSMENT_SESSIONS_WIDGET = import.meta.env.VITE_ENABLE_ASSESSMENT_SESSIONS_WIDGET === 'true';

interface MobileConversationProps {
  onNavigateBack: () => void;
  assessmentMode?: 'baseline' | 'checkin';
}
export const MobileConversation: React.FC<MobileConversationProps> = ({
  onNavigateBack,
  assessmentMode = 'checkin',
}) => {
  const { user } = useAuth();
  const { currentSession, createSession, updateSessionData } = useSession();
  const { endCheckin } = useCheckinConversation(() => handleConversationEnd());
  const { trackElevenLabsUsage: _trackElevenLabsUsage } = useCostTracking();
  const [currentStep, setCurrentStep] = useState<'welcome' | 'recording' | 'conversation'>('recording');
  const [_isProcessing, setIsProcessing] = useState(false);
  const [conversationState, setConversationState] = useState<'idle' | 'active' | 'processing'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [visualData, setVisualData] = useState<VisualCaptureData | null>(null);
  const [userContext, setUserContext] = useState<UserContextData | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetInitializedRef = useRef(false);
  const conversationEndedRef = useRef(false);
  const sessionCreatedRef = useRef(false);
  const startingRef = useRef(false);
  const stillImageCaptureRef = useRef<StillImageCaptureRef>(null);
  // Use the assessmentMode prop instead of URL parameter
  const actualMode = assessmentMode === 'baseline';

  // AWS Backend Service
  const backendService = BackendServiceFactory.createService(BackendServiceFactory.getEnvironmentConfig());

  // Load user context for personalized conversations
  const loadUserContext = useCallback(async () => {
    if (!user?.id) return null;
    try {
      // Get user profile data
      const { data: profile } = await backendService.database.select('profiles', {
        columns: 'first_name, last_name, university, course, year_of_study',
        filters: { id: user.id },
        limit: 1,
      });

      // Get recent assessment history for context
      const { data: recentAssessments } = await backendService.database.select('assessment_sessions', {
        columns: 'assessment_type, created_at, meta',
        filters: { user_id: user.id },
        orderBy: [{ column: 'created_at', ascending: false }],
        limit: 3,
      });

      // Get wellness trends
      const { data: wellnessData } = await backendService.database.select('fusion_outputs', {
        columns: 'score, created_at',
        filters: { user_id: user.id },
        orderBy: [{ column: 'created_at', ascending: false }],
        limit: 5,
      });

      const p = profile?.[0] as Record<string, unknown> | undefined;
      const context: UserContextData = {
        user: {
          name: (p?.first_name as string) || 'there',
          fullName: `${(p?.first_name as string) || ''} ${(p?.last_name as string) || ''}`.trim(),
          university: (p?.university as string | undefined) ?? undefined,
          course: (p?.course as string | undefined) ?? undefined,
          yearOfStudy: (p?.year_of_study as string | undefined) ?? undefined,
        },
        assessmentHistory: (recentAssessments || []) as UserContextData['assessmentHistory'],
        wellnessTrends: (wellnessData || []) as UserContextData['wellnessTrends'],
        isFirstTime: !recentAssessments || recentAssessments.length === 0,
        platform: 'mobile',
      };
      setUserContext(context);
      return context;
    } catch (error) {
      console.error('Failed to load user context:', error);
      return null;
    }
  }, [user?.id, backendService]);

  // Load user context on mount
  useEffect(() => {
    loadUserContext();
  }, [loadUserContext]);

  // Load ElevenLabs script
  useEffect(() => {
    const id = 'elevenlabs-convai-embed';
    if (document.getElementById(id)) {
      setScriptLoaded(true);
      setLoading(false);
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
      setLoading(false);
      setConnectionError(null); // Clear any previous errors
      // Add a timeout to check if the widget is actually working
      setTimeout(() => {
        if (customElements.get('elevenlabs-convai')) {
          /* intentionally empty */
        } else {
          console.error('❌ Widget custom element NOT registered');
        }
      }, 2000);
      // Check if the custom element is available
      setTimeout(() => {
        if (customElements.get('elevenlabs-convai')) {
          /* intentionally empty */
        } else {
          console.error('❌ ElevenLabs custom element not available after script load');
          // Fallback: try to manually register the element
          if (window.customElements && !customElements.get('elevenlabs-convai')) {
            /* intentionally empty */
          }
        }
      }, 1000);
      // Add custom dark theme CSS and containment
      const style = document.createElement('style');
      style.textContent = `
        .elevenlabs-dark-theme elevenlabs-convai {
          --background: #1f2937 !important;
          --foreground: #f9fafb !important;
          --card: #374151 !important;
          --card-foreground: #f9fafb !important;
          --border: #4b5563 !important;
          --input: #374151 !important;
          --primary: #8b5cf6 !important;
          --primary-foreground: #ffffff !important;
        }
        .elevenlabs-dark-theme elevenlabs-convai iframe {
          background: #1f2937 !important;
          border: none !important;
          z-index: 1 !important;
          position: relative !important;
        }
        .elevenlabs-dark-theme elevenlabs-convai * {
          color: #f9fafb !important;
        }
        /* Force widget containment */
        .elevenlabs-dark-theme {
          contain: layout style paint !important;
          isolation: isolate !important;
          z-index: 1 !important;
          position: relative !important;
          width: 100% !important;
          height: 100% !important;
          min-height: 600px !important;
        }
        /* Ensure iframe is visible and sized */
        .elevenlabs-dark-theme elevenlabs-convai iframe {
          width: 100% !important;
          height: 100% !important;
          min-height: 600px !important;
          display: block !important;
        }
        /* Ensure our buttons stay on top */
        .conversation-controls {
          z-index: 1000 !important;
          position: relative !important;
        }
      `;
      document.head.appendChild(style);
    };
    script.onerror = (error) => {
      console.error('❌ Failed to load ElevenLabs script:', error);
      setConnectionError('Failed to load ElevenLabs. Please check your internet connection.');
      // Retry mechanism
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          // Instead of calling loadScript() which doesn't exist, reload the page or handle differently
        }, 2000);
      }
    };
    document.head.appendChild(script);
  }, []);
  // Initialize ElevenLabs widget when script is loaded
  useEffect(() => {
    if (scriptLoaded && widgetRef.current && currentStep === 'recording' && !widgetInitializedRef.current) {
      widgetInitializedRef.current = true; // Set flag immediately to prevent re-initialization
      initializeWidget();
    }
  }, [scriptLoaded]); // Removed currentStep from dependencies to prevent loop
  // Enhanced conversation monitoring for mobile with camera integration
  useEffect(() => {
    if (currentStep !== 'recording' || !widgetRef.current || !scriptLoaded || widgetInitializedRef.current) return;
    widgetInitializedRef.current = true;
    // Set up client tools for the ElevenLabs widget
    const setupClientTools = () => {
      const widget = widgetRef.current?.querySelector('elevenlabs-convai');
      if (widget && (widget as ElevenLabsWidgetElement).shadowRoot) {
        // Inject client tools into the widget
        window.mobileClientTools = {
          endConversation: () => {
            endCheckin();
            return 'Mobile conversation completed';
          },
          getConversationContext: () => {
            // Check if userContext is available
            if (!userContext) {
              console.warn('[ClientTools] No userContext available, returning basic context');
              return JSON.stringify({
                platform: 'mobile',
                sessionId: currentSession?.id,
                userId: user?.id,
                assessmentType: actualMode ? 'baseline' : 'checkin',
                conversationStage: 'active',
                studentName: 'there',
                lastCheckinDays: null,
                recentTrend: [],
                currentPeriod: 'General',
              });
            }

            // Calculate daysSinceLastCheckin from assessmentHistory
            let lastCheckinDays = null;
            const assessmentHistory = userContext.assessmentHistory as Array<{ created_at: string }> | undefined;
            if (assessmentHistory && assessmentHistory.length > 0) {
              const lastCheckin = assessmentHistory[0];
              const lastCheckinDate = new Date(lastCheckin.created_at);
              const now = new Date();
              const diffTime = Math.abs(now.getTime() - lastCheckinDate.getTime());
              lastCheckinDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            } else {
              /* intentionally empty */
            }

            // Extract last 3 scores from wellnessTrends
            const recentTrend: number[] = [];
            const wellnessTrends = userContext.wellnessTrends as Array<{ score: number }> | undefined;
            if (wellnessTrends && wellnessTrends.length > 0) {
              for (let i = 0; i < Math.min(3, wellnessTrends.length); i++) {
                recentTrend.push(wellnessTrends[i].score);
              }
            } else {
              /* intentionally empty */
            }

            // Determine current period (e.g., "Exam Season")
            const now = new Date();
            const month = now.getMonth(); // 0-11
            let currentPeriod = 'General';

            // UK Academic Calendar approximate periods
            if (month >= 0 && month <= 1) {
              currentPeriod = 'Exam Season'; // Jan-Feb
            } else if (month >= 2 && month <= 3) {
              currentPeriod = 'Spring Term'; // Mar-Apr
            } else if (month >= 4 && month <= 5) {
              currentPeriod = 'Exam Season'; // May-Jun
            } else if (month >= 6 && month <= 8) {
              currentPeriod = 'Summer Break'; // Jul-Sep
            } else if (month >= 9 && month <= 10) {
              currentPeriod = 'Autumn Term'; // Oct-Nov
            } else {
              currentPeriod = 'Winter Break'; // Dec
            }

            // Build rich context object
            const context = {
              platform: 'mobile',
              sessionId: currentSession?.id,
              userId: user?.id,
              assessmentType: actualMode ? 'baseline' : 'checkin',
              conversationStage: 'active',

              // Dynamic user data
              studentName: userContext.user?.name || 'there',
              fullName: userContext.user?.fullName || '',
              university: userContext.user?.university || '',
              course: userContext.user?.course || '',
              yearOfStudy: userContext.user?.yearOfStudy || '',

              // Wellness tracking data
              lastCheckinDays: lastCheckinDays,
              recentTrend: recentTrend,
              currentPeriod: currentPeriod,
              isFirstTime: userContext.isFirstTime,
            };

            return JSON.stringify(context);
          },
        };
        // Add event listeners for cost tracking
        widget.addEventListener('conversationstarted', () => {});
        widget.addEventListener('conversationended', () => {});
      }
    };
    let conversationHistory: ConversationMessage[] = [];
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          setupClientTools();
          // Check for conversation end indicators
          const widget = widgetRef.current?.querySelector('elevenlabs-convai');
          if (widget) {
            const shadowRoot = (widget as ElevenLabsWidgetElement).shadowRoot;
            if (shadowRoot) {
              // Capture conversation data
              const messages = shadowRoot.querySelectorAll('.message, .chat-message, [data-role], [role]');
              const newConversationData: Array<{ role: string; text: string; timestamp: number }> = [];
              const transcripts: string[] = [];
              messages.forEach((msg: Element) => {
                const text = msg.textContent?.trim() || '';
                const role =
                  msg.getAttribute('data-role') ||
                  msg.getAttribute('role') ||
                  (msg.classList.contains('user')
                    ? 'user'
                    : msg.classList.contains('assistant') || msg.classList.contains('ai')
                      ? 'ai'
                      : 'unknown');
                if (text && text.length > 5) {
                  newConversationData.push({ role, text, timestamp: Date.now() });
                  if (role === 'user') {
                    transcripts.push(text);
                  }
                }
              });
              // Update conversation history if new content detected
              if (newConversationData.length > conversationHistory.length) {
                conversationHistory = newConversationData as ConversationMessage[];
                // Store conversation data in session
                if (currentSession && conversationHistory.length > 0) {
                  const textData: SessionTextData = {
                    transcripts,
                    textInputs: transcripts,
                    fullConversation: conversationHistory
                      .map((m) => `${m.role === 'user' ? 'User' : 'Jodie'}: ${m.text}`)
                      .join('\n'),
                    conversationData: conversationHistory,
                  };
                  updateSessionData({ text_data: textData });
                }
              }
              // Look for conversation end indicators
              const endIndicators = shadowRoot.querySelectorAll(
                '[data-conversation-ended], .conversation-ended, .call-ended'
              );
              const textElements = shadowRoot.querySelectorAll('*');
              let hasEndText = false;
              textElements.forEach((el: Element) => {
                const text = el.textContent?.toLowerCase() || '';
                if (
                  text.includes('caller ended') ||
                  text.includes('conversation ended') ||
                  text.includes('call ended') ||
                  text.includes('disconnected')
                ) {
                  hasEndText = true;
                }
              });
              if ((endIndicators.length > 0 || hasEndText) && !conversationEndedRef.current) {
                conversationEndedRef.current = true;
                handleConversationEnd();
              }
            }
          }
        }
      });
    });
    observer.observe(widgetRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-state'],
    });
    // Setup initial client tools
    setupClientTools();
    return () => {
      observer.disconnect();
      // Clean up client tools
      delete window.mobileClientTools;
    };
  }, [scriptLoaded]); // Simplified dependencies to prevent death loop
  // Activate camera when recording starts
  useEffect(() => {
    if (currentStep === 'conversation' && scriptLoaded && !cameraActive) {
      setCameraActive(true);
    }
  }, [scriptLoaded]); // Simplified to prevent death loop
  const initializeWidget = () => {
    if (!widgetRef.current) return;
    // Also check parent container dimensions
    const parentContainer = widgetRef.current.parentElement;
    if (parentContainer) {
      /* intentionally empty */
    }
    // Check if widget already exists
    const existingWidget = widgetRef.current.querySelector('elevenlabs-convai');
    if (existingWidget) {
      return;
    }
    // Check if the custom element is defined
    if (!customElements.get('elevenlabs-convai')) {
      console.error('❌ ElevenLabs custom element not defined!');
      return;
    }
    // Create the widget element with the same attributes as working examples
    const widget = document.createElement('elevenlabs-convai');
    // Use the correct agent ID based on mode
    const agentId = actualMode ? 'agent_9301k22s8e94f7qs5e704ez02npe' : 'agent_7501k3hpgd5gf8ssm3c3530jx8qx';
    widget.setAttribute('agent-id', agentId);
    widget.setAttribute('auto-start', 'false');
    widget.setAttribute('conversation-mode', 'voice');
    widget.setAttribute('language', 'en');
    // Set explicit dimensions to ensure iframe renders
    widget.style.cssText = `
      width: 100% !important;
      height: 100% !important;
      min-height: 600px !important;
      display: block !important;
    `;
    // Debug: Check if widget is actually created
    // Add event listeners
    widget.addEventListener('conversation-started', () => {
      setConversationState('active');
    });
    widget.addEventListener('conversation-ended', () => {
      setConversationState('idle');
    });
    widget.addEventListener('error', (event) => {
      console.error('❌ Widget error:', event);
    });
    // Listen for our custom start event
    widget.addEventListener('start-conversation', () => {
      setConversationState('active');
    });
    // Listen for agent ready event
    widget.addEventListener('ready', () => {
      /* intentionally empty */
    });
    // Append to container
    widgetRef.current.appendChild(widget);
    // Force widget initialization after append
    setTimeout(() => {
      if (widget && typeof (widget as ElevenLabsWidgetElement).connect === 'function') {
        (widget as ElevenLabsWidgetElement).connect!();
      }
    }, 1500);
    // Check if widget is actually in the DOM
    setTimeout(() => {
      const widgetInDOM = widgetRef.current?.querySelector('elevenlabs-convai');
      if (widgetInDOM) {
        // Check for iframe content
        const iframe = widgetInDOM.querySelector('iframe');
        if (iframe) {
          /* intentionally empty */
        } else {
          /* intentionally empty */
        }
      } else {
        console.error('❌ Widget not found in DOM after append');
      }
    }, 100);
    widgetInitializedRef.current = true;
  };
  const handleStartConversation = async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    try {
      // Create session first
      if (!currentSession && !sessionCreatedRef.current) {
        sessionCreatedRef.current = true;
        if (ENABLE_ASSESSMENT_SESSIONS_WIDGET) {
          try {
            await backendService.database.update(
              'assessment_sessions',
              { status: 'cancelled' },
              { user_id: user?.id, status: 'pending' }
            );
          } catch (e) {
            console.warn('[MobileConversation] Skip cancel-pending assessment_sessions (flag off or error):', e);
          }
        }
        const sessionId = await createSession(actualMode ? 'baseline' : 'checkin');
        if (!sessionId) {
          startingRef.current = false;
          sessionCreatedRef.current = false;
          return;
        }
      }
      // Move to recording phase
      setCurrentStep('recording');
    } catch (error) {
      console.error('Error starting mobile conversation:', error);
      sessionCreatedRef.current = false;
    } finally {
      setTimeout(() => {
        startingRef.current = false;
      }, 1500);
    }
  };
  const handleConversationEnd = async () => {
    if (!currentSession) return;

    // CRITICAL VALIDATION: Check if we have actual conversation data for check-in
    const sessionData = currentSession.text_data;
    const transcripts = sessionData?.transcripts || [];
    const conversationHistory = sessionData?.conversationData || [];

    const hasTranscript = transcripts.length > 0 && transcripts.join(' ').length > 50; // At least 50 characters total
    const hasConversation = conversationHistory.length >= 4; // At least 2 user messages + 2 AI responses

    if (!hasTranscript || !hasConversation) {
      console.error('❌ Insufficient conversation data - cannot create check-in assessment');
      alert(
        'Unable to Complete Check-in\n\n' +
          "We didn't capture enough conversation data to create a new wellbeing score.\n\n" +
          'Please try again and spend a little more time talking with Jodie.'
      );

      // Navigate back to allow retry
      onNavigateBack();
      return;
    }

    setIsProcessing(true);
    setCameraActive(false); // Turn off camera indicator immediately
    try {
      // Stop camera capture to collect final visual data
      if (stillImageCaptureRef.current && stillImageCaptureRef.current.stopCapturing) {
        stillImageCaptureRef.current.stopCapturing();
      }
      // Finalize session with visual data
      await finalizeSession(visualData);
    } catch (error) {
      console.error('Error finalizing mobile session:', error);
      // Still navigate back even if processing fails
      onNavigateBack();
    }
  };
  const finalizeSession = async (data: VisualCaptureData | null) => {
    if (!currentSession || !user) return;
    try {
      if (ENABLE_ASSESSMENT_SESSIONS_WIDGET) {
        try {
          await backendService.database.update(
            'assessment_sessions',
            {
              status: 'completed',
              visual_data: data,
              assessment_type: actualMode ? 'baseline' : 'checkin',
            },
            { id: currentSession.id }
          );
        } catch (e) {
          console.warn('[MobileConversation] Skip assessment_sessions update (flag off or error):', e);
        }
      }
      setTimeout(() => {
        onNavigateBack();
      }, 1500);
    } catch (error) {
      console.error('Error finalizing mobile session:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };
  const handleVisualDataCapture = (data: VisualCaptureData) => {
    setVisualData(data);
    // Update session with visual data
    if (currentSession) {
      updateSessionData({ visual_data: data });
    }
  };
  const handleComplete = async (_data: unknown) => {
    // Use the proper conversation end handler
    await handleConversationEnd();
  };
  // Loading state
  if (loading) {
    return (
      <div className="px-6 py-8 space-y-8">
        <div className="text-center pt-8">
          <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <img
              src="https://api.mindmeasure.co.uk/storage/marketing/MM%20logo%20square.png"
              alt="Mind Measure"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }
  // ── Start widget handler (passed to ConversationActiveView) ────
  const handleStartWidget = async () => {
    if (conversationState === 'idle') {
      if (!currentSession) {
        const sessionId = await createSession(actualMode ? 'baseline' : 'checkin');
        if (!sessionId) {
          console.error('Failed to create session');
          return;
        }
      }
      setCurrentStep('conversation');
      setConversationState('active');
      setTimeout(() => {
        const widget = document.querySelector('elevenlabs-convai');
        if (widget) {
          const startButton =
            widget.shadowRoot?.querySelector('[data-testid="start-button"]') ||
            widget.shadowRoot?.querySelector('button') ||
            widget.shadowRoot?.querySelector('[aria-label*="start"]') ||
            widget.shadowRoot?.querySelector('[aria-label*="Start"]');
          if (startButton && startButton instanceof HTMLElement) {
            startButton.click();
          } else {
            widget.dispatchEvent(new CustomEvent('start-conversation'));
          }
        }
      }, 1500);
    }
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    const widget = document.querySelector('elevenlabs-convai');
    if (widget) {
      const audioElements: NodeListOf<HTMLAudioElement> | HTMLAudioElement[] =
        widget.shadowRoot?.querySelectorAll('audio') || [];
      audioElements.forEach((audio) => {
        audio.muted = !isMuted;
      });
    }
  };

  const handleRetry = () => {
    setConnectionError(null);
    setRetryCount(0);
    window.location.reload();
  };

  const agentId = actualMode ? 'agent_9301k22s8e94f7qs5e704ez02npe' : 'agent_7501k3hpgd5gf8ssm3c3530jx8qx';

  // Conversation step — full-screen interface
  if (currentStep === 'conversation') {
    return (
      <ConversationActiveView
        isBaseline={actualMode}
        agentId={agentId}
        scriptLoaded={scriptLoaded}
        conversationState={conversationState}
        isMuted={isMuted}
        cameraActive={cameraActive}
        connectionError={connectionError}
        onToggleMute={handleToggleMute}
        onStartWidget={handleStartWidget}
        onEndConversation={() => endCheckin()}
        onFinish={() => handleComplete({})}
        onVisualDataCapture={handleVisualDataCapture}
        onRetry={handleRetry}
      />
    );
  }
  // Welcome step
  return <ConversationWelcome isBaseline={actualMode} onStart={handleStartConversation} />;
};
