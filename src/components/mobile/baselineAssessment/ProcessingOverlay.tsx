import { ProcessingScreen } from '../ProcessingScreen';

interface ProcessingOverlayProps {
  previousScore?: number | null;
  newScore?: number | null;
  isFirstBaseline?: boolean;
  onScoreRevealed?: () => void;
}

export function ProcessingOverlay({
  previousScore,
  newScore,
  isFirstBaseline = false,
  onScoreRevealed,
}: ProcessingOverlayProps) {
  return (
    <ProcessingScreen
      mode="baseline"
      previousScore={previousScore}
      newScore={newScore}
      isFirstBaseline={isFirstBaseline}
      onScoreRevealed={onScoreRevealed}
    />
  );
}
