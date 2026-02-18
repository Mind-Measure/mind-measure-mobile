import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

const pampas = '#FAF9F7';
const spectra = '#2D4C4C';
const sinbad = '#99CCCE';
const buttercup = '#F59E0B';

interface ReportEmailPopupProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  hasCompletedBaseline: boolean;
}

export const ReportEmailPopup: React.FC<ReportEmailPopupProps> = ({
  isOpen,
  onClose,
  userEmail = '',
  hasCompletedBaseline,
}) => {
  const [email, setEmail] = useState(userEmail);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    setError('');
    setSending(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1800));
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setSent(false);
    setError('');
    setSending(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: 'rgba(45, 76, 76, 0.4)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '360px',
              backgroundColor: pampas,
              borderRadius: '20px',
              padding: '28px 24px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
              position: 'relative',
              fontFamily: 'Lato, system-ui, sans-serif',
            }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={handleClose}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: spectra,
                opacity: 0.3,
                padding: '4px',
              }}
            >
              <X size={20} />
            </button>

            {!hasCompletedBaseline ? (
              /* ─── BASELINE REQUIRED ─── */
              <div>
                <h2
                  style={{
                    fontSize: '24px',
                    fontWeight: 300,
                    color: spectra,
                    margin: '0 0 12px',
                    letterSpacing: '-0.015em',
                    lineHeight: 1.2,
                    paddingRight: '28px',
                  }}
                >
                  Baseline required
                </h2>
                <p
                  style={{
                    fontSize: '15px',
                    fontWeight: 300,
                    color: spectra,
                    margin: '0 0 24px',
                    lineHeight: 1.6,
                    opacity: 0.55,
                  }}
                >
                  You need to complete your baseline assessment before we can generate a wellness report. This gives us
                  the data we need to create meaningful insights for you.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    width: '100%',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'white',
                    color: spectra,
                    border: `1px solid rgba(45, 76, 76, 0.1)`,
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  Got it
                </button>
              </div>
            ) : sent ? (
              /* ─── SUCCESS STATE ─── */
              <div>
                <h2
                  style={{
                    fontSize: '24px',
                    fontWeight: 300,
                    color: spectra,
                    margin: '0 0 12px',
                    letterSpacing: '-0.015em',
                    lineHeight: 1.2,
                  }}
                >
                  Report sent
                </h2>
                <p
                  style={{
                    fontSize: '15px',
                    fontWeight: 300,
                    color: spectra,
                    margin: '0 0 6px',
                    lineHeight: 1.6,
                    opacity: 0.55,
                  }}
                >
                  Your wellness report has been sent to
                </p>
                <p
                  style={{
                    fontSize: '15px',
                    fontWeight: 400,
                    color: spectra,
                    margin: '0 0 24px',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  {email}
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    width: '100%',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: sinbad,
                    color: spectra,
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              /* ─── REQUEST FORM ─── */
              <div>
                <h2
                  style={{
                    fontSize: '24px',
                    fontWeight: 300,
                    color: spectra,
                    margin: '0 0 12px',
                    letterSpacing: '-0.015em',
                    lineHeight: 1.2,
                    paddingRight: '28px',
                  }}
                >
                  Email your report
                </h2>
                <p
                  style={{
                    fontSize: '15px',
                    fontWeight: 300,
                    color: spectra,
                    margin: '0 0 24px',
                    lineHeight: 1.6,
                    opacity: 0.55,
                  }}
                >
                  We'll send your latest wellness report to the email address below.
                </p>

                {/* Email field */}
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: spectra,
                    opacity: 0.4,
                    marginBottom: '8px',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase' as const,
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="you@university.ac.uk"
                  style={{
                    width: '100%',
                    height: '48px',
                    padding: '0 16px',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    border: '1px solid rgba(45, 76, 76, 0.1)',
                    color: spectra,
                    fontSize: '15px',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    outline: 'none',
                    boxSizing: 'border-box',
                    marginBottom: error ? '8px' : '20px',
                  }}
                />

                {/* Error */}
                {error && (
                  <p
                    style={{
                      fontSize: '13px',
                      color: buttercup,
                      margin: '0 0 16px',
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  >
                    {error}
                  </p>
                )}

                {/* Send button */}
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending}
                  style={{
                    width: '100%',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: sinbad,
                    color: spectra,
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: sending ? 'default' : 'pointer',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    opacity: sending ? 0.6 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {sending ? 'Sending...' : 'Send report'}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
