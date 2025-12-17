import { getFieldRevenueDetail } from "@/lib/action";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

export default async function FieldRevenueDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getFieldRevenueDetail(id);

  if (!data) return <div>Lapangan tidak ditemukan</div>;

  const { field, reservations } = data;

  return (
    <div className="p-6">
      {/* Tombol Back */}
      <Link href="/admin/revenue" className="inline-flex items-center text-gray-500 hover:text-[#f64e42] mb-6 transition">
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        Kembali ke Revenue
      </Link>

      <div className="flex justify-between items-end mb-8">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Histori Pendapatan</h1>
           <p className="text-gray-500 text-lg">{field.name}</p>
        </div>
        <div className="text-right">
            <p className="text-sm text-gray-500">Total Transaksi</p>
            <p className="text-2xl font-bold text-[#f64e42]">{reservations.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
                <tr>
                    <th className="px-6 py-4">No</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Tanggal Main</th>
                    <th className="px-6 py-4">Jam</th>
                    <th className="px-6 py-4 text-right">Pendapatan (Net)</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {reservations.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                            Belum ada booking yang lunas untuk lapangan ini.
                        </td>
                    </tr>
                ) : (
                    reservations.map((res, index) => (
                        <tr key={res.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                            <td className="px-6 py-4">
                                <div className="font-medium text-gray-900">{res.User.name || "User"}</div>
                                <div className="text-xs text-gray-400">{res.User.email}</div>
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                                {res.startDate.toLocaleDateString("id-ID", { 
                                    day: 'numeric', month: 'long', year: 'numeric' 
                                })}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                                {res.startDate.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit', timeZone: "Asia/Jakarta" })} - 
                                {res.endDate.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit', timeZone: "Asia/Jakarta" })}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-gray-900">
                                Rp {res.price.toLocaleString("id-ID")}
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