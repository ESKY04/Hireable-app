import './globals.css';

export const metadata = {
  title: 'Hireable',
  description: 'Get a tailored resume for any job. In minutes.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
