import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zetra - Video Calling Platform',
  description: 'Real-time video calling powered by WebRTC',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
