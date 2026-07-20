import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ログイン状態の確認・ログイン/ログアウト処理専用のクライアント。
// データ取得・更新（顧客・見積など）はservice_roleを使う src/lib/supabase/client.ts の方を使う。
// こちらはanon keyを使い、Cookieに保存されたユーザーのセッションだけを扱う。
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Componentから呼ばれた場合はCookieを書き換えられないため無視する。
            // セッションのリフレッシュはmiddlewareが担当する。
          }
        },
      },
    }
  );
}
