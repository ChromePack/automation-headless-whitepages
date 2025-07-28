# Whitepages Scraper with CapSolver Integration

A powerful web scraping solution for [Whitepages.com](https://www.whitepages.com/) that automatically handles captchas using the CapSolver extension and Puppeteer.

## Features

- 🔍 **Multiple Search Types**: Search by name, phone number, or address
- 🤖 **Automatic Captcha Solving**: Integrated CapSolver extension handles reCAPTCHA and other captchas
- 🛡️ **Stealth Mode**: Uses puppeteer-extra with stealth plugin to avoid detection
- 📊 **Comprehensive Data Extraction**: Extracts contact information, addresses, relatives, and more
- 📝 **Detailed Logging**: Winston-based logging system for debugging and monitoring
- ⚙️ **Configurable**: Environment-based configuration for easy deployment

## Prerequisites

- Node.js 16.0.0 or higher
- CapSolver API key (get one at [capsolver.com](https://www.capsolver.com/))
- CapSolver Browser Extension (included in this project)

## Installation

1. **Clone the repository and install dependencies:**

   ```bash
   yarn install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your CapSolver API key:

   ```env
   CAPSOLVER_API_KEY=your_capsolver_api_key_here
   ```

3. **Verify CapSolver extension is present:**
   The `CapSolver.Browser.Extension/` directory should be in the project root.

## Usage

### Basic Usage

```javascript
const WhitepagesScraperApp = require("./src/index");

async function example() {
  const app = new WhitepagesScraperApp();

  try {
    await app.initialize();

    // Search by name
    const nameResults = await app.searchByName("John Smith");
    console.log("Results:", nameResults);

    // Search by phone
    const phoneResults = await app.searchByPhone("555-123-4567");
    console.log("Results:", phoneResults);

    // Search by address
    const addressResults = await app.searchByAddress(
      "123 Main St, New York, NY"
    );
    console.log("Results:", addressResults);
  } finally {
    await app.close();
  }
}

example();
```

### Advanced Usage

```javascript
const WhitepagesScraperApp = require("./src/index");

async function advancedExample() {
  const app = new WhitepagesScraperApp();

  try {
    await app.initialize();

    // Search for a person
    const results = await app.searchByName("Jane Doe");

    if (results.length > 0) {
      // Get detailed information for the first result
      const personUrl = results[0].url; // Assuming URL is available
      const details = await app.getPersonDetails(personUrl);

      console.log("Detailed Information:", details);
    }
  } finally {
    await app.close();
  }
}
```

### Running the Application

```bash
# Start the application
yarn start

# Run in development mode with debugging
yarn dev
```

## Configuration

### Environment Variables

| Variable              | Description                         | Default                      |
| --------------------- | ----------------------------------- | ---------------------------- |
| `CAPSOLVER_API_KEY`   | Your CapSolver API key              | Required                     |
| `WHITEPAGES_BASE_URL` | Whitepages base URL                 | `https://www.whitepages.com` |
| `HEADLESS`            | Run browser in headless mode        | `false`                      |
| `BROWSER_TIMEOUT`     | Browser initialization timeout (ms) | `30000`                      |
| `PAGE_TIMEOUT`        | Page operation timeout (ms)         | `30000`                      |
| `LOG_LEVEL`           | Logging level                       | `info`                       |

### CapSolver Configuration

The application automatically configures the CapSolver extension with your API key. The configuration is located in:

```
CapSolver.Browser.Extension/assets/config.js
```

Key settings:

- `enabledForRecaptcha: true` - Enables reCAPTCHA solving
- `reCaptchaMode: "token"` - Uses token mode for better compatibility
- `useCapsolver: true` - Enables the CapSolver service

## Data Structure

### Search Results

```javascript
{
  index: 0,
  name: "John Smith",
  phone: "555-123-4567",
  address: "123 Main St, New York, NY",
  email: "john.smith@email.com",
  age: "35",
  relatives: ["Jane Smith", "Mike Smith"],
  rawText: "Full text content of the result"
}
```

### Person Details

```javascript
{
  name: "John Smith",
  phoneNumbers: ["555-123-4567", "555-987-6543"],
  addresses: ["123 Main St, New York, NY", "456 Oak Ave, Los Angeles, CA"],
  emails: ["john.smith@email.com"],
  age: "35",
  relatives: ["Jane Smith", "Mike Smith"],
  backgroundInfo: {},
  propertyInfo: {},
  rawText: "Full page content"
}
```

## Troubleshooting

### Common Issues

1. **CapSolver API Key Error**

   ```
   Error: CAPSOLVER_API_KEY environment variable is required
   ```

   **Solution**: Add your CapSolver API key to the `.env` file.

2. **Extension Not Found**

   ```
   Error: CapSolver config file not found
   ```

   **Solution**: Ensure the `CapSolver.Browser.Extension/` directory is present in the project root.

3. **Captcha Not Solved**

   - Check your CapSolver account balance
   - Verify the API key is correct
   - Check the extension configuration

4. **Browser Launch Issues**
   - Ensure you have sufficient system resources
   - Try running in headless mode: `HEADLESS=true`
   - Check if Chrome/Chromium is installed

### Debugging

1. **Enable Debug Logging:**

   ```env
   LOG_LEVEL=debug
   ```

2. **Run in Non-Headless Mode:**

   ```env
   HEADLESS=false
   ```

3. **Check Logs:**
   Logs are stored in the `logs/` directory:
   - `logs/combined.log` - All logs
   - `logs/error.log` - Error logs only

## Legal and Ethical Considerations

- **Respect Terms of Service**: Ensure compliance with Whitepages' terms of service
- **Rate Limiting**: Implement appropriate delays between requests
- **Data Privacy**: Handle personal information responsibly
- **Fair Use**: Use the scraper for legitimate purposes only

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues related to:

- **CapSolver**: Contact [CapSolver Support](https://www.capsolver.com/)
- **This Application**: Open an issue in this repository

## Changelog

### v1.0.0

- Initial release
- CapSolver integration
- Multiple search types
- Comprehensive data extraction
- Stealth mode support
