import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BackendServiceFactory } from '@/services/database/BackendServiceFactory';
import { cognitoApiClient } from '@/services/cognito-api-client';

export interface UseDataExportReturn {
  showExportModal: boolean;
  setShowExportModal: React.Dispatch<React.SetStateAction<boolean>>;
  exportPeriod: 14 | 30 | 90;
  setExportPeriod: React.Dispatch<React.SetStateAction<14 | 30 | 90>>;
  isExporting: boolean;
  showBaselineRequired: boolean;
  setShowBaselineRequired: React.Dispatch<React.SetStateAction<boolean>>;
  showExportProfileReminder: boolean;
  setShowExportProfileReminder: React.Dispatch<React.SetStateAction<boolean>>;
  handleExportData: () => Promise<void>;
  handleConfirmExport: (userFirstName: string) => Promise<void>;
}

export function useDataExport(profileCompleted: boolean): UseDataExportReturn {
  const { user } = useAuth();
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPeriod, setExportPeriod] = useState<14 | 30 | 90>(30);
  const [isExporting, setIsExporting] = useState(false);
  const [showBaselineRequired, setShowBaselineRequired] = useState(false);
  const [showExportProfileReminder, setShowExportProfileReminder] = useState(false);

  const checkBaselineToday = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const backendService = BackendServiceFactory.createService(BackendServiceFactory.getEnvironmentConfig());

      const today = new Date().toISOString().split('T')[0];

      const response = await backendService.database.select('fusion_outputs', {
        filters: { user_id: user.id },
        orderBy: [{ column: 'created_at', ascending: false }],
        limit: 10,
      });

      if (response.data && response.data.length > 0) {
        const baselineToday = response.data.find(
          (session: { created_at?: string; analysis?: { assessment_type?: string } }) => {
            const sessionDate = new Date(session.created_at).toISOString().split('T')[0];
            const isBaseline = session.analysis?.assessment_type === 'baseline';
            return isBaseline && sessionDate === today;
          }
        );
        return !!baselineToday;
      }

      return false;
    } catch (error: unknown) {
      console.error('Error checking baseline:', error);
      return false;
    }
  }, [user]);

  const handleExportData = useCallback(async () => {
    const hasBaseline = await checkBaselineToday();

    if (!hasBaseline) {
      setShowBaselineRequired(true);
    } else if (!profileCompleted) {
      setShowExportProfileReminder(true);
    } else {
      setShowExportModal(true);
    }
  }, [checkBaselineToday, profileCompleted]);

  const handleConfirmExport = useCallback(
    async (userFirstName: string) => {
      if (!user) return;

      try {
        setIsExporting(true);

        const idToken = await cognitoApiClient.getIdToken();
        if (!idToken) {
          console.error('[MobileProfile] No authentication token available');
          alert('Authentication required. Please sign in again.');
          return;
        }

        const response = await fetch('https://admin.mindmeasure.co.uk/api/reports/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            userId: user.id,
            userEmail: user.email,
            userName: userFirstName || 'there',
            periodDays: exportPeriod,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('[Export] API returned error:', errorData);
          console.error('[Export] Status code:', response.status);

          if (errorData.error === 'Baseline required') {
            setShowExportModal(false);
            setShowBaselineRequired(true);
            return;
          }
          throw new Error(errorData.message || errorData.error || 'Failed to generate report');
        }

        await response.json();

        setShowExportModal(false);
        alert(
          `Report generated successfully!\n\nWe've sent an email to ${user.email} with a link to view your report.\n\nCheck your inbox (and spam folder).`
        );
      } catch (error: unknown) {
        console.error('[Export] Full error object:', error);
        console.error('[Export] Error message:', error instanceof Error ? error.message : String(error));
        alert(
          `Failed to generate report. Please try again.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      } finally {
        setIsExporting(false);
      }
    },
    [user, exportPeriod]
  );

  return {
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
  };
}
