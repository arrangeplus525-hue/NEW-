import Anthropic from "@anthropic-ai/sdk";

// サーバー専用（APIルートからのみ呼ばれる）。
// ANTHROPIC_API_KEYを使うため、絶対にクライアントバンドルに含めてはいけない
// （NEXT_PUBLIC_ を付けない、"use client" ファイルから import しない）。

let cached: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (cached) return cached;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY が設定されていません。.env.local を確認してください。"
    );
  }

  cached = new Anthropic({ apiKey });
  return cached;
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export const AI_MODEL = "claude-sonnet-5";

export const FLOOR_AREA_SCHEMA = {
  type: "object",
  properties: {
    floorAreaSqm: { type: "number" },
    note: { type: "string" },
  },
  required: ["floorAreaSqm", "note"],
  additionalProperties: false,
} as const;

export const CHECKLIST_SCHEMA = {
  type: "object",
  properties: {
    rows: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          quantity: { type: "number" },
          unit: { type: "string" },
        },
        required: ["name", "quantity", "unit"],
        additionalProperties: false,
      },
    },
  },
  required: ["rows"],
  additionalProperties: false,
} as const;
