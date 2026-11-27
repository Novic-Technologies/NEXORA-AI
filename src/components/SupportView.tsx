import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Headphones,
  ImagePlus,
  MessageSquarePlus,
  Send,
  X,
} from 'lucide-react';
import {
  createSupportTicket,
  formatDateTime,
  sendSupportMessage,
} from '../lib/api.ts';
import { compressImageToDataUrl } from '../lib/imageUpload.ts';
import type {
  InvestorProfile,
  SupportTicket,
  SupportTicketCategory,
  SupportTicketStatus,
} from '../types.ts';

interface SupportViewProps {
  investor: InvestorProfile;
  tickets: SupportTicket[];
  loading: boolean;
  onBack: () => void;
  onTicketUpdated: (ticket: SupportTicket) => void;
}

const CATEGORIES: SupportTicketCategory[] = [
  'Deposits & Withdrawals',
  'Account & KYC',
  'Fleet & Yield',
  'Referral & Team',
  'Technical Issue',
  'General Inquiry',
];

function statusStyle(status: SupportTicketStatus): { label: string; cls: string } {
  switch (status) {
    case 'in_progress':
      return {
        label: 'IN PROGRESS',
        cls: 'bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#60A5FA]',
      };
    case 'resolved':
      return {
        label: 'RESOLVED',
        cls: 'bg-emerald-50 dark:bg-emerald-950/60 text-[#059669] dark:text-[#34D399]',
      };
    case 'closed':
      return {
        label: 'CLOSED',
        cls: 'bg-[#F3F4F6] dark:bg-[#1E293B] text-[#6B7280] dark:text-[#94A3B8]',
      };
    default:
      return {
        label: 'OPEN',
        cls: 'bg-amber-50 dark:bg-amber-950/60 text-[#D97706] dark:text-[#FBBF24]',
      };
  }
}

