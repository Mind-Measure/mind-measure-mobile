export type ScoreBand = 'excellent' | 'teal' | 'caution' | 'concern';

export function getScoreBand(score: number): ScoreBand {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'teal';
  if (score >= 40) return 'caution';
  return 'concern';
}

export function getBandColor(band: ScoreBand): string {
  switch (band) {
    case 'excellent':
      return 'primary';
    case 'teal':
      return 'primary';
    case 'caution':
      return 'warning';
    case 'concern':
      return 'destructive';
    default:
      return 'primary';
  }
}
