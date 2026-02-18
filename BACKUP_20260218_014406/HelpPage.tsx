import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, ExternalLink, ChevronDown, MessageSquare } from 'lucide-react';

const pampas = '#FAF9F7';
const spectra = '#2D4C4C';
const sinbad = '#99CCCE';

export function HelpScreen() {
  const [openUni, setOpenUni] = useState(false);
  const [openNational, setOpenNational] = useState(false);

  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  const handleVisit = (url: string) => {
    window.open(url, '_blank');
  };

  const userUniversity = 'University of Worcester';

  const uniWellbeing = [
    {
      name: 'University of Worcester Counselling Service',
      description: 'Free confidential counselling for all University of Worcester students',
      phone: '01905 855000',
      website: 'https://www.worcester.ac.uk/student-life/student-support/counselling/',
      hours: 'Mon-Fri 9am-5pm',
    },
    {
      name: 'Worcester Mental Health Services',
      description: 'Free and confidential support for young people in Worcester',
      phone: '01905 855222',
      website: 'https://www.worcester.ac.uk/student-life/student-support/mental-health/',
      hours: 'Mon-Fri 10am-6pm',
    },
  ];

  const nationalServices = [
    { name: 'Shout', desc: '24/7 text support. Text SHOUT to 85258.', website: 'https://giveusashout.org/' },
    { name: 'Mind', desc: 'Information and support for mental health.', website: 'https://www.mind.org.uk/' },
    {
      name: 'Student Space (Student Minds)',
      desc: 'Support for students via webchat, text and resources.',
      website: 'https://studentspace.org.uk/',
    },
    {
      name: 'Papyrus HOPELINE247',
      desc: 'Support for people under 35 experiencing suicidal thoughts.',
      website: 'https://www.papyrus-uk.org/',
      phone: '08006844141',
      phoneLabel: '0800 068 4141',
    },
  ];

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
      <div style={{ paddingTop: '56px', marginBottom: '14px' }}>
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

      {/* ─── EMERGENCY PILLS ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
        {/* 999 — strongest */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: '14px',
            backgroundColor: '#DC2626',
            color: 'white',
          }}
        >
          <div>
            <p style={{ fontSize: '15px', fontWeight: 600, margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>
              999
            </p>
            <p style={{ fontSize: '11px', margin: 0, opacity: 0.85 }}>Immediate danger</p>
          </div>
          <button
            type="button"
            onClick={() => handleCall('999')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: '#DC2626',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            <Phone size={14} />
            Call
          </button>
        </div>

        {/* Samaritans */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: '14px',
            backgroundColor: '#EF4444',
            color: 'white',
          }}
        >
          <div>
            <p style={{ fontSize: '15px', fontWeight: 600, margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>
              Samaritans
            </p>
            <p style={{ fontSize: '11px', margin: 0, opacity: 0.85 }}>24/7 emotional support</p>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => handleCall('116123')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              <Phone size={13} />
              Call
            </button>
            <button
              type="button"
              onClick={() => handleVisit('https://www.samaritans.org/how-we-can-help/contact-samaritans/')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#EF4444',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              <MessageSquare size={13} />
              Text
            </button>
          </div>
        </div>

        {/* NHS 111 */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: '14px',
            backgroundColor: '#F87171',
            color: 'white',
          }}
        >
          <div>
            <p style={{ fontSize: '15px', fontWeight: 600, margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>
              NHS 111
            </p>
            <p style={{ fontSize: '11px', margin: 0, opacity: 0.85 }}>Crisis support — 24/7</p>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => handleCall('111')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              <Phone size={13} />
              Call
            </button>
            <button
              type="button"
              onClick={() => handleVisit('https://111.nhs.uk/service/mental-health/')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#F87171',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              <ExternalLink size={13} />
              Online
            </button>
          </div>
        </div>

        {/* University emergency */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: '14px',
            backgroundColor: '#FBBF24',
            color: spectra,
          }}
        >
          <div>
            <p style={{ fontSize: '15px', fontWeight: 600, margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>
              University Security
            </p>
            <p style={{ fontSize: '11px', margin: 0, opacity: 0.65 }}>24/7 on-campus support</p>
          </div>
          <button
            type="button"
            onClick={() => handleCall('01905855111')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: spectra,
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            <Phone size={13} />
            Call
          </button>
        </div>
      </div>

      {/* ═══ UNIVERSITY WELLBEING — accordion ═══ */}
      <div style={{ marginBottom: '12px' }}>
        <button
          type="button"
          onClick={() => setOpenUni(!openUni)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderRadius: openUni ? '14px 14px 0 0' : '14px',
            backgroundColor: 'white',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 1px 6px rgba(0,0,0,0.03)',
            textAlign: 'left',
          }}
        >
          <div>
            <p
              style={{
                fontSize: '15px',
                fontWeight: 500,
                color: spectra,
                margin: '0 0 2px',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              University Wellbeing
            </p>
            <p style={{ fontSize: '13px', color: spectra, margin: 0, opacity: 0.4 }}>{userUniversity}</p>
          </div>
          <motion.div animate={{ rotate: openUni ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronDown size={18} color={spectra} opacity={0.3} />
          </motion.div>
        </button>

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
                {uniWellbeing.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      borderTop: i > 0 ? '1px solid rgba(45,76,76,0.06)' : undefined,
                      paddingTop: i > 0 ? '14px' : 0,
                    }}
                  >
                    <p
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: spectra,
                        margin: '0 0 3px',
                        fontFamily: 'Inter, system-ui, sans-serif',
                      }}
                    >
                      {r.name}
                    </p>
                    <p style={{ fontSize: '13px', color: spectra, margin: '0 0 3px', opacity: 0.45, lineHeight: 1.4 }}>
                      {r.description}
                    </p>
                    <p style={{ fontSize: '12px', color: spectra, margin: '0 0 10px', opacity: 0.3 }}>{r.hours}</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {r.phone && (
                        <button
                          type="button"
                          onClick={() => handleCall(r.phone)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            backgroundColor: sinbad,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 500,
                            fontFamily: 'Inter, system-ui, sans-serif',
                            color: spectra,
                          }}
                        >
                          <Phone size={13} /> {r.phone}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleVisit(r.website)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          backgroundColor: 'white',
                          border: '1px solid rgba(45,76,76,0.1)',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 500,
                          fontFamily: 'Inter, system-ui, sans-serif',
                          color: spectra,
                        }}
                      >
                        <ExternalLink size={13} /> Visit Website
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ NATIONAL — accordion ═══ */}
      <div style={{ marginBottom: '28px' }}>
        <button
          type="button"
          onClick={() => setOpenNational(!openNational)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderRadius: openNational ? '14px 14px 0 0' : '14px',
            backgroundColor: 'white',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 1px 6px rgba(0,0,0,0.03)',
            textAlign: 'left',
          }}
        >
          <div>
            <p
              style={{
                fontSize: '15px',
                fontWeight: 500,
                color: spectra,
                margin: '0 0 2px',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              National Support
            </p>
            <p style={{ fontSize: '13px', color: spectra, margin: 0, opacity: 0.4 }}>UK-wide mental health services</p>
          </div>
          <motion.div animate={{ rotate: openNational ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronDown size={18} color={spectra} opacity={0.3} />
          </motion.div>
        </button>

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
                {nationalServices.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      borderTop: i > 0 ? '1px solid rgba(45,76,76,0.06)' : undefined,
                      paddingTop: i > 0 ? '14px' : 0,
                    }}
                  >
                    <p
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: spectra,
                        margin: '0 0 3px',
                        fontFamily: 'Inter, system-ui, sans-serif',
                      }}
                    >
                      {s.name}
                    </p>
                    <p style={{ fontSize: '13px', color: spectra, margin: '0 0 10px', opacity: 0.45, lineHeight: 1.4 }}>
                      {s.desc}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {s.phone && (
                        <button
                          type="button"
                          onClick={() => handleCall(s.phone!)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            backgroundColor: sinbad,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 500,
                            fontFamily: 'Inter, system-ui, sans-serif',
                            color: spectra,
                          }}
                        >
                          <Phone size={13} /> {s.phoneLabel || s.phone}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleVisit(s.website)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          backgroundColor: 'white',
                          border: '1px solid rgba(45,76,76,0.1)',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 500,
                          fontFamily: 'Inter, system-ui, sans-serif',
                          color: spectra,
                        }}
                      >
                        <ExternalLink size={13} /> Visit
                      </button>
                    </div>
                  </div>
                ))}
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
