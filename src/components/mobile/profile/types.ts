export type TabType = 'overview' | 'details' | 'wellness';

export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  institution: string;
  institutionLogo: string;
  institutionId: string;
  accountType: string;
  ageRange: string;
  gender: string;
  school: string;
  yearOfStudy: string;
  course: string;
  studyMode: string;
  livingArrangement: string;
  accommodationName: string;
  domicileStatus: string;
  firstGenStudent: boolean;
  caringResponsibilities: boolean;
  occupation: string;
  referralSource: string;
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  averageScore: number | null;
}

export interface UniversityData {
  id: string;
  name: string;
  logo?: string;
  schools: Array<{ name: string; studentCount?: number }>;
  halls_of_residence?: Array<{ name: string }>;
}

export const OPEN_ACCESS_INSTITUTION_ID = 'mindmeasure';

export const REFERRAL_SOURCE_OPTIONS = [
  'Social Media',
  'Friend or Family',
  'University',
  'News / Press',
  'Search Engine',
  'App Store',
  'Other',
] as const;

export const DEFAULT_USER_DATA: UserData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  institution: '',
  institutionLogo: '',
  institutionId: '',
  accountType: 'Student',
  ageRange: '',
  gender: '',
  school: '',
  yearOfStudy: '',
  course: '',
  studyMode: '',
  livingArrangement: '',
  accommodationName: '',
  domicileStatus: '',
  firstGenStudent: false,
  caringResponsibilities: false,
  occupation: '',
  referralSource: '',
  currentStreak: 0,
  longestStreak: 0,
  totalCheckIns: 0,
  averageScore: null,
};
