import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Eye, Mic, MessageCircle, Shield } from 'lucide-react';

interface ConversationWelcomeProps {
  isBaseline: boolean;
  onStart: () => void;
}

export const ConversationWelcome: React.FC<ConversationWelcomeProps> = ({ isBaseline, onStart }) => {
  return (
    <div className="min-h-screen bg-[#FAF9F7] w-full px-4 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8 flex flex-col justify-center">
      {/* Header */}
      <div className="text-center pt-4 sm:pt-8">
        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
          <img
            src="https://api.mindmeasure.co.uk/storage/marketing/MM%20logo%20square.png"
            alt="Mind Measure"
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2D4C4C] mb-2 sm:mb-3">
          {isBaseline ? 'Welcome to Mind Measure' : 'Welcome back'}
        </h1>
        <p className="text-[#2D4C4C]/60 leading-relaxed text-sm sm:text-base px-4 sm:px-0">
          {isBaseline
            ? "Let's get to know you better with a brief assessment to establish your wellness baseline"
            : 'Ready for your regular wellness check?'}
        </p>
      </div>

      {/* Start Button */}
      <div className="text-center space-y-3 sm:space-y-4">
        <Button
          onClick={onStart}
          className="w-full h-14 sm:h-16 bg-[#2D4C4C] text-white border-0 shadow-lg text-base sm:text-lg hover:shadow-xl transition-all duration-300 rounded-2xl"
        >
          <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
          Start {isBaseline ? 'Baseline Assessment' : 'Check-in'} with Jodie
        </Button>
        <p className="text-[#2D4C4C]/40 text-xs sm:text-sm px-4 sm:px-0 italic">
          Find a quiet, comfortable space where you can speak freely
        </p>
      </div>

      {/* What to Expect */}
      {isBaseline ? (
        <div className="space-y-4 sm:space-y-6">
          <h3 className="text-[#2D4C4C] text-center text-base sm:text-lg font-semibold">What to Expect</h3>
          <div className="space-y-4 sm:space-y-5">
            <Card className="border-0 shadow-lg bg-[#99CCCE]/15 p-3 sm:p-5">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#99CCCE]/25 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-[#2D4C4C]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[#2D4C4C] mb-1 text-sm sm:text-base font-semibold">Visual Analysis</h4>
                  <p className="text-[#2D4C4C]/70 text-xs sm:text-sm leading-relaxed">
                    We use your phone's camera to assess your facial expressions. We do not store any images of you,
                    they are analysed for facial landmarks, emotion categories (happy, sad, angry, confused, calm,
                    etc.), and attention markers (e.g., eyes closed, head down).
                  </p>
                </div>
              </div>
            </Card>
            <Card className="border-0 shadow-lg bg-[#F59E0B]/10 p-3 sm:p-5">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#F59E0B]/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-[#2D4C4C]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[#2D4C4C] mb-1 text-sm sm:text-base font-semibold">Voice Patterns</h4>
                  <p className="text-[#2D4C4C]/70 text-xs sm:text-sm leading-relaxed">
                    The human voice is a rich source of affective information. Acoustic features such as pitch, jitter,
                    speaking rate, and pauses correlate strongly with depression, anxiety, and stress. We listen to how
                    you sound not just what you say.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="border-0 shadow-lg bg-[#99CCCE]/15 p-3 sm:p-5">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#99CCCE]/25 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#2D4C4C]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[#2D4C4C] mb-1 text-sm sm:text-base font-semibold">Conversation</h4>
                  <p className="text-[#2D4C4C]/70 text-xs sm:text-sm leading-relaxed">
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
            <Card className="border-0 shadow-lg bg-[#99CCCE]/15 p-3 sm:p-5">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#99CCCE]/25 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#2D4C4C]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[#2D4C4C] mb-1 text-sm sm:text-base font-semibold">Quick Check-in</h4>
                  <p className="text-[#2D4C4C]/70 text-xs sm:text-sm leading-relaxed">
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
      <Card className="border-0 shadow-lg bg-[#DDD6FE]/20 p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#DDD6FE]/30 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-[#2D4C4C]" />
          </div>
          <div className="min-w-0">
            <h4 className="text-[#2D4C4C] mb-2 text-sm sm:text-base font-semibold">Private & Secure</h4>
            <p className="text-[#2D4C4C]/70 text-xs sm:text-sm leading-relaxed">
              Your data is encrypted and confidential. Mind Measure complies with GDPR, UK ICO guidance, and aligns with
              NHS Clinical Governance frameworks (NHS England, 2023). Identifiable raw media (audio and images) are
              discarded after feature extraction and analysis.
            </p>
          </div>
        </div>
      </Card>

      {/* More Information */}
      <Card className="border-0 shadow-lg bg-[#F59E0B]/10 p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#F59E0B]/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#2D4C4C]" />
          </div>
          <div className="min-w-0">
            <h4 className="text-[#2D4C4C] mb-2 text-sm sm:text-base font-semibold">More Information</h4>
            <p className="text-[#2D4C4C]/70 text-xs sm:text-sm leading-relaxed">
              There are more details about how Mind Measure works on our website{' '}
              <a href="https://mindmeasure.app/" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-[#2D4C4C] transition-colors">
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
          <h3 className="text-lg sm:text-xl font-bold text-[#2D4C4C] mb-2 sm:mb-3">
            Mind Measure
          </h3>
          <p className="text-[#2D4C4C]/60 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto px-4 sm:px-0">
            Your trusted companion for understanding and measuring your mental wellbeing through intelligent
            conversation and analysis.
          </p>
        </div>
      </div>

      <div className="h-24" />
    </div>
  );
};
