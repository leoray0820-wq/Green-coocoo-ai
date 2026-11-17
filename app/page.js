'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ChatInterface() {
  const searchParams = useSearchParams();
  // 支援 QR Code 帶入預設問題，例如：/?q=箱子有點臭臭的怎麼辦
  const initialQuestion = searchParams.get('q') || '';

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '哈囉！我是「歸蚓酷客」的虛擬助教酷客 🌱\n蚯蚓是土壤生態系的好夥伴，今天你的蚯蚓箱還好嗎？有任何觀察或疑問，隨時問我喔！'
    }
  ]);
  const [input, setInput] = useState(initialQuestion);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content, source: 'Web_QRCode' }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', content: '哎呀，酷客剛剛在土裡鑽太深訊號不好，請再試一次！' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-stone-50 border-x border-stone-200">
      {/* 頂部品牌列 */}
      <header className="bg-emerald-800 text-white p-4 shadow-md flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center font-bold text-lg">
          蚓
        </div>
        <div>
          <h1 className="font-bold text-lg">歸蚓酷客 Green coo coo</h1>
          <p className="text-xs text-emerald-200">蚯蚓堆肥與土壤生態智慧助教</p>
        </div>
      </header>

      {/* 對話訊息區 */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-emerald-700 text-white rounded-br-none'
                  : 'bg-white text-stone-800 border border-stone-200 shadow-sm rounded-bl-none'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-xs text-stone-500 animate-pulse">酷客正在翻閱生態筆記中...</div>
        )}
      </main>

      {/* 快速提問標籤 */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto bg-stone-100 border-t border-stone-200">
        {['箱子有臭味', '出現小果蠅', '蚯蚓想逃家', '什麼時候可採收'].map((tag) => (
          <button
            key={tag}
            onClick={() => setInput(tag)}
            className="shrink-0 text-xs bg-white border border-emerald-700 text-emerald-800 px-3 py-1 rounded-full hover:bg-emerald-50"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* 底部輸入框 */}
      <form onSubmit={sendMessage} className="p-3 bg-white border-t border-stone-200 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="描述你看到的蚯蚓箱狀況..."
          className="flex-1 border border-stone-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-emerald-700"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-emerald-700 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-emerald-800 disabled:opacity-50"
        >
          發問
        </button>
      </form>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="p-4 text-center">載入酷客助教中...</div>}>
      <ChatInterface />
    </Suspense>
  );
}
