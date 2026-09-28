import { redirect } from "next/navigation";
import { getHousehold } from "./actions";
import Link from "next/link";
import { Wallet, ShieldCheck, PieChart, ArrowRight, Sparkles } from "lucide-react";
import { seedDemoData } from "./actions";

export default async function Home() {
  const household = await getHousehold();
  
  if (household?.availableCash) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white text-slate-900 pb-20">
      {/* Hero Section */}
      <div className="pt-20 pb-16 px-6 max-w-md mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-6">
          <Sparkles size={16} />
          <span>Safe-to-Spend MVP V0</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
          Biết gia đình <span className="text-blue-600">còn được tiêu bao nhiêu.</span>
        </h1>
        <p className="text-lg text-slate-600 mb-10 leading-relaxed">
          Không cần Excel. Không cần ghi chép phức tạp. Family Money giúp bạn an tâm chi tiêu từ hôm nay đến kỳ lương tiếp theo.
        </p>
        
        <Link 
          href="/onboarding" 
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-2xl text-xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] transition-all"
        >
          Bắt đầu ngay
          <ArrowRight size={20} />
        </Link>
      </div>

      {/* User Guide Section */}
      <div className="max-w-md mx-auto px-6 space-y-8 mt-4">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-6">Cách hoạt động</h2>
        
        <div className="relative space-y-6 before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
          
          <div className="relative flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 z-10 shadow-sm border-4 border-white">
              <Wallet size={24} />
            </div>
            <div className="pt-1">
              <h3 className="text-lg font-bold text-slate-900">1. Nhập quỹ hiện có</h3>
              <p className="text-slate-600 text-sm mt-1">Cho chúng tôi biết số tiền gia đình đang có sẵn để chi tiêu và ngày nhận lương tiếp theo.</p>
            </div>
          </div>

          <div className="relative flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 z-10 shadow-sm border-4 border-white">
              <ShieldCheck size={24} />
            </div>
            <div className="pt-1">
              <h3 className="text-lg font-bold text-slate-900">2. Bảo vệ các khoản cứng</h3>
              <p className="text-slate-600 text-sm mt-1">Điền tiền nhà, điện nước và các mục tiêu tiết kiệm. Ứng dụng sẽ tự động tách chúng ra an toàn.</p>
            </div>
          </div>

          <div className="relative flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 z-10 shadow-sm border-4 border-white">
              <PieChart size={24} />
            </div>
            <div className="pt-1">
              <h3 className="text-lg font-bold text-slate-900">3. An tâm chi tiêu</h3>
              <p className="text-slate-600 text-sm mt-1">Nhận ngay con số "Còn được tiêu". Trước khi mua sắm, bạn có thể thử mô phỏng xem mình có đủ khả năng không!</p>
            </div>
          </div>
          
        </div>

        <div className="pt-12 text-center border-t border-slate-100">
          <form action={seedDemoData}>
            <button type="submit" className="text-sm font-medium text-slate-400 hover:text-blue-600 transition-colors">
              Hoặc bấm vào đây để tải dữ liệu dùng thử (Demo)
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
