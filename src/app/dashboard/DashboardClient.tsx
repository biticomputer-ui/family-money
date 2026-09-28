'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency, parseCurrency } from '@/lib/format';
import { calculateSafeToSpend, calculateDaysUntilIncome } from '@/lib/safeToSpend';
import { addTransaction } from '../actions';
import { CheckCircle2, Plus, CreditCard, ShoppingBag, WalletCards, ShieldAlert, Check, Calendar, Sparkles, Users } from 'lucide-react';

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

  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // New Obligation State
  const [isObligationModalOpen, setIsObligationModalOpen] = useState(false);
  const [newObName, setNewObName] = useState('');
  const [newObAmount, setNewObAmount] = useState(0);
  const [newObDate, setNewObDate] = useState('');

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

  const handleAddObligation = async () => {
    if (newObAmount <= 0 || !newObName || !newObDate) return;
    setLoading(true);
    await import('../actions').then(m => m.addObligation(newObName, newObAmount, new Date(newObDate)));
    setIsObligationModalOpen(false);
    setNewObName('');
    setNewObAmount(0);
    setNewObDate('');
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
              <div className="mt-2 flex flex-col items-center gap-3">
                <div className="text-center bg-slate-50 rounded-2xl py-3 px-4 inline-block">
                  <p className="text-slate-600 font-medium text-sm">Còn <span className="text-slate-900 font-bold">{daysUntilIncome} ngày</span> tới kỳ lương</p>
                  {daysUntilIncome > 0 && (
                    <p className="text-blue-600 font-bold mt-1">≈ {formatCurrency(dailyAmount)} <span className="text-xs text-blue-400 font-medium">/ ngày</span></p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-bold border border-orange-100">
                  🔥 Phong độ chi tiêu: Rất kỷ luật!
                </div>
              </div>
            )}
          </div>

          {/* SHARE CARD */}
          <div className="mt-4 flex gap-2">
            <button 
              onClick={() => {
                if (typeof window !== 'undefined') {
                  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(household))));
                  const url = `${window.location.origin}/join?data=${encoded}`;
                  navigator.clipboard.writeText(url);
                  alert('Đã copy link mời! Hãy gửi link này cho vợ/chồng của bạn qua Zalo để đồng bộ dữ liệu nhé.');
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 text-sm text-slate-700 bg-white py-3 px-5 rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors font-bold"
            >
              <Users size={18} className="text-blue-500" />
              Mời Vợ/Chồng tham gia
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-green-700 bg-green-50 py-3 px-5 rounded-2xl border border-green-100 shadow-sm">
            <CheckCircle2 size={18} className="text-green-500" />
            <span className="font-medium">Các khoản quan trọng đang được bảo vệ</span>
          </div>

          {/* LOGIC BREAKDOWN CARD */}
          <div className="mt-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <span className="bg-slate-100 p-1.5 rounded-lg">💡</span> Cách tính toán số tiền này
            </h3>
            <div className="space-y-2 text-sm text-slate-600 font-medium">
              <div className="flex justify-between">
                <span>Quỹ ban đầu</span>
                <span className="text-slate-900">{formatCurrency(household.availableCash)}</span>
              </div>
              <div className="flex justify-between text-red-500">
                <span>Trừ: Đã tiêu linh hoạt</span>
                <span>-{formatCurrency(household.transactions.reduce((acc: number, t: any) => acc + t.amount, 0))}</span>
              </div>
              <div className="flex justify-between text-orange-500">
                <span>Trừ: Sắp phải trả</span>
                <span>-{formatCurrency(household.obligations.filter((o:any)=>!o.isPaid).reduce((acc: number, o: any) => acc + o.amount, 0))}</span>
              </div>
              <div className="flex justify-between text-teal-600">
                <span>Trừ: Đã khóa (Tiết kiệm/Dự phòng)</span>
                <span>-{formatCurrency(household.safetyBuffer + household.protectedSavings.reduce((acc: number, s: any) => acc + s.amount, 0))}</span>
              </div>
              <div className="border-t border-slate-100 pt-2 mt-2 flex justify-between font-bold text-slate-900">
                <span>= Còn được tiêu</span>
                <span>{formatCurrency(safeToSpend)}</span>
              </div>
            </div>
          </div>

          {/* AI ASSISTANT CARD */}
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-1 shadow-sm border border-indigo-100">
            <div className="bg-white rounded-[22px] p-4 flex flex-col gap-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10 text-indigo-500">
                <Sparkles size={60} />
              </div>
              
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm relative z-10">
                <Sparkles size={16} />
                <span>Trợ lý AI</span>
              </div>
              
              <form 
                className="relative z-10"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!aiInput.trim()) return;
                  setAiLoading(true);
                  try {
                    const m = await import('../actions');
                    const msg = await m.processExpenseWithAI(aiInput);
                    alert(msg || "Đã lưu thành công!");
                    setAiInput('');
                    router.refresh();
                  } catch (error: any) {
                    alert("Lỗi: " + error.message);
                  }
                  setAiLoading(false);
                }}
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="VD: Mua trà sữa 50k, đóng tiền nhà 5 củ..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    disabled={aiLoading}
                  />
                  <button 
                    type="submit"
                    disabled={aiLoading || !aiInput.trim()}
                    className="bg-indigo-600 text-white rounded-xl px-4 py-3 font-semibold shadow-md shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center shrink-0"
                  >
                    {aiLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      "Gửi"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="grid grid-cols-2 gap-3 mt-6">
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
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Sắp phải trả</h2>
                <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{nextObligations.length} khoản</span>
              </div>
              <button 
                onClick={() => setIsObligationModalOpen(true)}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full flex items-center gap-1"
              >
                <Plus size={16} /> Thêm khoản
              </button>
            </div>
            
            {nextObligations.length > 0 ? (
              <div className="space-y-3">
                {nextObligations.map((ob: any) => {
                  const dueDate = new Date(ob.dueDate);
                  
                  // Format for Google Calendar (YYYYMMDDTHHmmssZ)
                  const formatCalDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
                  const startDate = formatCalDate(dueDate);
                  
                  // Next day for all-day event
                  const endDateObj = new Date(dueDate);
                  endDateObj.setDate(endDateObj.getDate() + 1);
                  const endDate = formatCalDate(endDateObj);
                  
                  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Thanh to%C3%A1n%3A+${encodeURIComponent(ob.name)}&dates=${startDate}/${endDate}&details=Nh%E1%BA%AFc+nh%E1%BB%A1+thanh+to%C3%A1n+kho%E1%BA%A3n+${formatCurrency(ob.amount)}+t%E1%BB%AB+Family+Money.`;

                  return (
                    <div key={ob.id} className="flex flex-col bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow gap-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                            <CreditCard size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{ob.name}</p>
                            <p className="text-xs font-medium text-slate-400 mt-0.5">
                              Hạn: {new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(dueDate)}
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
                      
                      {/* ADD TO CALENDAR ACTION */}
                      <div className="border-t border-slate-50 pt-3 mt-1">
                        <a 
                          href={googleCalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-blue-600 flex items-center gap-1.5 hover:text-blue-700 w-fit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                          Đồng bộ Lịch / Đặt nhắc nhở
                        </a>
                      </div>
                    </div>
                  );
                })}
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

        {/* ADD OBLIGATION MODAL */}
        {isObligationModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
            <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-3xl p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Dự kiến khoản phải chi</h3>
                <button onClick={() => setIsObligationModalOpen(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">&times;</button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tên khoản tiền</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Đóng học phí, Tiền nhà..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={newObName}
                    onChange={(e) => setNewObName(e.target.value)}
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Số tiền</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0 ₫"
                    className="w-full text-4xl font-extrabold bg-transparent py-1 outline-none text-slate-900 placeholder:text-slate-300"
                    value={newObAmount ? formatCurrency(newObAmount).replace(' ₫', '') : ''}
                    onChange={(e) => setNewObAmount(parseCurrency(e.target.value))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Ngày dự kiến thanh toán</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={newObDate}
                    onChange={(e) => setNewObDate(e.target.value)}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 items-start">
                  <div className="mt-1"><Calendar size={20} className="text-blue-600" /></div>
                  <p className="text-sm text-blue-800 font-medium">Sau khi thêm, bạn có thể tạo Lịch nhắc nhở (Google Calendar/Apple) để không bị quên!</p>
                </div>

                <button 
                  onClick={handleAddObligation}
                  disabled={loading || newObAmount <= 0 || !newObName || !newObDate}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl text-lg font-bold shadow-lg shadow-slate-300 disabled:opacity-50 disabled:shadow-none hover:bg-black transition-all mt-4"
                >
                  {loading ? 'Đang thêm...' : 'Khóa khoản tiền này lại'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
