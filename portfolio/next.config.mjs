/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "export",
    images: {unoptimized: true},
    basePath: "/~ncr7500",
    assetPrefix: "/~ncr7500/",
    trailingSlash: true,
    env: {
        BASE_PATH: "/~ncr7500"
    }
};

export default nextConfig;
