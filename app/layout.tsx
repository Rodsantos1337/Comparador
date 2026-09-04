import type {Metadata, Viewport} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Comparador de Preços',
  description: 'Comparador de preços entre Continente e Pingo Doce.',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#09090b',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}