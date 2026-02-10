export interface Nudge {
  id: string;
  text: string;
  type: 'checkin' | 'buddy' | 'content' | 'general';
  priority: number;
  createdAt: string;
}
