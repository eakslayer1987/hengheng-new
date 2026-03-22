/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "xn--72ca9ib1gc.xn--72cac8e8ec.com" },
      { protocol: "https", hostname: "*.line-scdn.net" },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/hengheng/:path*',
        destination: 'http://203.170.192.192/hengheng/:path*',
      },
    ]
  },
}
module.exports = nextConfig
