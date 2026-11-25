import "./globals.css";

export const metadata = {
  title: "Puja Bookings — Admin",
  description: "Admin dashboard for managing puja bookings",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
