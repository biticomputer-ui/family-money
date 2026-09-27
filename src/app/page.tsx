import { redirect } from "next/navigation";
import { getHousehold } from "./actions";
import Link from "next/link";
import { seedDemoData } from "./actions";

export default async function Home() {
  const household = await getHousehold();
  
  if (household?.availableCash) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-slate-900">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Biết gia đình còn được tiêu bao nhiêu.
          </h1>
          <p className="text-lg text-slate-600">
            Không cần Excel. Không cần ghi chép phức tạp.
          </p>
          <p className="text-lg text-slate-600">
            Chỉ cần cho Family Money biết những khoản quan trọng.
          </p>
        </div>

        <div className="pt-8">
          <Link 
            href="/onboarding" 
            className="block w-full py-4 px-6 bg-blue-600 text-white rounded-2xl text-xl font-medium shadow-lg hover:bg-blue-700 transition-colors"
          >
            Bắt đầu
          </Link>
        </div>

        <div className="pt-12">
          <form action={seedDemoData}>
            <button type="submit" className="text-sm text-slate-400 hover:text-slate-600 underline underline-offset-4">
              Chạy Demo (Seed Data)
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
