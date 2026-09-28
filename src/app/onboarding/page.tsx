'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  updateAvailableCash, 
  updateNextIncomeDate, 
  addObligation, 
  addProtectedSaving, 
  updateSafetyBuffer 
} from '../actions';
import { formatCurrency, parseCurrency } from '@/lib/format';
import { calculateSafeToSpend, calculateDaysUntilIncome } from '@/lib/safeToSpend';
import { Wallet, Calendar, ShieldCheck, PiggyBank, Briefcase, PartyPopper, Check, ArrowRight } from 'lucide-react';

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const totalSteps = 6;

  // State
  const [availableCash, setAvailableCash] = useState<number>(0);
  const [incomeDateStr, setIncomeDateStr] = useState<string>('');
  
  const [obligations, setObligations] = useState<{name: string, amount: number}[]>([]);
  const [newObligationName, setNewObligationName] = useState('');
  const [newObligationAmount, setNewObligationAmount] = useState<number>(0);
  
  const [savingAmount, setSavingAmount] = useState<number>(0);
  const [bufferAmount, setBufferAmount] = useState<number>(0);

  const nextStep = () => setStep(s => s + 1);

  const handleSaveCash = async () => {
    setLoading(true);
    await updateAvailableCash(availableCash);
    setLoading(false);
    nextStep();
  };

  const handleSaveIncomeDate = async () => {
    if (!incomeDateStr) return;
    setLoading(true);
    await updateNextIncomeDate(new Date(incomeDateStr));
    setLoading(false);
    nextStep();
  };

  const handleAddObligation = () => {
    if (!newObligationName || newObligationAmount <= 0) return;
    setObligations([...obligations, { name: newObligationName, amount: newObligationAmount }]);
    setNewObligationName('');
    setNewObligationAmount(0);
  };

  const handleSaveObligations = async () => {
    setLoading(true);
    for (const ob of obligations) {
      await addObligation(ob.name, ob.amount, new Date(incomeDateStr));
    }
    setLoading(false);
    nextStep();
  };

  const handleSaveSavings = async () => {
    setLoading(true);
    if (savingAmount > 0) {
      await addProtectedSaving("Tiết kiệm", savingAmount);
    }
    setLoading(false);
    nextStep();
  };

  const handleSaveBuffer = async () => {
    setLoading(true);
    await updateSafetyBuffer(bufferAmount);
    setLoading(false);
    nextStep();
  };

  const handleFinish = () => {
    router.push('/dashboard');
  };

  const safeToSpend = calculateSafeToSpend({
    availableCash,
    transactions: [],
    obligations: obligations.map(o => ({ amount: o.amount, isPaid: false, dueDate: new Date(incomeDateStr) })),
    protectedSavings: [{ amount: savingAmount }],
    safetyBuffer: bufferAmount,
    nextIncomeDate: new Date(incomeDateStr)
  });
  
  const daysUntilIncome = calculateDaysUntilIncome(new Date(incomeDateStr));
  const dailyAmount = daysUntilIncome > 0 ? Math.floor(safeToSpend / daysUntilIncome) : safeToSpend;

  const getStepIcon = () => {
    switch(step) {
      case 1: return <Wallet size={48} className="text-blue-500" />;
      case 2: return <Calendar size={48} className="text-indigo-500" />;
      case 3: return <Briefcase size={48} className="text-orange-500" />;
      case 4: return <PiggyBank size={48} className="text-green-500" />;
      case 5: return <ShieldCheck size={48} className="text-teal-500" />;
      case 6: return <PartyPopper size={56} className="text-yellow-500" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl shadow-slate-200/50 flex flex-col">
        
        {/* Progress Bar */}
        <div className="pt-8 px-6">
          <div className="flex gap-1.5 w-full">
            {Array.from({length: totalSteps}).map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                  idx < step ? 'bg-blue-600' : 'bg-slate-100'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-4 text-center">
            Bước {step} / {totalSteps}
          </p>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col p-6 pt-10">
          
          <div className="flex justify-center mb-8 animate-in zoom-in duration-500">
            <div className="w-24 h-24 rounded-[32px] bg-slate-50 border-2 border-slate-100 flex items-center justify-center shadow-sm">
              {getStepIcon()}
            </div>
          </div>

          <div key={step} className="animate-in fade-in slide-in-from-right-8 duration-500 flex-1">
            
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-3xl font-extrabold text-slate-900 leading-tight text-center">
                  Hiện gia đình mình có bao nhiêu tiền?
                </h2>
                <p className="text-slate-500 text-center">
                  Tổng số tiền bạn muốn đưa vào kế hoạch này. Không bao gồm tài sản đầu tư dài hạn hay sổ tiết kiệm cũ.
                </p>
                <div className="bg-slate-50 p-4 rounded-3xl border-2 border-slate-100 mt-8 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 transition-all">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    placeholder="25.000.000 ₫"
                    className="w-full text-center text-4xl font-extrabold bg-transparent py-4 outline-none text-slate-900 placeholder:text-slate-300"
                    value={availableCash ? formatCurrency(availableCash).replace(' ₫', '') : ''}
                    onChange={(e) => setAvailableCash(parseCurrency(e.target.value))}
                  />
                </div>
                <button 
                  onClick={handleSaveCash} 
                  disabled={loading || availableCash <= 0}
                  className="w-full py-4 mt-8 bg-blue-600 text-white rounded-2xl text-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  Tiếp tục <ArrowRight size={20} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-3xl font-extrabold text-slate-900 leading-tight text-center">
                  Kỳ thu nhập tiếp theo là khi nào?
                </h2>
                <p className="text-slate-500 text-center">
                  Ngày nhận lương hoặc ngày có khoản thu kế tiếp để ứng dụng biết lúc nào sẽ làm mới lại "kho" tiền.
                </p>
                <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 mt-8 focus-within:border-blue-500 transition-all">
                  <input
                    type="date"
                    autoFocus
                    className="w-full text-center text-2xl font-bold bg-transparent outline-none text-slate-900"
                    value={incomeDateStr}
                    onChange={(e) => setIncomeDateStr(e.target.value)}
                  />
                </div>
                <button 
                  onClick={handleSaveIncomeDate} 
                  disabled={loading || !incomeDateStr}
                  className="w-full py-4 mt-8 bg-blue-600 text-white rounded-2xl text-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Tiếp tục <ArrowRight size={20} />
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 flex flex-col h-full">
                <h2 className="text-3xl font-extrabold text-slate-900 leading-tight text-center">
                  Các khoản chắc chắn phải trả?
                </h2>
                <p className="text-slate-500 text-center text-sm">
                  Ví dụ: Tiền nhà, học phí, hóa đơn, trả góp... Những khoản tiền cố định trước ngày nhận lương.
                </p>
                
                <div className="space-y-3 mt-4">
                  {obligations.map((ob, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-orange-50/50 border border-orange-100 p-4 rounded-2xl">
                      <span className="font-bold text-slate-800">{ob.name}</span>
                      <span className="font-bold text-orange-600">{formatCurrency(ob.amount)}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 p-5 rounded-3xl border-2 border-dashed border-slate-200 mt-4 space-y-4">
                  <input
                    type="text"
                    placeholder="Tên khoản (vd: Tiền nhà)"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 font-medium"
                    value={newObligationName}
                    onChange={(e) => setNewObligationName(e.target.value)}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Số tiền (vd: 5.000.000 ₫)"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 font-bold text-lg"
                    value={newObligationAmount ? formatCurrency(newObligationAmount).replace(' ₫', '') : ''}
                    onChange={(e) => setNewObligationAmount(parseCurrency(e.target.value))}
                  />
                  <button 
                    onClick={handleAddObligation}
                    disabled={!newObligationName || newObligationAmount <= 0}
                    className="w-full font-bold text-blue-600 bg-blue-50 py-3 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    + Thêm khoản này
                  </button>
                </div>

                <div className="mt-auto pt-6">
                  <button 
                    onClick={handleSaveObligations} 
                    disabled={loading}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl text-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    Tiếp tục <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-3xl font-extrabold text-slate-900 leading-tight text-center">
                  Muốn cất đi bao nhiêu?
                </h2>
                <p className="text-slate-500 text-center">
                  Dành cho tiền tiết kiệm tháng này, hoặc các mục tiêu tài chính gia đình cần bảo vệ. (Có thể để 0đ).
                </p>
                <div className="bg-slate-50 p-4 rounded-3xl border-2 border-slate-100 mt-8 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 transition-all">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    placeholder="0 ₫"
                    className="w-full text-center text-4xl font-extrabold bg-transparent py-4 outline-none text-slate-900 placeholder:text-slate-300"
                    value={savingAmount ? formatCurrency(savingAmount).replace(' ₫', '') : ''}
                    onChange={(e) => setSavingAmount(parseCurrency(e.target.value))}
                  />
                </div>
                <button 
                  onClick={handleSaveSavings} 
                  disabled={loading}
                  className="w-full py-4 mt-8 bg-blue-600 text-white rounded-2xl text-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  Tiếp tục <ArrowRight size={20} />
                </button>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <h2 className="text-3xl font-extrabold text-slate-900 leading-tight text-center">
                  Khoản dự phòng nhỏ?
                </h2>
                <p className="text-slate-500 text-center">
                  Một khoản dự phòng cho việc bất ngờ. Family Money sẽ ẩn số tiền này khỏi quỹ linh hoạt để bạn không "lỡ tay" tiêu mất.
                </p>
                <div className="bg-slate-50 p-4 rounded-3xl border-2 border-slate-100 mt-8 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 transition-all">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    placeholder="0 ₫"
                    className="w-full text-center text-4xl font-extrabold bg-transparent py-4 outline-none text-slate-900 placeholder:text-slate-300"
                    value={bufferAmount ? formatCurrency(bufferAmount).replace(' ₫', '') : ''}
                    onChange={(e) => setBufferAmount(parseCurrency(e.target.value))}
                  />
                </div>
                <button 
                  onClick={handleSaveBuffer} 
                  disabled={loading}
                  className="w-full py-4 mt-8 bg-blue-600 text-white rounded-2xl text-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  Xem kết quả! <Sparkles size={20} />
                </button>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-6 flex flex-col items-center pt-2">
                
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 w-[120%] -ml-[10%] p-10 rounded-[3rem] text-center text-white shadow-2xl shadow-blue-900/20 transform transition-all duration-700 scale-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Wallet size={120} className="-mr-8 -mt-8" />
                  </div>
                  
                  <p className="text-blue-100 font-semibold uppercase tracking-widest text-xs mb-3">
                    CÒN ĐƯỢC TIÊU
                  </p>
                  <h1 className="text-5xl font-extrabold tracking-tight mb-2">
                    {formatCurrency(safeToSpend)}
                  </h1>
                  
                  <div className="mt-4 bg-white/20 backdrop-blur-md rounded-2xl py-3 px-4 inline-block border border-white/20">
                    <p className="text-white font-medium text-sm">Còn <span className="font-bold">{daysUntilIncome} ngày</span> tới kỳ lương</p>
                    {safeToSpend >= 0 && daysUntilIncome > 0 && (
                      <p className="text-blue-50 font-bold mt-1">≈ {formatCurrency(dailyAmount)} / ngày</p>
                    )}
                  </div>
                </div>

                <div className="w-full space-y-4 pt-6">
                  <div className="flex items-start gap-4 bg-green-50/50 border border-green-100 p-4 rounded-2xl">
                    <div className="bg-green-100 p-1 rounded-full"><Check size={16} className="text-green-600" /></div>
                    <p className="text-sm font-medium text-slate-700">Các khoản bắt buộc đã được dành riêng</p>
                  </div>
                  <div className="flex items-start gap-4 bg-green-50/50 border border-green-100 p-4 rounded-2xl">
                    <div className="bg-green-100 p-1 rounded-full"><Check size={16} className="text-green-600" /></div>
                    <p className="text-sm font-medium text-slate-700">Mục tiêu tiết kiệm và quỹ dự phòng được bảo vệ an toàn</p>
                  </div>
                </div>

                <button 
                  onClick={handleFinish}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xl font-bold shadow-xl shadow-slate-300 hover:bg-black transition-all mt-8"
                >
                  Vào màn hình chính
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// Added this directly into the file because Sparkles was missing from the import
function Sparkles({ size, className }: { size?: number, className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
    </svg>
  );
}
