import { Platform } from 'react-native';

export const typography = {
  heading: Platform.select({
    web: "Oxanium, Sora, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    default: 'System',
  }),
  body: Platform.select({
    web: "Sora, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    default: 'System',
  }),
  mono: Platform.select({
    web: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
    default: 'monospace',
  }),
} as const;
