import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus, X } from 'lucide-react';
import { BuddyCard } from './BuddyCard';
import { AddBuddyModal } from './AddBuddyModal';
import { PendingInviteCard } from './PendingInviteCard';
import { buddiesApi, type BuddyDTO, type InviteDTO } from '@/services/buddies-api';
import { useAuth } from '@/contexts/AuthContext';

const BUDDY_COLORS = ['#99CCCE', '#DDD6FE', '#F59E0B', '#FF6B6B', '#99CCCE'];

export function SupportCircle() {
  const { user } = useAuth();
  const [activeBuddies, setActiveBuddies] = useState<BuddyDTO[]>([]);
  const [pendingInvites, setPendingInvites] = useState<InviteDTO[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError(null);
      const { activeBuddies: a, pendingInvites: p } = await buddiesApi.list();
      setActiveBuddies(a);
      setPendingInvites(p);
    } catch (e) {
      console.error('[Buddies] list error:', e);
      setError(e instanceof Error ? e.message : 'Failed to load buddies');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const handleInvite = async (p: { name: string; email: string; personalMessage?: string }) => {
    try {
      await buddiesApi.createInvite({
        inviteeName: p.name.trim(),
        contactType: 'email',
        contactValue: p.email.trim().toLowerCase(),
        personalMessage: (p.personalMessage ?? '').trim() || undefined,
      });
      setIsModalOpen(false);
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to send invite';
      const inviteCreatedEmailFailed = msg.includes('Invite created but email could not be sent');
      setIsModalOpen(false);
      await load();
      alert(inviteCreatedEmailFailed
        ? `${msg}\n\nThe invite was saved. You can use "Resend invite" on the Buddies screen to try again.`
        : msg);
    }
  };

  const handleResend = async (inviteId: string) => {
    try { await buddiesApi.resendInvite(inviteId); await load(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Failed to resend invite'); }
  };

  const handleRevoke = async (inviteId: string) => {
    if (!window.confirm('Cancel this invite? They won\'t be able to accept it.')) return;
    try { await buddiesApi.revokeInvite(inviteId); await load(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Failed to cancel invite'); }
  };

  const handleRemoveBuddy = async (buddyId: string) => {
    if (!window.confirm('Remove this buddy? They won\'t be notified.')) return;
    try { await buddiesApi.removeBuddy(buddyId); await load(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Failed to remove buddy'); }
  };

  const handleNudge = async (buddyId: string) => {
    try {
      await buddiesApi.nudgeBuddy(buddyId);
      await load();
      alert('Nudge sent. They\'ll get a gentle check-in reminder by email.');
    } catch (e) { alert(e instanceof Error ? e.message : 'Failed to send nudge'); }
  };

  const moveCard = useCallback((dragIndex: number, hoverIndex: number) => {
    setActiveBuddies((prev) => {
      const next = [...prev];
      const [removed] = next.splice(dragIndex, 1);
      next.splice(hoverIndex, 0, removed);
      return next.map((b, i) => ({ ...b, preferenceOrder: i + 1 }));
    });
  }, []);

  const total = activeBuddies.length + pendingInvites.length;
  const canInvite = total < 5;
  const isEmpty = activeBuddies.length === 0 && pendingInvites.length === 0;
  const isTestUniversity = user?.university_id === 'rummidge';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#2D4C4C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '4px solid rgba(255,255,255,0.15)', borderTopColor: '#99CCCE', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Loading...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F0', display: 'flex', flexDirection: 'column', paddingBottom: '100px' }}>

        {/* ═══ SPECTRA HERO ═══ */}
        <div style={{
          backgroundColor: '#2D4C4C',
          padding: '56px 24px 32px',
          minHeight: '220px',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 style={{
              fontSize: '32px', fontWeight: 700, color: '#ffffff',
              margin: '0 0 10px', letterSpacing: '-0.025em', lineHeight: 1.15,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>
              Buddies
            </h1>
            <p style={{
              fontSize: '15px', fontWeight: 400, color: 'rgba(255,255,255,0.6)',
              margin: 0, lineHeight: 1.55, maxWidth: '340px',
            }}>
              A Buddy is someone you trust who agrees to be gently reminded to check in with you if things feel harder than usual.
            </p>
          </motion.div>
        </div>

        {/* ═══ BUDDIES LIST ═══ */}
        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Info button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(45,76,76,0.4)' }}>
              {total}/5 Buddies
            </span>
            <button
              onClick={() => setShowInfo(true)}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                backgroundColor: 'rgba(45,76,76,0.06)', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D4C4C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
              </svg>
            </button>
          </div>

          {error && (
            <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 12, padding: 16, color: '#DC2626', fontSize: 14 }}>
              {error}
            </div>
          )}

          {/* Active buddies */}
          {activeBuddies.map((b, idx) => (
            <BuddyCard
              key={b.id}
              buddy={{ id: b.id, name: b.name, phone: '', email: b.email, rank: b.preferenceOrder }}
              index={idx}
              onDelete={handleRemoveBuddy}
              onMove={moveCard}
              onAskCheckIn={handleNudge}
            />
          ))}

          {/* Pending invites */}
          {pendingInvites.map((inv) => (
            <PendingInviteCard
              key={inv.id}
              invite={{
                id: inv.id,
                name: inv.inviteeName,
                email: inv.contactValueMasked,
                sentDate: new Date(inv.sentAt),
              }}
              onResend={() => handleResend(inv.id)}
              onCancel={() => handleRevoke(inv.id)}
            />
          ))}

          {/* Empty slot */}
          {isEmpty && (
            <div style={{ textAlign: 'center', padding: '24px 16px' }}>
              <p style={{ fontSize: '15px', color: 'rgba(45,76,76,0.6)', lineHeight: 1.6, margin: '0 0 20px' }}>
                You haven't added any buddies yet. Invite someone you trust to get started.
              </p>
            </div>
          )}

          {total < 5 && total > 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                border: '2px dashed rgba(45,76,76,0.12)',
                borderRadius: '16px', padding: '20px 16px',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}
            >
              <div style={{ width: '12px' }} />
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                backgroundColor: 'rgba(45,76,76,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', fontWeight: 700, color: 'rgba(45,76,76,0.2)', flexShrink: 0,
              }}>
                {total + 1}
              </div>
              <span style={{ fontSize: '14px', color: 'rgba(45,76,76,0.3)', fontStyle: 'italic' }}>
                Empty spot
              </span>
            </motion.div>
          )}

          {/* Add buddy button */}
          {canInvite && !isTestUniversity && (
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              onClick={() => setIsModalOpen(true)}
              style={{
                width: '100%', padding: '16px', marginTop: '8px',
                backgroundColor: '#2D4C4C', color: '#ffffff',
                border: 'none', borderRadius: '16px',
                fontSize: '15px', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              <Plus size={16} /> {isEmpty ? 'Invite Your First Buddy' : 'Add a buddy'}
            </motion.button>
          )}

          {isTestUniversity && isEmpty && (
            <div style={{
              width: '100%', padding: 16,
              backgroundColor: 'rgba(153,204,206,0.15)',
              border: '1px solid rgba(153,204,206,0.3)',
              borderRadius: 12, textAlign: 'center',
            }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#2D4C4C', margin: '0 0 4px' }}>
                Not available during testing
              </p>
              <p style={{ fontSize: 13, color: 'rgba(45,76,76,0.6)', margin: 0 }}>
                The buddy system is disabled for test accounts. It will be fully operational when your university goes live.
              </p>
            </div>
          )}

          {activeBuddies.length > 1 && (
            <p style={{
              fontSize: '12px', color: 'rgba(45,76,76,0.35)',
              textAlign: 'center', margin: '8px 0 0',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>
              Drag to reorder — Spot 1 is contacted first
            </p>
          )}
        </div>

        {/* ═══ HOW BUDDIES WORK INFO MODAL ═══ */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 100,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onClick={() => setShowInfo(false)}
            >
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                onClick={e => e.stopPropagation()}
                style={{
                  position: 'relative', zIndex: 101,
                  width: 'calc(100% - 48px)', maxWidth: '382px',
                  backgroundColor: '#ffffff', borderRadius: '20px',
                  overflow: 'hidden',
                }}
              >
                <div style={{ height: '32px', backgroundColor: '#99CCCE' }} />

                <button
                  onClick={() => setShowInfo(false)}
                  style={{
                    position: 'absolute', top: '44px', right: '16px',
                    width: '36px', height: '36px', borderRadius: '50%',
                    backgroundColor: 'rgba(45,76,76,0.06)', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} color="#2D4C4C" />
                </button>

                <div style={{ padding: '24px 24px 28px', maxHeight: '70vh', overflowY: 'auto' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#2D4C4C', margin: '0 0 12px', lineHeight: 1.2, fontFamily: 'Inter, system-ui, sans-serif' }}>
                    How Buddies Work
                  </h2>
                  <p style={{ fontSize: '14px', color: 'rgba(45,76,76,0.7)', margin: '0 0 20px', lineHeight: 1.6 }}>
                    A Buddy is someone you trust who agrees to be gently reminded to check in with you if things feel harder than usual.
                  </p>

                  {([
                    { title: 'What happens', color: '#99CCCE', items: ['You choose someone and send them an invite', 'They can accept or decline, with no explanation needed', 'If they accept, they may occasionally get a nudge to check in with you'] },
                    { title: 'What Buddies see', color: '#DDD6FE', items: ['They do not see your scores, check-ins, or activity', 'They are not alerted in emergencies', 'They are never expected to provide professional support'] },
                    { title: 'Your control', color: '#F59E0B', items: ['Buddies are always optional', 'You can add or remove them at any time', 'They can opt out whenever they want'] },
                  ]).map(section => (
                    <div key={section.title} style={{ marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#2D4C4C', margin: '0 0 10px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                        {section.title}
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {section.items.map((text, i) => (
                          <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: section.color, flexShrink: 0, marginTop: '7px' }} />
                            <p style={{ fontSize: '14px', color: '#2D4C4C', margin: 0, lineHeight: 1.6 }}>{text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <p style={{ fontSize: '14px', color: 'rgba(45,76,76,0.5)', margin: '0 0 20px', lineHeight: 1.6, fontStyle: 'italic' }}>
                    Buddies are about staying connected, not monitoring or intervention.
                  </p>

                  <button
                    onClick={() => setShowInfo(false)}
                    style={{
                      width: '100%', padding: '14px',
                      backgroundColor: '#2D4C4C', color: '#ffffff',
                      border: 'none', borderRadius: '14px',
                      fontSize: '15px', fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  >
                    Got it
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AddBuddyModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={handleInvite}
          currentBuddyCount={total}
        />
      </div>
    </DndProvider>
  );
}
