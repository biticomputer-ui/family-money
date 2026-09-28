'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { importHouseholdData } from '../actions';
import { Users, Loader2 } from 'lucide-react';

function JoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const data = searchParams.get('data');
    if (!data) {
      setStatus('error');
      return;
    }

    importHouseholdData(data).then((success) => {
      if (success) {
        setStatus('success');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setStatus('error');
      }
    });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <Users size={40} />
      </div>
      
      {status === 'loading' && (
        <>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Đang đồng bộ dữ liệu...</h1>
          <p className="text-slate-500 mb-6">Đang kết nối bạn vào sổ thu chi chung của gia đình</p>
          <Loader2 size={32} className="animate-spin text-blue-500" />
        </>
      )}

      {status === 'success' && (
        <>
          <h1 className="text-2xl font-bold text-green-600 mb-2">Thành công!</h1>
          <p className="text-slate-500">Đã đồng bộ xong. Đang chuyển hướng...</p>
        </>
      )}

      {status === 'error' && (
        <>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Lỗi đồng bộ</h1>
          <p className="text-slate-500 mb-6">Đường link không hợp lệ hoặc đã hết hạn.</p>
          <button 
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold"
          >
            Về trang chủ
          </button>
        </>
      )}
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <JoinContent />
    </Suspense>
  );
}
