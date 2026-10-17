/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Server Actions default to a 1MB request body. ID photos (up to 8MB in
    // the upload component) and guard application documents (up to 5 x 4MB) exceed that, which makes check-in fail with the
    // generic "error occurred in the Server Components render" message.
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
