import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
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
  Search,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import {
  formatUsd,
  submitCryptoDeposit,
  submitCryptoWithdrawal,
} from '../lib/api.ts';
import { copyTextToClipboard } from '../lib/clipboard.ts';
import {
  BINANCE_COINS,
  validateNetworkAddress,
} from '../lib/cryptoCoins.ts';
import { compressImageToDataUrl } from '../lib/imageUpload.ts';
import type {
  BinanceCoinConfig,
  BinanceCoinSymbol,
  BinanceNetworkCode,
  InvestorProfile,
  WalletTransaction,
} from '../types.ts';

interface CryptoWalletViewProps {
  investor: InvestorProfile;
  cryptoCoins?: BinanceCoinConfig[];
  initialTab?: 'deposit' | 'withdraw';
  suggestedDepositUsd?: number;
  onBack?: () => void;
  onInvestorUpdate: (investor: InvestorProfile, tx?: WalletTransaction) => void;
  onOpenVerification?: () => void;
}

export function CryptoWalletView({
  investor,
  cryptoCoins,
  initialTab = 'deposit',
  suggestedDepositUsd,
  onBack,
  onInvestorUpdate,
  onOpenVerification,
}: CryptoWalletViewProps) {
  const coins = cryptoCoins && cryptoCoins.length > 0 ? cryptoCoins : BINANCE_COINS;

  const [tab, setTab] = useState<'deposit' | 'withdraw'>(initialTab);
  const [coinSearch, setCoinSearch] = useState('');
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

  const selectedCoin = coins.find((c) => c.symbol === coinSymbol) ?? coins[0];
  const selectedNetwork =
    selectedCoin.networks.find((n) => n.networkCode === networkCode) ??
    selectedCoin.networks[0];

  const filteredCoins = useMemo(() => {
    const q = coinSearch.trim().toLowerCase();
    if (!q) return coins;
    return coins.filter(
      (c) =>
        c.symbol.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.networks.some(
          (n) =>
            n.networkCode.toLowerCase().includes(q) ||
            n.networkName.toLowerCase().includes(q)
        )
    );
  }, [coins, coinSearch]);

  const isVerified =
    investor.kycStatus === 'verified' || investor.role === 'master_admin';

  const supportsMemo =
    selectedNetwork.networkCode === 'XRPL' ||
    selectedNetwork.networkCode === 'XLM' ||
    selectedNetwork.networkCode === 'TON' ||
    Boolean(selectedNetwork.memo);

  const handleSelectCoin = (symbol: BinanceCoinSymbol) => {
    const nextCoin = coins.find((c) => c.symbol === symbol) ?? coins[0];
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
    const ok = await copyTextToClipboard(value);
    if (ok) {
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 2000);
    } else {
      setError('Unable to access clipboard automatically — select and copy the address text above.');
    }
  };

  const handleReceiptPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
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
        `Submitted ${formatUsd(res.transaction.amount)} ${selectedCoin.symbol} deposit for Finance Department approval. Your balance updates automatically once approved.`
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
        'Identity verification must be approved by the Compliance Department before requesting withdrawals.'
      );
      return;
    }

    if (investor.walletBalance < selectedNetwork.minWithdrawUsd) {
      setError(
        `Available balance (${formatUsd(investor.walletBalance)}) is below the ${formatUsd(selectedNetwork.minWithdrawUsd)} minimum withdrawal for ${selectedCoin.symbol} (${selectedNetwork.networkCode}).`
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
    if (amountNum <= selectedNetwork.withdrawFeeUsd) {
      setError(
        `Withdrawal amount must exceed the ${formatUsd(selectedNetwork.withdrawFeeUsd)} network fee.`
      );
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
        `Withdrawal of ${formatUsd(res.transaction.amount)} ${selectedCoin.symbol} reserved in escrow and queued for Finance Department approval.`
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
      <header className="sticky top-0 z-30 h-14 px-4 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#1E293B] flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="w-9 h-9 rounded-lg border border-[#E5E7EB] dark:border-[#334155] flex items-center justify-center text-[#111827] dark:text-[#F8FAFC] shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC] truncate">
            Crypto Settlement
          </h1>
        </div>
      </header>

      <div className="px-4 space-y-4">
        <div className="rounded-2xl bg-[#111827] dark:bg-[#0F172A] border border-[#1F2937] dark:border-[#1E293B] text-white p-4 flex items-center justify-between">
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

        <div className="flex rounded-xl bg-[#E5E7EB]/70 dark:bg-[#1E293B] p-1">
          <button
            type="button"
            onClick={() => {
              setTab('deposit');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 rounded-lg py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              tab === 'deposit'
                ? 'bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] shadow-2xs'
                : 'text-[#6B7280] dark:text-[#94A3B8]'
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
            className={`flex-1 rounded-lg py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              tab === 'withdraw'
                ? 'bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] shadow-2xs'
                : 'text-[#6B7280] dark:text-[#94A3B8]'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Withdraw</span>
          </button>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
              1. Select Coin ({coins.length})
            </p>
            <span className="text-[10.5px] text-[#6B7280] dark:text-[#94A3B8]">
              Global Binance rails
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={coinSearch}
              onChange={(e) => setCoinSearch(e.target.value)}
              placeholder="Search coin or network (e.g. SOL, TON, USDT, TRC20)..."
              className="w-full h-9 pl-8 pr-3 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] text-[11px] text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          {filteredCoins.length === 0 ? (
            <div className="py-4 text-center text-xs text-[#6B7280] dark:text-[#94A3B8]">
              No matching coin.{' '}
              <button
                type="button"
                onClick={() => setCoinSearch('')}
                className="text-[#2563EB] dark:text-[#60A5FA] font-semibold underline cursor-pointer"
              >
                Show all {coins.length} coins
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 max-h-[248px] overflow-y-auto pr-0.5">
              {filteredCoins.map((coin) => {
                const active = coin.symbol === selectedCoin.symbol;
                return (
                  <button
                    key={coin.symbol}
                    type="button"
                    onClick={() => handleSelectCoin(coin.symbol)}
                    className={`rounded-xl py-2 px-1.5 border flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#111827] dark:bg-[#2563EB] text-white border-[#111827] dark:border-[#2563EB]'
                        : 'bg-[#F9FAFB] dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border-[#E5E7EB] dark:border-[#1E293B] hover:border-[#9CA3AF]'
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-full text-[10px] font-mono font-bold text-white flex items-center justify-center shrink-0"
                      style={{ backgroundColor: coin.badgeColor }}
                    >
                      {coin.symbol.slice(0, 1)}
                    </span>
                    <span className="text-[11px] font-mono font-semibold leading-none">
                      {coin.symbol}
                    </span>
                    <span
                      className={`text-[9px] truncate max-w-full leading-none ${
                        active ? 'text-white/80' : 'text-[#6B7280] dark:text-[#94A3B8]'
                      }`}
                    >
                      {coin.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="pt-2 border-t border-[#F3F4F6] dark:border-[#1E293B] space-y-2">
            <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
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
                        ? 'bg-[#EFF6FF] dark:bg-[#1E3A8A]/40 border-[#2563EB] text-[#111827] dark:text-[#F8FAFC]'
                        : 'bg-[#F9FAFB] dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] text-[#4B5563] dark:text-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-mono font-semibold text-[#111827] dark:text-[#F8FAFC]">
                        {net.networkCode}
                      </span>
                      <span className="text-[10px] font-mono tabular-nums text-[#6B7280] dark:text-[#94A3B8]">
                        {tab === 'deposit'
                          ? `Min $${net.minDepositUsd}`
                          : `Fee $${net.withdrawFeeUsd}`}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-[#6B7280] dark:text-[#94A3B8] truncate">
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
            <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
                  3. Deposit Address ({selectedCoin.symbol})
                </p>
                <span className="text-[10.5px] font-mono text-[#2563EB] dark:text-[#60A5FA]">
                  {selectedNetwork.networkCode}
                </span>
              </div>

              <div className="flex flex-col items-center bg-[#F9FAFB] dark:bg-[#0F172A] rounded-2xl p-4 border border-[#E5E7EB] dark:border-[#1E293B]">
                <div className="bg-white p-3 rounded-xl border border-[#E5E7EB]">
                  <QRCodeSVG
                    value={selectedNetwork.depositAddress}
                    size={152}
                    bgColor="#FFFFFF"
                    fgColor="#111827"
                    level="M"
                  />
                </div>
                <p className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-medium text-[#6B7280] dark:text-[#94A3B8]">
                  <QrCode className="w-3 h-3" />
                  <span>Scan QR in Binance or wallet app</span>
                </p>

                <div className="mt-3 w-full space-y-2">
                  <p className="font-mono text-[11px] text-[#111827] dark:text-[#F8FAFC] break-all bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#334155] rounded-xl px-3 py-2.5 text-center select-all">
                    {selectedNetwork.depositAddress}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopy('address', selectedNetwork.depositAddress)
                    }
                    className="w-full h-11 rounded-xl bg-[#111827] dark:bg-[#2563EB] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
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
                  <div className="mt-3 w-full pt-3 border-t border-[#E5E7EB] dark:border-[#1E293B] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#111827] dark:text-[#F8FAFC]">
                        Destination Tag / Memo (Required)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy('memo', selectedNetwork.memo!)}
                        className="font-mono font-semibold text-[#2563EB] dark:text-[#60A5FA] cursor-pointer py-1 px-2"
                      >
                        {copiedField === 'memo' ? 'Copied' : 'Copy Memo'}
                      </button>
                    </div>
                    <p className="font-mono text-xs text-[#111827] dark:text-[#F8FAFC] bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#334155] rounded-xl px-3 py-2 text-center select-all">
                      {selectedNetwork.memo}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/50 p-3 flex items-start gap-2 text-[11px] text-amber-900 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" />
                <p className="leading-relaxed">
                  Send only <strong>{selectedCoin.symbol}</strong> over{' '}
                  <strong>{selectedNetwork.networkName}</strong>. Minimum deposit{' '}
                  {formatUsd(selectedNetwork.minDepositUsd)} ·{' '}
                  {selectedNetwork.confirmations}.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleDepositSubmit}
              noValidate
              className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
                  4. Submit Deposit Proof
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#D97706] dark:text-[#FBBF24] bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3" />
                  Finance Dept Approval
                </span>
              </div>

              <div>
                <label
                  htmlFor="app-deposit-amt"
                  className="block text-[11px] font-medium text-[#6B7280] dark:text-[#94A3B8] mb-1"
                >
                  Amount Sent (USD equivalent)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#6B7280] dark:text-[#94A3B8]">
                    $
                  </span>
                  <input
                    id="app-deposit-amt"
                    type="number"
                    min={selectedNetwork.minDepositUsd}
                    step="0.01"
                    value={depositAmount}
                    onChange={(e) => {
                      setDepositAmount(e.target.value);
                      setError(null);
                    }}
                    className="w-full h-11 pl-7 pr-3.5 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-mono tabular-nums text-xs text-[#111827] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {[950, 1500, 2600, 4800].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setDepositAmount(String(preset));
                        setError(null);
                      }}
                      className="py-2 rounded-lg border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] font-mono tabular-nums text-[10.5px] font-medium text-[#111827] dark:text-[#F8FAFC] cursor-pointer"
                    >
                      ${preset.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="app-deposit-hash"
                  className="block text-[11px] font-medium text-[#6B7280] dark:text-[#94A3B8] mb-1"
                >
                  Transaction Hash / TXID
                </label>
                <input
                  id="app-deposit-hash"
                  type="text"
                  value={txHash}
                  onChange={(e) => {
                    setTxHash(e.target.value);
                    setError(null);
                  }}
                  placeholder="Paste blockchain TXID from Binance"
                  className="w-full h-10 px-3 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-mono text-[11px] text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="flex-1 rounded-xl border border-dashed border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] p-3 flex items-center gap-3 cursor-pointer hover:border-[#2563EB]">
                  {receiptImageUrl ? (
                    <img
                      src={receiptImageUrl}
                      alt="Transfer receipt"
                      className="w-11 h-11 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] flex items-center justify-center shrink-0">
                      <Upload className="w-4 h-4 text-[#6B7280] dark:text-[#94A3B8]" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-[#111827] dark:text-[#F8FAFC]">
                      {receiptImageUrl
                        ? 'Transfer screenshot attached (tap to replace)'
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
                {receiptImageUrl && (
                  <button
                    type="button"
                    onClick={() => setReceiptImageUrl('')}
                    aria-label="Remove screenshot"
                    className="w-10 h-10 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] flex items-center justify-center text-[#6B7280] hover:text-red-600 shrink-0 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/60 px-3 py-2 text-[11px] font-medium text-red-800 dark:text-red-200"
                >
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/60 px-3 py-2.5 text-[11px] text-amber-950 dark:text-amber-100 space-y-1">
                  <p className="font-semibold inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#D97706] dark:text-[#FBBF24]" />
                    <span>Queued for Finance Dept Approval</span>
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
              <div className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/50 p-4 space-y-2.5">
                <p className="text-xs font-bold text-amber-950 dark:text-amber-100 inline-flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-[#D97706] dark:text-[#FBBF24]" />
                  <span>Identity Verification Required for Withdrawals</span>
                </p>
                <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
                  Your account status is currently <strong>{investor.kycStatus}</strong>.
                  Submit your photo and ID documents for Compliance Department approval before
                  withdrawing.
                </p>
                {onOpenVerification && (
                  <button
                    type="button"
                    onClick={onOpenVerification}
                    className="px-3.5 py-2.5 rounded-lg bg-[#111827] dark:bg-[#2563EB] text-white text-[11px] font-semibold cursor-pointer"
                  >
                    Open Verification Center →
                  </button>
                )}
              </div>
            )}

            <form
              onSubmit={handleWithdrawSubmit}
              noValidate
              className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-4 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
                  3. Destination {selectedCoin.symbol} Wallet ({selectedNetwork.networkCode})
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#D97706] dark:text-[#FBBF24] bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3" />
                  Finance Approval
                </span>
              </div>

              <div>
                <label
                  htmlFor="app-withdraw-addr"
                  className="block text-[11px] font-medium text-[#6B7280] dark:text-[#94A3B8] mb-1"
                >
                  Recipient Wallet Address
                </label>
                <input
                  id="app-withdraw-addr"
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => {
                    setWithdrawAddress(e.target.value);
                    setError(null);
                  }}
                  placeholder={selectedNetwork.depositAddress}
                  className="w-full h-11 px-3 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-mono text-[11px] text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
                <p className="mt-1 text-[10px] text-[#6B7280] dark:text-[#94A3B8]">
                  {selectedNetwork.addressHint}
                </p>
              </div>

              {supportsMemo && (
                <div>
                  <label
                    htmlFor="app-withdraw-memo"
                    className="block text-[11px] font-medium text-[#6B7280] dark:text-[#94A3B8] mb-1"
                  >
                    Destination Tag / Memo (
                    {selectedNetwork.networkCode === 'XRPL'
                      ? 'Required for XRP'
                      : 'Optional if required by your exchange'}
                    )
                  </label>
                  <input
                    id="app-withdraw-memo"
                    type="text"
                    value={withdrawMemo}
                    onChange={(e) => {
                      setWithdrawMemo(e.target.value);
                      setError(null);
                    }}
                    placeholder={
                      selectedNetwork.networkCode === 'XRPL'
                        ? 'e.g. 109482751'
                        : 'Exchange memo or tag'
                    }
                    className="w-full h-11 px-3 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-mono text-xs text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="app-withdraw-amt"
                    className="text-[11px] font-medium text-[#6B7280] dark:text-[#94A3B8]"
                  >
                    Withdrawal Amount (USD)
                  </label>
                  <span className="text-[10.5px] font-mono tabular-nums text-[#6B7280] dark:text-[#94A3B8]">
                    Avail: {formatUsd(investor.walletBalance)}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#6B7280] dark:text-[#94A3B8]">
                    $
                  </span>
                  <input
                    id="app-withdraw-amt"
                    type="number"
                    min={selectedNetwork.minWithdrawUsd}
                    step="0.01"
                    value={withdrawAmount}
                    onChange={(e) => {
                      setWithdrawAmount(e.target.value);
                      setError(null);
                    }}
                    placeholder={`Min ${selectedNetwork.minWithdrawUsd}`}
                    className="w-full h-11 pl-7 pr-3.5 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-mono tabular-nums text-xs text-[#111827] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
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
                        onClick={() => {
                          setError(null);
                          if (investor.walletBalance <= 0) {
                            setError('Your available balance is $0.00. Deposit crypto or collect yield first.');
                            return;
                          }
                          setWithdrawAmount(String(val));
                        }}
                        className="py-2 rounded-lg border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] font-mono text-[11px] font-medium text-[#111827] dark:text-[#F8FAFC] cursor-pointer"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <dl className="rounded-xl bg-[#F9FAFB] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] p-3 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <dt className="text-[#6B7280] dark:text-[#94A3B8]">
                    Network Fee ({selectedNetwork.networkCode})
                  </dt>
                  <dd className="font-mono tabular-nums text-[#111827] dark:text-[#F8FAFC]">
                    {formatUsd(selectedNetwork.withdrawFeeUsd)}
                  </dd>
                </div>
                <div className="flex justify-between font-semibold text-[#111827] dark:text-[#F8FAFC]">
                  <dt>Estimated Net Receive</dt>
                  <dd className="font-mono tabular-nums">{formatUsd(netWithdraw)}</dd>
                </div>
              </dl>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/60 px-3 py-2.5 text-[11px] font-medium text-red-800 dark:text-red-200 space-y-2"
                >
                  <p>{error}</p>
                  {!isVerified && onOpenVerification && (
                    <button
                      type="button"
                      onClick={onOpenVerification}
                      className="px-3 py-1.5 rounded-lg bg-[#111827] dark:bg-[#2563EB] text-white text-[10.5px] font-semibold cursor-pointer"
                    >
                      Verify Identity Now →
                    </button>
                  )}
                  {isVerified && investor.walletBalance < selectedNetwork.minWithdrawUsd && (
                    <button
                      type="button"
                      onClick={() => {
                        setTab('deposit');
                        setError(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-[10.5px] font-semibold cursor-pointer"
                    >
                      Switch to Deposit Crypto →
                    </button>
                  )}
                </div>
              )}

              {successMsg && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/60 px-3 py-2.5 text-[11px] font-medium text-amber-950 dark:text-amber-100">
                  {successMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-[#111827] dark:bg-[#2563EB] hover:bg-[#1F2937] dark:hover:bg-[#1D4ED8] text-white text-xs font-semibold disabled:opacity-60 transition-colors cursor-pointer"
              >
                {submitting
                  ? 'Submitting request...'
                  : `Request ${selectedCoin.symbol} Withdrawal`}
              </button>

              <p className="flex items-center justify-center gap-1 text-[10px] text-[#6B7280] dark:text-[#94A3B8]">
                <ShieldCheck className="w-3 h-3" />
                Held safely in escrow until Finance Department sends payout
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
