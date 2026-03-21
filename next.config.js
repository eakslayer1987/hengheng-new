/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "xn--72ca9ib1gc.xn--72cac8e8ec.com" },
      { protocol: "https", hostname: "*.line-scdn.net" },
    ],
  },
};
module.exports = nextConfig;
