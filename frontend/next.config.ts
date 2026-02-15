import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize compilation speed with modular imports
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{kebabCase member}}",
    },
  },
};

export default nextConfig;
