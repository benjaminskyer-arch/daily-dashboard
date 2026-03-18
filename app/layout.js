import './globals.css';

export const metadata = {
  title: 'Savvy Dashboard',
  description: 'Your personal Savvy daily dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
