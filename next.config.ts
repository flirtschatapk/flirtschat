import type {NextConfig} from "next";

const nextConfig:NextConfig={
  distDir:process.env.NEXT_DIST_DIR||".next",
  images:{remotePatterns:[{protocol:"https",hostname:"cdn.flirtschat.com",pathname:"/**"},{protocol:"https",hostname:"lh3.googleusercontent.com",pathname:"/**"}]},
};

export default nextConfig;
