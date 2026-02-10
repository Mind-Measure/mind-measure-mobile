import { WeeklySummaryDay, WeeklySummaryCounts } from '@/hooks/useSummary';
interface WeeklySummaryProps {
  days: WeeklySummaryDay[];
  counts: WeeklySummaryCounts;
}
export function WeeklySummary({ days, counts: _counts }: WeeklySummaryProps) {
  const formatDay = (day: string) => {
    const date = new Date(day);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };
  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">Past 7 days</h3>
      {/* Visual bar chart */}
      <div className="flex gap-1">
        {days.map((day, _index) => (
          <div key={day.day} className="flex-1 min-w-0">
            <div
              className={`h-8 rounded-sm transition-colors ${(day.score ?? 0) > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
              title={
                (day.score ?? 0) > 0
                  ? `${formatDay(day.day)}: Check-in completed`
                  : `${formatDay(day.day)}: No check-in`
              }
            />
            <div className="text-xs text-muted-foreground text-center mt-1">{formatDay(day.day).slice(0, 1)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
