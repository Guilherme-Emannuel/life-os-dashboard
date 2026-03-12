import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const message =
    (body.message as string | undefined) ??
    "Você tem tarefas críticas pendentes no seu Life OS.";

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return NextResponse.json(
      {
        error:
          "Configuração do Telegram ausente. Defina TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID no .env.",
      },
      { status: 500 },
    );
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
    }),
  });

  if (!res.ok) {
    const textBody = await res.text();
    return NextResponse.json(
      { error: "Falha ao enviar mensagem para o Telegram", details: textBody },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

