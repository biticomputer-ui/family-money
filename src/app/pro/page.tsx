import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ProPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-md pt-8">
        <Link href="/dashboard" className="text-slate-500 inline-flex items-center gap-2 mb-8">
          <ArrowLeft size={20} />
          <span>Quay lại</span>
        </Link>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Family Pro</h1>
        <p className="text-slate-600 mb-8">
          Mở khóa toàn bộ sức mạnh quản lý tài chính cho gia đình bạn.
        </p>
        
        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6 space-y-6 mb-8">
          <h2 className="text-2xl font-bold text-amber-600 text-center border-b border-amber-50 pb-4">
            299.000 ₫ <span className="text-sm font-normal text-slate-500">/ năm</span>
          </h2>
          
          <ul className="space-y-4">
            <li className="flex gap-3">
              <span className="text-amber-500">✓</span>
              <span className="text-slate-700">Chia sẻ với các thành viên trong gia đình</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-500">✓</span>
              <span className="text-slate-700">Dự báo tiền mặt (Cashflow forecast)</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-500">✓</span>
              <span className="text-slate-700">Lên kế hoạch đa mục tiêu</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-500">✓</span>
              <span className="text-slate-700">Báo cáo tình hình tài chính hàng tuần</span>
            </li>
          </ul>
        </div>
        
        <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm leading-relaxed mb-6">
          <p className="font-semibold mb-1">Tính năng Pro hiện đang trong quá trình phát triển.</p>
          <p>Tham gia danh sách ưu tiên để nhận thông báo ngay khi ra mắt!</p>
        </div>
        
        <button 
          className="w-full py-4 bg-slate-900 text-white rounded-2xl text-lg font-medium shadow-md"
        >
          Tham gia danh sách Early Access
        </button>
      </div>
    </div>
  );
}
