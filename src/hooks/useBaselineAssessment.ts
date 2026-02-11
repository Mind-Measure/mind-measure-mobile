import { useState, useEffect, useRef, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import { useAuth } from '../contexts/AuthContext';
import { Preferences } from '@capacitor/preferences';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  extractAssessmentFromTranscript,
  calculateClinicalScores,
  calculateMindMeasureComposite,
  validateAssessmentData,
  type AssessmentState,
} from '../utils/baselineScoring';
import { MediaCapture } from '../services/multimodal/baseline/mediaCapture';
import { BaselineEnrichmentService } from '../services/multimodal/baseline';
import type { EnrichmentResult } from '../services/multimodal/baseline/enrichmentService';
import type { CapturedMediaResult, BaselineAnalysisData, ElevenLabsSessionOptions } from '../types/assessment';
import type { Message, ProcessingPhase } from '../components/mobile/baselineAssessment/types';
import { PROCESSING_MESSAGES } from '../components/mobile/baselineAssessment/types';

interface UseBaselineAssessmentOptions {
  onComplete?: () => void;
}

export function useBaselineAssessment({ onComplete }: UseBaselineAssessmentOptions) {
  const { user } = useAuth();
  const [showConversation, setShowConversation] = useState(false);
  const [requestingPermissions, setRequestingPermissions] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [processingPhase, setProcessingPhase] = useState<ProcessingPhase>('extracting');
  const [processingMessage, setProcessingMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Multimodal capture
  const mediaCaptureRef = useRef<MediaCapture | null>(null);
  const captureStartTimeRef = useRef<number>(0);

  // Assessment state
  const [assessmentState, setAssessmentState] = useState<AssessmentState>({
    transcript: '',
    phqResponses: {},
    moodScore: null,
    startedAt: null,
    endedAt: null,
  });

  const [sessionId, setSessionId] = useState<string | null>(null);

  // ElevenLabs conversation hook
  const conversation = useConversation({
    onConnect: () => {},
    onDisconnect: () => {},
    onMessage: (message) => {
      const newMessage: Message = {
        id: crypto.randomUUID(),
        text: message.message,
        sender: message.source === 'ai' ? 'ai' : 'user',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newMessage]);

      setAssessmentState((prev) => ({
        ...prev,
        transcript: prev.transcript + `${message.source === 'ai' ? 'agent' : 'user'}: ${message.message}\n`,
      }));
    },
    onError: (error) => {
      console.error('[SDK] ❌ Conversation error:', error);
    },
  });

  // Load click sound
  useEffect(() => {
    audioRef.current = new Audio(
      'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSyBzvLZiTYIGWi77eafTRAMUKfj8LZjHAY4ktfyy3ksBSR3yPDdkEALFF+06eunVRQKRZ/g8r5sIQUsgs/y2Yk1CBlouu3mn00QDFA='
    );
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  // Reset state helper
  const resetState = useCallback(() => {
    setShowConversation(false);
    setMessages([]);
    setAssessmentState({
      transcript: '',
      phqResponses: {},
      moodScore: null,
      startedAt: null,
      endedAt: null,
    });
  }, []);

  const handleStartAssessment = useCallback(async () => {
    setRequestingPermissions(true);

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start media capture for multimodal features
      try {
        mediaCaptureRef.current = new MediaCapture({
          captureAudio: true,
          captureVideo: true,
          videoFrameRate: 1,
        });
        await mediaCaptureRef.current.start();
        captureStartTimeRef.current = Date.now();
      } catch (captureError: unknown) {
        console.warn('[SDK] ⚠️ Media capture failed, continuing with clinical-only:', captureError);
      }

      // Show conversation UI and initialize assessment state
      setShowConversation(true);
      const startedAt = Date.now();
      setAssessmentState({
        transcript: '',
        phqResponses: {},
        moodScore: null,
        startedAt,
        endedAt: null,
      });

      // Wait a moment for UI to render, then start the conversation
      setTimeout(async () => {
        try {
          const sid = await conversation.startSession({
            agentId: 'agent_9301k22s8e94f7qs5e704ez02npe',
          } as ElevenLabsSessionOptions);

          setSessionId(sid);
        } catch (error: unknown) {
          console.error('[SDK] ❌ Failed to start conversation:', error);
          alert('Failed to start conversation. Please try again.');
          setShowConversation(false);

          if (mediaCaptureRef.current) {
            mediaCaptureRef.current.cancel();
            mediaCaptureRef.current = null;
          }
        }
      }, 500);
    } catch (error: unknown) {
      console.error('[SDK] ❌ Permission request failed:', error);
      alert(
        'Microphone access is required for the baseline assessment. Please check your browser settings and try again.'
      );
    } finally {
      setRequestingPermissions(false);
    }
  }, [conversation]);

  const processAssessmentData = useCallback(async () => {
    const endedAt = Date.now();

    // Start smooth 9-second message roll (1.5s per message)
    setProcessingPhase('extracting');
    let messageIndex = 0;
    setProcessingMessage(PROCESSING_MESSAGES[0]);

    const messageInterval = setInterval(() => {
      messageIndex++;
      if (messageIndex < PROCESSING_MESSAGES.length) {
        setProcessingMessage(PROCESSING_MESSAGES[messageIndex]);
      }
    }, 1500);

    // Extract PHQ/GAD/mood from the full transcript
    const { phqResponses, moodScore } = extractAssessmentFromTranscript(assessmentState.transcript);

    const updatedState: AssessmentState = {
      ...assessmentState,
      phqResponses,
      moodScore,
      endedAt,
    };

    // Validate
    const validation = validateAssessmentData(updatedState);

    if (!validation.isValid) {
      console.error('[SDK] ❌ Incomplete assessment:', validation.details);
      console.error('[SDK] ❌ Missing questions:', validation.details.missingQuestions);
      clearInterval(messageInterval);
      setErrorMessage(
        "We didn't capture enough data to create your baseline assessment. " +
          'This can happen if you pressed Finish before answering all five questions.'
      );
      setShowErrorModal(true);
      setIsSaving(false);
      return;
    }

    // Calculate clinical scores
    const clinical = calculateClinicalScores(phqResponses, moodScore);
    const composite = calculateMindMeasureComposite(clinical);

    // Visual phase transitions
    setTimeout(() => setProcessingPhase('calculating'), 3000);
    setTimeout(() => setProcessingPhase('saving'), 6000);

    // Stop message rotation after all messages shown
    setTimeout(() => clearInterval(messageInterval), 9000);

    // Stop media capture and get blobs
    let capturedMedia: CapturedMediaResult | null = null;
    let enrichmentResult: EnrichmentResult | null = null;

    if (mediaCaptureRef.current) {
      try {
        capturedMedia = await mediaCaptureRef.current.stop();

        // Enrich with multimodal features
        const enrichmentService = new BaselineEnrichmentService();

        enrichmentResult = await enrichmentService.enrichBaseline({
          clinicalScore: composite.score,
          audioBlob: capturedMedia.audio,
          videoFrames: capturedMedia.videoFrames,
          duration: capturedMedia.duration ?? 0,
          userId: user?.id || '',
          fusionOutputId: 'temp',
          startTime: capturedMedia.startTime,
          endTime: capturedMedia.endTime,
        });
      } catch (error: unknown) {
        console.warn('[SDK] Multimodal enrichment failed:', error);
        enrichmentResult = null;
      } finally {
        mediaCaptureRef.current = null;
      }
    }

    // Use enriched score if available, otherwise clinical-only
    const finalScore = enrichmentResult?.finalScore ?? composite.score;

    // Phase 3: Saving
    setTimeout(() => setProcessingPhase('saving'), 3000);

    // Get user ID
    let userId = user?.id;
    if (!userId) {
      try {
        const { value } = await Preferences.get({ key: 'mindmeasure_user' });
        if (value) {
          const userData = JSON.parse(value);
          userId = userData.userId;
        }
      } catch (error: unknown) {
        console.error('[SDK] Error reading user ID:', error);
      }
    }

    if (!userId) {
      console.error('[SDK] ❌ No user ID available');
      alert('Unable to save assessment. Please try logging in again.');
      setIsSaving(false);
      return;
    }

    try {
      const { BackendServiceFactory } = await import('../services/database/BackendServiceFactory');
      const backendService = BackendServiceFactory.createService(BackendServiceFactory.getEnvironmentConfig());

      // Check/create profile
      const { data: existingProfiles, error: profileCheckError } = await backendService.database.select('profiles', {
        columns: ['id', 'email', 'user_id'],
        filters: { user_id: userId },
      });

      if (profileCheckError) {
        console.error('[SDK] ❌ Error checking profile:', profileCheckError);
        throw new Error('Failed to verify user profile');
      }

      if (!existingProfiles || existingProfiles.length === 0) {
        const { resolveUniversityFromEmail } = await import('../services/UniversityResolver');
        const userEmail = user?.email || '';
        const universityId = await resolveUniversityFromEmail(userEmail);

        const firstName = user?.user_metadata?.first_name || 'User';
        const lastName = user?.user_metadata?.last_name || '';
        const profileData = {
          user_id: userId,
          first_name: firstName,
          last_name: lastName,
          email: userEmail,
          display_name: `${firstName} ${lastName}`.trim() || 'User',
          university_id: universityId,
          baseline_established: false,
          streak_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: profileCreateError } = await backendService.database.insert('profiles', profileData);
        if (profileCreateError) {
          console.error('[SDK] ❌ Failed to create profile:', profileCreateError);
          throw new Error('Failed to create user profile');
        }
      }

      // Build analysis object with multimodal data if available
      const analysisData: BaselineAnalysisData = {
        assessment_type: 'baseline',
        elevenlabs_session_id: sessionId,
        clinical_scores: {
          phq2_total: clinical.phq2_total,
          gad2_total: clinical.gad2_total,
          mood_scale: clinical.mood_scale,
          phq2_positive_screen: clinical.phq2_positive_screen,
          gad2_positive_screen: clinical.gad2_positive_screen,
        },
        conversation_quality: 'complete',
        mind_measure_composite: {
          score: composite.score,
          phq2_component: composite.phq2_component,
          gad2_component: composite.gad2_component,
          mood_component: composite.mood_component,
        },
        multimodal_enrichment: {
          enabled: false,
          reason: 'Not yet processed',
        },
      };

      // Add multimodal data if enrichment succeeded
      if (enrichmentResult && enrichmentResult.success) {
        analysisData.multimodal_enrichment = {
          enabled: true,
          audio_features: enrichmentResult.audioFeatures as Record<string, unknown> | null,
          visual_features: enrichmentResult.visualFeatures as Record<string, unknown> | null,
          scoring_breakdown: enrichmentResult.scoringBreakdown as unknown as Record<string, unknown>,
          processing_time_ms: enrichmentResult.processingTimeMs,
          warnings: enrichmentResult.warnings,
        };
      } else {
        analysisData.multimodal_enrichment = {
          enabled: false,
          reason: enrichmentResult?.warnings?.[0] || 'Media capture not available',
        };
      }

      // Save fusion output
      const fusionData = {
        user_id: userId,
        session_id: null as string | null,
        score: finalScore,
        score_smoothed: finalScore,
        final_score: finalScore,
        p_worse_fused: (100 - finalScore) / 100,
        uncertainty: enrichmentResult ? 1 - enrichmentResult.scoringBreakdown.confidence : 0.3,
        qc_overall: enrichmentResult?.scoringBreakdown.confidence || 0.7,
        public_state: 'report',
        model_version: enrichmentResult ? 'v1.1-multimodal' : 'v1.0-clinical',
        analysis: JSON.stringify(analysisData),
        topics: JSON.stringify(['wellbeing', 'baseline', 'initial_assessment', 'phq2', 'gad2']),
        created_at: new Date().toISOString(),
      };

      const { data: fusionResult, error: fusionError } = await backendService.database.insert(
        'fusion_outputs',
        fusionData
      );
      if (fusionError || !fusionResult) {
        console.error('[SDK] ❌ CRITICAL: Failed to save baseline assessment:', fusionError);
        throw new Error('Failed to save baseline assessment');
      }

      const fusionOutputId = Array.isArray(fusionResult)
        ? ((fusionResult[0] as Record<string, unknown> | undefined)?.id as string | undefined)
        : ((fusionResult as Record<string, unknown> | undefined)?.id as string | undefined);
      if (!fusionOutputId) {
        console.error('[SDK] ❌ CRITICAL: No fusion_output_id returned');
        throw new Error('Failed to get fusion_output_id');
      }
      // Store raw transcript
      const transcriptLines = assessmentState.transcript.split('\n').filter((line: string) => line.trim());
      const transcriptData = {
        fusion_output_id: fusionOutputId,
        user_id: userId,
        conversation_id: sessionId,
        transcript: assessmentState.transcript,
        message_count: transcriptLines.length,
        word_count: assessmentState.transcript.split(/\s+/).length,
        duration_seconds: Math.round((endedAt - (assessmentState.startedAt || endedAt)) / 1000),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: transcriptError } = await backendService.database.insert('assessment_transcripts', transcriptData);
      if (transcriptError) {
        console.warn('[SDK] Failed to store transcript:', transcriptError);
      }

      // Store individual assessment items
      const questionTexts = {
        phq2_q1: 'Over the past two weeks, how often have you felt little interest or pleasure in doing things?',
        phq2_q2: 'Over the past two weeks, how often have you felt down, depressed, or hopeless?',
        gad2_q1: 'Over the past two weeks, how often have you felt nervous, anxious, or on edge?',
        gad2_q2: 'Over the past two weeks, how often have you been unable to stop or control worrying?',
        mood: 'On a scale of one to ten, how would you rate your current mood?',
      };

      const frequencyMap: { [key: number]: string } = {
        0: 'Not at all',
        1: 'Several days',
        2: 'More than half the days',
        3: 'Nearly every day',
      };

      const items = [
        {
          item_code: 'phq2_q1',
          instrument: 'PHQ-2',
          question_text: questionTexts.phq2_q1,
          response_score: phqResponses.phq2_q1 ?? 0,
          response_raw: frequencyMap[phqResponses.phq2_q1 ?? 0],
        },
        {
          item_code: 'phq2_q2',
          instrument: 'PHQ-2',
          question_text: questionTexts.phq2_q2,
          response_score: phqResponses.phq2_q2 ?? 0,
          response_raw: frequencyMap[phqResponses.phq2_q2 ?? 0],
        },
        {
          item_code: 'gad2_q1',
          instrument: 'GAD-2',
          question_text: questionTexts.gad2_q1,
          response_score: phqResponses.gad2_q1 ?? 0,
          response_raw: frequencyMap[phqResponses.gad2_q1 ?? 0],
        },
        {
          item_code: 'gad2_q2',
          instrument: 'GAD-2',
          question_text: questionTexts.gad2_q2,
          response_score: phqResponses.gad2_q2 ?? 0,
          response_raw: frequencyMap[phqResponses.gad2_q2 ?? 0],
        },
        {
          item_code: 'mood_scale',
          instrument: 'MOOD_SCALE',
          question_text: questionTexts.mood,
          response_score: moodScore ?? 5,
          response_raw: String(moodScore ?? 5),
        },
      ];

      let itemsStored = 0;
      for (const item of items) {
        const { error: itemError } = await backendService.database.insert('assessment_items', {
          fusion_output_id: fusionOutputId,
          user_id: userId,
          instrument: item.instrument,
          item_code: item.item_code,
          question_text: item.question_text,
          response_raw: item.response_raw,
          response_score: item.response_score,
          extraction_confidence: 'high',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        if (itemError) {
          console.warn('[SDK] ⚠️ Failed to store assessment item:', item.item_code, itemError);
        } else {
          itemsStored++;
        }
      }
      const { error: updateError } = await backendService.database.update(
        'profiles',
        { baseline_established: true, updated_at: new Date().toISOString() },
        { user_id: userId }
      );

      if (updateError) {
        console.error('[SDK] ❌ CRITICAL: Failed to update profile:', updateError);
        throw new Error('Failed to mark baseline as complete');
      }
      // Mark complete in device storage
      await Preferences.set({
        key: 'mindmeasure_baseline_complete',
        value: 'true',
      });
      setIsSaving(false);
      if (onComplete) {
        onComplete();
      }
    } catch (error: unknown) {
      console.error('[SDK] ❌ Error saving assessment:', error);
      setIsSaving(false);
      alert('There was an error saving your assessment. Please try again or contact support.');
    }
  }, [assessmentState, sessionId, user, onComplete]);

  const handleFinish = useCallback(async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    // Play click sound and haptics
    try {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {
      // Haptics/audio not available
    }

    // End the conversation
    try {
      await conversation.endSession();
    } catch (error: unknown) {
      console.error('[SDK] ❌ Error ending conversation:', error);
    }

    // Process assessment data
    try {
      await processAssessmentData();
    } catch (error: unknown) {
      console.error('[SDK] ❌ CRITICAL ERROR in processAssessmentData:', error);
      setIsSaving(false);
      alert('There was an error processing your assessment. Please try again or contact support.');
    }
  }, [isSaving, assessmentState.transcript.length, conversation, processAssessmentData]);

  const handleErrorCancel = useCallback(() => {
    setShowErrorModal(false);
    resetState();
    if (onComplete) {
      onComplete();
    }
  }, [resetState, onComplete]);

  const handleErrorRetry = useCallback(
    (onBack?: () => void) => {
      setShowErrorModal(false);
      resetState();
      if (onBack) {
        onBack();
      }
    },
    [resetState]
  );

  return {
    // State
    showConversation,
    requestingPermissions,
    messages,
    isSaving,
    processingPhase,
    processingMessage,
    showErrorModal,
    errorMessage,
    conversationStatus: conversation.status,
    messagesEndRef,

    // Actions
    handleStartAssessment,
    handleFinish,
    handleErrorCancel,
    handleErrorRetry,
  };
}
