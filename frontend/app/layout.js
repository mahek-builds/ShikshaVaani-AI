import "./globals.css";

export const metadata = {
  title: "ShikshaVaani AI — Voice Teaching Assistant",
  description:
    "Hands-free, bilingual AI co-pilot for live classroom sessions in Indian government schools. Teachers speak in Hinglish; ShikshaVaani AI generates and projects educational content onto the smart board instantly.",
  keywords: [
    "ShikshaVaani AI",
    "AI teaching assistant",
    "government schools",
    "Hinglish",
    "voice-enabled",
    "smart board",
    "classroom AI",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="hi-en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body>{children}</body>
    </html>
  );
}
