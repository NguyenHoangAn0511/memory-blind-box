import type {Metadata} from 'next';
import "./globals.css";
import LoginGuard from '@/components/LoginGuard'; // Global styles

export const metadata: Metadata = {
  title: 'Memory Blind Box',
  description: 'A digital TCG of precious memories.',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🦄</text></svg>",
  },
  formatDetection: {
    telephone: false,
    date: false,
    email: false,
    address: false,
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LoginGuard>{children}</LoginGuard>
      </body>
    </html>
  );
}
