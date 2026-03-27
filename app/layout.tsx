import type {Metadata} from 'next';
import "./globals.css";
import LoginGuard from '@/components/LoginGuard'; // Global styles

export const metadata: Metadata = {
  title: 'My Google AI Studio App',
  description: 'My Google AI Studio App',
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
