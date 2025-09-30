/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/perpdexs_arb' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/perpdexs_arb/' : '',
};

export default nextConfig;


