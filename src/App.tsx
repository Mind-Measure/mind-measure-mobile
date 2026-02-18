import {} from 'react';
import { MobileAppStructure } from './components/mobile/MobileAppStructure';
import { AuthProvider } from './contexts/AuthContext';
import { DashboardPreview } from './components/mobile/DashboardPreview';

// Use the existing mobile app structure with AWS Amplify auth integrated behind the scenes
function App() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('preview') === 'dashboard') {
    return <DashboardPreview />;
  }

  return (
    <AuthProvider>
      <MobileAppStructure />
    </AuthProvider>
  );
}

export default App;
