/** @type {import('next').NextConfig} */
export default () => {
    const isProd = process.env.NODE_ENV === "production";
    const prefix = isProd ? "/~ncr7500" : "";

    return {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
        basePath: prefix,
        env: {
            BASE_PATH: prefix,
        },
    };
};
// const nextConfig = {
//     output: "export",
//     images: {unoptimized: true},
//     basePath: "/~ncr7500",
//     assetPrefix: "/~ncr7500/",
//     trailingSlash: true,
//     env: {
//         BASE_PATH: "/~ncr7500"
//     }
// };

// export default nextConfig;
