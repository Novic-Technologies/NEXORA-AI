import { useState, type ChangeEvent, type FormEvent } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Check,
  Clock,
  Copy,
  QrCode,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import {
  formatUsd,
  submitCryptoDeposit,
  submitCryptoWithdrawal,
} from '../lib/api.ts';
import { compressImageToDataUrl } from '../lib/imageUpload.ts';
import {
  BINANCE_COINS,
  getBinanceCoin,
  validateNetworkAddress,
} from '../lib/cryptoCoins.ts';
import type {
  BinanceCoinSymbol,
  BinanceNetworkCode,
  InvestorProfile,
  WalletTransaction,
} from '../types.ts';

interface CryptoWalletViewProps {
  investor: InvestorProfile;
  initialTab?: 'deposit' | 'withdraw';
  suggestedDepositUsd?: number;
  onBack?: () => void;
  onInvestorUpdate: (investor: InvestorProfile, tx?: WalletTransaction) => void;
  onOpenVerification?: () => void;
}

export function CryptoWalletView({
  investor,
  initialTab = 'deposit',
  suggestedDepositUsd,
  onBack,
  onInvestorUpdate,
  onOpenVerification,
}: CryptoWalletViewProps) {
  const [tab, setTab] = useState<'deposit' | 'withdraw'>(initialTab);
  const [coinSymbol, setCoinSymbol] = useState<BinanceCoinSymbol>('USDT');
  const [networkCode, setNetworkCode] = useState<BinanceNetworkCode>('TRC20');
  const [depositAmount, setDepositAmount] = useState<string>(
    suggestedDepositUsd && suggestedDepositUsd > 0
      ? String(Math.max(50, Math.ceil(suggestedDepositUsd)))
      : '1500'
  );
  const [txHash, setTxHash] = useState('');
  const [receiptImageUrl, setReceiptImageUrl] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawMemo, setWithdrawMemo] = useState('');
  const [copiedField, setCopiedField] = useState<'address' | 'memo' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const selectedCoin = getBinanceCoin(coinSymbol);
  const selectedNetwork =
    selectedCoin.networks.find((n) => n.networkCode === networkCode) ??
    selectedCoin.networks[0];

  const isVerified =
    investor.kycStatus === 'verified' || investor.role === 'master_admin';

  const handleSelectCoin = (symbol: BinanceCoinSymbol) => {
    const nextCoin = getBinanceCoin(symbol);
    setCoinSymbol(symbol);
    setNetworkCode(nextCoin.networks[0].networkCode);
    setCopiedField(null);
    setError(null);
    setSuccessMsg(null);
  };

  const handleSelectNetwork = (code: BinanceNetworkCode) => {
    setNetworkCode(code);
    setCopiedField(null);
    setError(null);
    setSuccessMsg(null);
  };

  const handleCopy = async (field: 'address' | 'memo', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 2000);
    } catch {
      setCopiedField(null);
    }
  };

  const handleReceiptPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await compressImageToDataUrl(file, 960, 0.8);
      setReceiptImageUrl(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process receipt image.');
    }
  };

  const handleDepositSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSuccessMsg(null);

    const amountNum = Number(depositAmount);
    if (!Number.isFinite(amountNum) || amountNum < selectedNetwork.minDepositUsd) {
      setError(
        `Minimum deposit for ${selectedCoin.symbol} (${selectedNetwork.networkName}) is ${formatUsd(selectedNetwork.minDepositUsd)}.`
      );
      return;
    }

    if (txHash.trim().length < 8 && !receiptImageUrl) {
      setError(
        'Enter the transaction TXID / hash from your wallet or upload a transfer screenshot.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitCryptoDeposit({
        coinSymbol: selectedCoin.symbol,
        networkCode: selectedNetwork.networkCode,
        amountUsd: amountNum,
        txHash: txHash.trim() || undefined,
        receiptImageUrl: receiptImageUrl || undefined,
      });
      onInvestorUpdate(res.investor, res.transaction);
      setTxHash('');
      setReceiptImageUrl('');
      setSuccessMsg(
        `Submitted ${formatUsd(res.transaction.amount)} ${selectedCoin.symbol} deposit for Master Admin approval. Your balance updates automatically once approved.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit deposit.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdrawSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSuccessMsg(null);

    if (!isVerified) {
      setError(
        'Identity verification must be approved by the Master Admin before requesting withdrawals.'
      );
      return;
    }

    const addrError = validateNetworkAddress(
      selectedNetwork.networkCode,
      withdrawAddress
    );
    if (addrError) {
      setError(addrError);
      return;
    }

    if (selectedNetwork.networkCode === 'XRPL' && !/^\d{4,12}$/.test(withdrawMemo.trim())) {
      setError('XRP withdrawals require a numeric Destination Tag / Memo (4–12 digits).');
      return;
    }

    const amountNum = Number(withdrawAmount);
    if (!Number.isFinite(amountNum) || amountNum < selectedNetwork.minWithdrawUsd) {
      setError(
        `Minimum withdrawal for ${selectedCoin.symbol} (${selectedNetwork.networkName}) is ${formatUsd(selectedNetwork.minWithdrawUsd)}.`
      );
      return;
    }
    if (amountNum > investor.walletBalance) {
      setError('Withdrawal amount exceeds your available wallet balance.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitCryptoWithdrawal({
        coinSymbol: selectedCoin.symbol,
        networkCode: selectedNetwork.networkCode,
        amountUsd: amountNum,
        walletAddress: withdrawAddress.trim(),
        memo: withdrawMemo.trim() || undefined,
      });
      onInvestorUpdate(res.investor, res.transaction);
      setWithdrawAmount('');
      setWithdrawAddress('');
      setWithdrawMemo('');
      setSuccessMsg(
        `Withdrawal of ${formatUsd(res.transaction.amount)} ${selectedCoin.symbol} reserved in escrow and queued for Master Admin approval.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit withdrawal.');
    } finally {
      setSubmitting(false);
    }
  };

  const parsedWithdraw = Number(withdrawAmount);
  const netWithdraw =
    Number.isFinite(parsedWithdraw) && parsedWithdraw > selectedNetwork.withdrawFeeUsd
      ? parsedWithdraw - selectedNetwork.withdrawFeeUsd
      : 0;

  return (
    <div className="pb-6 space-y-4">
      <header className="sticky top-0 z-30 h-14 px-4 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="w-8 h-8 rounded-lg border border-[#E5E7EB] flex items-center justify-center text-[#111827] shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <h1 className="font-display text-base font-bold text-[#111827]">
            Crypto Settlement
          </h1>
        </div>
      </header>

      <div className="px-4 space-y-4">
        {/* Clean Balance Summary Card */}
        <div className="rounded-2xl bg-[#111827] text-white p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.12em] uppercase text-[#9CA3AF]">
              Available Balance
            </p>
            <p className="mt-1 text-2xl font-bold font-mono tabular-nums">
              {formatUsd(investor.walletBalance)}
            </p>
            {investor.heldBalance > 0 && (
              <p className="mt-1 text-[10.5px] font-mono text-[#FBBF24]">
                In Pending Payout Escrow: {formatUsd(investor.heldBalance)}
              </p>
            )}
          </div>
          <div className="text-right text-[11px] font-mono tabular-nums text-[#9CA3AF]">
            <p>Approved In: {formatUsd(investor.totalDeposited)}</p>
            <p>Paid Out: {formatUsd(investor.totalWithdrawn)}</p>
          </div>
        </div>

        {/* Deposit / Withdraw Switch */}
        <div className="flex rounded-xl bg-[#E5E7EB]/70 p-1">
          <button
            type="button"
            onClick={() => {
              setTab('deposit');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              tab === 'deposit'
                ? 'bg-white text-[#111827] shadow-2xs'
                : 'text-[#6B7280]'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Deposit</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('withdraw');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              tab === 'withdraw'
                ? 'bg-white text-[#111827] shadow-2xs'
                : 'text-[#6B7280]'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Withdraw</span>
          </button>
        </div>

        {/* Step 1: Select Binance Coin */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#111827]">1. Select Coin</p>
            <span className="text-[10.5px] text-[#6B7280]">Binance-supported assets</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {BINANCE_COINS.map((coin) => {
              const active = coin.symbol === selectedCoin.symbol;
              return (
                <button
                  key={coin.symbol}
                  type="button"
                  onClick={() => handleSelectCoin(coin.symbol)}
                  className={`rounded-xl py-2.5 px-2 border flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#111827] text-white border-[#111827]'
                      : 'bg-[#F9FAFB] text-[#111827] border-[#E5E7EB] hover:border-[#9CA3AF]'
                  }`}
                >
                  <span
                    className="w-6 h-6 rounded-full text-[10px] font-mono font-bold text-white flex items-center justify-center"
                    style={{ backgroundColor: coin.badgeColor }}
                  >
                    {coin.symbol.slice(0, 1)}
                  </span>
                  <span className="text-xs font-mono font-semibold">{coin.symbol}</span>
                </button>
              );
            })}
          </div>

          {/* Step 2: Select Network */}
          <div className="pt-2 border-t border-[#F3F4F6] space-y-2">
            <p className="text-xs font-semibold text-[#111827]">
              2. Select Network ({selectedCoin.name})
            </p>
            <div className="grid grid-cols-2 gap-2">
              {selectedCoin.networks.map((net) => {
                const active = net.networkCode === selectedNetwork.networkCode;
                return (
                  <button
                    key={net.networkCode}
                    type="button"
                    onClick={() => handleSelectNetwork(net.networkCode)}
                    className={`text-left rounded-xl p-2.5 border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#EFF6FF] border-[#2563EB] text-[#111827]'
                        : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#4B5563]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-mono font-semibold text-[#111827]">
                        {net.networkCode}
                      </span>
                      <span className="text-[10px] font-mono tabular-nums text-[#6B7280]">
                        {tab === 'deposit'
                          ? `Min $${net.minDepositUsd}`
                          : `Fee $${net.withdrawFeeUsd}`}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-[#6B7280] truncate">
                      {net.networkName}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {tab === 'deposit' ? (
          <div className="space-y-4">
            {/* Scannable QR & Copy Address Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[#111827]">
                  3. Deposit Address ({selectedCoin.symbol})
                </p>
                <span className="text-[10.5px] font-mono text-[#2563EB]">
                  {selectedNetwork.networkCode}
                </span>
              </div>

              <div className="flex flex-col items-center bg-[#F9FAFB] rounded-2xl p-4 border border-[#E5E7EB]">
                <div className="bg-white p-3 rounded-xl border border-[#E5E7EB]">
                  <QRCodeSVG
                    value={selectedNetwork.depositAddress}
                    size={152}
                    bgColor="#FFFFFF"
                    fgColor="#111827"
                    level="M"
                  />
                </div>
                <p className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-medium text-[#6B7280]">
                  <QrCode className="w-3 h-3" />
                  <span>Scan QR in Binance or wallet app</span>
                </p>

                <div className="mt-3 w-full space-y-2">
                  <p className="font-mono text-[11px] text-[#111827] break-all bg-white border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-center select-all">
                    {selectedNetwork.depositAddress}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopy('address', selectedNetwork.depositAddress)
                    }
                    className="w-full h-10 rounded-xl bg-[#111827] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedField === 'address' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#34D399]" />
                        <span>Address copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy deposit address</span>
                      </>
                    )}
                  </button>
                </div>

                {selectedNetwork.memo && (
                  <div className="mt-3 w-full pt-3 border-t border-[#E5E7EB] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#111827]">
                        Destination Tag / Memo (Required)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy('memo', selectedNetwork.memo!)}
                        className="font-mono font-semibold text-[#2563EB] cursor-pointer"
                      >
                        {copiedField === 'memo' ? 'Copied' : 'Copy Memo'}
                      </button>
                    </div>
                    <p className="font-mono text-xs text-[#111827] bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-center select-all">
                      {selectedNetwork.memo}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-2 text-[11px] text-amber-900">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                <p className="leading-relaxed">
                  Send only <strong>{selectedCoin.symbol}</strong> over{' '}
                  <strong>{selectedNetwork.networkName}</strong>. Minimum deposit{' '}
                  {formatUsd(selectedNetwork.minDepositUsd)} ·{' '}
                  {selectedNetwork.confirmations}.
                </p>
              </div>
            </div>

            {/* Submit Deposit for Master Admin Approval */}
            <form
              onSubmit={handleDepositSubmit}
              className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[#111827]">
                  4. Submit Deposit Proof
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#D97706] bg-amber-50 px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3" />
                  Master Admin Approval
                </span>
              </div>

              <div>
                <label
                  htmlFor="app-deposit-amt"
                  className="block text-[11px] font-medium text-[#6B7280] mb-1"
                >
                  Amount Sent (USD equivalent)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#6B7280]">
                    $
                  </span>
                  <input
                    id="app-deposit-amt"
                    type="number"
                    min={selectedNetwork.minDepositUsd}
                    step="0.01"
                    required
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full h-11 pl-7 pr-3.5 rounded-xl border border-[#D1D5DB] bg-white font-mono tabular-nums text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {[500, 1500, 3500, 10000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDepositAmount(String(preset))}
                      className="py-1.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] font-mono tabular-nums text-[10.5px] font-medium text-[#111827] cursor-pointer"
                    >
                      ${preset.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="app-deposit-hash"
                  className="block text-[11px] font-medium text-[#6B7280] mb-1"
                >
                  Transaction Hash / TXID
                </label>
                <input
                  id="app-deposit-hash"
                  type="text"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="Paste blockchain TXID from Binance"
                  className="w-full h-10 px-3 rounded-xl border border-[#D1D5DB] bg-white font-mono text-[11px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <label className="rounded-xl border border-dashed border-[#D1D5DB] bg-[#F9FAFB] p-3 flex items-center gap-3 cursor-pointer hover:border-[#2563EB]">
                {receiptImageUrl ? (
                  <img
                    src={receiptImageUrl}
                    alt="Transfer receipt"
                    className="w-11 h-11 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center shrink-0">
                    <Upload className="w-4 h-4 text-[#6B7280]" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-[#111827]">
                    {receiptImageUrl
                      ? 'Transfer screenshot attached'
                      : 'Attach Binance transfer screenshot (optional if TXID entered)'}
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptPick}
                  className="sr-only"
                />
              </label>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-800"
                >
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-950 space-y-1">
                  <p className="font-semibold inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>Queued for Master Admin Approval</span>
                  </p>
                  <p>{successMsg}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold disabled:opacity-60 transition-colors cursor-pointer"
              >
                {submitting
                  ? 'Submitting deposit...'
                  : `Submit ${selectedCoin.symbol} Deposit for Approval`}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            {!isVerified && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-2.5">
                <p className="text-xs font-bold text-amber-950 inline-flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-[#D97706]" />
                  <span>Identity Verification Required for Withdrawals</span>
                </p>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Your account status is currently <strong>{investor.kycStatus}</strong>.
                  Submit your photo and ID documents for Master Admin approval before
                  withdrawing.
                </p>
                {onOpenVerification && (
                  <button
                    type="button"
                    onClick={onOpenVerification}
                    className="px-3.5 py-2 rounded-lg bg-[#111827] text-white text-[11px] font-semibold cursor-pointer"
                  >
                    Open Verification Center →
                  </button>
                )}
              </div>
            )}

            <form
              onSubmit={handleWithdrawSubmit}
              className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[#111827]">
                  3. Destination {selectedCoin.symbol} Wallet ({selectedNetwork.networkCode})
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#D97706] bg-amber-50 px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3" />
                  Admin Approval
                </span>
              </div>

              <div>
                <label
                  htmlFor="app-withdraw-addr"
                  className="block text-[11px] font-medium text-[#6B7280] mb-1"
                >
                  Recipient Wallet Address
                </label>
                <input
                  id="app-withdraw-addr"
                  type="text"
                  required
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder={selectedNetwork.depositAddress}
                  className="w-full h-11 px-3 rounded-xl border border-[#D1D5DB] bg-white font-mono text-[11px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
                <p className="mt-1 text-[10px] text-[#6B7280]">
                  {selectedNetwork.addressHint}
                </p>
              </div>

              {selectedNetwork.networkCode === 'XRPL' && (
                <div>
                  <label
                    htmlFor="app-withdraw-memo"
                    className="block text-[11px] font-medium text-[#6B7280] mb-1"
                  >
                    Destination Tag / Memo (Required for XRP)
                  </label>
                  <input
                    id="app-withdraw-memo"
                    type="text"
                    required
                    value={withdrawMemo}
                    onChange={(e) => setWithdrawMemo(e.target.value)}
                    placeholder="e.g. 109482751"
                    className="w-full h-11 px-3 rounded-xl border border-[#D1D5DB] bg-white font-mono text-xs text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="app-withdraw-amt"
                    className="text-[11px] font-medium text-[#6B7280]"
                  >
                    Withdrawal Amount (USD)
                  </label>
                  <span className="text-[10.5px] font-mono tabular-nums text-[#6B7280]">
                    Avail: {formatUsd(investor.walletBalance)}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#6B7280]">
                    $
                  </span>
                  <input
                    id="app-withdraw-amt"
                    type="number"
                    min={selectedNetwork.minWithdrawUsd}
                    max={investor.walletBalance}
                    step="0.01"
                    required
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder={`Min ${selectedNetwork.minWithdrawUsd}`}
                    className="w-full h-11 pl-7 pr-3.5 rounded-xl border border-[#D1D5DB] bg-white font-mono tabular-nums text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[0.25, 0.5, 1].map((ratio) => {
                    const label = ratio === 1 ? 'Max' : `${ratio * 100}%`;
                    const val = Number((investor.walletBalance * ratio).toFixed(2));
                    return (
                      <button
                        key={label}
                        type="button"
                        disabled={investor.walletBalance <= 0}
                        onClick={() => setWithdrawAmount(String(val))}
                        className="py-1.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] font-mono text-[11px] font-medium text-[#111827] disabled:opacity-40 cursor-pointer"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <dl className="rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] p-3 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <dt className="text-[#6B7280]">Network Fee ({selectedNetwork.networkCode})</dt>
                  <dd className="font-mono tabular-nums text-[#111827]">
                    {formatUsd(selectedNetwork.withdrawFeeUsd)}
                  </dd>
                </div>
                <div className="flex justify-between font-semibold text-[#111827]">
                  <dt>Estimated Net Receive</dt>
                  <dd className="font-mono tabular-nums">{formatUsd(netWithdraw)}</dd>
                </div>
              </dl>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-800"
                >
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] font-medium text-amber-950">
                  {successMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  submitting ||
                  !isVerified ||
                  investor.walletBalance < selectedNetwork.minWithdrawUsd
                }
                className="w-full h-12 rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-semibold disabled:opacity-50 transition-colors cursor-pointer"
              >
                {submitting
                  ? 'Submitting request...'
                  : `Request ${selectedCoin.symbol} Withdrawal`}
              </button>

              <p className="flex items-center justify-center gap-1 text-[10px] text-[#6B7280]">
                <ShieldCheck className="w-3 h-3" />
                Held safely in escrow until Master Admin sends payout
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
