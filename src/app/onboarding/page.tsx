'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency, parseCurrency } from '@/lib/format';
import { householdRepository } from '../../repository/household';
import { HouseholdData, Obligation } from '../../domain/models';
import { ArrowRight, ArrowLeft, Plus, CheckCircle2 } from 'lucide-react';
import { calculateRawSafeToSpend, calculateDailyAllowance } from '../../domain/engine';

export default function OnboardingPage() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [balanceStr, setBalanceStr] = useState('');
  const [nextPayday, setNextPayday] = useState('');
  
  const [obligations, setObligations] = useState<{title: string, amountStr: string, date: string}[]>([
    { title: '', amountStr: '', date: '' }
  ]);
  
  const [lockedSavingsStr, setLockedSavingsStr] = useState('');
  const [emergencyReserveStr, setEmergencyReserveStr] = useState('');
  
  const [finalData, setFinalData] = useState<HouseholdData | null>(null);

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Create data and show Aha screen
      const balance = parseCurrency(balanceStr);
      const lockedSavings = parseCurrency(lockedSavingsStr);
      const emergencyReserve = parseCurrency(emergencyReserveStr);
      
      const parsedObligations: Obligation[] = obligations
        .filter(o => o.title.trim() !== '' && parseCurrency(o.amountStr) > 0 && o.date !== '')
        .map(o => ({
          id: crypto.randomUUID(),
          title: o.title,
          amount: parseCurrency(o.amountStr),
          dueDate: new Date(o.date).toISOString(),
          status: 'pending',
          createdAt: new Date().toISOString()
        }));

      const data: HouseholdData = {
        schemaVersion: 1,
        householdId: crypto.randomUUID(),
        currency: 'VND',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh',
        balance,
        nextPayday: new Date(nextPayday).toISOString(),
        lockedSavings,
        emergencyReserve,
        obligations: parsedObligations,
        transactions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setFinalData(data);
      householdRepository.save(data);
      setStep(5); // Aha screen
    }
  };

  const handleAddObligation = () => {
    setObligations([...obligations, { title: '', amountStr: '', date: '' }]);
  };
  
  const updateObligation = (index: number, field: string, value: string) => {
    const newObs = [...obligations];
    newObs[index] = { ...newObs[index], [field]: value };
    setObligations(newObs);
  };

  if (step === 5 && finalData) {
    const rawSafe = calculateRawSafeToSpend(finalData);
    const daily = calculateDailyAllowance(finalData);
    const dateObj = new Date(finalData.nextPayday);
    const dateFormatted = `${dateObj.getDate().toString().padStart(2,'0')}/${(dateObj.getMonth()+1).toString().padStart(2,'0')}`;
    
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
          <p className="text-slate-400 font-bold text-center mb-2">Nhà mình có thể tiêu</p>
          <h1 className="text-5xl font-extrabold text-white text-center mb-4">{formatCurrency(rawSafe)}</h1>
          <p className="text-slate-300 text-center text-lg">từ hôm nay đến {dateFormatted}</p>
          
          <div className="bg-indigo-600 rounded-2xl p-4 mt-6 text-center shadow-lg shadow-indigo-900/50">
            <p className="text-indigo-100 font-medium">Mỗi ngày</p>
            <p className="text-3xl font-bold text-white mt-1">≈ {formatCurrency(daily)}</p>
          </div>
          
          <div className="mt-8 bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <p className="text-slate-400 text-sm font-bold mb-4 uppercase tracking-wider">Đã giữ riêng an toàn:</p>
            <ul className="space-y-3">
              {finalData.obligations.map(ob => (
                <li key={ob.id} className="flex items-center gap-3 text-slate-200 font-medium">
                  <CheckCircle2 className="text-green-500 shrink-0" size={18} /> {ob.title}
                </li>
              ))}
              {finalData.lockedSavings > 0 && (
                <li className="flex items-center gap-3 text-slate-200 font-medium">
                  <CheckCircle2 className="text-green-500 shrink-0" size={18} /> Tiết kiệm khóa
                </li>
              )}
              {finalData.emergencyReserve > 0 && (
                <li className="flex items-center gap-3 text-slate-200 font-medium">
                  <CheckCircle2 className="text-green-500 shrink-0" size={18} /> Quỹ dự phòng
                </li>
              )}
            </ul>
          </div>
          
          <button 
            onClick={() => router.push('/dashboard')}
            className="w-full py-4 mt-8 rounded-2xl bg-white text-slate-900 font-bold text-lg hover:bg-slate-100 transition-colors"
          >
            Bắt đầu theo dõi
          </button>
        </div>
      </div>
    );
  }

  const stepTitles = ["Tiền hiện có", "Ngày nhận lương", "Khoản phải trả", "Giữ riêng"];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col pt-8 px-6 pb-20">
        
        {/* Progress Bar */}
        <div className="mb-8">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            {step}/4 · {stepTitles[step-1]}
          </p>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 transition-all duration-500 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Step 1 */}
        {step === 1 && (
          <div className="flex-1 animate-in fade-in slide-in-from-right-4">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2 leading-tight">Nhà mình hiện có bao nhiêu tiền để dùng đến kỳ lương tới?</h1>
            <p className="text-slate-500 font-medium mb-8">Tính cả tiền mặt và số dư bạn muốn dùng cho sinh hoạt. Không cần tính tiền đầu tư hoặc tiết kiệm dài hạn.</p>
            
            <input
              autoFocus
              type="text"
              inputMode="numeric"
              placeholder="0 ₫"
              className="w-full text-4xl font-extrabold bg-white border border-slate-200 rounded-2xl p-6 outline-none text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              value={balanceStr ? formatCurrency(parseCurrency(balanceStr)).replace(' ₫', '') : ''}
              onChange={(e) => setBalanceStr(e.target.value)}
            />
            
            <div className="flex flex-wrap gap-2 mt-4">
              {['5000000', '10000000', '20000000', '30000000'].map(val => (
                <button 
                  key={val}
                  onClick={() => setBalanceStr(val)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-full font-semibold text-sm hover:bg-slate-300"
                >
                  {parseInt(val) / 1000000} triệu
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="flex-1 animate-in fade-in slide-in-from-right-4">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-8 leading-tight">Khi nào nhà mình nhận tiền tiếp?</h1>
            
            <input
              type="date"
              className="w-full text-xl font-bold bg-white border border-slate-200 rounded-2xl p-6 outline-none text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              value={nextPayday}
              onChange={(e) => setNextPayday(e.target.value)}
            />
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="flex-1 animate-in fade-in slide-in-from-right-4">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2 leading-tight">Từ giờ đến ngày đó còn phải trả khoản nào?</h1>
            <p className="text-slate-500 font-medium mb-6">Bạn có thể bỏ qua nếu không có hóa đơn nào sắp tới.</p>
            
            <div className="space-y-4">
              {obligations.map((ob, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <input 
                    type="text" 
                    placeholder="Tên khoản (VD: Tiền nhà)" 
                    className="w-full bg-slate-50 p-3 rounded-xl font-bold text-slate-900 outline-none"
                    value={ob.title}
                    onChange={(e) => updateObligation(i, 'title', e.target.value)}
                  />
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      inputMode="numeric"
                      placeholder="Số tiền" 
                      className="w-1/2 bg-slate-50 p-3 rounded-xl font-bold text-slate-900 outline-none"
                      value={ob.amountStr ? formatCurrency(parseCurrency(ob.amountStr)).replace(' ₫', '') : ''}
                      onChange={(e) => updateObligation(i, 'amountStr', e.target.value)}
                    />
                    <input 
                      type="date" 
                      className="w-1/2 bg-slate-50 p-3 rounded-xl font-medium text-slate-700 outline-none text-sm"
                      value={ob.date}
                      onChange={(e) => updateObligation(i, 'date', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              onClick={handleAddObligation}
              className="mt-4 flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-slate-300 text-slate-500 font-bold rounded-2xl hover:bg-slate-100 transition-colors"
            >
              <Plus size={20} /> Thêm khoản khác
            </button>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="flex-1 animate-in fade-in slide-in-from-right-4">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2 leading-tight">Muốn giữ lại bao nhiêu?</h1>
            <p className="text-slate-500 font-medium mb-8">Các khoản này vẫn nằm trong tổng tiền hiện có, nhưng Family Money sẽ không tính chúng là tiền được tiêu.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block font-bold text-slate-700 mb-2">Tiết kiệm muốn khóa</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0 ₫"
                  className="w-full text-2xl font-extrabold bg-white border border-slate-200 rounded-2xl p-5 outline-none text-slate-900 shadow-sm focus:border-indigo-500"
                  value={lockedSavingsStr ? formatCurrency(parseCurrency(lockedSavingsStr)).replace(' ₫', '') : ''}
                  onChange={(e) => setLockedSavingsStr(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-2">Quỹ dự phòng (ốm đau, xe hỏng)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0 ₫"
                  className="w-full text-2xl font-extrabold bg-white border border-slate-200 rounded-2xl p-5 outline-none text-slate-900 shadow-sm focus:border-indigo-500"
                  value={emergencyReserveStr ? formatCurrency(parseCurrency(emergencyReserveStr)).replace(' ₫', '') : ''}
                  onChange={(e) => setEmergencyReserveStr(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Nav Buttons */}
        <div className="flex gap-3 pt-8 mt-auto">
          {step > 1 && (
            <button 
              onClick={() => setStep(step - 1)}
              className="w-14 h-14 shrink-0 rounded-2xl bg-white border-2 border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <button 
            onClick={handleNext}
            disabled={step === 1 && parseCurrency(balanceStr) <= 0 || step === 2 && !nextPayday}
            className="flex-1 h-14 rounded-2xl bg-indigo-600 text-white font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
          >
            {step === 4 ? 'Hoàn tất' : 'Tiếp tục'}
            {step < 4 && <ArrowRight size={20} />}
          </button>
        </div>

      </div>
    </div>
  );
}
