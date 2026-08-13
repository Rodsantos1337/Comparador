import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.continente.pt',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.pingodoce.pt',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static.pingodoce.pt',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
