/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@repo/shared"],
    output: "standalone",
};

export default nextConfig;
