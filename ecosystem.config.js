module.exports = {
  apps: [
    {
      name: "whitepages-api",
      script: "yarn",
      args: "run start:prod",
      cwd: "./",
      watch: false,
      instances: 1,
      autorestart: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        DISPLAY: ":1",
      },
      env_production: {
        NODE_ENV: "production",
        DISPLAY: ":1",
      },
    },
  ],

  deploy: {
    production: {
      user: "root",
      host: "31.97.13.50",
      ref: "origin/main",
      repo: "https://github.com/ChromePack/automation-headless-whitepages",
      path: "/var/www/whitepagesapi-headless",
      "pre-deploy-local": "",
      "post-deploy":
        "yarn install && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
    },
  },
};
