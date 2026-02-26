import { Inter, JetBrains_Mono, Libre_Baskerville } from "next/font/google";
import "./globals.css";
import { ClerkProvider, ClerkLoaded } from "@clerk/nextjs";
import { ThemeProvider } from "@/context/ThemeContext";
import { SearchProvider } from "@/context/SearchContext";
import Provider from "./provider.jsx";

// Serif font for headings (Perplexity-style marketing emotion)
const libreBaskerville = Libre_Baskerville({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

// Sans-serif for body/product clarity
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

// Mono for code
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Asteroid - AI Search",
  description: "AI-powered search engine",
};

// Clerk appearance configuration for premium look
const clerkAppearance = {
  variables: {
    colorPrimary: "#82c8e5",
    colorText: "#0f172a",
    colorTextSecondary: "#475569",
    colorBackground: "#ffffff",
    colorInputBackground: "#f9fafb",
    colorInputText: "#0f172a",
    borderRadius: "0.75rem",
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: "15px",
  },
  elements: {
    // Card styling
    card: {
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
      borderRadius: "1.25rem",
      border: "1px solid #e5e7eb",
    },
    // Header styling
    headerTitle: {
      fontFamily: "'Libre Baskerville', Georgia, serif",
      fontWeight: "400",
      fontSize: "1.5rem",
      letterSpacing: "-0.02em",
      color: "#0f172a",
    },
    headerSubtitle: {
      fontFamily: "Inter, system-ui, sans-serif",
      color: "#475569",
      fontSize: "0.875rem",
    },
    // Social buttons
    socialButtonsBlockButton: {
      borderRadius: "0.75rem",
      border: "1px solid #e5e7eb",
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "500",
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: "#f9fafb",
        borderColor: "#82c8e5",
      },
    },
    // Divider
    dividerLine: {
      backgroundColor: "#e5e7eb",
    },
    dividerText: {
      color: "#9ca3af",
      fontFamily: "Inter, system-ui, sans-serif",
    },
    // Form fields
    formFieldLabel: {
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "500",
      color: "#0f172a",
      fontSize: "0.875rem",
    },
    formFieldInput: {
      borderRadius: "0.75rem",
      border: "1px solid #e5e7eb",
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: "0.9375rem",
      padding: "0.75rem 1rem",
      transition: "all 0.2s ease",
      "&:focus": {
        borderColor: "#82c8e5",
        boxShadow: "0 0 0 3px rgba(130, 200, 229, 0.2)",
      },
    },
    formFieldInputShowPasswordButton: {
      color: "#475569",
    },
    // Primary button
    formButtonPrimary: {
      backgroundColor: "#0f172a",
      borderRadius: "0.75rem",
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "600",
      fontSize: "0.9375rem",
      padding: "0.75rem 1.5rem",
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: "#1e293b",
      },
    },
    // Footer
    footerActionLink: {
      color: "#82c8e5",
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "500",
      "&:hover": {
        color: "#5fb4d6",
      },
    },
    footerActionText: {
      fontFamily: "Inter, system-ui, sans-serif",
      color: "#475569",
    },
    // Identity preview
    identityPreviewEditButton: {
      color: "#82c8e5",
    },
    // Alerts and badges
    badge: {
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: "0.75rem",
    },
    alert: {
      borderRadius: "0.75rem",
      fontFamily: "Inter, system-ui, sans-serif",
    },
    // User button
    userButtonAvatarBox: {
      width: "2.5rem",
      height: "2.5rem",
    },
    userButtonPopoverCard: {
      borderRadius: "1rem",
      boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.15)",
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${libreBaskerville.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
        >
          <ThemeProvider>
            <ClerkLoaded>
              <SearchProvider>
                <Provider>
                  {children}
                </Provider>
              </SearchProvider>
            </ClerkLoaded>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}


