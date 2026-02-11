import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BackendServiceFactory } from '@/services/database/BackendServiceFactory';
import type { ThemeData } from '@/components/mobile/KeyThemes';
import { DEFAULT_USER_DATA } from '@/components/mobile/profile/types';
import type { UserData, UniversityData } from '@/components/mobile/profile/types';

/**
 * Calculates the current check-in streak from a list of sessions.
 */
interface SessionWithCreatedAt {
  created_at: string;
}
function calculateCurrentStreak(sessions: SessionWithCreatedAt[]): number {
  if (sessions.length === 0) return 0;

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let checkDate = new Date(today);

  for (const session of sortedSessions) {
    const sessionDate = new Date(session.created_at);
    sessionDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((checkDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0 || daysDiff === 1) {
      if (daysDiff === 1) {
        streak++;
        checkDate = new Date(sessionDate);
      }
    } else {
      break;
    }
  }

  return streak;
}

export interface UseProfileDataReturn {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  originalUserData: UserData | null;
  isLoading: boolean;
  isSaving: boolean;
  schoolOptions: string[];
  hallOptions: string[];
  moodData: Array<{ date: string; score: number }>;
  themesData: ThemeData[];
  profileCompleted: boolean;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
  handleSaveProfile: () => Promise<void>;
}

export function useProfileData(): UseProfileDataReturn {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [_universityData, setUniversityData] = useState<UniversityData | null>(null);
  const [schoolOptions, setSchoolOptions] = useState<string[]>([]);
  const [hallOptions, setHallOptions] = useState<string[]>([]);
  const [moodData, setMoodData] = useState<Array<{ date: string; score: number }>>([]);
  const [themesData, setThemesData] = useState<ThemeData[]>([]);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalUserData, setOriginalUserData] = useState<UserData | null>(null);
  const [userData, setUserData] = useState<UserData>(DEFAULT_USER_DATA);

  // Suppress unused var lint for _universityData (kept for future use)
  void _universityData;

  const loadUserProfile = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const backendService = BackendServiceFactory.createService(BackendServiceFactory.getEnvironmentConfig());

      // Fetch profile data
      const profileResponse = await backendService.database.select('profiles', {
        filters: { user_id: user.id },
      });

      if (profileResponse.data && profileResponse.data.length > 0) {
        const profile = profileResponse.data[0] as Record<string, unknown>;

        // Fetch university data
        const universityResponse = await backendService.database.select('universities', {
          filters: { id: profile.university_id },
        });

        let uniData: UniversityData | null = null;
        let schools: string[] = [];
        let halls: string[] = [];

        if (universityResponse.data && universityResponse.data.length > 0) {
          const uni = universityResponse.data[0] as Record<string, unknown>;
          uniData = {
            id: uni.id as string,
            name: uni.name as string,
            logo: uni.logo as string | undefined,
            schools: Array.isArray(uni.schools) ? uni.schools : [],
            halls_of_residence: Array.isArray(uni.halls_of_residence) ? uni.halls_of_residence : [],
          };

          schools = (Array.isArray(uni.schools) ? uni.schools : []).map((s: { name?: string }) =>
            String(s?.name ?? '')
          );
          halls = (Array.isArray(uni.halls_of_residence) ? uni.halls_of_residence : []).map((h: { name?: string }) =>
            String(h?.name ?? '')
          );

          setUniversityData(uniData);
          setSchoolOptions(schools);
          setHallOptions(halls);
        }

        // Fetch wellness stats from fusion_outputs
        const sessionsResponse = await backendService.database.select('fusion_outputs', {
          filters: { user_id: user.id },
          orderBy: [{ column: 'created_at', ascending: false }],
          columns: 'id, user_id, final_score, analysis, created_at',
        });

        const sessions = sessionsResponse.data || [];
        const totalCheckIns = sessions.length;

        const averageScore =
          totalCheckIns > 0
            ? Math.round(
                sessions.reduce((sum: number, s: { final_score?: number }) => sum + (s.final_score ?? 0), 0) /
                  totalCheckIns
              )
            : null;

        const currentStreak = calculateCurrentStreak(sessions);

        // Extract mood scores
        const moodScores = sessions
          .map((session: { created_at?: string; analysis?: string | Record<string, unknown> }) => {
            try {
              const analysis = typeof session.analysis === 'string' ? JSON.parse(session.analysis) : session.analysis;

              const moodScore = analysis?.moodScore || analysis?.mood_score;

              if (moodScore && moodScore > 0) {
                return { date: session.created_at as string, score: moodScore as number };
              }
              return null;
            } catch {
              return null;
            }
          })
          .filter((item): item is { date: string; score: number } => item !== null);

        setMoodData(moodScores);

        // Extract themes
        const themeCounts: Record<string, number> = {};
        sessions.forEach((session: { analysis?: string | Record<string, unknown> }) => {
          try {
            const analysis = typeof session.analysis === 'string' ? JSON.parse(session.analysis) : session.analysis;

            const themes = analysis?.themes || [];
            themes.forEach((theme: string) => {
              if (theme && typeof theme === 'string') {
                const capitalizedTheme = theme.charAt(0).toUpperCase() + theme.slice(1);
                themeCounts[capitalizedTheme] = (themeCounts[capitalizedTheme] || 0) + 1;
              }
            });
          } catch {
            // Skip invalid analysis
          }
        });

        const themesArray: ThemeData[] = Object.entries(themeCounts)
          .map(([text, value]) => ({ text, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 15);

        setThemesData(themesArray);

        setProfileCompleted(!!profile.profile_completed);
        const loadedUserData: UserData = {
          firstName: String(profile.first_name || ''),
          lastName: String(profile.last_name || ''),
          email: String(profile.email || user.email || ''),
          phone: String(profile.phone || ''),
          institution: uniData?.name || 'University of Worcester',
          institutionLogo: uniData?.logo || '',
          accountType: 'Student',
          ageRange: String(profile.age_range || ''),
          gender: String(profile.gender || ''),
          school: String(profile.school || ''),
          yearOfStudy: String(profile.year_of_study || ''),
          course: String(profile.course || ''),
          studyMode: String(profile.study_mode || ''),
          livingArrangement: String(profile.living_situation || ''),
          accommodationName: String(profile.hall_of_residence || ''),
          domicileStatus: String(profile.domicile || ''),
          firstGenStudent: !!profile.is_first_generation,
          caringResponsibilities: !!profile.has_caring_responsibilities,
          currentStreak,
          longestStreak: currentStreak,
          totalCheckIns,
          averageScore,
        };
        setUserData(loadedUserData);
        setOriginalUserData(loadedUserData);
        setHasUnsavedChanges(false);
      }
    } catch (error: unknown) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch user profile on mount / user change
  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user, loadUserProfile]);

  const handleSaveProfile = useCallback(async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      const backendService = BackendServiceFactory.createService(BackendServiceFactory.getEnvironmentConfig());

      await backendService.database.update(
        'profiles',
        {
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone,
          age_range: userData.ageRange,
          gender: userData.gender,
          school: userData.school,
          year_of_study: userData.yearOfStudy,
          course: userData.course,
          study_mode: userData.studyMode,
          living_situation: userData.livingArrangement,
          hall_of_residence: userData.accommodationName,
          domicile: userData.domicileStatus,
          is_first_generation: userData.firstGenStudent,
          has_caring_responsibilities: userData.caringResponsibilities,
          profile_completed: true,
          profile_completed_at: new Date().toISOString(),
        },
        { user_id: user.id }
      );

      setProfileCompleted(true);
      setOriginalUserData({ ...userData });
      setHasUnsavedChanges(false);
    } catch (error: unknown) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [user, userData]);

  return {
    userData,
    setUserData,
    originalUserData,
    isLoading,
    isSaving,
    schoolOptions,
    hallOptions,
    moodData,
    themesData,
    profileCompleted,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    handleSaveProfile,
  };
}
