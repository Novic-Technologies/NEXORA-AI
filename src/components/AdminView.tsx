import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Building2,
  CalendarPlus,
  Check,
  Coins,
  Cpu,
  Edit3,
  Eye,
  EyeOff,
  FileCheck2,
  Globe,
  KeyRound,
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  advanceAllRentalsCycle,
  createAdminRobot,
  createAdminUser,
  deleteAdminDispatch,
  deleteAdminRental,
  deleteAdminRobot,
  deleteAdminTransaction,
  deleteAdminUser,
  dismissPasswordResetRequest,
  formatDateTime,
  formatUsd,
  publishFleetDispatch,
  resetUserPasswordByTech,
  reviewAdminTransaction,
  reviewUserKyc,
  sendAdminNotification,
  truncateAddress,
  updateAdminDispatch,
  updateAdminRental,
  updateAdminRobot,
  updateAdminUser,
  updateCryptoNetwork,
  updateSiteConfig,
  updateUserRole,
} from '../lib/api.ts';
import {
  formatInternationalPhone,
  parseInternationalPhone,
  type CountryOption,
} from '../lib/countries.ts';
import { compressImageToDataUrl } from '../lib/imageUpload.ts';
import type {
  AccountStatus,
  AdminOverviewData,
  BinanceCoinSymbol,
  BinanceNetworkCode,
  CorporateDepartment,
  FleetDispatch,
  InvestorProfile,
  KycStatus,
  RobotCategory,
  RobotMachine,
  SiteConfig,
  UserRole,
} from '../types.ts';
import { CountrySelectField, PhoneDialInputField } from './CountryPhonePicker.tsx';

interface AdminViewProps {
  currentUser: InvestorProfile;
  data: AdminOverviewData | null;
  loading: boolean;
  onRefresh: () => Promise<void>;
}

type AdminTab = 'transfers' | 'kyc' | 'users' | 'fleet' | 'cms';

const ROLE_LABELS: Record<UserRole, string> = {
  master_admin: 'Executive Ops',
  admin: 'Dept Officer',
  moderator: 'Compliance Desk',
  investor: 'Investor',
};

const DEPARTMENTS: CorporateDepartment[] = [
  'Executive Operations',
  'Finance Department',
  'Technical Department',
  'Compliance Department',
  'Fleet Operations',
];

const ROBOT_CATEGORIES: RobotCategory[] = [
  'Warehouse & Logistics',
  'Humanoid AI',
  'Precision Assembly',
  'Autonomous Inspection',
  'Service & Agri',
];

