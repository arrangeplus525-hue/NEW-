import Link from "next/link";
import { customerRepository, projectRepository } from "@/repositories";
import type { Project } from "@/domain/types";

const statusLabel: Record<Project["status"], string> = {
  estimate: "見積中",
  contracted: "契約済み",
  in_progress: "施工中",
  completed: "完了",
};

export default async function ProjectsPage() {
  const [projects, customers] = await Promise.all([projectRepository.list(), customerRepository.list()]);
  const customerNameById = new Map(customers.map((c) => [c.id, c.name]));

  const sorted = [...projects].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 pb-24 sm:p-8">
      <header>
        <h1 className="text-xl font-bold text-neutral-900">案件管理</h1>
        <p className="mt-1 text-sm text-neutral-500">
          見積を保存すると自動的に案件が作成されます。ここで進捗状況を管理できます。
        </p>
      </header>

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">件名</th>
                <th className="px-4 py-3 font-medium">顧客</th>
                <th className="px-4 py-3 font-medium">状態</th>
                <th className="px-4 py-3 font-medium">作成日</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                    まだ案件がありません（見積を作成すると自動的に作られます）
                  </td>
                </tr>
              )}
              {sorted.map((p) => (
                <tr key={p.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{p.title}</td>
                  <td className="px-4 py-3 text-neutral-600">{customerNameById.get(p.customerId) ?? "-"}</td>
                  <td className="px-4 py-3 text-neutral-600">{statusLabel[p.status]}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {new Date(p.createdAt).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/projects/${p.id}`} className="text-blue-600 hover:underline">
                      詳細
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
