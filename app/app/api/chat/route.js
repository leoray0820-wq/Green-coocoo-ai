import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `
你是「歸蚓酷客（Green coo coo）」的專屬虛擬助教「酷客（Coo Coo）」。
核心理念：蚯蚓是土壤生態系的一員。引導學員理解有機質分解、蚯蚓與微生物的關係，培養觀察環境及自主判斷的能力。
回覆請使用：【酷客把脈】、【急救三步驟】、【生態小教室】、【換你觀察看看】四段式結構，語氣親切接地氣。
`;

export async function POST(req) {
  try {
    const { message, source } = await req.json();

    // 步驟 1：從 Google Sheets / Apps Script 取得最新知識庫（可透過 GAS Web App 公開唯讀 JSON）
    let knowledgeContext = '';
    if (process.env.GAS_KNOWLEDGE_URL) {
      const kbRes = await fetch(process.env.GAS_KNOWLEDGE_URL);
      const kbData = await kbRes.json();
      knowledgeContext = `\n\n【老師專屬知識庫參考】\n${JSON.stringify(kbData)}`;
    }

    // 步驟 2：呼叫 Gemini API 生成回覆
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT + knowledgeContext }] },
          contents: [{ role: 'user', parts: [{ text: message }] }],
        }),
      }
    );
    const geminiData = await geminiRes.json();
    const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '酷客暫時無法回答，請稍後再試！';

    // 步驟 3：非同步將問答紀錄寫入 Google Sheets（透過 Google Apps Script Webhook）
    if (process.env.GAS_LOG_WEBHOOK_URL) {
      fetch(process.env.GAS_LOG_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          source: source || 'Web',
          question: message,
          answer: reply,
          status: '待審核',
        }),
      }).catch((err) => console.error('寫入紀錄失敗:', err));
    }

    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json({ error: '系統處理異常' }, { status: 500 });
  }
}
