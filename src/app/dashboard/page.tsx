import {
  brokerageDealRepository,
  craftsmanRepository,
  customerRepository,
  estimateRepository,
  paymentRepository,
  processTaskRepository,
  projectRepository,
  resaleProjectRepository,
} from "@/repositories";
import { calcEstimateSummary } from "@/lib/calculations/estimate-calculations";
import { calcResaleProfit } from "@/lib/calculations/resale-calculations";

function yen(n: number): string {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

function percent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className="mt-1 text-2xl font-bold text-neutral-900">{value}</dd>
      {sub && <p className="mt-0.5 text-xs text-neutral-400">{sub}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  const [
    projects,
    processTasks,
    craftsmen,
    payments,
    estimates,
    customers,
    brokerageDeals,
    resaleProjects,
  ] = await Promise.all([
    projectRepository.list(),
    processTaskRepository.list(),
    craftsmanRepository.list(),
    paymentRepository.list(),
    estimateRepository.list(),
    customerRepository.list(),
    brokerageDealRepository.list(),
    resaleProjectRepository.list(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);

  const projectNameById = new Map(projects.map((p) => [p.id, p.title]));
  const craftsmanNameById = new Map(craftsmen.map((c) => [c.id, c.name]));

  const todayTasks = processTasks.filter((t) => t.startDate <= today && today <= t.endDate);
  const todayCraftsmen = [...new Set(todayTasks.map((t) => t.craftsmanId).filter((id): id is string => !!id))];

  const todayPayments = payments.filter((p) => p.paidDate === today);
  const todayPaymentsTotal = todayPayments.reduce((sum, p) => sum + p.amount, 0);

  const pendingEstimateProjects = projects.filter((p) => p.status === "estimate").length;
  const orderRate =
    projects.length === 0 ? 0 : projects.filter((p) => p.status !== "estimate").length / projects.length;

  const thisMonthEstimates = estimates.filter((e) => e.issueDate.slice(0, 7) === thisMonth);
  const thisMonthSummaries = thisMonthEstimates.map((e) => calcEstimateSummary(e.lines, e.taxRate));
  const thisMonthRevenue = thisMonthSummaries.reduce((sum, s) => sum + s.subtotalSell, 0);
  const thisMonthCost = thisMonthSummaries.reduce((sum, s) => sum + s.subtotalCost, 0);
  const thisMonthProfit = thisMonthRevenue - thisMonthCost;
  const thisMonthMarginRate = thisMonthRevenue === 0 ? 0 : thisMonthProfit / thisMonthRevenue;

  const referralCount = customers.filter((c) => c.referrerId).length;
  const resaleProfitTotal = resaleProjects.reduce((sum, p) => sum + calcResaleProfit(p).profit, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 pb-24 sm:p-8">
      <header>
        <h1 className="text-xl font-bold text-neutral-900">経営ダッシュボード</h1>
        <p className="mt-1 text-sm text-neutral-500">{today} 時点</p>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-neutral-700">今日</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Tile
            label="今日の現場"
            value={`${todayTasks.length}件`}
            sub={todayTasks.map((t) => projectNameById.get(t.projectId) ?? t.title).join("、") || "なし"}
          />
          <Tile
            label="今日の職人"
            value={`${todayCraftsmen.length}名`}
            sub={todayCraftsmen.map((id) => craftsmanNameById.get(id)).join("、") || "なし"}
          />
          <Tile label="今日の入金" value={yen(todayPaymentsTotal)} sub={`${todayPayments.length}件`} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-neutral-700">営業</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Tile label="見積待ち案件" value={`${pendingEstimateProjects}件`} />
          <Tile label="受注率" value={percent(orderRate)} />
          <Tile label="案件数" value={`${projects.length}件`} />
          <Tile label="紹介件数" value={`${referralCount}件`} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-neutral-700">今月の業績（見積ベース）</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Tile label="今月売上" value={yen(thisMonthRevenue)} />
          <Tile label="今月粗利" value={yen(thisMonthProfit)} />
          <Tile label="利益率" value={percent(thisMonthMarginRate)} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-neutral-700">売買・再販</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Tile label="売買件数" value={`${brokerageDeals.length}件`} />
          <Tile
            label="仲介手数料合計"
            value={yen(brokerageDeals.reduce((sum, d) => sum + d.commissionAmount, 0))}
          />
          <Tile label="再販利益（見込含む）" value={yen(resaleProfitTotal)} />
        </div>
      </section>
    </div>
  );
}
