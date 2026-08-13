import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Comparador de Preços',
  description: 'Comparador de preços entre Continente e Pingo Doce.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}