'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency, parseCurrency } from '@/lib/format';
import { householdRepository } from '../../repository/household';
import { HouseholdData, Transaction } from '../../domain/models';
import { 
  calculateRawSafeToSpend, 
  calculateDailyAllowance, 
  calculateRemainingSpendingDays,
  applyTransaction,
  payObligation,
  simulatePurchase,
  undoTransaction,
  calculateOutstandingObligations
} from '../../domain/engine';
import { 
  CheckCircle2, Plus, CreditCard, ShoppingBag, 
  Check, Calendar, 
  Sparkles, Users, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';

export default function DashboardClient() {
  const router = useRouter();
  
  const [household, setHousehold] = useState<HouseholdData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Modals state
  const [isSpendModalOpen, setIsSpendModalOpen] = useState(false);
  const [spendAmount, setSpendAmount] = useState(0);
  const [spendNote, setSpendNote] = useState('');

  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [simulateAmount, setSimulateAmount] = useState(0);

  const [isObligationModalOpen, setIsObligationModalOpen] = useState(false);
  const [newObName, setNewObName] = useState('');
  const [newObAmount, setNewObAmount] = useState(0);
  const [newObDate, setNewObDate] = useState('');

  // AI Assistant state
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiConfirmActions, setAiConfirmActions] = useState<any[] | null>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  // UI state
  const [showBreakdown, setShowBreakdown] = useState(false);
  
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      let data = householdRepository.get();
      if (!data) {
        // Try legacy migration
        try {
          const { getLegacyData, clearLegacyCookie } = await import('../actions');
          const legacyRaw = await getLegacyData();
          if (legacyRaw) {
            const migrated = householdRepository.migrateLegacy(legacyRaw);
            householdRepository.save(migrated);
            data = migrated;
            await clearLegacyCookie();
          }
        } catch (e) {
          console.error("Migration failed", e);
        }
      }

      if (isMounted) {
        if (!data) {
          router.push('/onboarding');
        } else {
          setHousehold(data);
        }
        setIsLoaded(true);
      }
    }
    
    // Defer execution slightly to avoid synchronous setState warning
    setTimeout(loadData, 0);
    
    return () => { isMounted = false; };
  }, [router]);

  const updateHousehold = (newData: HouseholdData) => {
    householdRepository.save(newData);
    setHousehold(newData);
  };

  const handleSpend = () => {
    if (!household || spendAmount <= 0) return;
    const newData = applyTransaction(household, {
      type: 'expense',
      amount: spendAmount,
      description: spendNote || 'Chi tiêu'
    });
    updateHousehold(newData);
    setIsSpendModalOpen(false);
    setSpendAmount(0);
    setSpendNote('');
  };

  const handleAddObligation = () => {
    if (!household || newObAmount <= 0 || !newObName || !newObDate) return;
    
    const newData = {
      ...household,
      obligations: [...household.obligations, {
        id: crypto.randomUUID(),
        title: newObName,
        amount: newObAmount,
        dueDate: new Date(newObDate).toISOString(),
        status: 'pending' as const,
        createdAt: new Date().toISOString()
      }],
      updatedAt: new Date().toISOString()
    };
    
    updateHousehold(newData);
    setIsObligationModalOpen(false);
    setNewObName('');
    setNewObAmount(0);
    setNewObDate('');
  };

  const handleAIRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || !household) return;
    setAiLoading(true);
    
    try {
      const pendingObs = household.obligations.filter(o => o.status === 'pending');
      const m = await import('../actions');
      const result = await m.parseExpenseWithAI(aiInput, pendingObs);
      setAiConfirmActions(result.actions);
    } catch (error: unknown) {
      alert("Lỗi: " + (error instanceof Error ? error.message : String(error)));
    }
    setAiLoading(false);
  };

  const confirmAIActions = () => {
    if (!household || !aiConfirmActions) return;
    
    let newData = { ...household };
    for (const actUntyped of aiConfirmActions) {
      const act = actUntyped as any; // Cast internally since Zod already validated it
      if (act.type === 'expense' || act.type === 'income') {
        newData = applyTransaction(newData, {
          type: act.type,
          amount: act.amount,
          description: act.description,
          category: act.category
        });
      } else if (act.type === 'pay_obligation') {
        newData = payObligation(newData, act.obligationId);
      }
    }
    
    updateHousehold(newData);
    setAiConfirmActions(null);
    setAiInput('');
  };

  if (!isLoaded || !household) return null;

  const rawSafeToSpend = calculateRawSafeToSpend(household);
  const dailyAmount = calculateDailyAllowance(household);
  const remainingDays = calculateRemainingSpendingDays(household.nextPayday);
  const pendingObsTotal = calculateOutstandingObligations(household);

  const nextObligations = household.obligations
    .filter(o => o.status === 'pending')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const recentTransactions = [...household.transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl shadow-slate-200/50 relative pb-32">
        
        {/* HEADER */}
        <div className="bg-white p-6 shadow-sm flex justify-between items-center sticky top-0 z-20 border-b border-slate-100">
          <div className="font-bold text-lg text-slate-900 tracking-tight">Family<span className="text-indigo-600">Money</span></div>
          <div className="text-sm font-semibold text-slate-500">Còn {remainingDays} ngày</div>
        </div>

        <div className="px-6 py-6 space-y-6">
          
          {/* 1. SAFE-TO-SPEND HERO */}
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-indigo-900/5 border border-slate-100 text-center relative overflow-hidden">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-3">
              CÒN ĐƯỢC TIÊU
            </p>
            
            {rawSafeToSpend >= 0 ? (
              <>
                <h1 className="text-5xl font-extrabold tracking-tight mb-2 text-slate-900">
                  {formatCurrency(rawSafeToSpend)}
                </h1>
                {remainingDays > 0 && (
                  <p className="text-indigo-600 font-bold text-lg mt-2">
                    ≈ {formatCurrency(dailyAmount)} <span className="text-sm text-indigo-400">/ ngày</span>
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase mb-2">
                  <AlertCircle size={14} /> Đang thiếu
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-red-600 mb-2">
                  {formatCurrency(Math.abs(rawSafeToSpend))}
                </h1>
                <p className="text-slate-600 text-sm font-medium">để đủ cho các khoản đã dự kiến đến kỳ lương.</p>
              </>
            )}

            <button 
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="mt-6 text-sm font-semibold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 w-full"
            >
              Vì sao còn số này? {showBreakdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showBreakdown && (
              <div className="mt-4 pt-4 border-t border-slate-100 text-sm font-medium text-slate-500 text-left space-y-2">
                <div className="flex justify-between">
                  <span>Tiền hiện có</span>
                  <span className="text-slate-900">{formatCurrency(household.balance)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Khoản phải trả</span>
                  <span className="text-orange-500">-{formatCurrency(pendingObsTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tiết kiệm đã khóa</span>
                  <span className="text-teal-600">-{formatCurrency(household.lockedSavings)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dự phòng</span>
                  <span className="text-teal-600">-{formatCurrency(household.emergencyReserve)}</span>
                </div>
              </div>
            )}
          </div>

          {/* 2. AI ASSISTANT INPUT */}
          <div>
            <h2 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-500" /> Hôm nay nhà mình đã chi gì?
            </h2>
            <form onSubmit={handleAIRequest} className="flex gap-2">
              <input
                type="text"
                placeholder="VD: ăn trưa 80k, đổ xăng 100k"
                className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                disabled={aiLoading}
              />
              <button 
                type="submit"
                disabled={aiLoading || !aiInput.trim()}
                className="bg-indigo-600 text-white rounded-2xl px-6 font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {aiLoading ? "Đang xử lý..." : "Ghi"}
              </button>
            </form>

            {/* AI Confirmation */}
            {aiConfirmActions && (
              <div className="mt-3 bg-indigo-50 p-4 rounded-2xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2">Mình hiểu là:</p>
                <div className="space-y-2 mb-4">
                  {aiConfirmActions.map((act, i) => (
                    <div key={i} className="flex justify-between text-sm font-medium text-slate-700 bg-white p-2 rounded-xl">
                      <span>{act.description || (act.type === 'pay_obligation' ? 'Trả hóa đơn' : '')}</span>
                      <span className="font-bold">{formatCurrency(act.amount)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setAiConfirmActions(null)} className="flex-1 py-2 bg-white text-slate-600 font-bold rounded-xl border border-slate-200">Sửa lại</button>
                  <button onClick={confirmAIActions} className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-xl">Xác nhận</button>
                </div>
              </div>
            )}
          </div>

          {/* 3. MANUAL ENTRY / SIMULATOR */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setIsSpendModalOpen(true)}
              className="py-4 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center gap-2 hover:bg-slate-50"
            >
              <Plus size={18} /> Ghi thủ công
            </button>
            <button 
              onClick={() => setIsSimulateModalOpen(true)}
              className="py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2 hover:bg-slate-800"
            >
              <ShoppingBag size={18} /> Thử trước khi mua
            </button>
          </div>

          {/* 4. UPCOMING OBLIGATIONS */}
          <div className="pt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Sắp phải trả</h2>
              <button 
                onClick={() => setIsObligationModalOpen(true)}
                className="text-sm font-bold text-indigo-600 flex items-center gap-1"
              >
                <Plus size={16} /> Thêm khoản
              </button>
            </div>
            
            {nextObligations.length > 0 ? (
              <div className="space-y-3">
                {nextObligations.map(ob => {
                  const dueDate = new Date(ob.dueDate);
                  const formatCalDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
                  const startDate = formatCalDate(dueDate);
                  const endDateObj = new Date(dueDate);
                  endDateObj.setDate(endDateObj.getDate() + 1);
                  const endDate = formatCalDate(endDateObj);
                  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Thanh+to%C3%A1n%3A+${encodeURIComponent(ob.title)}&dates=${startDate}/${endDate}`;

                  return (
                    <div key={ob.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-900">{ob.title}</p>
                          <p className="text-xs font-medium text-slate-400 mt-0.5">
                            {new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(dueDate)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="font-bold text-slate-900">{formatCurrency(ob.amount)}</span>
                          <button 
                            onClick={() => updateHousehold(payObligation(household, ob.id))}
                            className="text-xs font-bold flex items-center gap-1 text-slate-400 hover:text-green-600 bg-slate-50 hover:bg-green-50 px-3 py-1.5 rounded-full"
                          >
                            <Check size={14} /> Đã trả
                          </button>
                        </div>
                      </div>
                      <div className="border-t border-slate-50 pt-2">
                        <a href={googleCalUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-blue-600 flex items-center gap-1 w-fit">
                          <Calendar size={14} /> Thêm vào lịch
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-sm font-medium">
                Chưa có khoản nào phải trả trước kỳ lương.
              </div>
            )}
          </div>

          {/* 5. RECENT TRANSACTIONS */}
          <div className="pt-4">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Gần đây</h2>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map(tx => (
                  <div key={tx.id} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div>
                      <p className="font-bold text-slate-900">{tx.description}</p>
                      <p className="text-xs text-slate-400 font-medium">
                        {new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(tx.createdAt))}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`font-bold ${tx.type === 'expense' || tx.type === 'bill_payment' ? 'text-slate-900' : 'text-green-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                      <button 
                        onClick={() => updateHousehold(undoTransaction(household, tx.id))}
                        className="text-xs text-slate-400 font-semibold hover:text-red-500"
                      >
                        Hoàn tác
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 text-sm font-medium py-4">Chưa có giao dịch nào được ghi.</div>
            )}
          </div>

          {/* 6. SHARE SNAPSHOT */}
          <div className="pt-4 border-t border-slate-100">
            <button 
              onClick={async () => {
                const { createEncryptedSnapshot } = await import('../../repository/snapshot');
                const payload = await createEncryptedSnapshot(household);
                const url = `${window.location.origin}/join#payload=${payload}`;
                navigator.clipboard.writeText(url);
                alert('Đã copy link mã hóa! Gửi cho vợ/chồng để xem tình hình hiện tại nhé.');
              }}
              className="w-full py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl border border-slate-200 flex items-center justify-center gap-2 hover:bg-slate-200"
            >
              <Users size={18} className="text-indigo-600" />
              Gửi tình hình hiện tại
            </button>
          </div>

        </div>

        {/* MODALS */}
        {/* SPEND MODAL */}
        {isSpendModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center">
            <div className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Ghi thủ công</h3>
                <button onClick={() => setIsSpendModalOpen(false)} className="w-8 h-8 bg-slate-100 rounded-full font-bold text-slate-500">&times;</button>
              </div>
              <div className="space-y-4">
                <input type="text" inputMode="numeric" placeholder="Số tiền" className="w-full text-3xl font-extrabold bg-slate-50 rounded-2xl p-4 outline-none text-slate-900" value={spendAmount ? formatCurrency(spendAmount).replace(' ₫', '') : ''} onChange={(e) => setSpendAmount(parseCurrency(e.target.value))} />
                <input type="text" placeholder="Nội dung" className="w-full bg-slate-50 rounded-xl p-4 font-bold outline-none text-slate-900" value={spendNote} onChange={(e) => setSpendNote(e.target.value)} />
                <button onClick={handleSpend} disabled={spendAmount <= 0} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold disabled:opacity-50 mt-4">Ghi sổ</button>
              </div>
            </div>
          </div>
        )}

        {/* SIMULATOR MODAL */}
        {isSimulateModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center">
            <div className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Thử trước khi mua</h3>
                <button onClick={() => setIsSimulateModalOpen(false)} className="w-8 h-8 bg-slate-100 rounded-full font-bold text-slate-500">&times;</button>
              </div>
              <div className="space-y-6">
                <input type="text" inputMode="numeric" placeholder="Món đồ giá bao nhiêu?" className="w-full text-3xl font-extrabold bg-slate-50 rounded-2xl p-4 outline-none text-slate-900" value={simulateAmount ? formatCurrency(simulateAmount).replace(' ₫', '') : ''} onChange={(e) => setSimulateAmount(parseCurrency(e.target.value))} />
                
                {simulateAmount > 0 && (
                  <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden">
                    <p className="text-slate-400 font-bold mb-4 uppercase text-xs tracking-wider">Nếu mua:</p>
                    <div className="space-y-4 relative z-10">
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-300">Còn được tiêu:</span>
                        <span className={`font-bold ${simulatePurchase(household, simulateAmount).simulatedRawSafeToSpend >= 0 ? 'text-white' : 'text-red-400'}`}>
                          {formatCurrency(simulatePurchase(household, simulateAmount).simulatedRawSafeToSpend)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-300">Mỗi ngày:</span>
                        <span className="font-bold text-white">
                          {formatCurrency(simulatePurchase(household, simulateAmount).simulatedDailyAllowance)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* OBLIGATION MODAL */}
        {isObligationModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center">
            <div className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Thêm khoản sắp phải trả</h3>
                <button onClick={() => setIsObligationModalOpen(false)} className="w-8 h-8 bg-slate-100 rounded-full font-bold text-slate-500">&times;</button>
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="Tên khoản (VD: Tiền nhà)" className="w-full bg-slate-50 rounded-xl p-4 font-bold outline-none text-slate-900" value={newObName} onChange={(e) => setNewObName(e.target.value)} />
                <input type="text" inputMode="numeric" placeholder="Số tiền" className="w-full text-3xl font-extrabold bg-slate-50 rounded-2xl p-4 outline-none text-slate-900" value={newObAmount ? formatCurrency(newObAmount).replace(' ₫', '') : ''} onChange={(e) => setNewObAmount(parseCurrency(e.target.value))} />
                <input type="date" className="w-full bg-slate-50 rounded-xl p-4 font-bold outline-none text-slate-900" value={newObDate} onChange={(e) => setNewObDate(e.target.value)} />
                <button onClick={handleAddObligation} disabled={newObAmount <= 0 || !newObName || !newObDate} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold disabled:opacity-50 mt-4">Thêm khoản</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
