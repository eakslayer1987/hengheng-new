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
        destination: 'http://direct.xn--72cac8e8ec.com/hengheng/:path*',
      },
    ]
  },
}

module.exports = nextConfig
