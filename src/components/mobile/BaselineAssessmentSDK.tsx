import { useEffect, useRef } from 'react';
import { useBaselineAssessment } from '../../hooks/useBaselineAssessment';
import { useAuth } from '../../contexts/AuthContext';
import { ConversationScreen } from './ConversationScreen';
import { ProcessingOverlay, ErrorModal } from './baselineAssessment';
import type { BaselineAssessmentSDKProps } from './baselineAssessment';

export function BaselineAssessmentSDK({ onBack, onComplete }: BaselineAssessmentSDKProps) {
  const { user } = useAuth();
  const startedRef = useRef(false);
  const {
    showConversation,
    messages,
    isSaving,
    showErrorModal,
    errorMessage,
    conversationStatus,
    previousBaselineScore,
    isFirstBaseline,
    newScore,
    handleStartAssessment,
    handleFinish,
    handleErrorCancel,
    handleErrorRetry,
  } = useBaselineAssessment({ onComplete });

  // Auto-start: BaselineWelcome already handled the welcome flow,
  // so skip the duplicate WelcomeScreen and go straight to conversation
  useEffect(() => {
    if (!startedRef.current && !showConversation) {
      startedRef.current = true;
      handleStartAssessment();
    }
  }, [showConversation, handleStartAssessment]);

  if (showConversation) {
    return (
      <>
        {isSaving && (
          <ProcessingOverlay
            previousScore={previousBaselineScore}
            newScore={newScore}
            isFirstBaseline={isFirstBaseline}
            onScoreRevealed={() => {
              if (onComplete) onComplete();
            }}
          />
        )}

        <ConversationScreen
          type="baseline"
          messages={messages}
          isListening={conversationStatus === 'connected'}
          onFinish={handleFinish}
          onBack={onBack}
          userName={user?.user_metadata?.first_name || user?.user_metadata?.given_name}
        />
      </>
    );
  }

  // Minimal fallback while auto-start kicks in or if error
  return (
    <>
      {showErrorModal && (
        <ErrorModal errorMessage={errorMessage} onCancel={handleErrorCancel} onRetry={() => handleErrorRetry(onBack)} />
      )}
      {!showErrorModal && (
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: '#2D4C4C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: '2px solid rgba(153,204,206,0.3)',
              borderTopColor: '#99CCCE',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </>
  );
}
