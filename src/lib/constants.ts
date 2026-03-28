// Constants para URLs e configurações da aplicação
export const APP_CONFIG = {
  // URL base da aplicação (configurada para Tailscale)
  BASE_URL: process.env.NEXTAUTH_URL || "http://100.113.255:3000",
  
  // Configurações de API
  API: {
    TIMEOUT: 30000, // 30 segundos
  },
  
  // Configurações de PWA
  PWA: {
    NAME: "Life OS Dashboard",
    SHORT_NAME: "Life OS",
    DESCRIPTION: "Dashboard de Gestão Pessoal",
    BACKGROUND_COLOR: "#0f172a",
    THEME_COLOR: "#0f172a",
    DISPLAY: "standalone" as const,
    ORIENTATION: "portrait" as const,
  },
  
  // Configurações de notificação
  NOTIFICATION: {
    ENABLED: true,
    DEFAULT_ICON: "/icon-192x192.png",
  }
} as const;

export default APP_CONFIG;
