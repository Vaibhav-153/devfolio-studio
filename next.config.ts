import type { NextConfig } from "next";

/** Baseline security headers for both the platform and tenant-hosted portfolios.
 * CSP is report-only in Phase 5 until real Supabase/Vercel browser tests confirm
 * React hydration, private storage preview and the visual editor all work.
 */
const securityHeaders = [
  {key:"X-Content-Type-Options",value:"nosniff"},
  {key:"X-Frame-Options",value:"DENY"},
  {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
  {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=(), payment=()"},
  {key:"Cross-Origin-Opener-Policy",value:"same-origin"},
  {key:"Content-Security-Policy-Report-Only", value:[
    "default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'none'",
    "form-action 'self'", "script-src 'self' 'unsafe-inline'", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com", "img-src 'self' data: blob: https:",
    "connect-src 'self' https: wss:"
  ].join("; ")},
  ...(process.env.VERCEL_ENV === "production" ? [{key:"Strict-Transport-Security",value:"max-age=31536000; includeSubDomains"}] : []),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{source:"/:path*",headers:securityHeaders}];
  },
};
export default nextConfig;
