import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shanerobihemed.taskmuster',
  appName: 'TaskMuster',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  ios: {
    backgroundColor: '#000000'
  }
};

export default config;
