import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '星座速配 · SIGN MATCH',
  description: '选择两个人的星座与年龄，一秒揭晓恋人 / 夫妻 / 朋友三维契合度，还能让 AI 深度解读。'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#07050f'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