export function SupportView({
  investor,
  tickets,
  loading,
  onBack,
  onTicketUpdated,
}: SupportViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    tickets[0]?.id ?? null
  );
  const [showNewForm, setShowNewForm] = useState(tickets.length === 0);

  // New ticket form state (text + pictures only)
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SupportTicketCategory>('Deposits & Withdrawals');
  const [newMessage, setNewMessage] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  // Reply box state (text + pictures only)
  const [replyText, setReplyText] = useState('');
  const [replyImageUrl, setReplyImageUrl] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const newPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const replyPhotoInputRef = useRef<HTMLInputElement | null>(null);

  const activeTicket =
    tickets.find((t) => t.id === selectedId) ?? tickets[0] ?? null;

  const handleImagePick = async (
    e: ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      setError('Only PNG, JPG, or WebP pictures are supported.');
      return;
    }
    try {
      const compressed = await compressImageToDataUrl(file, 1080, 0.84);
      setter(compressed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process picture.');
    }
  };

  const handleCreateTicket = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!subject.trim()) {
      setError('Please enter a short subject for your support request.');
      return;
    }
    if (!newMessage.trim() && !newImageUrl) {
      setError('Please enter a message or attach a picture.');
      return;
    }
    setBusy(true);
    try {
      const res = await createSupportTicket({
        subject: subject.trim(),
        category,
        message: newMessage.trim() || 'Attached image screenshot.',
        imageUrl: newImageUrl || undefined,
      });
      onTicketUpdated(res.ticket);
      setSelectedId(res.ticket.id);
      setShowNewForm(false);
      setSubject('');
      setNewMessage('');
      setNewImageUrl('');
      setNotice('Support ticket opened and routed to the Support Department.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create support ticket.');
    } finally {
      setBusy(false);
    }
  };

  const handleSendReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeTicket) return;
    setError(null);
    setNotice(null);
    if (!replyText.trim() && !replyImageUrl) {
      setError('Write a message or attach a picture to reply.');
      return;
    }
    setBusy(true);
    try {
      const res = await sendSupportMessage(activeTicket.id, {
        message: replyText.trim() || 'Attached image screenshot.',
        imageUrl: replyImageUrl || undefined,
      });
      onTicketUpdated(res.ticket);
      setReplyText('');
      setReplyImageUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pb-6 space-y-4">
      <header className="sticky top-0 z-30 h-14 px-4 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#1E293B] flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="w-9 h-9 rounded-lg border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] flex items-center justify-center text-[#111827] dark:text-[#F8FAFC] shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC] truncate">
              Support Desk
            </h1>
            <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] truncate">
              Text &amp; picture assistance · Support Department
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowNewForm((v) => !v);
            setError(null);
            setNotice(null);
          }}
          className="px-2.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          <span>{showNewForm ? 'My Tickets' : 'New Ticket'}</span>
        </button>
      </header>

      <div className="px-4 space-y-4">
        <div className="rounded-2xl border border-[#BFDBFE] dark:border-[#1E3A8A] bg-[#EFF6FF]/70 dark:bg-[#0F172A] p-3.5 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shrink-0">
            <Headphones className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC]">
              24/7 Investor Support Department
            </p>
            <p className="mt-0.5 text-[11px] text-[#4B5563] dark:text-[#CBD5E1] leading-relaxed">
              Open a ticket for deposit audits, withdrawal status, KYC reviews, or account help.
              Attach screenshots or clear pictures along with your message.
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/60 px-3.5 py-2.5 text-xs font-medium text-red-800 dark:text-red-200"
          >
            {error}
          </div>
        )}
        {notice && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-2.5 text-xs font-medium text-emerald-900 dark:text-emerald-200">
            {notice}
          </div>
        )}

        {showNewForm ? (
          <form
            onSubmit={handleCreateTicket}
            className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC]">
                Open a Support Ticket
              </p>
              <span className="text-[10.5px] text-[#6B7280] dark:text-[#94A3B8]">
                {investor.email}
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#374151] dark:text-[#CBD5E1] mb-1">
                Topic Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SupportTicketCategory)}
                className="w-full h-10 px-3 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC] outline-none focus:border-[#2563EB]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#374151] dark:text-[#CBD5E1] mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={120}
                placeholder="e.g. Deposit TXID verification or yield question"
                className="w-full h-10 px-3 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC] outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#374151] dark:text-[#CBD5E1] mb-1">
                Message
              </label>
              <textarea
                rows={4}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                maxLength={2000}
                placeholder="Describe what assistance you need..."
                className="w-full p-3 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC] outline-none focus:border-[#2563EB] resize-none"
              />
            </div>

            <div>
              <input
                ref={newPhotoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => void handleImagePick(e, setNewImageUrl)}
                className="hidden"
              />
              {newImageUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A]">
                  <img
                    src={newImageUrl}
                    alt="Attached support screenshot"
                    className="w-full max-h-48 object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setNewImageUrl('')}
                    aria-label="Remove attached picture"
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => newPhotoInputRef.current?.click()}
                  className="w-full h-10 rounded-xl border border-dashed border-[#D1D5DB] dark:border-[#334155] hover:border-[#2563EB] text-xs font-medium text-[#4B5563] dark:text-[#CBD5E1] inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ImagePlus className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
                  <span>Attach picture / screenshot (optional)</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full h-11 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{busy ? 'Submitting ticket...' : 'Send Support Ticket'}</span>
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            {loading && tickets.length === 0 ? (
              <div className="h-24 rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] animate-pulse" />
            ) : tickets.length === 0 ? (
              <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] px-5 py-8 text-center">
                <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
                  No support tickets yet
                </p>
                <p className="mt-1 text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                  Tap New Ticket above to contact our Support Department.
                </p>
              </div>
            ) : (
              <>
                {/* Ticket Switcher */}
                <div className="space-y-2">
                  {tickets.map((ticket) => {
                    const st = statusStyle(ticket.status);
                    const selected = activeTicket?.id === ticket.id;
                    return (
                      <button
                        key={ticket.id}
                        type="button"
                        onClick={() => setSelectedId(ticket.id)}
                        className={`w-full text-left rounded-2xl border p-3.5 transition-colors cursor-pointer ${
                          selected
                            ? 'bg-white dark:bg-[#111827] border-[#2563EB] dark:border-[#3B82F6]'
                            : 'bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1E293B]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10.5px] font-mono text-[#6B7280] dark:text-[#94A3B8]">
                            {ticket.category} · {ticket.messages.length} msg
                            {ticket.messages.length === 1 ? '' : 's'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${st.cls}`}>
                            {st.label}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-bold text-[#111827] dark:text-[#F8FAFC] truncate">
                          {ticket.subject}
                        </p>
                        <p className="mt-0.5 text-[10.5px] text-[#6B7280] dark:text-[#94A3B8]">
                          Updated {formatDateTime(ticket.updatedAt)}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Active Thread */}
                {activeTicket && (
                  <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-4 space-y-3">
                    <div className="pb-2.5 border-b border-[#F3F4F6] dark:border-[#1E293B] flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC]">
                          {activeTicket.subject}
                        </h2>
                        <p className="text-[10.5px] text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
                          Ticket {activeTicket.id} · {activeTicket.category}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                          statusStyle(activeTicket.status).cls
                        }`}
                      >
                        {statusStyle(activeTicket.status).label}
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-0.5">
                      {activeTicket.messages.map((msg) => {
                        const mine = !msg.isStaff;
                        return (
                          <div
                            key={msg.id}
                            className={`rounded-xl p-3 text-xs space-y-1.5 ${
                              mine
                                ? 'bg-[#EFF6FF] dark:bg-[#1E3A8A]/35 border border-[#BFDBFE] dark:border-[#3B82F6]/30 ml-4'
                                : 'bg-[#F9FAFB] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] mr-4'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 text-[10px]">
                              <span className="font-bold text-[#111827] dark:text-[#F8FAFC]">
                                {mine ? 'You' : msg.senderDepartment || 'Support Department'}
                              </span>
                              <span className="text-[#6B7280] dark:text-[#94A3B8]">
                                {formatDateTime(msg.createdAt)}
                              </span>
                            </div>
                            {msg.body && (
                              <p className="text-[11.5px] text-[#374151] dark:text-[#E2E8F0] leading-relaxed whitespace-pre-wrap">
                                {msg.body}
                              </p>
                            )}
                            {msg.imageUrl && (
                              <button
                                type="button"
                                onClick={() => setLightboxImage(msg.imageUrl!)}
                                className="block rounded-lg overflow-hidden border border-[#D1D5DB] dark:border-[#334155] cursor-pointer"
                              >
                                <img
                                  src={msg.imageUrl}
                                  alt="Ticket attachment"
                                  className="max-h-44 w-auto object-cover"
                                />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {activeTicket.status === 'closed' ? (
                      <div className="rounded-xl bg-[#F9FAFB] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] px-3 py-2.5 text-[11px] text-[#6B7280] dark:text-[#94A3B8] flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                        <span>This ticket is closed. Open a new ticket if you need further help.</span>
                      </div>
                    ) : (
                      <form onSubmit={handleSendReply} className="pt-2 border-t border-[#F3F4F6] dark:border-[#1E293B] space-y-2.5">
                        {activeTicket.status === 'resolved' && (
                          <p className="text-[10.5px] text-[#059669] dark:text-[#34D399] inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Marked resolved — reply below to reopen anytime.</span>
                          </p>
                        )}
                        <input
                          ref={replyPhotoInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(e) => void handleImagePick(e, setReplyImageUrl)}
                          className="hidden"
                        />
                        {replyImageUrl && (
                          <div className="relative rounded-xl overflow-hidden border border-[#E5E7EB] dark:border-[#334155]">
                            <img
                              src={replyImageUrl}
                              alt="Reply picture preview"
                              className="w-full max-h-36 object-contain bg-[#F9FAFB] dark:bg-[#0F172A]"
                            />
                            <button
                              type="button"
                              onClick={() => setReplyImageUrl('')}
                              aria-label="Remove attached picture"
                              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <div className="flex items-end gap-2">
                          <button
                            type="button"
                            onClick={() => replyPhotoInputRef.current?.click()}
                            aria-label="Attach picture"
                            className="h-10 w-10 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] flex items-center justify-center text-[#2563EB] dark:text-[#60A5FA] shrink-0 cursor-pointer"
                          >
                            <ImagePlus className="w-4 h-4" />
                          </button>
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            maxLength={2000}
                            placeholder="Write a message..."
                            className="flex-1 h-10 px-3 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC] outline-none focus:border-[#2563EB]"
                          />
                          <button
                            type="submit"
                            disabled={busy}
                            aria-label="Send reply"
                            className="h-10 px-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-60"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Send</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-[400px] w-full">
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              aria-label="Close picture"
              className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white/15 text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={lightboxImage}
              alt="Support picture"
              className="w-full max-h-[80dvh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
