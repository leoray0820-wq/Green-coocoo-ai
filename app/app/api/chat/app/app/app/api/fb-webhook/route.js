import { NextResponse } from 'next/server';

// 1. Meta Webhook 網址驗證 (設定後台時觸發)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.FB_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('驗證失敗', { status: 403 });
}

// 2. 接收粉專貼文留言並自動回覆
export async function POST(req) {
  try {
    const body = await req.json();

    if (body.object === 'page') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          // 確保事件是「新增貼文留言 (feed -> comment -> add)」
          if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
            const commentId = change.value.comment_id;
            const message = change.value.message;
            const senderId = change.value.from?.id;

            // 重要防護：避免粉專自己回覆自己造成無限迴圈
            if (senderId === process.env.FB_PAGE_ID || !message) {
              continue;
            }

            // (選用) 若希望只有留言包含「酷客」或「？」才觸發，可取消下方註解：
            // if (!message.includes('酷客') && !message.includes('?') && !message.includes('？')) continue;

            // 呼叫內部的酷客 AI API 取得回覆
            const host = req.headers.get('host');
            const protocol = host.includes('localhost') ? 'http' : 'https';
            const aiRes = await fetch(`${protocol}://${host}/api/chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: message,
                source: 'FB_Comment'
              }),
            });
            const aiData = await aiRes.json();

            // 透過 Meta Graph API 在該留言下方直接回覆
            if (aiData.reply) {
              await fetch(`https://graph.facebook.com/v21.0/${commentId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  message: aiData.reply,
                  access_token: process.env.FB_PAGE_ACCESS_TOKEN,
                }),
              });
            }
          }
        }
      }
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }
    return new NextResponse('Not Found', { status: 404 });
  } catch (error) {
    console.error('FB Webhook 錯誤:', error);
    return new NextResponse('Server Error', { status: 500 });
  }
}
