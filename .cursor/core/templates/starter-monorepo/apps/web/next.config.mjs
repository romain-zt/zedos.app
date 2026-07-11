/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // i18n routing: default + secondary locale, matching the CMS locales.
  i18n: {
    locales: ["en", "fr"],
    defaultLocale: "en",
  },
};

export default nextConfig;
