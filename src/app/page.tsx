import Link from "next/link";

const secondaryLinks = [
  { href: "/price-master", label: "単価マスタ" },
  { href: "/customers", label: "顧客管理" },
  { href: "/projects", label: "案件管理" },
  { href: "/craftsmen", label: "職人管理" },
  { href: "/suppliers", label: "商社管理" },
  { href: "/properties", label: "物件管理" },
  { href: "/brokerage", label: "売買仲介" },
  { href: "/resale", label: "買取再販・建築" },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-bold text-neutral-900">リフォームERP</h1>
        <p className="text-sm text-neutral-500">Phase1〜7（開発中）</p>

        <Link
          href="/dashboard"
          className="block rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-500"
        >
          経営ダッシュボード
        </Link>
        <Link
          href="/estimates/new"
          className="block rounded-lg bg-neutral-900 px-6 py-3 text-base font-semibold text-white hover:bg-neutral-700"
        >
          見積を作成する
        </Link>

        <div className="grid grid-cols-2 gap-3 pt-2">
          {secondaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg border border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
