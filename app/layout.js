import './globals.css';

export const metadata = {
  title: 'Daily Dashboard',
  description: 'Your personal daily dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
