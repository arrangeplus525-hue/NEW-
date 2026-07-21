import { NextResponse } from "next/server";
import {
  AI_MODEL,
  CHECKLIST_SCHEMA,
  getAnthropicClient,
  isAiConfigured,
} from "@/lib/ai/anthropic-client";

const MAX_PDF_BYTES = 8 * 1024 * 1024; // 8MB

export async function POST(request: Request) {
  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "AI機能を使うには設定が必要です。管理者にご確認ください。" },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("pdf");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "PDFファイルを選択してください。" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "PDFファイルを選択してください。" }, { status: 400 });
  }
  if (file.size > MAX_PDF_BYTES) {
    return NextResponse.json(
      { error: "PDFのサイズが大きすぎます（上限8MB）。" },
      { status: 413 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 2048,
      output_config: {
        format: { type: "json_schema", schema: CHECKLIST_SCHEMA },
        effort: "low",
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: base64 },
            },
            {
              type: "text",
              text:
                "このPDFは工事項目のチェックリスト（表）です。表の各行から、品名・数量・単位を抽出し、" +
                "rows配列として返してください。数量が読み取れない場合は1としてください。",
            },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "PDFの内容を読み取れませんでした。別のPDFでお試しください。" },
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

    const parsed = JSON.parse(textBlock.text) as {
      rows: { name: string; quantity: number; unit: string }[];
    };

    return NextResponse.json({ rows: parsed.rows });
  } catch (e) {
    console.error("checklist-pdf AI error:", e);
    return NextResponse.json(
      { error: "PDFの読み取りに失敗しました。時間をおいて再度お試しください。" },
      { status: 502 }
    );
  }
}
