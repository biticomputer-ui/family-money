'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency, parseCurrency } from '@/lib/format';
import { calculateSafeToSpend, calculateDaysUntilIncome } from '@/lib/safeToSpend';
import { addTransaction } from '../actions';
import { CheckCircle2, Plus, Info } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 flex flex-col p-6 max-w-md mx-auto w-full pb-32">
      
      {/* HEADER */}
      <div className="py-6 flex flex-col items-center">
        <p className="text-slate-500 font-medium uppercase tracking-widest text-sm mb-2">CÒN ĐƯỢC TIÊU</p>
        <h1 className={`text-5xl font-bold tracking-tight ${safeToSpend >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
          {formatCurrency(safeToSpend)}
        </h1>
        
        {safeToSpend < 0 && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl w-full text-center text-sm">
            Các khoản đã lên kế hoạch hiện cao hơn số tiền có thể sử dụng {formatCurrency(Math.abs(safeToSpend))}.
          </div>
        )}

        {safeToSpend >= 0 && (
          <div className="mt-4 text-center">
            <p className="text-slate-700 font-medium">Còn {daysUntilIncome} ngày tới kỳ thu nhập</p>
            {daysUntilIncome > 0 && (
              <p className="text-slate-500 mt-1">≈ {formatCurrency(dailyAmount)} / ngày</p>
            )}
          </div>
        )}

        <div className="mt-6 w-full flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 py-2 px-4 rounded-full">
          <CheckCircle2 size={16} />
          <span>Các khoản quan trọng đang được bảo vệ</span>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="space-y-3 mt-4">
        <button 
          onClick={() => setIsSpendModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl text-lg font-medium shadow-sm hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Ghi khoản vừa tiêu
        </button>
        <button 
          onClick={() => setIsSimulateModalOpen(true)}
          className="w-full py-4 bg-white text-blue-600 border-2 border-blue-100 rounded-2xl text-lg font-medium shadow-sm hover:bg-blue-50 transition"
        >
          Tôi có mua được không?
        </button>
      </div>

      {/* UPCOMING OBLIGATIONS */}
      <div className="mt-12">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Sắp phải trả</h2>
        {nextObligations.length > 0 ? (
          <div className="space-y-3">
            {nextObligations.map((ob: any) => (
              <div key={ob.id} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
                <div>
                  <p className="font-medium text-slate-900">{ob.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(new Date(ob.dueDate))}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-slate-900">{formatCurrency(ob.amount)}</span>
                  <button 
                    onClick={async () => {
                      setLoading(true);
                      await import('../actions').then(m => m.markObligationPaid(ob.id, true));
                      setLoading(false);
                      router.refresh();
                    }}
                    className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100"
                    title="Đánh dấu đã trả"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-500 text-sm">Không có khoản nào sắp tới.</div>
        )}
      </div>

      {/* PRO EXPERIMENT LINK */}
      <div className="mt-12 text-center pb-8">
        <button 
          onClick={() => router.push('/pro')}
          className="px-6 py-2 bg-gradient-to-r from-amber-200 to-amber-300 text-amber-900 font-semibold rounded-full shadow-sm text-sm"
        >
          ✨ Nâng cấp Family Pro
        </button>
      </div>

      {/* SPEND MODAL */}
      {isSpendModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-8 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Ghi khoản vừa tiêu</h3>
              <button onClick={() => setIsSpendModalOpen(false)} className="text-slate-400 p-2 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Bạn vừa tiêu bao nhiêu?</label>
                <input
                  autoFocus
                  type="text"
                  inputMode="numeric"
                  placeholder="0 ₫"
                  className="w-full text-4xl font-semibold border-b-2 border-slate-300 focus:border-blue-500 bg-transparent py-2 outline-none"
                  value={spendAmount ? formatCurrency(spendAmount).replace(' ₫', '') : ''}
                  onChange={(e) => setSpendAmount(parseCurrency(e.target.value))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cho việc gì? (không bắt buộc)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Ăn tối, siêu thị..."
                  className="w-full border-b border-slate-200 py-2 outline-none"
                  value={spendNote}
                  onChange={(e) => setSpendNote(e.target.value)}
                />
              </div>

              {spendAmount > 0 && (
                <div className="bg-slate-50 p-4 rounded-xl text-center">
                  <p className="text-sm text-slate-500 mb-1">Sau khi ghi, còn được tiêu:</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(safeToSpend - spendAmount)}</p>
                </div>
              )}

              <button 
                onClick={handleSpend}
                disabled={loading || spendAmount <= 0}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl text-xl font-medium disabled:opacity-50"
              >
                {loading ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIMULATE MODAL */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-8 min-h-[70vh] sm:min-h-0 sm:my-8 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Tôi có mua được không?</h3>
              <button onClick={() => setIsSimulateModalOpen(false)} className="text-slate-400 p-2 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Bạn đang định chi bao nhiêu?</label>
                <input
                  autoFocus
                  type="text"
                  inputMode="numeric"
                  placeholder="0 ₫"
                  className="w-full text-4xl font-semibold border-b-2 border-slate-300 focus:border-blue-500 bg-transparent py-2 outline-none"
                  value={simulateAmount ? formatCurrency(simulateAmount).replace(' ₫', '') : ''}
                  onChange={(e) => setSimulateAmount(parseCurrency(e.target.value))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Món đồ / Dịch vụ</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Máy hút bụi"
                  className="w-full border-b border-slate-200 py-2 outline-none"
                  value={simulateNote}
                  onChange={(e) => setSimulateNote(e.target.value)}
                />
              </div>

              {simulateAmount > 0 && (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h4 className="text-slate-500 font-medium mb-4">NẾU CHI {formatCurrency(simulateAmount)}</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-500">Còn được tiêu:</p>
                      <p className={`text-3xl font-bold ${simulatedSafeToSpend >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                        {formatCurrency(simulatedSafeToSpend)}
                      </p>
                    </div>
                    
                    {simulatedSafeToSpend >= 0 && daysUntilIncome > 0 && (
                      <div>
                        <p className="text-slate-700">Còn {daysUntilIncome} ngày</p>
                        <p className="text-slate-500 font-medium">≈ {formatCurrency(simulatedDailyAmount)} / ngày</p>
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-200 space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-slate-700">Các khoản bắt buộc vẫn đủ.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-slate-700">Mục tiêu tiết kiệm vẫn được bảo vệ.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-4">
                <button 
                  onClick={handleSimulateToSpend}
                  disabled={loading || simulateAmount <= 0}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl text-lg font-medium disabled:opacity-50"
                >
                  Ghi khoản chi này
                </button>
                <button 
                  onClick={() => setIsSimulateModalOpen(false)}
                  className="w-full py-4 bg-transparent text-slate-600 rounded-2xl text-lg font-medium"
                >
                  Để sau
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
