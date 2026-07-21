"use client";

import { useMemo, useState } from "react";
import type { Customer, EstimateLine, PriceMasterItem, Project } from "@/domain/types";
import { calcEstimateSummary, calcLineTotals } from "@/lib/calculations/estimate-calculations";
import { detectEstimateGaps } from "@/lib/ai/estimate-gap-detection";
import { saveEstimateAction } from "./actions";

function yen(n: number): string {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

function percent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

type ChecklistRow = { name: string; quantity: number; unit: string };

export function EstimateForm({
  customers,
  priceItems,
  projects,
}: {
  customers: Customer[];
  priceItems: PriceMasterItem[];
  projects: Project[];
}) {
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [selectedProjectId, setSelectedProjectId] = useState(""); // ""は「新しい案件を作成」
  const [title, setTitle] = useState("");
  const [siteAddress, setSiteAddress] = useState(""); // 現場住所（新規案件作成時のみ使用）
  const [overheadFeeInput, setOverheadFeeInput] = useState(""); // 諸経費
  const [adjustedPriceInput, setAdjustedPriceInput] = useState(""); // 調整後価格

  const [checkedItemIds, setCheckedItemIds] = useState<Set<string>>(new Set());
  const [quantityOverrides, setQuantityOverrides] = useState<Map<string, number>>(new Map());
  const [sellPriceOverrides, setSellPriceOverrides] = useState<Map<string, number>>(new Map());
  const [floorAreaInput, setFloorAreaInput] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedEstimateId, setSavedEstimateId] = useState<string | null>(null);

  const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null);
  const [floorPlanReading, setFloorPlanReading] = useState(false);
  const [floorPlanError, setFloorPlanError] = useState<string | null>(null);
  const [floorPlanNote, setFloorPlanNote] = useState<string | null>(null);

  const [checklistPdfFile, setChecklistPdfFile] = useState<File | null>(null);
  const [checklistPdfReading, setChecklistPdfReading] = useState(false);
  const [checklistPdfError, setChecklistPdfError] = useState<string | null>(null);
  const [unmatchedRows, setUnmatchedRows] = useState<ChecklistRow[]>([]);

  const categorizedItems = useMemo(() => {
    const groups = new Map<string, PriceMasterItem[]>();
    for (const item of priceItems) {
      const list = groups.get(item.category) ?? [];
      list.push(item);
      groups.set(item.category, list);
    }
    return Array.from(groups.entries());
  }, [priceItems]);

  const lines: EstimateLine[] = useMemo(
    () =>
      priceItems
        .filter((item) => checkedItemIds.has(item.id))
        .map((item) => ({
          id: item.id,
          priceItemId: item.id,
          category: item.category,
          name: item.name,
          unit: item.unit,
          quantity: quantityOverrides.get(item.id) ?? 1,
          costPrice: item.costPrice,
          sellPrice: sellPriceOverrides.get(item.id) ?? item.sellPrice,
        })),
    [priceItems, checkedItemIds, quantityOverrides, sellPriceOverrides]
  );

  const summary = useMemo(() => calcEstimateSummary(lines, 0.1), [lines]);
  const gapWarnings = useMemo(() => detectEstimateGaps(lines, priceItems), [lines, priceItems]);

  const customerProjects = useMemo(
    () => projects.filter((p) => p.customerId === customerId),
    [projects, customerId]
  );

  function handleCustomerChange(nextCustomerId: string) {
    setCustomerId(nextCustomerId);
    setSelectedProjectId("");
  }

  function toggleItem(item: PriceMasterItem, checked: boolean) {
    setCheckedItemIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(item.id);
      } else {
        next.delete(item.id);
      }
      return next;
    });

    if (checked) {
      // 床面積の反映はチェックが入った「その瞬間」だけ。以降に床面積が変わっても、
      // すでにチェック済みの項目の数量は上書きしない（下のonChangeが根拠）。
      const floorAreaSqm = Number(floorAreaInput) || 0;
      const defaultQty = item.unit === "㎡" && floorAreaSqm > 0 ? floorAreaSqm : 1;
      setQuantityOverrides((prev) => new Map(prev).set(item.id, defaultQty));
    } else {
      setQuantityOverrides((prev) => {
        const next = new Map(prev);
        next.delete(item.id);
        return next;
      });
      setSellPriceOverrides((prev) => {
        const next = new Map(prev);
        next.delete(item.id);
        return next;
      });
    }
  }

  function updateQuantity(itemId: string, quantity: number) {
    setQuantityOverrides((prev) => new Map(prev).set(itemId, quantity));
  }

  function updateSellPrice(itemId: string, sellPrice: number) {
    setSellPriceOverrides((prev) => new Map(prev).set(itemId, sellPrice));
  }

  async function handleReadFloorPlan() {
    if (!floorPlanFile) {
      setFloorPlanError("画像を選択してください。");
      return;
    }
    setFloorPlanReading(true);
    setFloorPlanError(null);
    setFloorPlanNote(null);
    try {
      const formData = new FormData();
      formData.append("image", floorPlanFile);
      const res = await fetch("/api/ai/floor-area", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setFloorPlanError(data.error ?? "画像の読み取りに失敗しました。");
        return;
      }
      setFloorAreaInput(String(data.floorAreaSqm));
      setFloorPlanNote(data.note);
    } catch {
      setFloorPlanError("画像の読み取りに失敗しました。時間をおいて再度お試しください。");
    } finally {
      setFloorPlanReading(false);
    }
  }

  async function handleReadChecklistPdf() {
    if (!checklistPdfFile) {
      setChecklistPdfError("PDFファイルを選択してください。");
      return;
    }
    setChecklistPdfReading(true);
    setChecklistPdfError(null);
    setUnmatchedRows([]);
    try {
      const formData = new FormData();
      formData.append("pdf", checklistPdfFile);
      const res = await fetch("/api/ai/checklist-pdf", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setChecklistPdfError(data.error ?? "PDFの読み取りに失敗しました。");
        return;
      }

      const rows: ChecklistRow[] = data.rows ?? [];
      const nextChecked = new Set(checkedItemIds);
      const nextQty = new Map(quantityOverrides);
      const unmatched: ChecklistRow[] = [];

      for (const row of rows) {
        const rowName = row.name.toLowerCase();
        const match = priceItems.find((item) => {
          const itemName = item.name.toLowerCase();
          return itemName.includes(rowName) || rowName.includes(itemName);
        });
        if (match) {
          nextChecked.add(match.id);
          nextQty.set(match.id, row.quantity > 0 ? row.quantity : 1);
        } else {
          unmatched.push(row);
        }
      }

      setCheckedItemIds(nextChecked);
      setQuantityOverrides(nextQty);
      setUnmatchedRows(unmatched);
    } catch {
      setChecklistPdfError("PDFの読み取りに失敗しました。時間をおいて再度お試しください。");
    } finally {
      setChecklistPdfReading(false);
    }
  }

  async function handleSaveAndCreatePdf() {
    setError(null);
    if (!customerId) {
      setError("顧客を選択してください");
      return;
    }
    if (!title.trim()) {
      setError("件名を入力してください");
      return;
    }
    if (lines.length === 0) {
      setError("見積項目を1件以上追加してください");
      return;
    }

    setSaving(true);
    try {
      const { estimateId } = await saveEstimateAction({
        customerId,
        title,
        lines,
        projectId: selectedProjectId || undefined,
        siteAddress: siteAddress.trim() || undefined,
        overheadFee: overheadFeeInput ? Number(overheadFeeInput) : undefined,
        adjustedPrice: adjustedPriceInput ? Number(adjustedPriceInput) : undefined,
      });
      setSavedEstimateId(estimateId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 pb-24 sm:p-8">
      <header>
        <h1 className="text-xl font-bold text-neutral-900">見積作成</h1>
        <p className="mt-1 text-sm text-neutral-500">
          顧客と件名を選び、工事項目にチェックを入れると自動で利益率を計算します。
        </p>
      </header>

      <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">顧客</span>
            <select
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base"
              value={customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {customerProjects.length > 0 && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-neutral-700">案件</span>
              <select
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                <option value="">+ 新しい案件を作成</option>
                {customerProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">
              {selectedProjectId ? "この見積の件名" : "件名（案件名にもなります）"}
            </span>
            <input
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base"
              placeholder="例：浴室リフォーム工事"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          {!selectedProjectId && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-neutral-700">
                現場住所（任意・見積書に表示されます）
              </span>
              <input
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base"
                placeholder="例：名古屋市中川区打中1丁目77"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
              />
            </label>
          )}
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">
              諸経費（任意・現場管理・固定費など）
            </span>
            <input
              type="number"
              min={0}
              step="any"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base"
              placeholder="例：293695"
              value={overheadFeeInput}
              onChange={(e) => setOverheadFeeInput(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">
              調整後価格（任意・空欄なら値引きなし）
            </span>
            <input
              type="number"
              min={0}
              step="any"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base"
              placeholder="例：3450000"
              value={adjustedPriceInput}
              onChange={(e) => setAdjustedPriceInput(e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-700">延べ床面積から自動計算</h2>
        <label className="block sm:max-w-xs">
          <span className="mb-1 block text-sm font-medium text-neutral-700">延べ床面積（㎡）</span>
          <input
            type="number"
            min={0}
            step="any"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base"
            placeholder="例：80"
            value={floorAreaInput}
            onChange={(e) => setFloorAreaInput(e.target.value)}
          />
        </label>
        <p className="text-xs text-neutral-500">
          ㎡単位の項目をチェックすると、この値が数量の初期値として入力されます。あくまで概算です。項目ごとに数量を調整してください。
        </p>

        <div className="grid gap-4 border-t border-neutral-100 pt-4 sm:grid-cols-2">
          <div className="space-y-2">
            <span className="block text-sm font-medium text-neutral-700">間取り図から読み取る</span>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFloorPlanFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
              <button
                type="button"
                disabled={floorPlanReading}
                onClick={handleReadFloorPlan}
                className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
              >
                {floorPlanReading ? "読み取り中..." : "読み取る"}
              </button>
            </div>
            {floorPlanError && <p className="text-xs text-red-600">{floorPlanError}</p>}
            {floorPlanNote && <p className="text-xs text-neutral-500">{floorPlanNote}</p>}
          </div>

          <div className="space-y-2">
            <span className="block text-sm font-medium text-neutral-700">
              チェック項目表（PDF）から読み取る
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setChecklistPdfFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
              <button
                type="button"
                disabled={checklistPdfReading}
                onClick={handleReadChecklistPdf}
                className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
              >
                {checklistPdfReading ? "読み取り中..." : "読み取る"}
              </button>
            </div>
            {checklistPdfError && <p className="text-xs text-red-600">{checklistPdfError}</p>}
          </div>
        </div>

        {unmatchedRows.length > 0 && (
          <div className="rounded-lg border border-neutral-300 bg-neutral-50 p-3">
            <h3 className="mb-1 text-xs font-semibold text-neutral-700">
              単価マスタに一致する項目が見つかりませんでした
            </h3>
            <ul className="list-inside list-disc space-y-0.5 text-xs text-neutral-600">
              {unmatchedRows.map((row, i) => (
                <li key={i}>
                  {row.name}（数量: {row.quantity} {row.unit}）
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-700">工事項目を選ぶ</h2>
        <div className="space-y-4">
          {categorizedItems.map(([category, items]) => (
            <div key={category}>
              <h3 className="mb-1 text-xs font-semibold text-neutral-500">{category}</h3>
              <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
                {items.map((item) => {
                  const checked = checkedItemIds.has(item.id);
                  return (
                    <label
                      key={item.id}
                      className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => toggleItem(item, e.target.checked)}
                      />
                      <span className="flex-1">
                        {item.name}
                        <span className="ml-1 text-neutral-400">
                          （{yen(item.sellPrice)} / {item.unit}）
                        </span>
                      </span>
                      {checked && (
                        <input
                          type="number"
                          min={0}
                          step="any"
                          className="w-24 rounded border border-neutral-300 px-2 py-1"
                          value={quantityOverrides.get(item.id) ?? 1}
                          onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">分類</th>
                <th className="px-4 py-3 font-medium">項目</th>
                <th className="px-4 py-3 font-medium">数量</th>
                <th className="px-4 py-3 font-medium">売価単価</th>
                <th className="px-4 py-3 font-medium">金額</th>
                <th className="px-4 py-3 font-medium">利益率</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-400">
                    まだ項目がありません
                  </td>
                </tr>
              )}
              {lines.map((line) => {
                const totals = calcLineTotals(line);
                return (
                  <tr key={line.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 text-neutral-500">{line.category}</td>
                    <td className="px-4 py-3">
                      {line.name}
                      <span className="ml-1 text-neutral-400">/{line.unit}</span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        className="w-20 rounded border border-neutral-300 px-2 py-1"
                        value={line.quantity}
                        onChange={(e) => updateQuantity(line.id, Number(e.target.value))}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        className="w-28 rounded border border-neutral-300 px-2 py-1"
                        value={line.sellPrice}
                        onChange={(e) => updateSellPrice(line.id, Number(e.target.value))}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{yen(totals.sellTotal)}</td>
                    <td className="px-4 py-3 text-neutral-500">{percent(totals.marginRate)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          const item = priceItems.find((p) => p.id === line.id);
                          if (item) toggleItem(item, false);
                        }}
                        className="text-neutral-400 hover:text-red-600"
                        aria-label="削除"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {gapWarnings.length > 0 && (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <h2 className="mb-2 text-sm font-semibold text-amber-800">見積チェック（ルールベース簡易版）</h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-amber-800">
            {gapWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-neutral-700">社内向けサマリー（PDFには出力されません）</h2>
        <dl className="grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-neutral-500">原価合計</dt>
            <dd className="font-medium">{yen(summary.subtotalCost)}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">売上合計</dt>
            <dd className="font-medium">{yen(summary.subtotalSell)}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">粗利額</dt>
            <dd className="font-medium">{yen(summary.profitAmount)}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">利益率</dt>
            <dd className="font-medium">{percent(summary.marginRate)}</dd>
          </div>
        </dl>
        <div className="mt-4 flex justify-between border-t border-neutral-200 pt-4 text-base">
          <span>消費税（10%）</span>
          <span>{yen(summary.taxAmount)}</span>
        </div>
        <div className="mt-1 flex justify-between text-lg font-bold">
          <span>お客様向け合計金額</span>
          <span>{yen(summary.totalAmount)}</span>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {savedEstimateId && !error && (
        <p className="text-sm text-green-700">
          保存しました。{" "}
          <a
            href={`/api/estimates/${savedEstimateId}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline hover:text-green-800"
          >
            PDFを開く
          </a>
        </p>
      )}

      <div className="sticky bottom-4 flex justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={handleSaveAndCreatePdf}
          className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? "保存中..." : "見積を保存してPDF作成"}
        </button>
      </div>
    </div>
  );
}
