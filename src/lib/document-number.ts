// Phase1は仮採番。Supabase接続後はDBの連番シーケンスに置き換える。
export function generateDocumentNumber(prefix: string, date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 900 + 100);
  return `${prefix}-${y}${m}${d}-${rand}`;
}
