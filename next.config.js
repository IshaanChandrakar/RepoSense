/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    serverExternalPackages: ['@lancedb/lancedb', 'tar-stream'],
};

module.exports = nextConfig;
