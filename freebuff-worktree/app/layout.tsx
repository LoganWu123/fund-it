import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "FundIt! OC — homebuyer assistance, matched",
  description:
    "A prototype that builds a complete homebuyer profile, tests it against assistance programs with cited rules, and prices Orange County homes against the result.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <div className="container site-header__inner">
            <Link href="/" className="brand" aria-label="FundIt! OC home">
              <span className="brand__mark" aria-hidden="true">
                ⌂
              </span>
              <span className="brand__text">
                FundIt! <span className="brand__oc">OC</span>
              </span>
            </Link>
            <nav className="nav" aria-label="Main">
              <Link href="/onboarding">Profile</Link>
              <Link href="/profile">Review</Link>
              <Link href="/results">Matches</Link>
            </nav>
            <Link href="/onboarding" className="btn btn--small btn--primary">
              Start
            </Link>
          </div>
        </header>
        <main id="main">{children}</main>
        <footer className="site-footer">
          <div className="container site-footer__inner">
            <p>
              <strong>Prototype, not advice.</strong> This is not legal, financial or lending advice
              and it does not determine eligibility. Program terms change and funds run out:
              confirm every number with the program before relying on it.
            </p>
            <p>
              Do not enter real personal or financial information about yourself or anyone else.
              Sample listings are synthetic. Built for the Claude Impact Lab, November 7, 2026.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
