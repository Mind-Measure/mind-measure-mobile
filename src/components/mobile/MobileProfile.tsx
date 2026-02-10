import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileData } from '@/hooks/useProfileData';
import { useDataExport } from '@/hooks/useDataExport';
import mindMeasureLogo from '@/assets/Mindmeasure_logo.png';
import { OverviewTab } from './profile/OverviewTab';
import { DetailsTab } from './profile/DetailsTab';
import { WellnessTab } from './profile/WellnessTab';
import { ExportModal } from './profile/ExportModal';
import type { TabType, UserData } from './profile/types';

interface MobileProfileProps {
  onNavigateBack?: () => void;
  onNavigateToBaseline?: () => void;
  onNavigateToSettings?: () => void;
  /** When set (e.g. from post-baseline reminder), open on this tab (e.g. 'details') */
  initialTab?: TabType;
  autoTriggerExport?: boolean;
  onExportTriggered?: () => void;
  /** Called when unsaved changes state changes */
  onUnsavedChangesChange?: (hasChanges: boolean) => void;
  /** Ref to register save function for parent to call */
  saveRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}

export function MobileProfile({
  onNavigateBack: _onNavigateBack,
  onNavigateToBaseline,
  onNavigateToSettings,
  initialTab,
  autoTriggerExport = false,
  onExportTriggered,
  onUnsavedChangesChange,
  saveRef,
}: MobileProfileProps) {
  const { user } = useAuth();

  // Suppress unused-var lint (kept for API compatibility)
  void _onNavigateBack;

  const [activeTab, setActiveTab] = useState<TabType>(initialTab ?? 'wellness');
  const [isEditing, setIsEditing] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // ----- Hooks -----
  const {
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
    handleSaveProfile: saveProfile,
  } = useProfileData();

  const {
    showExportModal,
    setShowExportModal,
    exportPeriod,
    setExportPeriod,
    isExporting,
    showBaselineRequired,
    setShowBaselineRequired,
    showExportProfileReminder,
    setShowExportProfileReminder,
    handleExportData,
    handleConfirmExport,
  } = useDataExport(profileCompleted);

  // ----- Save wrapper (also clears editing state) -----
  const handleSaveProfile = async () => {
    await saveProfile();
    setIsEditing(false);
  };

  // ----- Effects -----

  // Sync activeTab when initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      if (initialTab === 'details') {
        setIsEditing(true);
      }
    }
  }, [initialTab]);

  // Detect unsaved changes by comparing current userData with original
  useEffect(() => {
    if (!originalUserData || !isEditing) {
      setHasUnsavedChanges(false);
      return;
    }
    const editableFields: (keyof UserData)[] = [
      'firstName',
      'lastName',
      'phone',
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
    ];
    const hasChanges = editableFields.some((field) => userData[field] !== originalUserData[field]);
    setHasUnsavedChanges(hasChanges);
  }, [userData, originalUserData, isEditing, setHasUnsavedChanges]);

  // Report unsaved changes to parent
  useEffect(() => {
    onUnsavedChangesChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onUnsavedChangesChange]);

  // Auto-trigger export after completing baseline
  useEffect(() => {
    if (autoTriggerExport && user && !isLoading) {
      setActiveTab('wellness');
      setTimeout(() => {
        handleExportData();
        onExportTriggered?.();
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTriggerExport, user, isLoading]);

  // Register save function with parent via ref
  useEffect(() => {
    if (saveRef) {
      saveRef.current = handleSaveProfile;
    }
    return () => {
      if (saveRef) {
        saveRef.current = null;
      }
    };
  }, [saveRef, handleSaveProfile]);

  // ----- Navigation with unsaved changes guard -----
  const handleTabChangeWithWarning = (newTab: TabType) => {
    if (activeTab === 'details' && isEditing && hasUnsavedChanges) {
      setPendingNavigation(() => () => {
        setActiveTab(newTab);
        setIsEditing(false);
        setHasUnsavedChanges(false);
      });
      setShowUnsavedWarning(true);
    } else {
      setActiveTab(newTab);
      if (activeTab === 'details') setIsEditing(false);
    }
  };

  // ----- Render -----

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#F5F5F5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: '14px', color: '#999999' }}>Loading profile...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F5F5F5',
        paddingBottom: '80px',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          padding: '72px 20px 24px 20px',
          borderBottom: '1px solid #F0F0F0',
        }}
      >
        {/* Settings gear */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button
            onClick={() => onNavigateToSettings?.()}
            style={{
              background: '#F5F5F5',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 200ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#E5E7EB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F5F5F5';
            }}
            aria-label="Settings"
          >
            <Settings size={18} color="#666666" />
          </button>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          {/* University Logo */}
          {userData.institutionLogo ? (
            <img
              src={userData.institutionLogo}
              alt={userData.institution}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '12px',
                objectFit: 'contain',
                flexShrink: 0,
                border: '1px solid #E0E0E0',
                padding: '4px',
                backgroundColor: 'white',
              }}
            />
          ) : (
            <img
              src={mindMeasureLogo}
              alt="Logo"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '12px',
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '2px',
                lineHeight: '1.2',
              }}
            >
              {userData.firstName} {userData.lastName}
            </div>
            <div style={{ fontSize: '13px', color: '#999999', marginBottom: '2px' }}>
              {userData.institution || 'No institution'}
            </div>
            <div style={{ fontSize: '13px', color: '#666666' }}>{userData.email}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['overview', 'details', 'wellness'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChangeWithWarning(tab)}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: activeTab === tab ? 'linear-gradient(135deg, #5B8FED, #6BA3FF)' : '#F5F5F5',
                color: activeTab === tab ? 'white' : '#666666',
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ padding: '20px' }}>
        {activeTab === 'overview' && <OverviewTab userData={userData} moodData={moodData} themesData={themesData} />}

        {activeTab === 'details' && (
          <DetailsTab
            userData={userData}
            setUserData={setUserData}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            isSaving={isSaving}
            schoolOptions={schoolOptions}
            hallOptions={hallOptions}
            onSaveProfile={handleSaveProfile}
          />
        )}

        {activeTab === 'wellness' && <WellnessTab userData={userData} onExportData={handleExportData} />}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          userEmail={user?.email ?? ''}
          exportPeriod={exportPeriod}
          setExportPeriod={setExportPeriod}
          isExporting={isExporting}
          onCancel={() => setShowExportModal(false)}
          onConfirm={() => handleConfirmExport(userData.firstName)}
        />
      )}

      {/* Unsaved changes warning */}
      {showUnsavedWarning && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowUnsavedWarning(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 16px 0' }}>
              Unsaved changes
            </h3>
            <p style={{ fontSize: '14px', color: '#666666', margin: '0 0 24px 0', lineHeight: '1.6' }}>
              You have unsaved changes. Do you want to save before leaving?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                type="button"
                onClick={async () => {
                  setShowUnsavedWarning(false);
                  await handleSaveProfile();
                  if (pendingNavigation) {
                    pendingNavigation();
                    setPendingNavigation(null);
                  }
                }}
                disabled={isSaving}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isSaving ? 'default' : 'pointer',
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                {isSaving ? 'Saving...' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedWarning(false);
                  if (originalUserData) setUserData(originalUserData);
                  setHasUnsavedChanges(false);
                  if (pendingNavigation) {
                    pendingNavigation();
                    setPendingNavigation(null);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #E0E0E0',
                  borderRadius: '8px',
                  background: 'white',
                  color: '#666666',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Discard changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedWarning(false);
                  setPendingNavigation(null);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: '#999999',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export: Profile incomplete reminder */}
      {showExportProfileReminder && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowExportProfileReminder(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 16px 0' }}>
              Complete your profile
            </h3>
            <p style={{ fontSize: '14px', color: '#666666', margin: '0 0 24px 0', lineHeight: '1.6' }}>
              Complete your profile so your export includes your details. You can fill in your details in the Details
              tab.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowExportProfileReminder(false);
                  setActiveTab('details');
                  setIsEditing(true);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Go to details
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExportProfileReminder(false);
                  setShowExportModal(true);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #E0E0E0',
                  borderRadius: '8px',
                  background: 'white',
                  color: '#666666',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Export anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Baseline Required Modal */}
      {showBaselineRequired && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 16px 0' }}>
              Baseline Assessment Required
            </h3>
            <p style={{ fontSize: '14px', color: '#666666', margin: '0 0 16px 0', lineHeight: '1.6' }}>
              To generate your wellbeing report, we need your current PHQ-2 and GAD-2 scores.
            </p>
            <p style={{ fontSize: '14px', color: '#666666', margin: '0 0 24px 0', lineHeight: '1.6' }}>
              Please complete a fresh baseline assessment today to ensure your report reflects your current wellbeing
              status.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowBaselineRequired(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #E0E0E0',
                  borderRadius: '8px',
                  background: 'white',
                  color: '#666666',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowBaselineRequired(false);
                  onNavigateToBaseline?.();
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #5B8FED, #6BA3FF)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Start Baseline Assessment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
