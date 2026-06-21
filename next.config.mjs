import TerserPlugin from 'terser-webpack-plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', 'whatsapp-web.js'],
  },
  webpack: (config, { isServer, dev }) => {
    // Override SWC minifier with Terser to prevent 16GB memory crash on ARM64
    if (!dev && !isServer) {
      config.optimization.minimizer = [
        new TerserPlugin({
          terserOptions: {
            compress: false,
            mangle: false,
          },
        }),
      ];
    }
    // Ignore EPERM errors from Windows junction points during build
    if (isServer) {
      config.infrastructureLogging = {
        ...config.infrastructureLogging,
        level: 'error',
      };
    }
    // Handle native modules that cause glob errors
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve?.fallback,
      },
    };
    return config;
  },
};
export default nextConfig;





