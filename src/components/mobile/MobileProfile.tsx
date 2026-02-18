import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileData } from '@/hooks/useProfileData';
import { useDataExport } from '@/hooks/useDataExport';
import { OverviewTab } from './profile/OverviewTab';
import { DetailsTab } from './profile/DetailsTab';
import { WellnessTab } from './profile/WellnessTab';
import { ExportModal } from './profile/ExportModal';
import type { TabType, UserData } from './profile/types';
import { PrivacyTerms } from './PrivacyTerms';

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
  const { user, signOut } = useAuth();

  // Suppress unused-var lint (kept for API compatibility)
  void _onNavigateBack;

  const [activeTab, setActiveTab] = useState<TabType>(initialTab ?? 'wellness');
  const [isEditing, setIsEditing] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);

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
          backgroundColor: '#2D4C4C',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Loading profile...</div>
      </div>
    );
  }

  const initials = `${(userData.firstName || '')[0] || ''}${(userData.lastName || '')[0] || ''}`.toUpperCase() || '?';

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F5F5F0',
        paddingBottom: '100px',
      }}
    >
      {/* ═══ SPECTRA HERO ═══ */}
      <div
        style={{
          backgroundColor: '#2D4C4C',
          padding: '56px 24px 32px',
          minHeight: '240px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        {/* Privacy - top right */}
        <div style={{ position: 'absolute', top: '56px', right: '24px' }}>
          <button
            onClick={() => setShowPrivacy(true)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            aria-label="Privacy"
          >
            <Shield size={18} color="rgba(255,255,255,0.6)" />
          </button>
        </div>

        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#99CCCE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: 700,
              color: '#1a2e2e',
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '26px',
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: '2px',
                lineHeight: 1.2,
                letterSpacing: '-0.025em',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              {userData.firstName} {userData.lastName}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>{userData.email}</div>
          </div>
        </div>

        <p style={{ fontSize: '14px', fontWeight: 400, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          {userData.institution || 'No institution'}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ padding: '16px 24px 0', backgroundColor: '#F5F5F0' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['overview', 'details', 'wellness'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChangeWithWarning(tab)}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '12px',
                border: activeTab === tab ? 'none' : '1.5px solid rgba(45,76,76,0.15)',
                fontSize: '14px',
                fontWeight: activeTab === tab ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: activeTab === tab ? '#2D4C4C' : '#ffffff',
                color: activeTab === tab ? '#ffffff' : '#2D4C4C',
                fontFamily: 'Inter, system-ui, sans-serif',
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

      {/* Wellbeing Report */}
      <div style={{ padding: '0 20px' }}>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            overflow: 'hidden',
            marginBottom: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ height: '4px', background: 'linear-gradient(90deg, #99CCCE, #DDD6FE, #F59E0B)' }} />
          <div style={{ padding: '20px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '14px',
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: '17px',
                    fontWeight: 700,
                    color: '#2D4C4C',
                    margin: '0 0 4px',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  Your Wellbeing Report
                </h3>
                <p style={{ fontSize: '13px', color: 'rgba(45,76,76,0.5)', margin: 0 }}>AI-powered personal insights</p>
              </div>
              <div
                style={{
                  backgroundColor: 'rgba(153,204,206,0.15)',
                  borderRadius: '10px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2D4C4C"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
              {['14 days', '30 days', '90 days'].map((period, i) => (
                <button
                  key={period}
                  onClick={() => setExportPeriod(period === '14 days' ? 14 : period === '30 days' ? 30 : 90)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '10px',
                    border:
                      exportPeriod === (period === '14 days' ? 14 : period === '30 days' ? 30 : 90)
                        ? 'none'
                        : '1.5px solid rgba(45,76,76,0.1)',
                    backgroundColor:
                      exportPeriod === (period === '14 days' ? 14 : period === '30 days' ? 30 : 90)
                        ? '#2D4C4C'
                        : 'transparent',
                    color:
                      exportPeriod === (period === '14 days' ? 14 : period === '30 days' ? 30 : 90)
                        ? '#ffffff'
                        : 'rgba(45,76,76,0.5)',
                    fontSize: '13px',
                    fontWeight:
                      exportPeriod === (period === '14 days' ? 14 : period === '30 days' ? 30 : 90) ? 600 : 400,
                    cursor: 'pointer',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  {period}
                </button>
              ))}
            </div>

            <button
              onClick={handleExportData}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#2D4C4C',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Generate & Email Report
            </button>
            <p style={{ fontSize: '11px', color: 'rgba(45,76,76,0.35)', textAlign: 'center', margin: '10px 0 0' }}>
              Report sent to your email with a secure 7-day link
            </p>
          </div>
        </motion.div>

        {/* Data Ownership */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{
            backgroundColor: 'rgba(153,204,206,0.1)',
            borderRadius: '16px',
            padding: '18px 20px',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2D4C4C"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0, marginTop: '1px' }}
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#2D4C4C', margin: '0 0 4px' }}>
                This is your data
              </p>
              <p style={{ fontSize: '13px', color: 'rgba(45,76,76,0.5)', margin: 0, lineHeight: 1.5 }}>
                Every conversation, score and insight belongs to you. Share it with a counsellor, keep it for yourself,
                or export it any time.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Legal & Settings */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            overflow: 'hidden',
            marginBottom: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          {[
            {
              label: 'Privacy Policy',
              sub: 'mindmeasure.co.uk',
              onClick: () => window.open('https://mindmeasure.co.uk/privacy', '_blank'),
              isLink: true,
            },
            {
              label: 'Terms of Service',
              sub: 'mindmeasure.co.uk',
              onClick: () => window.open('https://mindmeasure.co.uk/terms', '_blank'),
              isLink: true,
            },
          ].map((item, i) => (
            <div
              key={item.label}
              onClick={item.onClick}
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                borderTop: i > 0 ? '1px solid rgba(45,76,76,0.06)' : 'none',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 500,
                    color: '#2D4C4C',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    display: 'block',
                  }}
                >
                  {item.label}
                </span>
                <span style={{ fontSize: '12px', color: 'rgba(45,76,76,0.35)' }}>{item.sub}</span>
              </div>
              {item.isLink ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(45,76,76,0.2)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              ) : (
                <ChevronRight size={16} color="rgba(45,76,76,0.2)" />
              )}
            </div>
          ))}
        </motion.div>

        {/* Sign Out */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          onClick={() => {
            if (window.confirm('Are you sure you want to sign out?')) {
              signOut();
            }
          }}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: 'transparent',
            color: '#FF6B6B',
            border: '1.5px solid rgba(255,107,107,0.2)',
            borderRadius: '14px',
            fontSize: '15px',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif',
            marginBottom: '12px',
          }}
        >
          Sign Out
        </motion.button>
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
                  background: '#2D4C4C',
                  color: '#ffffff',
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
                  background: '#2D4C4C',
                  color: '#ffffff',
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

      {/* Privacy popup */}
      <PrivacyTerms isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />

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
                  background: '#2D4C4C',
                  color: '#ffffff',
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
