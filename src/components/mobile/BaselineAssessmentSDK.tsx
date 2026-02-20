import { useBaselineAssessment } from '../../hooks/useBaselineAssessment';
import { useAuth } from '../../contexts/AuthContext';
import { ConversationScreen } from './ConversationScreen';
import { WelcomeScreen, ProcessingOverlay, ErrorModal } from './baselineAssessment';
import type { BaselineAssessmentSDKProps } from './baselineAssessment';

export function BaselineAssessmentSDK({ onBack, onComplete }: BaselineAssessmentSDKProps) {
  const { user } = useAuth();
  const {
    showConversation,
    requestingPermissions,
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

  return (
    <>
      <WelcomeScreen requestingPermissions={requestingPermissions} onStart={handleStartAssessment} />

      {showErrorModal && (
        <ErrorModal errorMessage={errorMessage} onCancel={handleErrorCancel} onRetry={() => handleErrorRetry(onBack)} />
      )}
    </>
  );
}
