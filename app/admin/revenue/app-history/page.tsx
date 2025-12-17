// app/admin/revenue/app-history/page.tsx

import { getAppRevenueHistory } from "@/lib/action";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

export default async function AppRevenueHistoryPage() {
  const history = await getAppRevenueHistory();
  const totalRecords = history.length;

  return (
    <div className="p-6">
      {/* Tombol Back biar ga kesasar */}
      <Link
        href="/admin/revenue"
        className="inline-flex items-center text-gray-500 hover:text-[#f64e42] mb-6 transition"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Link>

      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Application Revenue History 💰
          </h1>
          <p className="text-gray-500">
            Breakdown pendapatan bersih aplikasi (Fee 10% + Kode Unik)
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Transaksi</p>
          <p className="text-2xl font-bold text-[#f64e42]">{totalRecords}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
            <tr>
              <th className="px-6 py-4">No</th>
              <th className="px-6 py-4">Booking Info</th>
              <th className="px-6 py-4">Lapangan</th>
              <th className="px-6 py-4">Waktu Main</th>
              <th className="px-6 py-4 text-right">App Revenue (IDR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {history.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                  Belum ada cuan masuk nih bro. Sabar ya!
                </td>
              </tr>
            ) : (
              history.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-800">
                      #{item.bookingCode}
                    </div>
                    <div className="text-xs text-gray-500">{item.user}</div>
                    <div className="text-[10px] text-gray-400">
                      {item.userEmail}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-700">
                    {item.field}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {item.date.toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      timeZone: "Asia/Jakarta",
                    })}
                    <span className="text-xs ml-1 text-gray-400">
                      (
                      {item.date.toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Jakarta",
                      })}
                      )
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded-md font-bold text-xs">
                      + Rp {item.appRevenue.toLocaleString("id-ID")}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
