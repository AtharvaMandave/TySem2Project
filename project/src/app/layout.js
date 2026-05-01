import { Inter, Playfair_Display } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/Navbar/Navbar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Alumni Connect | Legacy & Excellence",
  description:
    "A private community for distinguished graduates. Bridge the gap between your academic roots and your global aspirations through our exclusive alumni network.",
  keywords: [
    "alumni",
    "network",
    "graduates",
    "mentorship",
    "community",
    "education",
  ],
  openGraph: {
    title: "Alumni Connect | Legacy & Excellence",
    description:
      "A private community for distinguished graduates. Bridge the gap between your academic roots and your global aspirations.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfairDisplay.variable}`}
    >
      <body>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
