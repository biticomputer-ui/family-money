'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency, parseCurrency } from '@/lib/format';
import { calculateSafeToSpend, calculateDaysUntilIncome } from '@/lib/safeToSpend';
import { addTransaction } from '../actions';
import { CheckCircle2, Plus, CreditCard, ShoppingBag, WalletCards, ShieldAlert, Check } from 'lucide-react';

type HouseholdData = {
  availableCash: number;
  nextIncomeDate: string | Date | null;
  safetyBuffer: number;
  transactions: any[];
  obligations: any[];
  protectedSavings: any[];
};

export default function DashboardClient({ household }: { household: HouseholdData }) {
  const router = useRouter();
  
  const [isSpendModalOpen, setIsSpendModalOpen] = useState(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  
  const [spendAmount, setSpendAmount] = useState(0);
  const [spendNote, setSpendNote] = useState('');
  
  const [simulateAmount, setSimulateAmount] = useState(0);
  const [simulateNote, setSimulateNote] = useState('');
  
  const [loading, setLoading] = useState(false);

  const safeToSpend = calculateSafeToSpend({
    availableCash: household.availableCash,
    transactions: household.transactions,
    obligations: household.obligations,
    protectedSavings: household.protectedSavings,
    safetyBuffer: household.safetyBuffer,
    nextIncomeDate: household.nextIncomeDate ? new Date(household.nextIncomeDate) : null
  });
  
  const daysUntilIncome = calculateDaysUntilIncome(household.nextIncomeDate ? new Date(household.nextIncomeDate) : null);
  const dailyAmount = daysUntilIncome > 0 ? Math.floor(safeToSpend / daysUntilIncome) : safeToSpend;

  const simulatedSafeToSpend = safeToSpend - simulateAmount;
  const simulatedDailyAmount = daysUntilIncome > 0 ? Math.floor(simulatedSafeToSpend / daysUntilIncome) : simulatedSafeToSpend;

  const handleSpend = async () => {
    if (spendAmount <= 0) return;
    setLoading(true);
    await addTransaction(spendAmount, spendNote);
    setIsSpendModalOpen(false);
    setSpendAmount(0);
    setSpendNote('');
    setLoading(false);
    router.refresh();
  };

  const handleSimulateToSpend = async () => {
    if (simulateAmount <= 0) return;
    setLoading(true);
    await addTransaction(simulateAmount, simulateNote);
    setIsSimulateModalOpen(false);
    setSimulateAmount(0);
    setSimulateNote('');
    setLoading(false);
    router.refresh();
  };

  const nextObligations = household.obligations
    .filter((o: any) => !o.isPaid)
    .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl shadow-slate-200/50 relative overflow-hidden pb-32">
        
        {/* Background Decor */}
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-b-[40px] z-0"></div>

        <div className="relative z-10 px-6 pt-10">
          {/* HEADER CARD */}
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-blue-900/10 border border-slate-100 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-blue-900">
              <WalletCards size={120} className="-mr-8 -mt-8" />
            </div>
            
            <p className="text-slate-500 font-semibold uppercase tracking-widest text-xs mb-3">
              CÒN ĐƯỢC TIÊU
            </p>
            <h1 className={`text-4xl sm:text-5xl font-extrabold tracking-tight mb-2 ${safeToSpend >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
              {formatCurrency(safeToSpend)}
            </h1>
            
            {safeToSpend < 0 && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl w-full text-center text-sm font-medium flex items-center justify-center gap-2 border border-red-100">
                <ShieldAlert size={16} />
                Vượt quá hạn mức {formatCurrency(Math.abs(safeToSpend))}
              </div>
            )}

            {safeToSpend >= 0 && (
              <div className="mt-2 text-center bg-slate-50 rounded-2xl py-3 px-4 inline-block">
                <p className="text-slate-600 font-medium text-sm">Còn <span className="text-slate-900 font-bold">{daysUntilIncome} ngày</span> tới kỳ lương</p>
                {daysUntilIncome > 0 && (
                  <p className="text-blue-600 font-bold mt-1">≈ {formatCurrency(dailyAmount)} <span className="text-xs text-blue-400 font-medium">/ ngày</span></p>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-green-700 bg-green-50 py-3 px-5 rounded-2xl border border-green-100 shadow-sm">
            <CheckCircle2 size={18} className="text-green-500" />
            <span className="font-medium">Các khoản quan trọng đang được bảo vệ</span>
          </div>

          {/* ACTIONS */}
          <div className="grid grid-cols-2 gap-3 mt-8">
            <button 
              onClick={() => setIsSpendModalOpen(true)}
              className="flex flex-col items-center justify-center gap-3 py-6 bg-blue-600 text-white rounded-3xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] transition-all"
            >
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Plus size={24} />
              </div>
              <span className="font-semibold">Ghi chi tiêu</span>
            </button>
            <button 
              onClick={() => setIsSimulateModalOpen(true)}
              className="flex flex-col items-center justify-center gap-3 py-6 bg-white text-slate-700 border-2 border-slate-100 rounded-3xl shadow-sm hover:border-blue-200 hover:bg-blue-50 transition-all group"
            >
              <div className="w-12 h-12 bg-slate-50 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500 rounded-full flex items-center justify-center transition-colors">
                <ShoppingBag size={22} />
              </div>
              <span className="font-semibold">Mô phỏng mua</span>
            </button>
          </div>

          {/* UPCOMING OBLIGATIONS */}
          <div className="mt-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Sắp phải trả</h2>
              <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{nextObligations.length} khoản</span>
            </div>
            
            {nextObligations.length > 0 ? (
              <div className="space-y-3">
                {nextObligations.map((ob: any) => (
                  <div key={ob.id} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{ob.name}</p>
                        <p className="text-xs font-medium text-slate-400 mt-0.5">
                          Hạn: {new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(new Date(ob.dueDate))}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-bold text-slate-800">{formatCurrency(ob.amount)}</span>
                      <button 
                        onClick={async () => {
                          setLoading(true);
                          await import('../actions').then(m => m.markObligationPaid(ob.id, true));
                          setLoading(false);
                          router.refresh();
                        }}
                        className="text-xs font-semibold flex items-center gap-1 text-slate-400 hover:text-green-600 bg-slate-50 hover:bg-green-50 px-3 py-1.5 rounded-full transition-colors"
                      >
                        <Check size={14} /> Xong
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center text-slate-500 text-sm">
                Không có khoản tiền nào sắp phải trả.
              </div>
            )}
          </div>

          {/* PRO EXPERIMENT LINK */}
          <div className="mt-12 text-center">
            <button 
              onClick={() => router.push('/pro')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 text-amber-900 font-bold rounded-2xl shadow-sm hover:shadow-md transition-shadow text-sm"
            >
              ✨ Nâng cấp Family Pro
            </button>
          </div>
        </div>

        {/* SPEND MODAL */}
        {isSpendModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
            <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-3xl p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Ghi khoản chi tiêu</h3>
                <button onClick={() => setIsSpendModalOpen(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">&times;</button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Số tiền đã tiêu</label>
                  <input
                    autoFocus
                    type="text"
                    inputMode="numeric"
                    placeholder="0 ₫"
                    className="w-full text-4xl font-extrabold bg-transparent py-1 outline-none text-slate-900 placeholder:text-slate-300"
                    value={spendAmount ? formatCurrency(spendAmount).replace(' ₫', '') : ''}
                    onChange={(e) => setSpendAmount(parseCurrency(e.target.value))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Ghi chú (Tùy chọn)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Mua đồ siêu thị, Cà phê..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={spendNote}
                    onChange={(e) => setSpendNote(e.target.value)}
                  />
                </div>

                {spendAmount > 0 && (
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-800">Còn lại:</span>
                    <span className="text-lg font-bold text-blue-900">{formatCurrency(safeToSpend - spendAmount)}</span>
                  </div>
                )}

                <button 
                  onClick={handleSpend}
                  disabled={loading || spendAmount <= 0}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl text-lg font-bold shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none hover:bg-blue-700 transition-all mt-4"
                >
                  {loading ? 'Đang lưu...' : 'Lưu giao dịch'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SIMULATE MODAL */}
        {isSimulateModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
            <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-3xl p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Mô phỏng chi tiêu</h3>
                <button onClick={() => setIsSimulateModalOpen(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">&times;</button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Dự định chi</label>
                  <input
                    autoFocus
                    type="text"
                    inputMode="numeric"
                    placeholder="0 ₫"
                    className="w-full text-4xl font-extrabold bg-transparent py-1 outline-none text-slate-900 placeholder:text-slate-300"
                    value={simulateAmount ? formatCurrency(simulateAmount).replace(' ₫', '') : ''}
                    onChange={(e) => setSimulateAmount(parseCurrency(e.target.value))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Món đồ muốn mua</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Máy giặt mới"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={simulateNote}
                    onChange={(e) => setSimulateNote(e.target.value)}
                  />
                </div>

                {simulateAmount > 0 && (
                  <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                      <ShoppingBag size={80} />
                    </div>
                    <h4 className="text-indigo-800 text-xs font-bold uppercase tracking-wider mb-3">Kết quả mô phỏng</h4>
                    
                    <div className="space-y-4 relative z-10">
                      <div className="bg-white rounded-xl p-3 shadow-sm flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-500">Quỹ linh hoạt:</span>
                        <span className={`text-xl font-bold ${simulatedSafeToSpend >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                          {formatCurrency(simulatedSafeToSpend)}
                        </span>
                      </div>
                      
                      {simulatedSafeToSpend >= 0 && daysUntilIncome > 0 && (
                        <div className="bg-white rounded-xl p-3 shadow-sm flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-500">Mức chi mỗi ngày:</span>
                          <span className="text-lg font-bold text-slate-700">≈ {formatCurrency(simulatedDailyAmount)}</span>
                        </div>
                      )}

                      <div className="pt-2 space-y-2">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                          <p className="text-sm font-medium text-slate-700">Các khoản bắt buộc vẫn đủ.</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                          <p className="text-sm font-medium text-slate-700">Mục tiêu tiết kiệm an toàn.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setIsSimulateModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl text-lg font-bold hover:bg-slate-200 transition-colors"
                  >
                    Để sau
                  </button>
                  <button 
                    onClick={handleSimulateToSpend}
                    disabled={loading || simulateAmount <= 0}
                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-lg font-bold shadow-lg shadow-slate-300 disabled:opacity-50 disabled:shadow-none hover:bg-black transition-all"
                  >
                    Ghi sổ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
