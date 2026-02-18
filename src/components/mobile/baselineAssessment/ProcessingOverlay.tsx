import type { ProcessingPhase } from './types';
import { ProcessingScreen } from '../ProcessingScreen';

interface ProcessingOverlayProps {
  processingPhase: ProcessingPhase;
  processingMessage: string;
}

export function ProcessingOverlay({ processingPhase: _phase, processingMessage: _msg }: ProcessingOverlayProps) {
  return (
    <div className="fixed inset-0 z-[9999]">
      <ProcessingScreen mode="baseline" />
    </div>
  );
}
