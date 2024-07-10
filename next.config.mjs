/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

// 프로덕션 환경에서만 basePath와 assetPrefix를 설정합니다.
if (process.env.NODE_ENV === 'production') {
  nextConfig.basePath = '/roro'
  nextConfig.assetPrefix = '/roro/'
}

export default nextConfig