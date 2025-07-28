const fs = require("fs");
const path = require("path");
const logger = require("../config/logger");

class CapSolverConfigManager {
  constructor() {
    this.configPath = path.join(
      __dirname,
      "../../CapSolver.Browser.Extension/assets/config.js"
    );
  }

  updateApiKey(apiKey) {
    try {
      logger.info("Updating CapSolver API key...");

      if (!fs.existsSync(this.configPath)) {
        throw new Error("CapSolver config file not found");
      }

      let configContent = fs.readFileSync(this.configPath, "utf8");

      // Update the API key in the config
      const apiKeyRegex = /apiKey:\s*"[^"]*"/;
      if (apiKeyRegex.test(configContent)) {
        configContent = configContent.replace(
          apiKeyRegex,
          `apiKey: "${apiKey}"`
        );
      } else {
        // If no apiKey found, add it to the defaultConfig object
        configContent = configContent.replace(
          "export const defaultConfig = {",
          `export const defaultConfig = {
  apiKey: "${apiKey}",`
        );
      }

      // Ensure reCAPTCHA is enabled
      configContent = configContent.replace(
        /enabledForRecaptcha:\s*(true|false)/g,
        "enabledForRecaptcha: true"
      );

      // Set reCAPTCHA mode to token for better compatibility
      configContent = configContent.replace(
        /reCaptchaMode:\s*"[^"]*"/g,
        'reCaptchaMode: "token"'
      );

      fs.writeFileSync(this.configPath, configContent, "utf8");

      logger.info("CapSolver configuration updated successfully");
      return true;
    } catch (error) {
      logger.error("Failed to update CapSolver configuration:", error);
      throw error;
    }
  }

  validateConfig() {
    try {
      if (!fs.existsSync(this.configPath)) {
        throw new Error("CapSolver config file not found");
      }

      const configContent = fs.readFileSync(this.configPath, "utf8");

      // Check if API key is set
      const apiKeyMatch = configContent.match(/apiKey:\s*"([^"]+)"/);
      if (!apiKeyMatch || apiKeyMatch[1] === "YourApiKey") {
        throw new Error("CapSolver API key not properly configured");
      }

      logger.info("CapSolver configuration is valid");
      return true;
    } catch (error) {
      logger.error("CapSolver configuration validation failed:", error);
      throw error;
    }
  }
}

module.exports = CapSolverConfigManager;
