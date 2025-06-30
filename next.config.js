/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/MoreOrLess',
  env: {
    NEXT_PUBLIC_BASE_PATH: '/MoreOrLess',
  },
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig 