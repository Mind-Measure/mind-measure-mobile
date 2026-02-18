import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, ExternalLink, ChevronDown, ChevronLeft, MessageSquare } from 'lucide-react';
import { BackendServiceFactory } from '@/services/database/BackendServiceFactory';
import { useAuth } from '@/contexts/AuthContext';

const pampas = '#FAF9F7';
const spectra = '#2D4C4C';
const sinbad = '#99CCCE';

interface CmsContact {
  name?: string;
  description?: string;
  phones?: string[];
  phone?: string;
  website?: string;
  hours?: string;
  availability?: string;
  isPrimary?: boolean;
  is24Hour?: boolean;
  isEnabled?: boolean;
  organisation?: string;
  location?: string;
}

interface HelpScreenProps {
  onBack?: () => void;
  onNavigateBack?: () => void;
}

export function HelpScreen({ onBack, onNavigateBack }: HelpScreenProps) {
  const handleBack = onBack || onNavigateBack;
  const { user } = useAuth();
  const [openUni, setOpenUni] = useState(false);
  const [openNational, setOpenNational] = useState(false);
  const [loading, setLoading] = useState(true);

  const [universityName, setUniversityName] = useState('');
  const [uniSecurity, setUniSecurity] = useState<CmsContact | null>(null);
  const [uniWellbeing, setUniWellbeing] = useState<CmsContact[]>([]);
  const [nationalServices, setNationalServices] = useState<CmsContact[]>([]);

  useEffect(() => {
    loadCmsResources();
  }, [user]);

  const loadCmsResources = async () => {
    try {
      setLoading(true);
      const backendService = BackendServiceFactory.createService(BackendServiceFactory.getEnvironmentConfig());

      let universityId = null;
      if (user?.id) {
        const { data: profileData } = await backendService.database.select('profiles', {
          filters: { user_id: user.id },
          limit: 1,
        });
        if (profileData && profileData.length > 0) {
          universityId = profileData[0].university_id as string | null;
        }
      }

      if (universityId) {
        const { data: universityData } = await backendService.database.select('universities', {
          filters: { id: universityId },
          limit: 1,
        });

        if (universityData && universityData.length > 0) {
          const university = universityData[0];
          setUniversityName((university.name as string) || '');

          if (university.emergency_contacts && Array.isArray(university.emergency_contacts)) {
            const security = (university.emergency_contacts as CmsContact[]).find(
              (c) => c.name?.toLowerCase().includes('security')
            );
            if (security) setUniSecurity(security);
          }

          if (university.mental_health_services && Array.isArray(university.mental_health_services)) {
            setUniWellbeing(university.mental_health_services as CmsContact[]);
          }

          if (university.national_resources && Array.isArray(university.national_resources)) {
            const enabled = (university.national_resources as CmsContact[]).filter(
              (r) => r.isEnabled !== false
            );
            setNationalServices(enabled);
          }
        }
      }

      if (nationalServices.length === 0) {
        setNationalServices([
          { name: 'Shout', description: '24/7 text support. Text SHOUT to 85258.', website: 'https://giveusashout.org/' },
          { name: 'Mind', description: 'Information and support for mental health.', website: 'https://www.mind.org.uk/' },
          { name: 'Student Space (Student Minds)', description: 'Support for students via webchat, text and resources.', website: 'https://studentspace.org.uk/' },
          { name: 'Papyrus HOPELINE247', description: 'Support for people under 35 experiencing suicidal thoughts.', website: 'https://www.papyrus-uk.org/', phone: '08006844141' },
        ]);
      }
    } catch (error) {
      console.error('Error loading help resources:', error);
      setNationalServices([
        { name: 'Shout', description: '24/7 text support. Text SHOUT to 85258.', website: 'https://giveusashout.org/' },
        { name: 'Mind', description: 'Information and support for mental health.', website: 'https://www.mind.org.uk/' },
        { name: 'Student Space (Student Minds)', description: 'Support for students via webchat, text and resources.', website: 'https://studentspace.org.uk/' },
        { name: 'Papyrus HOPELINE247', description: 'Support for people under 35 experiencing suicidal thoughts.', website: 'https://www.papyrus-uk.org/', phone: '08006844141' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (number: string) => {
    window.location.href = `tel:${number.replace(/\s/g, '')}`;
  };

  const handleVisit = (url: string) => {
    window.open(url?.startsWith('http') ? url : `https://${url}`, '_blank');
  };

  const getPhone = (c: CmsContact) => c.phones?.[0] || c.phone || '';

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: pampas,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ color: spectra, opacity: 0.4 }}>Loading support resources...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: pampas,
        padding: '0 20px 100px',
        fontFamily: 'Lato, system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ paddingTop: '72px', marginBottom: '14px' }}>
        {handleBack && (
          <button
            onClick={handleBack}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px',
              color: spectra, opacity: 0.4, padding: '0 0 16px',
              fontSize: '14px', fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            <ChevronLeft size={18} />
            Back
          </button>
        )}
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 400,
            color: spectra,
            margin: 0,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          Get support
        </h1>
      </div>

      {/* ─── HARDCODED EMERGENCY PILLS ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
        {/* 999 */}
        <EmergencyPill
          name="999"
          desc="Immediate danger"
          bg="#DC2626"
          actions={<PillButton label="Call" icon={<Phone size={14} />} bg="white" color="#DC2626" onClick={() => handleCall('999')} />}
        />

        {/* Samaritans */}
        <EmergencyPill
          name="Samaritans"
          desc="24/7 emotional support"
          bg="#EF4444"
          actions={
            <div style={{ display: 'flex', gap: '6px' }}>
              <PillButton label="Call" icon={<Phone size={13} />} bg="rgba(255,255,255,0.2)" color="white" border="1px solid rgba(255,255,255,0.3)" onClick={() => handleCall('116123')} />
              <PillButton label="Text" icon={<MessageSquare size={13} />} bg="white" color="#EF4444" onClick={() => handleVisit('https://www.samaritans.org/how-we-can-help/contact-samaritans/')} bold />
            </div>
          }
        />

        {/* NHS 111 */}
        <EmergencyPill
          name="NHS 111"
          desc="Crisis support — 24/7"
          bg="#F87171"
          actions={
            <div style={{ display: 'flex', gap: '6px' }}>
              <PillButton label="Call" icon={<Phone size={13} />} bg="rgba(255,255,255,0.2)" color="white" border="1px solid rgba(255,255,255,0.3)" onClick={() => handleCall('111')} />
              <PillButton label="Online" icon={<ExternalLink size={13} />} bg="white" color="#F87171" onClick={() => handleVisit('https://111.nhs.uk/service/mental-health/')} bold />
            </div>
          }
        />

        {/* University Security — from CMS */}
        {uniSecurity && (
          <EmergencyPill
            name={uniSecurity.name || 'University Security'}
            desc={uniSecurity.description || '24/7 on-campus support'}
            bg="#FBBF24"
            textColor={spectra}
            actions={
              getPhone(uniSecurity) ? (
                <PillButton label="Call" icon={<Phone size={13} />} bg="white" color={spectra} onClick={() => handleCall(getPhone(uniSecurity))} bold />
              ) : null
            }
          />
        )}
      </div>

      {/* ═══ UNIVERSITY WELLBEING — accordion (CMS) ═══ */}
      {uniWellbeing.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <AccordionHeader
            title="University Wellbeing"
            subtitle={universityName}
            open={openUni}
            onToggle={() => setOpenUni(!openUni)}
          />
          <AnimatePresence initial={false}>
            {openUni && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  overflow: 'hidden',
                  backgroundColor: 'white',
                  borderRadius: '0 0 14px 14px',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {uniWellbeing.map((r, i) => {
                    const phone = getPhone(r);
                    const website = r.website || '';
                    return (
                      <div
                        key={i}
                        style={{
                          borderTop: i > 0 ? '1px solid rgba(45,76,76,0.06)' : undefined,
                          paddingTop: i > 0 ? '14px' : 0,
                        }}
                      >
                        <p style={{ fontSize: '14px', fontWeight: 500, color: spectra, margin: '0 0 3px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                          {r.name || r.organisation || ''}
                        </p>
                        <p style={{ fontSize: '13px', color: spectra, margin: '0 0 3px', opacity: 0.45, lineHeight: 1.4 }}>
                          {r.description || ''}
                        </p>
                        {(r.hours || r.availability) && (
                          <p style={{ fontSize: '12px', color: spectra, margin: '0 0 10px', opacity: 0.3 }}>{r.hours || r.availability}</p>
                        )}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {phone && (
                            <ServiceButton label={phone} icon={<Phone size={13} />} bg={sinbad} color={spectra} onClick={() => handleCall(phone)} />
                          )}
                          {website && (
                            <ServiceButton label="Visit Website" icon={<ExternalLink size={13} />} bg="white" color={spectra} border="1px solid rgba(45,76,76,0.1)" onClick={() => handleVisit(website)} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ═══ NATIONAL SUPPORT — accordion (CMS or defaults) ═══ */}
      <div style={{ marginBottom: '28px' }}>
        <AccordionHeader
          title="National Support"
          subtitle="UK-wide mental health services"
          open={openNational}
          onToggle={() => setOpenNational(!openNational)}
        />
        <AnimatePresence initial={false}>
          {openNational && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                overflow: 'hidden',
                backgroundColor: 'white',
                borderRadius: '0 0 14px 14px',
                boxShadow: '0 1px 6px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {nationalServices.map((s, i) => {
                  const phone = getPhone(s);
                  const website = s.website || '';
                  return (
                    <div
                      key={i}
                      style={{
                        borderTop: i > 0 ? '1px solid rgba(45,76,76,0.06)' : undefined,
                        paddingTop: i > 0 ? '14px' : 0,
                      }}
                    >
                      <p style={{ fontSize: '14px', fontWeight: 500, color: spectra, margin: '0 0 3px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                        {s.name || ''}
                      </p>
                      <p style={{ fontSize: '13px', color: spectra, margin: '0 0 10px', opacity: 0.45, lineHeight: 1.4 }}>
                        {s.description || ''}
                      </p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {phone && (
                          <ServiceButton label={phone} icon={<Phone size={13} />} bg={sinbad} color={spectra} onClick={() => handleCall(phone)} />
                        )}
                        {website && (
                          <ServiceButton label="Visit" icon={<ExternalLink size={13} />} bg="white" color={spectra} border="1px solid rgba(45,76,76,0.1)" onClick={() => handleVisit(website)} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <p style={{ fontSize: '13px', fontWeight: 300, color: spectra, opacity: 0.25, lineHeight: 1.5 }}>
        If you are outside the UK, please use local emergency numbers and services in your country.
      </p>
    </div>
  );
}

function EmergencyPill({ name, desc, bg, textColor, actions }: {
  name: string; desc: string; bg: string; textColor?: string;
  actions: React.ReactNode;
}) {
  const c = textColor || 'white';
  return (
    <div
      style={{
        width: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '12px 16px',
        borderRadius: '14px', backgroundColor: bg, color: c,
      }}
    >
      <div>
        <p style={{ fontSize: '15px', fontWeight: 600, margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>{name}</p>
        <p style={{ fontSize: '11px', margin: 0, opacity: textColor ? 0.65 : 0.85 }}>{desc}</p>
      </div>
      {actions}
    </div>
  );
}

function PillButton({ label, icon, bg, color, border, bold, onClick }: {
  label: string; icon: React.ReactNode; bg: string; color: string;
  border?: string; bold?: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '8px 12px', borderRadius: '8px',
        backgroundColor: bg, color, border: border || 'none',
        cursor: 'pointer', fontSize: '13px',
        fontWeight: bold ? 700 : 600,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function ServiceButton({ label, icon, bg, color, border, onClick }: {
  label: string; icon: React.ReactNode; bg: string; color: string;
  border?: string; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '8px 14px', borderRadius: '8px',
        backgroundColor: bg, color, border: border || 'none',
        cursor: 'pointer', fontSize: '13px', fontWeight: 500,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function AccordionHeader({ title, subtitle, open, onToggle }: {
  title: string; subtitle: string; open: boolean; onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        width: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '16px 20px',
        borderRadius: open ? '14px 14px 0 0' : '14px',
        backgroundColor: 'white', border: 'none', cursor: 'pointer',
        boxShadow: '0 1px 6px rgba(0,0,0,0.03)', textAlign: 'left',
      }}
    >
      <div>
        <p style={{ fontSize: '15px', fontWeight: 500, color: '#2D4C4C', margin: '0 0 2px', fontFamily: 'Inter, system-ui, sans-serif' }}>
          {title}
        </p>
        <p style={{ fontSize: '13px', color: '#2D4C4C', margin: 0, opacity: 0.4 }}>{subtitle}</p>
      </div>
      <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
        <ChevronDown size={18} color="#2D4C4C" opacity={0.3} />
      </motion.div>
    </button>
  );
}
