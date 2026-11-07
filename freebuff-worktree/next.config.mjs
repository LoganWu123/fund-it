/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["node:sqlite"],
  // Only the Cloud preview hostname for this workspace. Not a wildcard.
  allowedDevOrigins: ["pv-0e66393e0f17-fdd2f2de-2356-40b4-b29d-dc1f9a3a1c7a.style.dev"],
};

export default nextConfig;
