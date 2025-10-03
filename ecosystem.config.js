module.exports = {
  apps: [
    {
      name: 'ogz-trading-bot',
      script: './run-trading-bot-v13-simplified.js',
      args: '--mode simulate --asset BTC-USD',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 3003
      },
      error_file: './logs/pm2-trading-error.log',
      out_file: './logs/pm2-trading-out.log',
      log_file: './logs/pm2-trading-combined.log',
      time: true
    },
    {
      name: 'ogz-ssl-server',
      script: './ogzprime_ssl_server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/pm2-ssl-error.log',
      out_file: './logs/pm2-ssl-out.log',
      log_file: './logs/pm2-ssl-combined.log',
      time: true
    },
    {
      name: 'ogz-api-server',
      script: './api/api.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/pm2-api-error.log',
      out_file: './logs/pm2-api-out.log',
      log_file: './logs/pm2-api-combined.log',
      time: true
    }
  ]
};
