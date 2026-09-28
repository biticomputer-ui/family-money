'use client';

import { ArrowRight, CheckCircle2, ShieldCheck, Zap, LineChart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { householdRepository } from '../repository/household';
import { HouseholdData } from '../domain/models';

export default function LandingPage() {
  const router = useRouter();

  const handleDemo = () => {
    const nextPayday = new Date();
    nextPayday.setDate(nextPayday.getDate() + 7);
    
    const demoData: HouseholdData = {
      schemaVersion: 1,
      householdId: crypto.randomUUID(),
      currency: 'VND',
      timezone: 'Asia/Ho_Chi_Minh',
      balance: 9500000,
      nextPayday: nextPayday.toISOString(),
      lockedSavings: 2000000,
      emergencyReserve: 1000000,
      obligations: [
        { id: crypto.randomUUID(), title: 'Tiền điện', amount: 850000, dueDate: new Date().toISOString(), status: 'pending', createdAt: new Date().toISOString() },
        { id: crypto.randomUUID(), title: 'Internet', amount: 370000, dueDate: new Date().toISOString(), status: 'pending', createdAt: new Date().toISOString() },
        { id: crypto.randomUUID(), title: 'Phí dịch vụ', amount: 1000000, dueDate: new Date().toISOString(), status: 'pending', createdAt: new Date().toISOString() }
      ],
      transactions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    householdRepository.save(demoData);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100">
      {/* HEADER */}
      <nav className="p-6 max-w-5xl mx-auto flex justify-between items-center">
        <div className="font-bold text-xl text-slate-900 tracking-tight">Family<span className="text-indigo-600">Money</span></div>
      </nav>

      <main className="max-w-md mx-auto px-6 pb-20 pt-10 flex flex-col gap-12">
        {/* HERO SECTION */}
        <section className="text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            Từ hôm nay đến kỳ lương, nhà mình còn được tiêu bao nhiêu?
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed font-medium">
            Family Money giữ riêng tiền hóa đơn, tiết kiệm và dự phòng — rồi cho bạn biết số tiền thực sự có thể tiêu mỗi ngày.
          </p>

          <div className="flex flex-col gap-3 pt-4">
            <button 
              onClick={() => router.push('/onboarding')}
              className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              Tính thử ngay — khoảng 1 phút <ArrowRight size={20} />
            </button>
            <button 
              onClick={handleDemo}
              className="w-full py-4 rounded-2xl bg-white text-slate-700 border-2 border-slate-200 font-bold text-lg hover:bg-slate-50 transition-colors"
            >
              Xem thử với dữ liệu mẫu
            </button>
          </div>
        </section>

        {/* MOCK CARD */}
        <section className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-indigo-900">
            <LineChart size={120} className="-mr-8 -mt-8" />
          </div>
          
          <p className="text-slate-500 font-semibold uppercase tracking-widest text-xs mb-3 relative z-10">
            CÒN ĐƯỢC TIÊU
          </p>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2 relative z-10">
            4.280.000 ₫
          </h2>
          <div className="mt-2 text-center bg-slate-50 rounded-2xl py-3 px-4 inline-block relative z-10 border border-slate-100">
            <p className="text-slate-600 font-medium text-sm">đến ngày nhận lương 05/10</p>
            <p className="text-indigo-600 font-bold mt-1 text-lg">≈ 535.000 ₫ / ngày</p>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 text-sm text-slate-500 text-left space-y-2 font-medium relative z-10">
            <div className="flex justify-between">
              <span>Tiền hiện có</span>
              <span className="text-slate-900">9.500.000</span>
            </div>
            <div className="flex justify-between">
              <span>Khoản sắp phải trả</span>
              <span className="text-orange-500">-2.220.000</span>
            </div>
            <div className="flex justify-between">
              <span>Tiết kiệm đã khóa</span>
              <span className="text-teal-600">-2.000.000</span>
            </div>
            <div className="flex justify-between">
              <span>Dự phòng</span>
              <span className="text-teal-600">-1.000.000</span>
            </div>
          </div>
        </section>

        {/* MENTAL MODEL */}
        <section className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900 text-center">Rất đơn giản, chỉ 3 bước:</h3>
          <div className="space-y-4">
            <div className="flex gap-4 items-start bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center shrink-0">1</div>
              <div>
                <p className="font-bold text-slate-900">Nhà mình đang có bao nhiêu?</p>
                <p className="text-sm text-slate-500 mt-1">Gom lại toàn bộ tiền mặt và thẻ có thể dùng.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center shrink-0">2</div>
              <div>
                <p className="font-bold text-slate-900">Từ giờ đến ngày lương còn phải trả gì?</p>
                <p className="text-sm text-slate-500 mt-1">Khai báo các hóa đơn, khoản nợ sắp tới.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center shrink-0">3</div>
              <div>
                <p className="font-bold text-slate-900">Phần còn lại mới là tiền được tiêu</p>
                <p className="text-sm text-slate-500 mt-1">Family Money sẽ tính ra mức cho phép mỗi ngày, ví dụ: <span className="text-indigo-600 font-bold">535.000đ/ngày</span>.</p>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST SECTION */}
        <section className="bg-slate-100 p-6 rounded-3xl border border-slate-200">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-600 shrink-0" size={20} />
              <p className="font-medium text-slate-700">Không cần Excel phức tạp.</p>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-600 shrink-0" size={20} />
              <p className="font-medium text-slate-700">Không cần kết nối thẻ ngân hàng.</p>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-600 shrink-0" size={20} />
              <p className="font-medium text-slate-700">Không cần tạo tài khoản.</p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-200/60">
            <div className="flex items-start gap-3">
              <ShieldCheck className="text-slate-400 shrink-0 mt-1" size={20} />
              <p className="text-sm text-slate-500 leading-relaxed">
                <strong className="text-slate-700">Dữ liệu an toàn:</strong> Dữ liệu chính được lưu trên thiết bị của bạn, không lưu trong database trung tâm của Family Money.
              </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
