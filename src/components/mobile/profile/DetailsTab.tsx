import { Edit2 } from 'lucide-react';
import { Select } from '../Select';
import type { UserData } from './types';
import { OPEN_ACCESS_INSTITUTION_ID, REFERRAL_SOURCE_OPTIONS } from './types';

interface DetailsTabProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  isSaving: boolean;
  schoolOptions: string[];
  hallOptions: string[];
  onSaveProfile: () => Promise<void>;
}

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#999999',
  marginBottom: '16px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#666666',
  marginBottom: '6px',
  display: 'block',
};

const inputStyleFn = (editing: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #E0E0E0',
  borderRadius: '8px',
  fontSize: '14px',
  color: '#1a1a1a',
  background: editing ? 'white' : '#FAFAFA',
  outline: 'none',
});

export function DetailsTab({
  userData,
  setUserData,
  isEditing,
  setIsEditing,
  isSaving,
  schoolOptions,
  hallOptions,
  onSaveProfile,
}: DetailsTabProps) {
  const isOpenAccess = userData.institutionId === OPEN_ACCESS_INSTITUTION_ID;

  return (
    <div>
      {/* Your Information Section */}
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>Your Information</h2>
          <button
            onClick={() => (isEditing ? onSaveProfile() : setIsEditing(true))}
            disabled={isSaving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              border: '1px solid #E0E0E0',
              borderRadius: '8px',
              background: 'white',
              color: '#1a1a1a',
              fontSize: '13px',
              fontWeight: '500',
              cursor: isSaving ? 'default' : 'pointer',
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            <Edit2 size={14} />
            {isSaving ? 'Saving...' : isEditing ? 'Save' : 'Edit'}
          </button>
        </div>

        {/* Personal Information */}
        <div style={{ marginBottom: '28px' }}>
          <div style={sectionHeaderStyle}>Personal Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>First Name</label>
              <input
                type="text"
                value={userData.firstName}
                disabled={!isEditing}
                onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                style={inputStyleFn(isEditing)}
              />
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input
                type="text"
                value={userData.lastName}
                disabled={!isEditing}
                onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                style={inputStyleFn(isEditing)}
              />
            </div>
          </div>
          {!isOpenAccess && (
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Phone Number</label>
              <input
                type="tel"
                value={userData.phone}
                disabled={!isEditing}
                onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                style={inputStyleFn(isEditing)}
              />
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Age Range</label>
              <Select
                value={userData.ageRange}
                onChange={(value) => setUserData({ ...userData, ageRange: value })}
                options={['17-18', '19-21', '22-25', '26-30', '31-40', '41+']}
                disabled={!isEditing}
              />
            </div>
            <div>
              <label style={labelStyle}>Gender</label>
              <Select
                value={userData.gender}
                onChange={(value) => setUserData({ ...userData, gender: value })}
                options={['Female', 'Male', 'Non-binary', 'Prefer not to say', 'Other']}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        {isOpenAccess ? (
          /* ─── Open-Access: About You ─── */
          <div>
            <div style={sectionHeaderStyle}>About You</div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Occupation</label>
              <input
                type="text"
                value={userData.occupation}
                disabled={!isEditing}
                onChange={(e) => setUserData({ ...userData, occupation: e.target.value })}
                placeholder="e.g., Nurse, Teacher, Software Engineer"
                style={inputStyleFn(isEditing)}
              />
            </div>
            <div>
              <label style={labelStyle}>How did you hear about us?</label>
              <Select
                value={userData.referralSource}
                onChange={(value) => setUserData({ ...userData, referralSource: value })}
                options={[...REFERRAL_SOURCE_OPTIONS]}
                disabled={!isEditing}
                placeholder="Select an option"
              />
            </div>
          </div>
        ) : (
          <>
            {/* ─── University: Academic Information ─── */}
            <div style={{ marginBottom: '28px' }}>
              <div style={sectionHeaderStyle}>Academic Information</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                <div>
                  <label style={labelStyle}>
                    School / Faculty <span style={{ color: '#FF4444' }}>*</span>
                  </label>
                  <Select
                    value={userData.school}
                    onChange={(value) => setUserData({ ...userData, school: value })}
                    options={schoolOptions.length > 0 ? schoolOptions : ['Select your faculty or school']}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    Year of Study <span style={{ color: '#FF4444' }}>*</span>
                  </label>
                  <Select
                    value={userData.yearOfStudy}
                    onChange={(value) => setUserData({ ...userData, yearOfStudy: value })}
                    options={['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Postgraduate', 'Foundation']}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Course / Programme</label>
                <input
                  type="text"
                  value={userData.course}
                  disabled={!isEditing}
                  onChange={(e) => setUserData({ ...userData, course: e.target.value })}
                  style={inputStyleFn(isEditing)}
                />
              </div>
              <div>
                <label style={labelStyle}>Study Mode</label>
                <Select
                  value={userData.studyMode}
                  onChange={(value) => setUserData({ ...userData, studyMode: value })}
                  options={['Full-time', 'Part-time', 'Distance Learning']}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* ─── University: Living Situation ─── */}
            <div style={{ marginBottom: '28px' }}>
              <div style={sectionHeaderStyle}>Living Situation</div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  marginBottom: userData.livingArrangement === 'University Accommodation' ? '12px' : '0',
                }}
              >
                <div>
                  <label style={labelStyle}>
                    Where do you live? <span style={{ color: '#FF4444' }}>*</span>
                  </label>
                  <Select
                    value={userData.livingArrangement}
                    onChange={(value) =>
                      setUserData({
                        ...userData,
                        livingArrangement: value,
                        accommodationName: value === 'University Accommodation' ? userData.accommodationName : '',
                      })
                    }
                    options={['University Accommodation', 'Off Campus - Private', 'Living at Home', 'Commuting']}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Domicile Status</label>
                  <Select
                    value={userData.domicileStatus}
                    onChange={(value) => setUserData({ ...userData, domicileStatus: value })}
                    options={['Home (UK)', 'EU', 'International']}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              {userData.livingArrangement === 'University Accommodation' && (
                <div>
                  <label style={labelStyle}>Name of Accommodation</label>
                  {hallOptions.length > 0 ? (
                    <Select
                      value={userData.accommodationName}
                      onChange={(value) => setUserData({ ...userData, accommodationName: value })}
                      options={hallOptions}
                      disabled={!isEditing}
                      placeholder="Select hall of residence"
                    />
                  ) : (
                    <input
                      type="text"
                      value={userData.accommodationName}
                      disabled={!isEditing}
                      onChange={(e) => setUserData({ ...userData, accommodationName: e.target.value })}
                      placeholder="e.g., Smith Hall"
                      style={inputStyleFn(isEditing)}
                    />
                  )}
                </div>
              )}
            </div>

            {/* ─── University: Additional Information ─── */}
            <div>
              <div style={sectionHeaderStyle}>Additional Information</div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginBottom: '16px',
                  cursor: isEditing ? 'pointer' : 'default',
                }}
              >
                <input
                  type="checkbox"
                  checked={userData.firstGenStudent}
                  disabled={!isEditing}
                  onChange={(e) => setUserData({ ...userData, firstGenStudent: e.target.checked })}
                  style={{
                    marginTop: '2px',
                    width: '18px',
                    height: '18px',
                    cursor: isEditing ? 'pointer' : 'default',
                  }}
                />
                <div>
                  <div style={{ fontSize: '14px', color: '#1a1a1a', fontWeight: '500', marginBottom: '2px' }}>
                    First generation student
                  </div>
                  <div style={{ fontSize: '12px', color: '#999999' }}>
                    First in your immediate family to attend university
                  </div>
                </div>
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  cursor: isEditing ? 'pointer' : 'default',
                }}
              >
                <input
                  type="checkbox"
                  checked={userData.caringResponsibilities}
                  disabled={!isEditing}
                  onChange={(e) => setUserData({ ...userData, caringResponsibilities: e.target.checked })}
                  style={{
                    marginTop: '2px',
                    width: '18px',
                    height: '18px',
                    cursor: isEditing ? 'pointer' : 'default',
                  }}
                />
                <div>
                  <div style={{ fontSize: '14px', color: '#1a1a1a', fontWeight: '500', marginBottom: '2px' }}>
                    Caring responsibilities
                  </div>
                  <div style={{ fontSize: '12px', color: '#999999' }}>You care for a family member or dependent</div>
                </div>
              </label>
            </div>
          </>
        )}
      </div>

      {/* Data Usage Info */}
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          border: '1px solid #E8F0FE',
        }}
      >
        <div
          style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#2D4C4C',
            marginBottom: '12px',
          }}
        >
          How we use your information
        </div>
        <ul
          style={{
            margin: 0,
            paddingLeft: '20px',
            fontSize: '12px',
            color: '#666666',
            lineHeight: '1.6',
          }}
        >
          <li style={{ marginBottom: '4px' }}>Your data helps us personalise your wellbeing support</li>
          {!isOpenAccess && <li style={{ marginBottom: '4px' }}>Academic info enables aggregate cohort insights</li>}
          <li style={{ marginBottom: '4px' }}>All data is anonymised and never shared with third parties</li>
          <li>You can update or delete your information anytime</li>
        </ul>
      </div>
    </div>
  );
}
