import { Edit2 } from 'lucide-react';
import { Select } from '../Select';
import type { UserData } from './types';

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
          <div
            style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#999999',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Personal Information
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#666666', marginBottom: '6px', display: 'block' }}>
                First Name
              </label>
              <input
                type="text"
                value={userData.firstName}
                disabled={!isEditing}
                onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #E0E0E0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#1a1a1a',
                  background: isEditing ? 'white' : '#FAFAFA',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#666666', marginBottom: '6px', display: 'block' }}>
                Last Name
              </label>
              <input
                type="text"
                value={userData.lastName}
                disabled={!isEditing}
                onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #E0E0E0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#1a1a1a',
                  background: isEditing ? 'white' : '#FAFAFA',
                  outline: 'none',
                }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#666666', marginBottom: '6px', display: 'block' }}>
              Phone Number
            </label>
            <input
              type="tel"
              value={userData.phone}
              disabled={!isEditing}
              onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #E0E0E0',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#1a1a1a',
                background: isEditing ? 'white' : '#FAFAFA',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#666666', marginBottom: '6px', display: 'block' }}>
                Age Range
              </label>
              <Select
                value={userData.ageRange}
                onChange={(value) => setUserData({ ...userData, ageRange: value })}
                options={['17-18', '19-21', '22-25', '26-30', '31-40', '41+']}
                disabled={!isEditing}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#666666', marginBottom: '6px', display: 'block' }}>
                Gender
              </label>
              <Select
                value={userData.gender}
                onChange={(value) => setUserData({ ...userData, gender: value })}
                options={['Female', 'Male', 'Non-binary', 'Prefer not to say', 'Other']}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#999999',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Academic Information
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#666666', marginBottom: '6px', display: 'block' }}>
                School / Faculty <span style={{ color: '#FF4444' }}>*</span>
              </label>
              <Select
                value={userData.school}
                onChange={(value) => setUserData({ ...userData, school: value })}
                options={
                  schoolOptions.length > 0
                    ? schoolOptions
                    : [
                        'School of Arts and Humanities',
                        'Worcester Business School',
                        'School of Education',
                        'School of Health and Wellbeing',
                        'School of Science and the Environment',
                        'School of Sport and Exercise Science',
                      ]
                }
                disabled={!isEditing}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#666666', marginBottom: '6px', display: 'block' }}>
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
            <label style={{ fontSize: '12px', color: '#666666', marginBottom: '6px', display: 'block' }}>
              Course / Programme
            </label>
            <input
              type="text"
              value={userData.course}
              disabled={!isEditing}
              onChange={(e) => setUserData({ ...userData, course: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #E0E0E0',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#1a1a1a',
                background: isEditing ? 'white' : '#FAFAFA',
                outline: 'none',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#666666', marginBottom: '6px', display: 'block' }}>
              Study Mode
            </label>
            <Select
              value={userData.studyMode}
              onChange={(value) => setUserData({ ...userData, studyMode: value })}
              options={['Full-time', 'Part-time', 'Distance Learning']}
              disabled={!isEditing}
            />
          </div>
        </div>

        {/* Living Situation */}
        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#999999',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Living Situation
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: userData.livingArrangement === 'University Accommodation' ? '12px' : '0',
            }}
          >
            <div>
              <label style={{ fontSize: '12px', color: '#666666', marginBottom: '6px', display: 'block' }}>
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
              <label style={{ fontSize: '12px', color: '#666666', marginBottom: '6px', display: 'block' }}>
                Domicile Status
              </label>
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
              <label style={{ fontSize: '12px', color: '#666666', marginBottom: '6px', display: 'block' }}>
                Name of Accommodation
              </label>
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
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #E0E0E0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#1a1a1a',
                    background: isEditing ? 'white' : '#FAFAFA',
                    outline: 'none',
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* Additional Information */}
        <div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#999999',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Additional Information
          </div>
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
            color: '#5B8FED',
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
          <li style={{ marginBottom: '4px' }}>Academic info enables aggregate cohort insights</li>
          <li style={{ marginBottom: '4px' }}>All data is anonymised for institutional research</li>
          <li>You can update or delete your information anytime</li>
        </ul>
      </div>
    </div>
  );
}
