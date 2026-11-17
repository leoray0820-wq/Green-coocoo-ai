import './globals.css';

export const metadata = {
  title: '歸蚓酷客 Green coo coo | AI 蚯蚓堆肥智慧助教',
  description: '引導學員理解有機質分解、蚯蚓與微生物的關係，培養觀察環境及自主判斷的能力。',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body className="bg-stone-100 text-stone-800 antialiased">
        {children}
      </body>
    </html>
  );
}
