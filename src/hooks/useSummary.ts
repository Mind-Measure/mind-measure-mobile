export interface WeeklySummaryDay {
  day: string;
  score: number | null;
  band: string;
}

export interface WeeklySummaryCounts {
  totalCheckins: number;
  averageScore: number | null;
  streak: number;
}
