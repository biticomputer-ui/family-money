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

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

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
    // In a real app we might Promise.all this, or add a batch action
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

  // Safe to spend calculation for the Aha moment
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-6 items-center">
      <div className="w-full max-w-md flex-1 flex flex-col pt-12">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-3xl font-bold text-slate-900 leading-tight">
              Hiện gia đình mình có bao nhiêu tiền có thể sử dụng?
            </h2>
            <p className="text-slate-500">
              Tổng số tiền bạn muốn đưa vào kế hoạch này. Không cần bao gồm tài sản đầu tư dài hạn.
            </p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Ví dụ: 25.000.000 ₫"
              className="w-full text-3xl font-semibold border-b-2 border-slate-300 focus:border-blue-500 bg-transparent py-2 outline-none"
              value={availableCash ? formatCurrency(availableCash).replace(' ₫', '') : ''}
              onChange={(e) => setAvailableCash(parseCurrency(e.target.value))}
            />
            <button 
              onClick={handleSaveCash} 
              disabled={loading || availableCash <= 0}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl text-xl font-medium mt-8 disabled:opacity-50"
            >
              Tiếp tục
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-3xl font-bold text-slate-900 leading-tight">
              Khi nào gia đình có khoản thu nhập tiếp theo?
            </h2>
            <input
              type="date"
              className="w-full text-2xl font-semibold border-b-2 border-slate-300 focus:border-blue-500 bg-transparent py-2 outline-none"
              value={incomeDateStr}
              onChange={(e) => setIncomeDateStr(e.target.value)}
            />
            <button 
              onClick={handleSaveIncomeDate} 
              disabled={loading || !incomeDateStr}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl text-xl font-medium mt-8 disabled:opacity-50"
            >
              Tiếp tục
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-3xl font-bold text-slate-900 leading-tight">
              Trước ngày đó, chắc chắn phải trả những khoản nào?
            </h2>
            <p className="text-slate-500">
              Ví dụ: Tiền nhà, học phí, điện nước, trả góp...
            </p>
            
            <div className="space-y-4">
              {obligations.map((ob, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
                  <span className="font-medium">{ob.name}</span>
                  <span className="font-semibold text-slate-700">{formatCurrency(ob.amount)}</span>
                </div>
              ))}
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm space-y-4 mt-4">
              <input
                type="text"
                placeholder="Tên khoản (vd: Tiền nhà)"
                className="w-full border-b border-slate-200 py-2 outline-none"
                value={newObligationName}
                onChange={(e) => setNewObligationName(e.target.value)}
              />
              <input
                type="text"
                inputMode="numeric"
                placeholder="Số tiền"
                className="w-full border-b border-slate-200 py-2 outline-none"
                value={newObligationAmount ? formatCurrency(newObligationAmount).replace(' ₫', '') : ''}
                onChange={(e) => setNewObligationAmount(parseCurrency(e.target.value))}
              />
              <button 
                onClick={handleAddObligation}
                className="text-blue-600 font-medium py-2"
              >
                + Thêm khoản này
              </button>
            </div>

            <button 
              onClick={handleSaveObligations} 
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl text-xl font-medium mt-8"
            >
              Tiếp tục
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-3xl font-bold text-slate-900 leading-tight">
              Bạn muốn giữ lại ít nhất bao nhiêu?
            </h2>
            <p className="text-slate-500">
              Dành cho tiết kiệm, quỹ khẩn cấp, mục tiêu gia đình...
            </p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0 ₫"
              className="w-full text-3xl font-semibold border-b-2 border-slate-300 focus:border-blue-500 bg-transparent py-2 outline-none"
              value={savingAmount ? formatCurrency(savingAmount).replace(' ₫', '') : ''}
              onChange={(e) => setSavingAmount(parseCurrency(e.target.value))}
            />
            <button 
              onClick={handleSaveSavings} 
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl text-xl font-medium mt-8 disabled:opacity-50"
            >
              Tiếp tục
            </button>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-3xl font-bold text-slate-900 leading-tight">
              Bạn muốn để lại một khoản dự phòng không đụng tới?
            </h2>
            <p className="text-slate-500">
              Khoản này giúp tránh dùng hết tiền linh hoạt khi có việc bất ngờ. Có thể để 0 ₫.
            </p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0 ₫"
              className="w-full text-3xl font-semibold border-b-2 border-slate-300 focus:border-blue-500 bg-transparent py-2 outline-none"
              value={bufferAmount ? formatCurrency(bufferAmount).replace(' ₫', '') : ''}
              onChange={(e) => setBufferAmount(parseCurrency(e.target.value))}
            />
            <button 
              onClick={handleSaveBuffer} 
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl text-xl font-medium mt-8 disabled:opacity-50"
            >
              Xem kết quả
            </button>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center pt-8">
            <h3 className="text-slate-500 font-medium uppercase tracking-wider">CÒN ĐƯỢC TIÊU</h3>
            
            <h1 className={`text-5xl font-bold tracking-tight ${safeToSpend >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
              {formatCurrency(safeToSpend)}
            </h1>
            
            <div className="text-center space-y-1">
              <p className="text-slate-700 font-medium text-lg">Còn {daysUntilIncome} ngày tới kỳ thu nhập</p>
              {safeToSpend >= 0 && daysUntilIncome > 0 && (
                <p className="text-slate-500">≈ {formatCurrency(dailyAmount)} / ngày</p>
              )}
            </div>

            <div className="w-full space-y-3 pt-6">
              <div className="flex items-start gap-3 bg-white p-4 rounded-xl">
                <div className="text-green-500 mt-0.5">✓</div>
                <p className="text-sm text-slate-700">Các khoản bắt buộc đã được dành riêng</p>
              </div>
              <div className="flex items-start gap-3 bg-white p-4 rounded-xl">
                <div className="text-green-500 mt-0.5">✓</div>
                <p className="text-sm text-slate-700">Mục tiêu tiết kiệm được bảo vệ</p>
              </div>
              <div className="flex items-start gap-3 bg-white p-4 rounded-xl">
                <div className="text-green-500 mt-0.5">✓</div>
                <p className="text-sm text-slate-700">Khoản dự phòng không bị tính vào tiền có thể tiêu</p>
              </div>
            </div>

            <button 
              onClick={handleFinish}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xl font-medium mt-8"
            >
              Vào trang chính
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
