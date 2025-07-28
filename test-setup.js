require("dotenv").config();
const fs = require("fs");
const path = require("path");

console.log("🧪 Testing Whitepages Scraper Setup...\n");

// Test 1: Check environment variables
console.log("1️⃣ Checking environment variables...");
if (process.env.CAPSOLVER_API_KEY) {
  console.log("✅ CAPSOLVER_API_KEY is set");
} else {
  console.log(
    "❌ CAPSOLVER_API_KEY is not set. Please add it to your .env file"
  );
}

// Test 2: Check CapSolver extension
console.log("\n2️⃣ Checking CapSolver extension...");
const extensionPath = path.join(__dirname, "CapSolver.Browser.Extension");
if (fs.existsSync(extensionPath)) {
  console.log("✅ CapSolver extension directory exists");

  const configPath = path.join(extensionPath, "assets/config.js");
  if (fs.existsSync(configPath)) {
    console.log("✅ CapSolver config file exists");
  } else {
    console.log("❌ CapSolver config file not found");
  }
} else {
  console.log("❌ CapSolver extension directory not found");
}

// Test 3: Check dependencies
console.log("\n3️⃣ Checking dependencies...");
try {
  require("puppeteer-extra");
  require("puppeteer-extra-plugin-stealth");
  require("winston");
  require("dotenv");
  console.log("✅ All required dependencies are installed");
} catch (error) {
  console.log("❌ Missing dependencies:", error.message);
}

// Test 4: Check source files
console.log("\n4️⃣ Checking source files...");
const sourceFiles = [
  "src/index.js",
  "src/config/browser.js",
  "src/config/logger.js",
  "src/services/whitepages-scraper.js",
  "src/utils/capsolver-config.js",
];

sourceFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
  }
});

// Test 5: Check logs directory
console.log("\n5️⃣ Checking logs directory...");
const logsDir = path.join(__dirname, "logs");
if (fs.existsSync(logsDir)) {
  console.log("✅ Logs directory exists");
} else {
  console.log("ℹ️ Logs directory will be created on first run");
}

console.log("\n🎯 Setup test completed!");
console.log("\n📝 Next steps:");
console.log("1. Add your CapSolver API key to the .env file");
console.log("2. Run: node src/index.js");
console.log("3. Or run: node examples/basic-search.js");
