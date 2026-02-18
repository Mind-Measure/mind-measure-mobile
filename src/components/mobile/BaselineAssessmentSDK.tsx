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
    processingPhase,
    processingMessage,
    showErrorModal,
    errorMessage,
    conversationStatus,
    handleStartAssessment,
    handleFinish,
    handleErrorCancel,
    handleErrorRetry,
  } = useBaselineAssessment({ onComplete });

  // --- Conversation view (with optional processing overlay) ---
  if (showConversation) {
    return (
      <>
        {isSaving && <ProcessingOverlay processingPhase={processingPhase} processingMessage={processingMessage} />}

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

  // --- Welcome / landing view ---
  return (
    <>
      <WelcomeScreen requestingPermissions={requestingPermissions} onStart={handleStartAssessment} />

      {showErrorModal && (
        <ErrorModal errorMessage={errorMessage} onCancel={handleErrorCancel} onRetry={() => handleErrorRetry(onBack)} />
      )}
    </>
  );
}
