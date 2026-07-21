import { NextResponse } from "next/server";
import {
  AI_MODEL,
  FLOOR_AREA_SCHEMA,
  getAnthropicClient,
  isAiConfigured,
} from "@/lib/ai/anthropic-client";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB

export async function POST(request: Request) {
  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "AI機能を使うには設定が必要です。管理者にご確認ください。" },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "画像を選択してください。" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "画像ファイルを選択してください。" }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "画像のサイズが大きすぎます（上限4MB）。撮影し直すか圧縮してください。" },
      { status: 413 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 1024,
      output_config: { format: { type: "json_schema", schema: FLOOR_AREA_SCHEMA } },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: base64,
              },
            },
            {
              type: "text",
              text:
                "この画像は住宅の間取り図です。各部屋のラベルや畳数・㎡表記・寸法から、" +
                "延べ床面積の概算値（㎡、数値のみ）を算出してください。" +
                "noteには、どの部屋をどう合計したかを1〜2文の日本語で簡潔に説明してください。" +
                "正確な測量ではなく概算であることを前提にしてください。",
            },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "画像の内容を読み取れませんでした。別の画像でお試しください。" },
        { status: 422 }
      );
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "読み取り結果の解析に失敗しました。もう一度お試しください。" },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(textBlock.text) as { floorAreaSqm: number; note: string };
    if (!Number.isFinite(parsed.floorAreaSqm) || parsed.floorAreaSqm <= 0) {
      return NextResponse.json(
        { error: "面積を読み取れませんでした。手入力してください。" },
        { status: 422 }
      );
    }

    return NextResponse.json({ floorAreaSqm: parsed.floorAreaSqm, note: parsed.note });
  } catch (e) {
    console.error("floor-area AI error:", e);
    return NextResponse.json(
      { error: "画像の読み取りに失敗しました。時間をおいて再度お試しください。" },
      { status: 502 }
    );
  }
}
