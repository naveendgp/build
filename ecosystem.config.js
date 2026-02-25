module.exports = {
  apps: [
    {
      name: 'otter-api',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        // Normal mode
        NODE_ENV: 'production',
      },
      env_chaos: {
        // Chaos mode — randomly fails/delays vendor, delivery & user routes
        NODE_ENV: 'production',
        CHAOS_MODE: 'true',
      },
    },
  ],
};
