/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['profile.line-scdn.net', 'lh3.googleusercontent.com'],
  },
  async rewrites() {
    return [
      {
        // Proxy /hengheng/* ทั้งหมดไป VPS
        // ทำให้ เฮงเฮง.ปังจัง.com/hengheng/admin/ ทำงานได้
        source: '/hengheng/:path*',
        destination: 'http://203.170.192.192/hengheng/:path*',
      },
    ]
  },
}

module.exports = nextConfig
