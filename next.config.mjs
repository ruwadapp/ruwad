/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }],
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'ruwaad.app' }],
        destination: 'https://www.ruwaad.app/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
