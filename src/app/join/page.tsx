'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { householdRepository } from '../../repository/household';
import { HouseholdData } from '../../domain/models';
import { Users, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { calculateRawSafeToSpend } from '../../domain/engine';

function JoinContent() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'preview' | 'error'>('loading');
  const [snapshotData, setSnapshotData] = useState<HouseholdData | null>(null);

  useEffect(() => {
    let isMounted = true;
    setTimeout(async () => {
      try {
        const hash = window.location.hash;
        if (!hash || !hash.startsWith('#payload=')) {
          if (isMounted) setStatus('error');
          return;
        }
        
        const encoded = hash.replace('#payload=', '');
        const { decryptSnapshot } = await import('../../repository/snapshot');
        
        const parsed = await decryptSnapshot(encoded);
        
        if (parsed && parsed.schemaVersion) {
          if (isMounted) {
            setSnapshotData(parsed);
            setStatus('preview');
          }
        } else {
          if (isMounted) setStatus('error');
        }
      } catch (e) {
        console.error(e);
        if (isMounted) setStatus('error');
      }
    }, 0);
    return () => { isMounted = false; };
  }, []);

  const handleImport = () => {
    if (snapshotData) {
      // Backup current data before replacing? For simplicity, we just replace.
      householdRepository.save(snapshotData);
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <Users size={40} />
      </div>
      
      {status === 'loading' && (
        <>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Đang tải dữ liệu...</h1>
          <Loader2 size={32} className="animate-spin text-indigo-500 mt-4 mx-auto" />
        </>
      )}

      {status === 'preview' && snapshotData && (
        <div className="w-full max-w-md text-left">
          <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">Nhận dữ liệu Family Money</h1>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 my-6">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Còn được tiêu</span>
              <span className="font-bold text-slate-900">{formatCurrency(calculateRawSafeToSpend(snapshotData))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Khoản phải trả</span>
              <span className="font-bold text-slate-900">{snapshotData.obligations.length} khoản</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Giao dịch</span>
              <span className="font-bold text-slate-900">{snapshotData.transactions.length} giao dịch</span>
            </div>
            <div className="border-t border-slate-100 pt-4 text-xs text-slate-400 text-center font-medium">
              Bản tạo lúc: {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(snapshotData.updatedAt))}
            </div>
          </div>
          
          <p className="text-sm text-red-500 font-medium text-center mb-6">Lưu ý: Dữ liệu hiện tại trên máy này sẽ bị thay thế.</p>
          
          <div className="flex gap-3">
            <button 
              onClick={() => router.push('/')}
              className="flex-1 py-4 bg-white text-slate-700 font-bold border-2 border-slate-200 rounded-2xl"
            >
              Hủy
            </button>
            <button 
              onClick={handleImport}
              className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200"
            >
              Nhập dữ liệu này
            </button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Lỗi dữ liệu</h1>
          <p className="text-slate-500 mb-6">Đường link không hợp lệ hoặc bị hỏng.</p>
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
