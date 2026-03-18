declare module "next-pwa" {
  import type { NextConfig } from "next";
  
  interface PWAConfig {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    runtimeCaching?: any[];
  }
  
  function withPWA(pwaConfig: PWAConfig): (nextConfig: NextConfig) => NextConfig;
  
  export default withPWA;
}