export function AdminView({
  currentUser,
  data,
  loading,
  onRefresh,
}: AdminViewProps) {
  const [tab, setTab] = useState<AdminTab>('transfers');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [previewImg, setPreviewImg] = useState<{ title: string; url: string } | null>(
    null
  );

  // User search & CRUD modals
  const [userSearch, setUserSearch] = useState('');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingUser, setEditingUser] = useState<InvestorProfile | null>(null);
  const [pwResetModal, setPwResetModal] = useState<{
    user: InvestorProfile;
    requestId?: string;
  } | null>(null);
  const [techNewPw, setTechNewPw] = useState('');
  const [showTechNewPw, setShowTechNewPw] = useState(false);
  const [techResetNote, setTechResetNote] = useState('');

  // Create user state
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserCountry, setNewUserCountry] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('investor');
  const [newUserDepartment, setNewUserDepartment] =
    useState<CorporateDepartment>('Finance Department');
  const [newUserBalance, setNewUserBalance] = useState('0');
  const [newUserKyc, setNewUserKyc] = useState<KycStatus>('verified');

  // Edit user state
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editBalance, setEditBalance] = useState('0');
  const [editHeld, setEditHeld] = useState('0');
  const [editKyc, setEditKyc] = useState<KycStatus>('unverified');
  const [editRole, setEditRole] = useState<UserRole>('investor');
  const [editDepartment, setEditDepartment] =
    useState<CorporateDepartment>('Finance Department');
  const [editStatus, setEditStatus] = useState<AccountStatus>('active');
  const [editBoostDays, setEditBoostDays] = useState('0');

  // Robot CRUD modal state
  const [robotModalOpen, setRobotModalOpen] = useState(false);
  const [editingRobot, setEditingRobot] = useState<RobotMachine | null>(null);
  const [rName, setRName] = useState('');
  const [rModel, setRModel] = useState('');
  const [rCategory, setRCategory] = useState<RobotCategory>('Warehouse & Logistics');
  const [rHub, setRHub] = useState('Munich Hub #1');
  const [rTagline, setRTagline] = useState('');
  const [rDesc, setRDesc] = useState('');
  const [rPrice, setRPrice] = useState('1500');
  const [rRate, setRRate] = useState('1.60');
  const [rCycle, setRCycle] = useState('45');
  const [rTotalUnits, setRTotalUnits] = useState('10');
  const [rAvailUnits, setRAvailUnits] = useState('10');
  const [rRefBonus, setRRefBonus] = useState('82.5');
  const [rImageUrl, setRImageUrl] = useState('');

  // Dispatch form & editing
  const [editingDispatch, setEditingDispatch] = useState<FleetDispatch | null>(null);
  const [dispCategory, setDispCategory] = useState('Deployment');
  const [dispTitle, setDispTitle] = useState('');
  const [dispSummary, setDispSummary] = useState('');
  const [dispImageUrl, setDispImageUrl] = useState('');

  // Notification broadcast form
  const [notifTarget, setNotifTarget] = useState('all');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMsg, setNotifMsg] = useState('');

  // SiteConfig editor form (initialized lazily from data.siteConfig when opened)
  const [siteDraft, setSiteDraft] = useState<SiteConfig | null>(null);

  // Crypto Wallet editor
  const [coinSymbol, setCoinSymbol] = useState<BinanceCoinSymbol>('USDT');
  const [networkCode, setNetworkCode] = useState<BinanceNetworkCode>('TRC20');
  const [coinAddress, setCoinAddress] = useState('');
  const [coinMemo, setCoinMemo] = useState('');
  const [coinMinDep, setCoinMinDep] = useState('50');
  const [coinMinWith, setCoinMinWith] = useState('20');
  const [coinFee, setCoinFee] = useState('1');

  const isMaster = currentUser.role === 'master_admin';

  const clearStatus = () => {
    setError(null);
    setFeedback(null);
  };

  const syncCryptoFields = useCallback(
    (symbol: BinanceCoinSymbol, net: BinanceNetworkCode) => {
      const coins = data?.cryptoCoins ?? [];
      const c = coins.find((x) => x.symbol === symbol) ?? coins[0];
      if (!c) return;
      const n = c.networks.find((x) => x.networkCode === net) ?? c.networks[0];
      if (!n) return;
      setCoinSymbol(c.symbol);
      setNetworkCode(n.networkCode);
      setCoinAddress(n.depositAddress);
      setCoinMemo(n.memo || '');
      setCoinMinDep(String(n.minDepositUsd));
      setCoinMinWith(String(n.minWithdrawUsd));
      setCoinFee(String(n.withdrawFeeUsd));
    },
    [data?.cryptoCoins]
  );

  useEffect(() => {
    if (data?.siteConfig && !siteDraft) {
      setSiteDraft(data.siteConfig);
    }
  }, [data?.siteConfig, siteDraft]);

  useEffect(() => {
    if (data?.cryptoCoins && data.cryptoCoins.length > 0 && !coinAddress) {
      syncCryptoFields(coinSymbol, networkCode);
    }
  }, [data?.cryptoCoins, coinAddress, coinSymbol, networkCode, syncCryptoFields]);

  useEffect(() => {
    if (!previewImg && !robotModalOpen && !editingUser && !pwResetModal && !showCreateUser) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (previewImg) setPreviewImg(null);
      else if (robotModalOpen) setRobotModalOpen(false);
      else if (editingUser) setEditingUser(null);
      else if (pwResetModal) setPwResetModal(null);
      else if (showCreateUser) setShowCreateUser(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewImg, robotModalOpen, editingUser, pwResetModal, showCreateUser]);

  const openEditUser = (u: InvestorProfile) => {
    setEditingUser(u);
    setEditFullName(u.fullName);
    setEditPhone(u.phone);
    setEditCompany(u.companyName);
    setEditCountry(u.country);
    setEditCity(u.city || '');
    setEditBalance(String(u.walletBalance));
    setEditHeld(String(u.heldBalance));
    setEditKyc(u.kycStatus);
    setEditRole(u.role);
    setEditDepartment(u.department || 'Finance Department');
    setEditStatus(u.accountStatus);
    setEditBoostDays('0');
  };

  const openRobotModal = (robot?: RobotMachine) => {
    if (robot) {
      setEditingRobot(robot);
      setRName(robot.name);
      setRModel(robot.modelCode);
      setRCategory(robot.category);
      setRHub(robot.facilityHub);
      setRTagline(robot.tagline);
      setRDesc(robot.description);
      setRPrice(String(robot.rentalPrice));
      setRRate(String(robot.dailyReturnRate));
      setRCycle(String(robot.cycleDays));
      setRTotalUnits(String(robot.totalUnits));
      setRAvailUnits(String(robot.availableUnits));
      setRRefBonus(
        String(
          robot.referralBonusUsd ??
            Number(
              (
                (robot.rentalPrice * (data?.siteConfig.referralRewardRatePct ?? 5.5)) /
                100
              ).toFixed(2)
            )
        )
      );
      setRImageUrl(robot.imageUrl);
    } else {
      setEditingRobot(null);
      setRName('');
      setRModel('');
      setRCategory('Warehouse & Logistics');
      setRHub('Munich Hub #1');
      setRTagline('');
      setRDesc('');
      setRPrice('2600');
      setRRate('1.78');
      setRCycle('45');
      setRTotalUnits('12');
      setRAvailUnits('12');
      setRRefBonus('143');
      setRImageUrl('/src/assets/images/robot_logistics_amr_1795701350768.jpg');
    }
    setRobotModalOpen(true);
  };

  const handleImageUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const compressed = await compressImageToDataUrl(file, 960, 0.82);
      setter(compressed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process image.');
    }
  };

  const handleTxReview = async (txId: string, action: 'approve' | 'reject') => {
    setBusyId(txId);
    clearStatus();
    try {
      await reviewAdminTransaction(txId, {
        action,
        adminNote: noteById[txId]?.trim() || undefined,
      });
      await onRefresh();
      setFeedback(
        action === 'approve'
          ? 'Transaction approved, balance & referral rewards processed live.'
          : 'Transaction rejected and any held balance returned.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to review transaction.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteTx = async (txId: string) => {
    setBusyId(txId);
    clearStatus();
    try {
      await deleteAdminTransaction(txId);
      await onRefresh();
      setFeedback('Transaction record removed from ledger.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete transaction.');
    } finally {
      setBusyId(null);
    }
  };

  const handleKycReview = async (userId: string, action: 'approve' | 'reject') => {
    setBusyId(userId);
    clearStatus();
    try {
      await reviewUserKyc(userId, {
        action,
        reviewNote: noteById[userId]?.trim() || undefined,
      });
      await onRefresh();
      setFeedback(
        action === 'approve' ? 'Identity verification approved.' : 'Identity verification declined.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update verification.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRoleUpdate = async (userId: string, role: UserRole) => {
    setBusyId(userId);
    clearStatus();
    try {
      await updateUserRole(userId, { role });
      await onRefresh();
      setFeedback(`Role updated to ${ROLE_LABELS[role]}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update user role.');
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusToggle = async (
    userId: string,
    nextStatus: 'active' | 'suspended'
  ) => {
    setBusyId(userId);
    clearStatus();
    try {
      await updateUserRole(userId, { accountStatus: nextStatus });
      await onRefresh();
      setFeedback(`Account status set to ${nextStatus}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update account status.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setBusyId('create-user');
    clearStatus();
    try {
      await createAdminUser({
        fullName: newUserFullName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword,
        phone: newUserPhone.trim() || undefined,
        country: newUserCountry.trim() || undefined,
        role: newUserRole,
        department: newUserRole === 'investor' ? undefined : newUserDepartment,
        walletBalance: Number(newUserBalance) || 0,
        kycStatus: newUserKyc,
      });
      setShowCreateUser(false);
      setNewUserFullName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserPhone('');
      setNewUserCountry('');
      setNewUserBalance('0');
      await onRefresh();
      setFeedback('Account created and synced across Nexora AI departments.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create user.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveUserEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setBusyId(editingUser.id);
    clearStatus();
    try {
      await updateAdminUser(editingUser.id, {
        fullName: editFullName.trim(),
        phone: editPhone.trim(),
        companyName: editCompany.trim(),
        country: editCountry.trim(),
        city: editCity.trim(),
        walletBalance: Number(editBalance),
        heldBalance: Number(editHeld),
        kycStatus: editKyc,
        role: editingUser.role === 'master_admin' ? undefined : editRole,
        department:
          editingUser.role === 'master_admin' || editRole !== 'investor'
            ? editDepartment
            : undefined,
        accountStatus: editingUser.role === 'master_admin' ? undefined : editStatus,
        doubleYieldDays: Number(editBoostDays) > 0 ? Number(editBoostDays) : undefined,
      });
      setEditingUser(null);
      await onRefresh();
      setFeedback('User details, balance & department permissions updated live.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update user.');
    } finally {
      setBusyId(null);
    }
  };

  const handleTechPasswordReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!pwResetModal) return;
    setBusyId('tech-pw-reset');
    clearStatus();
    try {
      const res = await resetUserPasswordByTech(pwResetModal.user.id, {
        newPassword: techNewPw,
        resolutionNote: techResetNote.trim() || undefined,
      });
      setPwResetModal(null);
      setTechNewPw('');
      setTechResetNote('');
      await onRefresh();
      setFeedback(`Password reset applied for ${res.user.fullName} by Technical Department.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset user password.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDismissPwRequest = async (reqId: string) => {
    setBusyId(reqId);
    clearStatus();
    try {
      await dismissPasswordResetRequest(reqId);
      await onRefresh();
      setFeedback('Password ticket closed by Technical Department.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to dismiss ticket.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteUser = async (u: InvestorProfile) => {
    setBusyId(u.id);
    clearStatus();
    try {
      await deleteAdminUser(u.id);
      await onRefresh();
      setFeedback(`Removed ${u.fullName} and associated records.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete user.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveRobot = async (e: FormEvent) => {
    e.preventDefault();
    setBusyId('robot-save');
    clearStatus();
    try {
      const payload = {
        name: rName.trim(),
        modelCode: rModel.trim(),
        category: rCategory,
        facilityHub: rHub.trim(),
        tagline: rTagline.trim() || rName.trim(),
        description: rDesc.trim() || rTagline.trim() || rName.trim(),
        rentalPrice: Number(rPrice),
        dailyReturnRate: Number(rRate),
        cycleDays: Number(rCycle),
        totalUnits: Number(rTotalUnits),
        availableUnits: Number(rAvailUnits),
        referralBonusUsd: Number(rRefBonus),
        imageUrl: rImageUrl.trim(),
      };
      if (editingRobot) {
        await updateAdminRobot(editingRobot.id, payload);
        setFeedback(`Updated ${payload.name} live across the fleet.`);
      } else {
        await createAdminRobot(payload);
        setFeedback(`Added ${payload.name} to the live catalog.`);
      }
      setRobotModalOpen(false);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save machine.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteRobot = async (id: string) => {
    setBusyId(id);
    clearStatus();
    try {
      await deleteAdminRobot(id);
      await onRefresh();
      setFeedback('Robot machine removed from catalog.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete robot.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRentalUpdate = async (
    rentalId: string,
    payload: { yieldMultiplier?: number; status?: 'active' | 'completed'; simulatedDaysAdd?: number }
  ) => {
    setBusyId(rentalId);
    clearStatus();
    try {
      await updateAdminRental(rentalId, payload);
      await onRefresh();
      setFeedback('Rental contract updated immediately.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update rental.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteRental = async (rentalId: string) => {
    setBusyId(rentalId);
    clearStatus();
    try {
      await deleteAdminRental(rentalId);
      await onRefresh();
      setFeedback('Rental contract deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete rental.');
    } finally {
      setBusyId(null);
    }
  };

  const handleAdvanceCycles = async () => {
    setBusyId('advance');
    clearStatus();
    try {
      const res = await advanceAllRentalsCycle();
      await onRefresh();
      setFeedback(`Credited +24h operating cycle across ${res.updated} active rental(s).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to advance cycle.');
    } finally {
      setBusyId(null);
    }
  };

  const handlePublishOrUpdateDispatch = async (e: FormEvent) => {
    e.preventDefault();
    setBusyId('dispatch');
    clearStatus();
    try {
      if (editingDispatch) {
        await updateAdminDispatch(editingDispatch.id, {
          category: dispCategory,
          title: dispTitle.trim(),
          summary: dispSummary.trim(),
          imageUrl: dispImageUrl.trim() || undefined,
        });
        setEditingDispatch(null);
        setFeedback('Dispatch updated live across all users.');
      } else {
        await publishFleetDispatch({
          category: dispCategory,
          title: dispTitle.trim(),
          summary: dispSummary.trim(),
          imageUrl: dispImageUrl.trim() || undefined,
        });
        setFeedback('Live dispatch published to all connected users.');
      }
      setDispTitle('');
      setDispSummary('');
      setDispImageUrl('');
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save dispatch.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteDispatch = async (id: string) => {
    setBusyId(id);
    clearStatus();
    try {
      await deleteAdminDispatch(id);
      await onRefresh();
      setFeedback('Dispatch removed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete dispatch.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveSiteConfig = async (e: FormEvent) => {
    e.preventDefault();
    const target = siteDraft ?? data?.siteConfig;
    if (!target) return;
    setBusyId('site-cfg');
    clearStatus();
    try {
      await updateSiteConfig(target);
      await onRefresh();
      setFeedback('App display copy, referral rates & hero updated system-wide.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save site settings.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveCryptoNetwork = async (e: FormEvent) => {
    e.preventDefault();
    setBusyId('crypto-net');
    clearStatus();
    try {
      await updateCryptoNetwork({
        symbol: coinSymbol,
        networkCode,
        depositAddress: coinAddress.trim(),
        memo: coinMemo.trim() || undefined,
        minDepositUsd: Number(coinMinDep),
        minWithdrawUsd: Number(coinMinWith),
        withdrawFeeUsd: Number(coinFee),
      });
      await onRefresh();
      setFeedback(`${coinSymbol} (${networkCode}) wallet updated system-wide.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update crypto address.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSendNotification = async (e: FormEvent) => {
    e.preventDefault();
    setBusyId('send-notif');
    clearStatus();
    try {
      const res = await sendAdminNotification({
        userId: notifTarget,
        title: notifTitle.trim(),
        message: notifMsg.trim(),
      });
      setNotifTitle('');
      setNotifMsg('');
      setFeedback(`Notification delivered live to ${res.sentCount} account(s).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send notification.');
    } finally {
      setBusyId(null);
    }
  };

  const summary = data?.summary;
  const pendingTx = data?.pendingTransactions ?? [];
  const allTx = data?.allTransactions ?? [];
  const kycUsers = (data?.users ?? []).filter(
    (u) => u.kycStatus === 'pending' || u.verification
  );
  const allUsers = data?.users ?? [];
  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.referralCode.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [allUsers, userSearch]);

  const activeSite = siteDraft ?? data?.siteConfig;
  const coins = data?.cryptoCoins ?? [];
  const pendingPwRequests = (data?.passwordResetRequests ?? []).filter(
    (r) => r.status === 'pending'
  );

  return (
    <div className="pb-6 space-y-4">
      <header className="sticky top-0 z-30 h-14 px-4 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#1E293B] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#1E1B4B] text-white flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-[#93C5FD]" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-sm font-bold text-[#111827] dark:text-[#F8FAFC] truncate">
              Nexora Department Console
            </h1>
            <p className="text-[10.5px] text-[#6B7280] dark:text-[#94A3B8] truncate">
              Finance · Compliance · Technical · Fleet Ops
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void onRefresh()}
          className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] text-[11px] font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Syncing' : 'Refresh'}</span>
        </button>
      </header>

      <div className="px-4 space-y-4">
        {/* Live Queue Summary Strip */}
        <div className="grid grid-cols-3 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl divide-x divide-[#E5E7EB] dark:divide-[#1E293B]">
          <div className="p-3">
            <p className="text-[10px] font-medium text-[#6B7280] dark:text-[#94A3B8]">
              Finance Queue
            </p>
            <p className="mt-1 font-mono text-base font-bold text-[#D97706] dark:text-[#FBBF24]">
              {(summary?.pendingDepositsCount ?? 0) + (summary?.pendingWithdrawalsCount ?? 0)}
            </p>
            <p className="text-[10px] font-mono text-[#6B7280] dark:text-[#94A3B8]">
              {formatUsd((summary?.pendingDepositVolume ?? 0) + (summary?.pendingWithdrawalVolume ?? 0))}
            </p>
          </div>
          <div className="p-3">
            <p className="text-[10px] font-medium text-[#6B7280] dark:text-[#94A3B8]">
              Compliance &amp; Tech
            </p>
            <p className="mt-1 font-mono text-base font-bold text-[#2563EB] dark:text-[#60A5FA]">
              {(summary?.pendingKycCount ?? 0) + (summary?.pendingPasswordResetsCount ?? 0)}
            </p>
            <p className="text-[10px] text-[#6B7280] dark:text-[#94A3B8]">
              {summary?.pendingKycCount ?? 0} KYC · {summary?.pendingPasswordResetsCount ?? 0} PW
            </p>
          </div>
          <div className="p-3">
            <p className="text-[10px] font-medium text-[#6B7280] dark:text-[#94A3B8]">
              Active Units
            </p>
            <p className="mt-1 font-mono text-base font-bold text-[#059669] dark:text-[#34D399]">
              {summary?.activeRentalsCount ?? 0}
            </p>
            <p className="text-[10px] font-mono text-[#6B7280] dark:text-[#94A3B8]">
              Ref: {formatUsd(summary?.totalReferralPayouts ?? 0)}
            </p>
          </div>
        </div>

        {/* Scrollable Corporate Department Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
          {(
            [
              ['transfers', `Finance Dept (${pendingTx.length})`],
              ['kyc', `Compliance (${summary?.pendingKycCount ?? 0})`],
              [
                'users',
                `Tech & Users (${allUsers.length}${pendingPwRequests.length > 0 ? ` · ${pendingPwRequests.length} PW` : ''})`,
              ],
              ['fleet', 'Fleet Ops'],
              ['cms', 'Comms & Site'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTab(key);
                if (key === 'cms') {
                  if (data?.siteConfig && !siteDraft) setSiteDraft(data.siteConfig);
                  if (data?.cryptoCoins && !coinAddress) {
                    syncCryptoFields('USDT', 'TRC20');
                  }
                }
              }}
              className={`px-3 py-2 rounded-xl text-[11px] font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                tab === key
                  ? 'bg-[#111827] dark:bg-[#2563EB] text-white'
                  : 'bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] text-[#4B5563] dark:text-[#94A3B8]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/60 px-3.5 py-2.5 text-xs font-medium text-red-800 dark:text-red-200"
          >
            {error}
          </div>
        )}
        {feedback && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-2.5 text-xs font-medium text-emerald-900 dark:text-emerald-100">
            {feedback}
          </div>
        )}

        {loading && !data ? (
          <div className="h-32 rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] animate-pulse" />
        ) : tab === 'transfers' ? (
          <div className="space-y-4">
            {pendingTx.length === 0 ? (
              <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] px-4 py-8 text-center">
                <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
                  All crypto deposits & withdrawals reviewed
                </p>
                <p className="mt-1 text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                  Approving an invitee&apos;s deposit automatically triggers their referrer&apos;s cash bonus and 2x daily yields.
                </p>
              </div>
            ) : (
              pendingTx.map((tx) => {
                const isDeposit = tx.type === 'deposit';
                const busy = busyId === tx.id;
                return (
                  <div
                    key={tx.id}
                    className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isDeposit
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#059669] dark:text-[#34D399]'
                              : 'bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#60A5FA]'
                          }`}
                        >
                          {isDeposit ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC] truncate">
                            {isDeposit ? 'Deposit Request' : 'Withdrawal Request'} ·{' '}
                            {tx.coinSymbol} ({tx.networkCode})
                          </p>
                          <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] truncate">
                            {tx.investorName} · {tx.investorEmail}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-bold text-[#111827] dark:text-[#F8FAFC] shrink-0">
                        {formatUsd(tx.amount)}
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#F9FAFB] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] p-2.5 space-y-1 text-[10.5px]">
                      <p className="text-[#6B7280] dark:text-[#94A3B8]">
                        Submitted:{' '}
                        <span className="text-[#111827] dark:text-[#F8FAFC]">
                          {formatDateTime(tx.createdAt)}
                        </span>
                      </p>
                      {tx.walletAddress && (
                        <p className="font-mono text-[#111827] dark:text-[#F8FAFC] break-all">
                          {isDeposit ? 'Treasury:' : 'Recipient:'} {tx.walletAddress}
                        </p>
                      )}
                      {tx.memo && (
                        <p className="font-mono text-[#111827] dark:text-[#F8FAFC]">
                          Memo/Tag: {tx.memo}
                        </p>
                      )}
                      {tx.txHash && (
                        <p className="font-mono text-[#374151] dark:text-[#CBD5E1] break-all">
                          TXID: {tx.txHash}
                        </p>
                      )}
                      {tx.receiptImageUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewImg({
                              title: `${tx.coinSymbol} Receipt`,
                              url: tx.receiptImageUrl!,
                            })
                          }
                          className="text-[#2563EB] dark:text-[#60A5FA] font-semibold underline cursor-pointer"
                        >
                          Inspect transfer screenshot →
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={noteById[tx.id] ?? ''}
                      onChange={(e) =>
                        setNoteById((prev) => ({ ...prev, [tx.id]: e.target.value }))
                      }
                      placeholder="Optional approval note or rejection reason..."
                      className="w-full h-9 px-3 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleTxReview(tx.id, 'reject')}
                        className="h-10 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-semibold inline-flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleTxReview(tx.id, 'approve')}
                        className="h-10 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold inline-flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {/* Full System Transaction Ledger */}
            {allTx.length > 0 && (
              <div className="space-y-2 pt-2">
                <h2 className="text-xs font-semibold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider">
                  System Ledger ({allTx.length})
                </h2>
                <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] divide-y divide-[#F3F4F6] dark:divide-[#1E293B]">
                  {allTx.slice(0, 20).map((tx) => (
                    <div
                      key={tx.id}
                      className="px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[#111827] dark:text-[#F8FAFC] truncate">
                          {tx.investorName || truncateAddress(tx.investorId)} · {tx.reference}
                        </p>
                        <p className="text-[10.5px] text-[#6B7280] dark:text-[#94A3B8]">
                          {tx.type.toUpperCase()} · {tx.status.toUpperCase()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-semibold text-[#111827] dark:text-[#F8FAFC]">
                          {formatUsd(tx.amount)}
                        </span>
                        {isMaster && (
                          <button
                            type="button"
                            disabled={busyId === tx.id}
                            onClick={() => handleDeleteTx(tx.id)}
                            aria-label="Delete transaction"
                            className="w-7 h-7 rounded-lg border border-[#E5E7EB] dark:border-[#334155] flex items-center justify-center text-red-600 dark:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : tab === 'kyc' ? (
          <div className="space-y-3">
            {kycUsers.length === 0 ? (
              <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] px-4 py-8 text-center">
                <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
                  No KYC records submitted yet
                </p>
              </div>
            ) : (
              kycUsers.map((u) => {
                const v = u.verification;
                const busy = busyId === u.id;
                return (
                  <div
                    key={u.id}
                    className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#E5E7EB] dark:bg-[#1E293B] overflow-hidden flex items-center justify-center shrink-0">
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={u.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">
                              {u.fullName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC] truncate">
                            {u.fullName}
                          </p>
                          <p className="text-[10.5px] text-[#6B7280] dark:text-[#94A3B8] truncate">
                            {u.email} · {u.country}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                          u.kycStatus === 'verified'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#059669] dark:text-[#34D399]'
                            : u.kycStatus === 'pending'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-[#D97706] dark:text-[#FBBF24]'
                              : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                        }`}
                      >
                        {u.kycStatus}
                      </span>
                    </div>

                    {v && (
                      <div className="rounded-xl bg-[#F9FAFB] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] p-3 space-y-2 text-[11px]">
                        <p className="font-semibold text-[#111827] dark:text-[#F8FAFC]">
                          {v.documentType} · <span className="font-mono">{v.documentNumber}</span>
                        </p>
                        {(v.sourceOfFunds || v.annualCapacity) && (
                          <p className="text-[#4B5563] dark:text-[#CBD5E1]">
                            Financial Ability: {v.sourceOfFunds || '—'} ·{' '}
                            {v.annualCapacity || '—'}
                          </p>
                        )}
                        {v.financialProofNote && (
                          <p className="text-[#6B7280] dark:text-[#94A3B8] italic">
                            “{v.financialProofNote}”
                          </p>
                        )}

                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewImg({
                                title: `${u.fullName} — ID Front`,
                                url: v.frontImageUrl,
                              })
                            }
                            className="rounded-lg border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#111827] p-1.5 text-[10px] font-semibold text-[#2563EB] dark:text-[#60A5FA] cursor-pointer"
                          >
                            View ID Front
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewImg({
                                title: `${u.fullName} — Back/Selfie`,
                                url: v.backOrSelfieUrl,
                              })
                            }
                            className="rounded-lg border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#111827] p-1.5 text-[10px] font-semibold text-[#2563EB] dark:text-[#60A5FA] cursor-pointer"
                          >
                            View Selfie/Back
                          </button>
                          {v.financialProofUrl ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewImg({
                                  title: `${u.fullName} — Financial Proof`,
                                  url: v.financialProofUrl!,
                                })
                              }
                              className="rounded-lg border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#111827] p-1.5 text-[10px] font-semibold text-[#059669] dark:text-[#34D399] cursor-pointer"
                            >
                              Financial Proof
                            </button>
                          ) : (
                            <span className="rounded-lg border border-[#F3F4F6] dark:border-[#1E293B] bg-[#F9FAFB] dark:bg-[#0F172A] p-1.5 text-[10px] text-[#9CA3AF] text-center">
                              No Fin. Doc
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <input
                      type="text"
                      value={noteById[u.id] ?? ''}
                      onChange={(e) =>
                        setNoteById((prev) => ({ ...prev, [u.id]: e.target.value }))
                      }
                      placeholder="Reviewer note (optional)..."
                      className="w-full h-9 px-3 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleKycReview(u.id, 'reject')}
                        className="h-9 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-semibold cursor-pointer"
                      >
                        Decline KYC
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleKycReview(u.id, 'approve')}
                        className="h-9 rounded-xl bg-[#059669] text-white text-xs font-semibold inline-flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <BadgeCheck className="w-3.5 h-3.5" />
                        <span>Verify Investor</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : tab === 'users' ? (
          <div className="space-y-3">
            {!isMaster && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/50 p-3 text-[11px] text-amber-900 dark:text-amber-200">
                Only <strong>Executive Operations</strong> or authorized{' '}
                <strong>Technical Department</strong> leads can create, edit, reset passwords,
                or modify department roles system-wide.
              </div>
            )}

            {/* Technical Department — Password Reset Requests Queue */}
            {pendingPwRequests.length > 0 && (
              <section className="rounded-2xl border border-[#C7D2FE] dark:border-indigo-900 bg-[#EEF2FF]/70 dark:bg-indigo-950/40 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-[#1E1B4B] dark:text-indigo-200 inline-flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#4338CA] dark:text-indigo-400" />
                    <span>Technical Dept — Password Reset Requests ({pendingPwRequests.length})</span>
                  </p>
                </div>

                <div className="space-y-2">
                  {pendingPwRequests.map((req) => {
                    const matchedUser = allUsers.find(
                      (u) =>
                        u.id === req.investorId ||
                        u.email.toLowerCase() === req.email.toLowerCase()
                    );
                    return (
                      <div
                        key={req.id}
                        className="rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#111827] p-3 space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-[#111827] dark:text-[#F8FAFC] truncate">
                              {req.investorName || req.email}
                            </p>
                            <p className="text-[10.5px] text-[#6B7280] dark:text-[#94A3B8] truncate">
                              {req.email} · {formatDateTime(req.createdAt)}
                            </p>
                            {req.note && (
                              <p className="mt-1 text-[11px] text-[#374151] dark:text-[#CBD5E1] italic">
                                “{req.note}”
                              </p>
                            )}
                          </div>
                        </div>

                        {isMaster && (
                          <div className="flex items-center gap-2">
                            {matchedUser && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPwResetModal({ user: matchedUser, requestId: req.id });
                                  setTechNewPw('');
                                  setTechResetNote('');
                                }}
                                className="flex-1 h-8 rounded-lg bg-[#2563EB] text-white text-[11px] font-semibold inline-flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <KeyRound className="w-3 h-3" />
                                <span>Set New Password</span>
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={busyId === req.id}
                              onClick={() => handleDismissPwRequest(req.id)}
                              className="h-8 px-3 rounded-lg border border-[#D1D5DB] dark:border-[#334155] text-[11px] font-semibold text-[#4B5563] dark:text-[#CBD5E1] cursor-pointer"
                            >
                              Dismiss
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user, email, code..."
                  className="w-full h-10 pl-8 pr-3 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#111827] text-xs text-[#111827] dark:text-[#F8FAFC]"
                />
              </div>
              {isMaster && (
                <button
                  type="button"
                  onClick={() => setShowCreateUser(true)}
                  className="h-10 px-3 rounded-xl bg-[#2563EB] text-white text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add User</span>
                </button>
              )}
            </div>

            {filteredUsers.map((u) => {
              const busy = busyId === u.id;
              const isTargetMaster = u.role === 'master_admin';
              return (
                <div
                  key={u.id}
                  className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#111827] dark:bg-[#1E293B] text-white overflow-hidden flex items-center justify-center shrink-0">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold">
                            {u.fullName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC] truncate">
                          {u.fullName}
                        </p>
                        <p className="text-[10.5px] text-[#6B7280] dark:text-[#94A3B8] truncate">
                          {u.email}{u.department ? ` · ${u.department}` : ''}
                        </p>
                        <p className="text-[10.5px] font-mono text-[#374151] dark:text-[#CBD5E1] mt-0.5">
                          Bal: {formatUsd(u.walletBalance)} · KYC: {u.kycStatus} · Ref:{' '}
                          {u.referralCode}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                        isTargetMaster
                          ? 'bg-[#1E1B4B] text-white'
                          : u.role === 'admin'
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#60A5FA]'
                            : u.role === 'moderator'
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                              : 'bg-[#F3F4F6] dark:bg-[#1E293B] text-[#374151] dark:text-[#CBD5E1]'
                      }`}
                    >
                      {ROLE_LABELS[u.role]}
                    </span>
                  </div>

                  {isMaster && (
                    <div className="pt-2 border-t border-[#F3F4F6] dark:border-[#1E293B] flex flex-wrap items-center gap-2">
                      {!isTargetMaster && (
                        <div className="flex items-center gap-1 flex-1 min-w-[140px]">
                          <Users className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#94A3B8]" />
                          <select
                            aria-label={`Role for ${u.fullName}`}
                            disabled={busy}
                            value={u.role}
                            onChange={(e) =>
                              handleRoleUpdate(u.id, e.target.value as UserRole)
                            }
                            className="flex-1 h-9 px-2 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]"
                          >
                            <option value="investor">Investor</option>
                            <option value="moderator">Compliance Desk</option>
                            <option value="admin">Dept Officer</option>
                          </select>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => openEditUser(u)}
                        className="h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] text-[11px] font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPwResetModal({ user: u });
                          setTechNewPw('');
                          setTechResetNote('');
                        }}
                        className="h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] text-[11px] font-semibold text-[#4338CA] dark:text-indigo-300 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Password</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setNotifTarget(u.id);
                          setTab('cms');
                          if (data?.siteConfig && !siteDraft) setSiteDraft(data.siteConfig);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] text-[11px] font-semibold text-[#2563EB] dark:text-[#60A5FA] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Bell className="w-3 h-3" />
                        <span>Notify</span>
                      </button>

                      {!isTargetMaster && (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              handleStatusToggle(
                                u.id,
                                u.accountStatus === 'active' ? 'suspended' : 'active'
                              )
                            }
                            className={`h-9 px-2.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                              u.accountStatus === 'active'
                                ? 'border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60'
                                : 'bg-[#059669] text-white'
                            }`}
                          >
                            {u.accountStatus === 'active' ? 'Suspend' : 'Restore'}
                          </button>

                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleDeleteUser(u)}
                            aria-label={`Delete ${u.fullName}`}
                            className="h-9 px-2.5 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : tab === 'fleet' ? (
          <div className="space-y-4">
            {isMaster && (
              <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-4 space-y-2.5">
                <p className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC]">
                  Fleet Yield Cycle Settlement
                </p>
                <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] leading-relaxed">
                  Credit +24h of operational output across active machine rentals immediately.
                </p>
                <button
                  type="button"
                  disabled={busyId === 'advance'}
                  onClick={handleAdvanceCycles}
                  className="w-full h-10 rounded-xl bg-[#111827] dark:bg-[#2563EB] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>Settle +24h Yield Across Active Rentals</span>
                </button>
              </div>
            )}

            {/* Robotic Machines CRUD */}
            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-bold text-[#111827] dark:text-[#F8FAFC]">
                  Robotic Fleet Catalog ({data?.robots.length ?? 0})
                </h2>
                {isMaster && (
                  <button
                    type="button"
                    onClick={() => openRobotModal()}
                    className="px-2.5 py-1.5 rounded-lg bg-[#2563EB] text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Robot</span>
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {(data?.robots ?? []).map((robot) => (
                  <div
                    key={robot.id}
                    className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-[10.5px] font-mono text-[#6B7280] dark:text-[#94A3B8]">
                        {robot.modelCode} · {robot.availableUnits}/{robot.totalUnits} open
                      </p>
                      <p className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC] truncate">
                        {robot.name}
                      </p>
                      <p className="text-[11px] font-mono text-[#059669] dark:text-[#34D399]">
                        {formatUsd(robot.rentalPrice)} · {robot.dailyReturnRate}%/d · Ref +
                        {formatUsd(
                          robot.referralBonusUsd ??
                            (robot.rentalPrice *
                              (data?.siteConfig.referralRewardRatePct ?? 5.5)) /
                              100
                        )}
                      </p>
                    </div>
                    {isMaster && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => openRobotModal(robot)}
                          className="w-8 h-8 rounded-lg border border-[#D1D5DB] dark:border-[#334155] flex items-center justify-center text-[#111827] dark:text-[#F8FAFC] cursor-pointer"
                          aria-label={`Edit ${robot.name}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={busyId === robot.id}
                          onClick={() => handleDeleteRobot(robot.id)}
                          className="w-8 h-8 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/60 flex items-center justify-center text-red-700 dark:text-red-300 cursor-pointer"
                          aria-label={`Delete ${robot.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Active Investor Rentals Management */}
            <section className="space-y-2.5">
              <h2 className="font-display text-sm font-bold text-[#111827] dark:text-[#F8FAFC]">
                Investor Rentals ({data?.rentals.length ?? 0})
              </h2>
              {(data?.rentals ?? []).length === 0 ? (
                <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-5 text-center text-xs text-[#6B7280] dark:text-[#94A3B8]">
                  No rentals created yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {(data?.rentals ?? []).map((r) => {
                    const owner = allUsers.find((u) => u.id === r.investorId);
                    return (
                      <div
                        key={r.id}
                        className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-3.5 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC] truncate">
                              {r.quantity}x {r.robotName}
                            </p>
                            <p className="text-[10.5px] text-[#6B7280] dark:text-[#94A3B8] truncate">
                              {owner ? owner.fullName : r.investorId} ·{' '}
                              {formatUsd(r.effectiveDailyPayout)}/d ({r.yieldMultiplier}x)
                            </p>
                          </div>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#F3F4F6] dark:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC]">
                            {r.status}
                          </span>
                        </div>
                        {isMaster && (
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              disabled={busyId === r.id}
                              onClick={() =>
                                handleRentalUpdate(r.id, {
                                  yieldMultiplier: r.yieldMultiplier === 2 ? 1 : 2,
                                })
                              }
                              className="px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] text-[10.5px] font-semibold text-[#111827] dark:text-[#F8FAFC] cursor-pointer"
                            >
                              {r.yieldMultiplier === 2 ? 'Set 1x Yield' : 'Boost 2x Yield'}
                            </button>
                            <button
                              type="button"
                              disabled={busyId === r.id}
                              onClick={() =>
                                handleRentalUpdate(r.id, { simulatedDaysAdd: 1 })
                              }
                              className="px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] text-[10.5px] font-semibold text-[#2563EB] dark:text-[#60A5FA] cursor-pointer"
                            >
                              +1 Day
                            </button>
                            <button
                              type="button"
                              disabled={busyId === r.id}
                              onClick={() =>
                                handleRentalUpdate(r.id, {
                                  status: r.status === 'active' ? 'completed' : 'active',
                                })
                              }
                              className="px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] text-[10.5px] font-semibold text-[#111827] dark:text-[#F8FAFC] cursor-pointer"
                            >
                              {r.status === 'active' ? 'Complete' : 'Reactivate'}
                            </button>
                            <button
                              type="button"
                              disabled={busyId === r.id}
                              onClick={() => handleDeleteRental(r.id)}
                              className="px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-[10.5px] font-semibold cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        ) : (
          /* App CMS, SiteConfig, Crypto Wallets, Notifications & Dispatches */
          <div className="space-y-4">
            {/* 1. Broadcast / Direct Notification */}
            {isMaster && (
              <form
                onSubmit={handleSendNotification}
                className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-4 space-y-3"
              >
                <p className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
                  <span>Send Live Notification</span>
                </p>

                <select
                  value={notifTarget}
                  onChange={(e) => setNotifTarget(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
                >
                  <option value="all">All Users (System-Wide Broadcast)</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.email})
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  required
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="Notification title..."
                  className="w-full h-10 px-3 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
                />
                <textarea
                  rows={2}
                  required
                  value={notifMsg}
                  onChange={(e) => setNotifMsg(e.target.value)}
                  placeholder="Message sent instantly to user notification area..."
                  className="w-full p-3 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
                />
                <button
                  type="submit"
                  disabled={busyId === 'send-notif'}
                  className="w-full h-10 rounded-xl bg-[#2563EB] text-white text-xs font-semibold cursor-pointer"
                >
                  Push Notification Immediately
                </button>
              </form>
            )}

            {/* 2. Site Display & Referral Settings (System-Wide CMS) */}
            {isMaster && activeSite && (
              <form
                onSubmit={handleSaveSiteConfig}
                className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-4 space-y-3"
              >
                <p className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-[#059669] dark:text-[#34D399]" />
                  <span>App Display, Branding & Referral Rules</span>
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10.5px] text-[#6B7280] dark:text-[#94A3B8] mb-1">
                      Brand Name
                    </label>
                    <input
                      type="text"
                      value={activeSite.brandName}
                      onChange={(e) =>
                        setSiteDraft({ ...activeSite, brandName: e.target.value })
                      }
                      className="w-full h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] text-[#6B7280] dark:text-[#94A3B8] mb-1">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={activeSite.brandSubtitle}
                      onChange={(e) =>
                        setSiteDraft({ ...activeSite, brandSubtitle: e.target.value })
                      }
                      className="w-full h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] text-[#6B7280] dark:text-[#94A3B8] mb-1">
                    Corporate Headquarters Address
                  </label>
                  <input
                    type="text"
                    value={activeSite.headquartersAddress}
                    onChange={(e) =>
                      setSiteDraft({ ...activeSite, headquartersAddress: e.target.value })
                    }
                    placeholder="Technoparkstrasse 1, Tower A, 8005 Zurich, Switzerland"
                    className="w-full h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] text-[#6B7280] dark:text-[#94A3B8] mb-1">
                    Top Announcement Banner (blank to hide)
                  </label>
                  <input
                    type="text"
                    value={activeSite.announcementBanner}
                    onChange={(e) =>
                      setSiteDraft({ ...activeSite, announcementBanner: e.target.value })
                    }
                    placeholder="e.g. Invite investors to unlock 2x daily yields!"
                    className="w-full h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] text-[#6B7280] dark:text-[#94A3B8] mb-1">
                    Hero Kicker
                  </label>
                  <input
                    type="text"
                    value={activeSite.heroKicker}
                    onChange={(e) =>
                      setSiteDraft({ ...activeSite, heroKicker: e.target.value })
                    }
                    className="w-full h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] text-[#6B7280] dark:text-[#94A3B8] mb-1">
                    Hero Headline
                  </label>
                  <input
                    type="text"
                    value={activeSite.heroTitle}
                    onChange={(e) =>
                      setSiteDraft({ ...activeSite, heroTitle: e.target.value })
                    }
                    className="w-full h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] text-[#6B7280] dark:text-[#94A3B8] mb-1">
                    Hero Description
                  </label>
                  <textarea
                    rows={2}
                    value={activeSite.heroDescription}
                    onChange={(e) =>
                      setSiteDraft({ ...activeSite, heroDescription: e.target.value })
                    }
                    className="w-full p-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={activeSite.heroImageUrl}
                    onChange={(e) =>
                      setSiteDraft({ ...activeSite, heroImageUrl: e.target.value })
                    }
                    placeholder="Hero image URL or upload..."
                    className="flex-1 h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
                  />
                  <label className="h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] text-[11px] font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-1 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageUpload(e, (url) =>
                          setSiteDraft({ ...activeSite, heroImageUrl: url })
                        )
                      }
                      className="sr-only"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10.5px] text-[#6B7280] dark:text-[#94A3B8] mb-1">
                      Invite Reward %
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={activeSite.referralRewardRatePct}
                      onChange={(e) =>
                        setSiteDraft({
                          ...activeSite,
                          referralRewardRatePct: Number(e.target.value),
                        })
                      }
                      className="w-full h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-mono text-xs text-[#111827] dark:text-[#F8FAFC]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] text-[#6B7280] dark:text-[#94A3B8] mb-1">
                      2x Yield Boost Days
                    </label>
                    <input
                      type="number"
                      value={activeSite.referralDoubleYieldDays}
                      onChange={(e) =>
                        setSiteDraft({
                          ...activeSite,
                          referralDoubleYieldDays: Number(e.target.value),
                        })
                      }
                      className="w-full h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-mono text-xs text-[#111827] dark:text-[#F8FAFC]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] text-[#6B7280] dark:text-[#94A3B8] mb-1">
                    Footer Notice
                  </label>
                  <input
                    type="text"
                    value={activeSite.footerNotice}
                    onChange={(e) =>
                      setSiteDraft({ ...activeSite, footerNotice: e.target.value })
                    }
                    className="w-full h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={busyId === 'site-cfg'}
                  className="w-full h-10 rounded-xl bg-[#059669] text-white text-xs font-semibold cursor-pointer"
                >
                  Publish Site Display Changes Live
                </button>
              </form>
            )}

            {/* 3. Binance Crypto Wallets Config */}
            {isMaster && coins.length > 0 && (
              <form
                onSubmit={handleSaveCryptoNetwork}
                className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-4 space-y-3"
              >
                <p className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-[#D97706]" />
                  <span>Crypto Treasury Wallets & Fees</span>
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={coinSymbol}
                    onChange={(e) => {
                      const sym = e.target.value as BinanceCoinSymbol;
                      const found = coins.find((c) => c.symbol === sym);
                      syncCryptoFields(sym, found?.networks[0].networkCode ?? 'BEP20');
                    }}
                    className="h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
                  >
                    {coins.map((c) => (
                      <option key={c.symbol} value={c.symbol}>
                        {c.symbol} — {c.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={networkCode}
                    onChange={(e) =>
                      syncCryptoFields(coinSymbol, e.target.value as BinanceNetworkCode)
                    }
                    className="h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
                  >
                    {(coins.find((c) => c.symbol === coinSymbol)?.networks ?? []).map(
                      (n) => (
                        <option key={n.networkCode} value={n.networkCode}>
                          {n.networkCode} ({n.networkName})
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[10.5px] text-[#6B7280] dark:text-[#94A3B8] mb-1">
                    Deposit Wallet Address
                  </label>
                  <input
                    type="text"
                    required
                    value={coinAddress}
                    onChange={(e) => setCoinAddress(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-mono text-[11px] text-[#111827] dark:text-[#F8FAFC]"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] text-[#6B7280] dark:text-[#94A3B8] mb-1">
                    Destination Tag / Memo (XRP, XLM, TON)
                  </label>
                  <input
                    type="text"
                    value={coinMemo}
                    onChange={(e) => setCoinMemo(e.target.value)}
                    placeholder="Optional memo or destination tag"
                    className="w-full h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-mono text-[11px] text-[#111827] dark:text-[#F8FAFC]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#6B7280] dark:text-[#94A3B8] mb-1">
                      Min Dep ($)
                    </label>
                    <input
                      type="number"
                      value={coinMinDep}
                      onChange={(e) => setCoinMinDep(e.target.value)}
                      className="w-full h-9 px-2 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-mono text-xs text-[#111827] dark:text-[#F8FAFC]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#6B7280] dark:text-[#94A3B8] mb-1">
                      Min With ($)
                    </label>
                    <input
                      type="number"
                      value={coinMinWith}
                      onChange={(e) => setCoinMinWith(e.target.value)}
                      className="w-full h-9 px-2 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-mono text-xs text-[#111827] dark:text-[#F8FAFC]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#6B7280] dark:text-[#94A3B8] mb-1">
                      Fee ($)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={coinFee}
                      onChange={(e) => setCoinFee(e.target.value)}
                      className="w-full h-9 px-2 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-mono text-xs text-[#111827] dark:text-[#F8FAFC]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busyId === 'crypto-net'}
                  className="w-full h-10 rounded-xl bg-[#111827] dark:bg-[#2563EB] text-white text-xs font-semibold cursor-pointer"
                >
                  Save {coinSymbol} ({networkCode}) Wallet Settings
                </button>
              </form>
            )}

            {/* 4. Fleet Dispatches / News CRUD */}
            <form
              onSubmit={handlePublishOrUpdateDispatch}
              className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
                  <span>{editingDispatch ? 'Edit Dispatch' : 'Publish Fleet Dispatch'}</span>
                </p>
                {editingDispatch && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDispatch(null);
                      setDispTitle('');
                      setDispSummary('');
                      setDispImageUrl('');
                    }}
                    className="text-[11px] font-semibold text-red-600 cursor-pointer"
                  >
                    Cancel edit
                  </button>
                )}
              </div>

              <select
                value={dispCategory}
                onChange={(e) => setDispCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
              >
                <option value="Deployment">Deployment</option>
                <option value="Hardware">Hardware</option>
                <option value="Settlement">Settlement</option>
              </select>

              <input
                type="text"
                required
                value={dispTitle}
                onChange={(e) => setDispTitle(e.target.value)}
                placeholder="Headline (e.g. 12 Kestrel H2 units live in Zurich)"
                className="w-full h-10 px-3 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
              />

              <textarea
                rows={3}
                required
                value={dispSummary}
                onChange={(e) => setDispSummary(e.target.value)}
                placeholder="Write operational summary..."
                className="w-full p-3 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
              />

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={dispImageUrl}
                  onChange={(e) => setDispImageUrl(e.target.value)}
                  placeholder="Optional story image URL..."
                  className="flex-1 h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
                />
                <label className="h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] text-[11px] font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-1 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setDispImageUrl)}
                    className="sr-only"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={busyId === 'dispatch'}
                className="w-full h-10 rounded-xl bg-[#2563EB] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>{editingDispatch ? 'Update Dispatch' : 'Broadcast Live Update'}</span>
              </button>
            </form>

            {/* Existing Dispatches list with Edit/Delete */}
            <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] divide-y divide-[#F3F4F6] dark:divide-[#1E293B]">
              {(data?.dispatches ?? []).map((d) => (
                <div key={d.id} className="p-3.5 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#111827] dark:text-[#F8FAFC] truncate">
                      {d.title}
                    </p>
                    <p className="text-[10.5px] text-[#6B7280] dark:text-[#94A3B8]">
                      {d.category} · {d.publishedAt}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDispatch(d);
                        setDispCategory(d.category);
                        setDispTitle(d.title);
                        setDispSummary(d.summary);
                        setDispImageUrl(d.imageUrl || '');
                      }}
                      className="w-8 h-8 rounded-lg border border-[#D1D5DB] dark:border-[#334155] flex items-center justify-center text-[#111827] dark:text-[#F8FAFC] cursor-pointer"
                      aria-label={`Edit ${d.title}`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {isMaster && (
                      <button
                        type="button"
                        disabled={busyId === d.id}
                        onClick={() => handleDeleteDispatch(d.id)}
                        className="w-8 h-8 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/60 flex items-center justify-center text-red-700 dark:text-red-300 cursor-pointer"
                        aria-label={`Delete ${d.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateUser && (
        <div
          onClick={() => setShowCreateUser(false)}
          className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center"
          role="dialog"
          aria-modal="true"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateUser}
            className="w-full max-w-[430px] max-h-[88dvh] overflow-y-auto bg-white dark:bg-[#111827] border-t border-[#E5E7EB] dark:border-[#1E293B] rounded-t-3xl p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC]">
                Create New User Account
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateUser(false)}
                className="w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-[#334155] flex items-center justify-center text-[#6B7280] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              required
              value={newUserFullName}
              onChange={(e) => setNewUserFullName(e.target.value)}
              placeholder="Full Name"
              className="w-full h-10 px-3 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
            />
            <input
              type="email"
              required
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full h-10 px-3 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
            />
            <div className="relative">
              <input
                type={showNewUserPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="Temporary Password (min 6 chars)"
                className="w-full h-10 pl-3 pr-10 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
              />
              <button
                type="button"
                onClick={() => setShowNewUserPassword((p) => !p)}
                aria-label={showNewUserPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-[#6B7280] dark:text-[#94A3B8] cursor-pointer"
              >
                {showNewUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="space-y-2">
              <CountrySelectField
                value={newUserCountry}
                compact
                placeholder="Click to select country"
                onChange={(picked: CountryOption) => {
                  setNewUserCountry(picked.name);
                  const parsed = parseInternationalPhone(newUserPhone, picked.name);
                  if (parsed.nationalNumber) {
                    setNewUserPhone(
                      formatInternationalPhone(picked.dialCode, parsed.nationalNumber)
                    );
                  }
                }}
              />
              <PhoneDialInputField
                value={newUserPhone}
                countryName={newUserCountry}
                compact
                onChange={(nextPhone, dialCountry) => {
                  setNewUserPhone(nextPhone);
                  if (!newUserCountry && dialCountry) {
                    setNewUserCountry(dialCountry.name);
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                className="h-10 px-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
              >
                <option value="investor">Investor</option>
                <option value="moderator">Compliance Desk</option>
                <option value="admin">Dept Officer</option>
              </select>
              <select
                value={newUserKyc}
                onChange={(e) => setNewUserKyc(e.target.value as KycStatus)}
                className="h-10 px-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
              >
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="unverified">Unverified</option>
              </select>
              <input
                type="number"
                value={newUserBalance}
                onChange={(e) => setNewUserBalance(e.target.value)}
                placeholder="USD Bal"
                className="h-10 px-2.5 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-mono text-xs text-[#111827] dark:text-[#F8FAFC]"
              />
            </div>
            {newUserRole !== 'investor' && (
              <select
                value={newUserDepartment}
                onChange={(e) => setNewUserDepartment(e.target.value as CorporateDepartment)}
                className="w-full h-10 px-3 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            )}
            <button
              type="submit"
              disabled={busyId === 'create-user'}
              className="w-full h-11 rounded-xl bg-[#2563EB] text-white text-xs font-semibold cursor-pointer"
            >
              Create Account
            </button>
          </form>
        </div>
      )}

      {/* Technical Department Password Reset Modal */}
      {pwResetModal && (
        <div
          onClick={() => setPwResetModal(null)}
          className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center"
          role="dialog"
          aria-modal="true"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleTechPasswordReset}
            className="w-full max-w-[430px] bg-white dark:bg-[#111827] border-t border-[#E5E7EB] dark:border-[#1E293B] rounded-t-3xl p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-[#2563EB]" />
                  <span>Technical Dept Password Reset</span>
                </h3>
                <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] truncate">
                  {pwResetModal.user.fullName} ({pwResetModal.user.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPwResetModal(null)}
                className="w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-[#334155] flex items-center justify-center text-[#6B7280] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-[10.5px] font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1">
                New Account Password (min 6 characters)
              </label>
              <div className="relative">
                <input
                  type={showTechNewPw ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={techNewPw}
                  onChange={(e) => setTechNewPw(e.target.value)}
                  placeholder="Enter new password for user"
                  className="w-full h-10 pl-3 pr-10 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
                />
                <button
                  type="button"
                  onClick={() => setShowTechNewPw((p) => !p)}
                  aria-label={showTechNewPw ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-[#6B7280] dark:text-[#94A3B8] cursor-pointer"
                >
                  {showTechNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1">
                Technical Department Security Note (Optional)
              </label>
              <input
                type="text"
                value={techResetNote}
                onChange={(e) => setTechResetNote(e.target.value)}
                placeholder="e.g. Identity confirmed via compliance ticket"
                className="w-full h-10 px-3 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
              />
            </div>

            <button
              type="submit"
              disabled={busyId === 'tech-pw-reset'}
              className="w-full h-11 rounded-xl bg-[#2563EB] text-white text-xs font-semibold cursor-pointer"
            >
              Apply Technical Password Reset
            </button>
          </form>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div
          onClick={() => setEditingUser(null)}
          className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center"
          role="dialog"
          aria-modal="true"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSaveUserEdit}
            className="w-full max-w-[430px] max-h-[90dvh] overflow-y-auto bg-white dark:bg-[#111827] border-t border-[#E5E7EB] dark:border-[#1E293B] rounded-t-3xl p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC]">
                Edit {editingUser.fullName}
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-[#334155] flex items-center justify-center text-[#6B7280] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-[#6B7280] dark:text-[#94A3B8] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#6B7280] dark:text-[#94A3B8] mb-1">
                  Country
                </label>
                <CountrySelectField
                  value={editCountry}
                  compact
                  onChange={(picked: CountryOption) => {
                    setEditCountry(picked.name);
                    const parsed = parseInternationalPhone(editPhone, picked.name);
                    if (parsed.nationalNumber) {
                      setEditPhone(
                        formatInternationalPhone(picked.dialCode, parsed.nationalNumber)
                      );
                    }
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-[#6B7280] dark:text-[#94A3B8] mb-1">
                Phone
              </label>
              <PhoneDialInputField
                value={editPhone}
                countryName={editCountry}
                compact
                onChange={(nextPhone, dialCountry) => {
                  setEditPhone(nextPhone);
                  if (!editCountry && dialCountry) {
                    setEditCountry(dialCountry.name);
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-[#6B7280] dark:text-[#94A3B8] mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#6B7280] dark:text-[#94A3B8] mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-[#6B7280] dark:text-[#94A3B8] mb-1">
                  Wallet Balance ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-mono text-xs text-[#111827] dark:text-[#F8FAFC]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#6B7280] dark:text-[#94A3B8] mb-1">
                  Held Escrow ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editHeld}
                  onChange={(e) => setEditHeld(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-mono text-xs text-[#111827] dark:text-[#F8FAFC]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#6B7280] dark:text-[#94A3B8] mb-1">
                  Grant 2x Days
                </label>
                <input
                  type="number"
                  min="0"
                  value={editBoostDays}
                  onChange={(e) => setEditBoostDays(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-mono text-xs text-[#111827] dark:text-[#F8FAFC]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-[#6B7280] dark:text-[#94A3B8] mb-1">
                  KYC Status
                </label>
                <select
                  value={editKyc}
                  onChange={(e) => setEditKyc(e.target.value as KycStatus)}
                  className="w-full h-9 px-2 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
                >
                  <option value="unverified">Unverified</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              {editingUser.role !== 'master_admin' && (
                <>
                  <div>
                    <label className="block text-[10px] text-[#6B7280] dark:text-[#94A3B8] mb-1">
                      Role
                    </label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as UserRole)}
                      className="w-full h-9 px-2 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
                    >
                      <option value="investor">Investor</option>
                      <option value="moderator">Compliance Desk</option>
                      <option value="admin">Dept Officer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#6B7280] dark:text-[#94A3B8] mb-1">
                      Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as AccountStatus)}
                      className="w-full h-9 px-2 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            {(editingUser.role === 'master_admin' || editRole !== 'investor') && (
              <div>
                <label className="block text-[10px] text-[#6B7280] dark:text-[#94A3B8] mb-1">
                  Corporate Department
                </label>
                <select
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value as CorporateDepartment)}
                  className="w-full h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={busyId === editingUser.id}
              className="w-full h-11 rounded-xl bg-[#2563EB] text-white text-xs font-semibold cursor-pointer"
            >
              Save User Changes System-Wide
            </button>
          </form>
        </div>
      )}

      {/* Create / Edit Robot Modal */}
      {robotModalOpen && (
        <div
          onClick={() => setRobotModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center"
          role="dialog"
          aria-modal="true"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSaveRobot}
            className="w-full max-w-[430px] max-h-[90dvh] overflow-y-auto bg-white dark:bg-[#111827] border-t border-[#E5E7EB] dark:border-[#1E293B] rounded-t-3xl p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#2563EB]" />
                <span>{editingRobot ? `Edit ${editingRobot.name}` : 'Add AI Robot'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setRobotModalOpen(false)}
                className="w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-[#334155] flex items-center justify-center text-[#6B7280] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={rName}
                onChange={(e) => setRName(e.target.value)}
                placeholder="Machine Name"
                className="h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
              />
              <input
                type="text"
                required
                value={rModel}
                onChange={(e) => setRModel(e.target.value)}
                placeholder="Model Code (e.g. NX-A7)"
                className="h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-mono text-xs text-[#111827] dark:text-[#F8FAFC]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={rCategory}
                onChange={(e) => setRCategory(e.target.value as RobotCategory)}
                className="h-9 px-2 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
              >
                {ROBOT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                value={rHub}
                onChange={(e) => setRHub(e.target.value)}
                placeholder="Facility Hub"
                className="h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
              />
            </div>

            <input
              type="text"
              required
              value={rTagline}
              onChange={(e) => setRTagline(e.target.value)}
              placeholder="Short tagline"
              className="w-full h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
            />

            <textarea
              rows={2}
              value={rDesc}
              onChange={(e) => setRDesc(e.target.value)}
              placeholder="Detailed operational description..."
              className="w-full p-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
            />

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-[#6B7280] dark:text-[#94A3B8] mb-0.5">
                  Price ($)
                </label>
                <input
                  type="number"
                  required
                  value={rPrice}
                  onChange={(e) => setRPrice(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-mono text-xs text-[#111827] dark:text-[#F8FAFC]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#6B7280] dark:text-[#94A3B8] mb-0.5">
                  Daily Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={rRate}
                  onChange={(e) => setRRate(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-mono text-xs text-[#111827] dark:text-[#F8FAFC]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#6B7280] dark:text-[#94A3B8] mb-0.5">
                  Cycle (Days)
                </label>
                <input
                  type="number"
                  required
                  value={rCycle}
                  onChange={(e) => setRCycle(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-mono text-xs text-[#111827] dark:text-[#F8FAFC]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-[#6B7280] dark:text-[#94A3B8] mb-0.5">
                  Total Units
                </label>
                <input
                  type="number"
                  required
                  value={rTotalUnits}
                  onChange={(e) => setRTotalUnits(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-mono text-xs text-[#111827] dark:text-[#F8FAFC]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#6B7280] dark:text-[#94A3B8] mb-0.5">
                  Open Units
                </label>
                <input
                  type="number"
                  required
                  value={rAvailUnits}
                  onChange={(e) => setRAvailUnits(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-mono text-xs text-[#111827] dark:text-[#F8FAFC]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#6B7280] dark:text-[#94A3B8] mb-0.5">
                  Ref Bonus ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={rRefBonus}
                  onChange={(e) => setRRefBonus(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-mono text-xs text-[#111827] dark:text-[#F8FAFC]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={rImageUrl}
                onChange={(e) => setRImageUrl(e.target.value)}
                placeholder="Robot image URL or upload..."
                className="flex-1 h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC]"
              />
              <label className="h-9 px-2.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] text-[11px] font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-1 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, setRImageUrl)}
                  className="sr-only"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={busyId === 'robot-save'}
              className="w-full h-11 rounded-xl bg-[#2563EB] text-white text-xs font-semibold cursor-pointer"
            >
              {editingRobot ? 'Save Robot Changes' : 'Publish Robot to Fleet'}
            </button>
          </form>
        </div>
      )}

      {/* Document / Screenshot Lightbox */}
      {previewImg && (
        <div
          onClick={() => setPreviewImg(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[400px] bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-[#E5E7EB] dark:border-[#1E293B] flex items-center justify-between">
              <p className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC] truncate">
                {previewImg.title}
              </p>
              <button
                type="button"
                onClick={() => setPreviewImg(null)}
                className="w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-[#334155] flex items-center justify-center text-[#374151] dark:text-[#CBD5E1] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 bg-[#F3F4F6] dark:bg-[#0B1120]">
              <img
                src={previewImg.url}
                alt={previewImg.title}
                className="w-full max-h-[65dvh] object-contain rounded-xl bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
