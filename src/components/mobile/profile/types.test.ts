import { describe, it, expect } from 'vitest';
import { DEFAULT_USER_DATA } from './types';
import type { UserData, UniversityData } from './types';

// ============================================================================
// DEFAULT_USER_DATA
// ============================================================================

describe('DEFAULT_USER_DATA', () => {
  it('has empty strings for text fields', () => {
    expect(DEFAULT_USER_DATA.firstName).toBe('');
    expect(DEFAULT_USER_DATA.lastName).toBe('');
    expect(DEFAULT_USER_DATA.email).toBe('');
    expect(DEFAULT_USER_DATA.phone).toBe('');
    expect(DEFAULT_USER_DATA.ageRange).toBe('');
    expect(DEFAULT_USER_DATA.gender).toBe('');
    expect(DEFAULT_USER_DATA.school).toBe('');
    expect(DEFAULT_USER_DATA.yearOfStudy).toBe('');
    expect(DEFAULT_USER_DATA.course).toBe('');
    expect(DEFAULT_USER_DATA.studyMode).toBe('');
    expect(DEFAULT_USER_DATA.livingArrangement).toBe('');
    expect(DEFAULT_USER_DATA.accommodationName).toBe('');
    expect(DEFAULT_USER_DATA.domicileStatus).toBe('');
  });

  it('defaults institution to University of Worcester', () => {
    expect(DEFAULT_USER_DATA.institution).toBe('University of Worcester');
  });

  it('defaults accountType to Student', () => {
    expect(DEFAULT_USER_DATA.accountType).toBe('Student');
  });

  it('defaults boolean fields to false', () => {
    expect(DEFAULT_USER_DATA.firstGenStudent).toBe(false);
    expect(DEFAULT_USER_DATA.caringResponsibilities).toBe(false);
  });

  it('defaults numeric fields to zero', () => {
    expect(DEFAULT_USER_DATA.currentStreak).toBe(0);
    expect(DEFAULT_USER_DATA.longestStreak).toBe(0);
    expect(DEFAULT_USER_DATA.totalCheckIns).toBe(0);
  });

  it('defaults averageScore to null', () => {
    expect(DEFAULT_USER_DATA.averageScore).toBeNull();
  });

  it('conforms to UserData interface shape', () => {
    // Verify all expected keys exist
    const expectedKeys: (keyof UserData)[] = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'institution',
      'institutionLogo',
      'accountType',
      'ageRange',
      'gender',
      'school',
      'yearOfStudy',
      'course',
      'studyMode',
      'livingArrangement',
      'accommodationName',
      'domicileStatus',
      'firstGenStudent',
      'caringResponsibilities',
      'currentStreak',
      'longestStreak',
      'totalCheckIns',
      'averageScore',
    ];

    for (const key of expectedKeys) {
      expect(DEFAULT_USER_DATA).toHaveProperty(key);
    }
  });
});

// ============================================================================
// UniversityData type (structural smoke test)
// ============================================================================

describe('UniversityData – type compliance', () => {
  it('accepts a valid university data object', () => {
    const uni: UniversityData = {
      id: 'uni-1',
      name: 'Test University',
      schools: [{ name: 'Engineering', studentCount: 500 }],
      halls_of_residence: [{ name: 'Bredon Hall' }],
    };

    expect(uni.id).toBe('uni-1');
    expect(uni.name).toBe('Test University');
    expect(uni.schools).toHaveLength(1);
    expect(uni.schools[0].name).toBe('Engineering');
    expect(uni.halls_of_residence).toHaveLength(1);
  });

  it('allows optional logo and halls_of_residence', () => {
    const uni: UniversityData = {
      id: 'uni-2',
      name: 'Minimal Uni',
      schools: [],
    };

    expect(uni.logo).toBeUndefined();
    expect(uni.halls_of_residence).toBeUndefined();
  });
});
