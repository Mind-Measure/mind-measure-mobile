export type TabType = 'overview' | 'details' | 'wellness';

export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  institution: string;
  institutionLogo: string;
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

export const DEFAULT_USER_DATA: UserData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  institution: 'University of Worcester',
  institutionLogo: '',
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
  currentStreak: 0,
  longestStreak: 0,
  totalCheckIns: 0,
  averageScore: null,
};
