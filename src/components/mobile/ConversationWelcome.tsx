import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Eye, Mic, MessageCircle, Shield } from 'lucide-react';

interface ConversationWelcomeProps {
  isBaseline: boolean;
  onStart: () => void;
}

/**
 * Welcome / landing screen shown before a conversation starts.
 * Displays different content for baseline vs check-in modes.
 */
export const ConversationWelcome: React.FC<ConversationWelcomeProps> = ({ isBaseline, onStart }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-50 w-full px-4 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8 flex flex-col justify-center">
      {/* Header */}
      <div className="text-center pt-4 sm:pt-8">
        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
          <img
            src="https://api.mindmeasure.co.uk/storage/marketing/MM%20logo%20square.png"
            alt="Mind Measure"
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-2 sm:mb-3">
          {isBaseline ? 'Welcome to Mind Measure' : 'Welcome back, Alex'}
        </h1>
        <p className="text-gray-600 leading-relaxed text-sm sm:text-base px-4 sm:px-0">
          {isBaseline
            ? "Let's get to know you better with a brief assessment to establish your wellness baseline"
            : 'Ready for your regular wellness check?'}
        </p>
      </div>

      {/* Start Button */}
      <div className="text-center space-y-3 sm:space-y-4">
        <Button
          onClick={onStart}
          className="w-full h-14 sm:h-16 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 border-0 shadow-2xl text-base sm:text-lg backdrop-blur-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-2xl"
        >
          <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
          Start {isBaseline ? 'Baseline Assessment' : 'Check-in'} with Jodie
        </Button>
        <p className="text-gray-500 text-xs sm:text-sm px-4 sm:px-0">
          Find a quiet, comfortable space where you can speak freely
        </p>
      </div>

      {/* What to Expect — different content for baseline vs check-in */}
      {isBaseline ? (
        <div className="space-y-4 sm:space-y-6">
          <h3 className="text-gray-900 text-center text-base sm:text-lg font-semibold">What to Expect</h3>
          <div className="space-y-4 sm:space-y-5">
            <Card className="border-0 shadow-lg backdrop-blur-xl bg-blue-50/70 p-3 sm:p-5">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center backdrop-blur-xl flex-shrink-0">
                  <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-blue-900 mb-1 text-sm sm:text-base font-semibold">Visual Analysis</h4>
                  <p className="text-blue-700 text-xs sm:text-sm leading-relaxed">
                    We use your phone's camera to assess your facial expressions. We do not store any images of you,
                    they are analysed for facial landmarks, emotion categories (happy, sad, angry, confused, calm,
                    etc.), and attention markers (e.g., eyes closed, head down).
                  </p>
                </div>
              </div>
            </Card>
            <Card className="border-0 shadow-lg backdrop-blur-xl bg-green-50/70 p-3 sm:p-5">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-2xl flex items-center justify-center backdrop-blur-xl flex-shrink-0">
                  <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-green-900 mb-1 text-sm sm:text-base font-semibold">Voice Patterns</h4>
                  <p className="text-green-700 text-xs sm:text-sm leading-relaxed">
                    The human voice is a rich source of affective information. Acoustic features such as pitch, jitter,
                    speaking rate, and pauses correlate strongly with depression, anxiety, and stress. We listen to how
                    you sound not just what you say.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="border-0 shadow-lg backdrop-blur-xl bg-purple-50/70 p-3 sm:p-5">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center backdrop-blur-xl flex-shrink-0">
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-purple-900 mb-1 text-sm sm:text-base font-semibold">Conversation</h4>
                  <p className="text-purple-700 text-xs sm:text-sm leading-relaxed">
                    When Jodie asks a question ("On a scale of 1–10, how is your mood right now?"), Mind Measure
                    evaluates your response quantitatively (the numerical score) and qualitatively (tone of voice,
                    hesitation, choice of words), this ensures a 'multi-modal' form of assessment, because we are not
                    always completely honest in what we say!
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <div className="space-y-4 sm:space-y-5">
            <Card className="border-0 shadow-lg backdrop-blur-xl bg-purple-50/70 p-3 sm:p-5">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center backdrop-blur-xl flex-shrink-0">
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-purple-900 mb-1 text-sm sm:text-base font-semibold">Quick Check-in</h4>
                  <p className="text-purple-700 text-xs sm:text-sm leading-relaxed">
                    Jodie will have a brief conversation with you to understand how you're feeling today compared to
                    your previous check-ins. This helps us track your wellness journey over time.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Private & Secure */}
      <Card className="border-0 shadow-lg backdrop-blur-xl bg-indigo-50/70 p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center backdrop-blur-xl flex-shrink-0">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <h4 className="text-indigo-900 mb-2 text-sm sm:text-base font-semibold">Private & Secure</h4>
            <p className="text-indigo-700 text-xs sm:text-sm leading-relaxed">
              Your data is encrypted and confidential. Mind Measure complies with GDPR, UK ICO guidance, and aligns with
              NHS Clinical Governance frameworks (NHS England, 2023). Identifiable raw media (audio and images) are
              discarded after feature extraction and analysis.
            </p>
          </div>
        </div>
      </Card>

      {/* More Information */}
      <Card className="border-0 shadow-lg backdrop-blur-xl bg-amber-50/70 p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center backdrop-blur-xl flex-shrink-0">
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
          </div>
          <div className="min-w-0">
            <h4 className="text-amber-900 mb-2 text-sm sm:text-base font-semibold">More Information</h4>
            <p className="text-amber-700 text-xs sm:text-sm leading-relaxed">
              There are more details about how Mind Measure works on our website{' '}
              <a
                href="https://mindmeasure.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium hover:text-amber-800 transition-colors"
              >
                mindmeasure.app
              </a>
            </p>
          </div>
        </div>
      </Card>

      {/* Mind Measure Branding */}
      <div className="text-center space-y-4 sm:space-y-6 py-6 sm:py-8">
        <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto flex items-center justify-center">
          <img
            src="https://api.mindmeasure.co.uk/storage/marketing/MM%20logo%20square.png"
            alt="Mind Measure"
            className="w-full h-full object-contain opacity-80"
          />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-2 sm:mb-3">
            Mind Measure
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto px-4 sm:px-0">
            Your trusted companion for understanding and measuring your mental wellbeing through intelligent
            conversation and analysis.
          </p>
        </div>
      </div>

      {/* Bottom padding for navigation */}
      <div className="h-24" />
    </div>
  );
};
