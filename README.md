# Whitepages Scraper with 2captcha Integration

A powerful web scraping solution for [Whitepages.com](https://www.whitepages.com/) that automatically handles Cloudflare captchas using 2captcha service and Puppeteer.

## Features

- 🔍 **Multiple Search Types**: Search by name, phone number, or address
- 🤖 **Automatic Captcha Solving**: Integrated 2captcha service handles Cloudflare Turnstile captchas
- 📊 **Comprehensive Data Extraction**: Extracts contact information, addresses, relatives, and more
- 📝 **Detailed Logging**: Winston-based logging system for debugging and monitoring
- ⚙️ **Configurable**: Environment-based configuration for easy deployment

## Prerequisites

- Node.js 16.0.0 or higher
- 2captcha API key (get one at [2captcha.com](https://2captcha.com/))

## Installation

1. **Clone the repository and install dependencies:**

   ```bash
   yarn install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your 2captcha API key:

   ```env
   TWOCAPTCHA_API_KEY=your_2captcha_api_key_here
   ```

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

### Interactive Mode

Run the scraper in interactive mode to manually control searches:

```bash
yarn interactive
```

### Test Website Functionality

Test the complete website automation including login and search:

```bash
yarn test-website
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

### 2captcha Configuration

The application uses 2captcha service to solve Cloudflare Turnstile captchas. The integration includes:

- Parameter interception via `inject.js`
- Automatic captcha solving via `src/services/twocaptcha-service.js`
- Cloudflare Turnstile support

The API key is configured via the `TWOCAPTCHA_API_KEY` environment variable.

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

1. **2captcha API Key Error**

   ```
   Error: TWOCAPTCHA_API_KEY environment variable is required
   ```

   **Solution**: Add your 2captcha API key to the `.env` file.

2. **Integration Files Not Found**

   ```
   Error: inject.js file not found
   ```

   **Solution**: Ensure the `inject.js` file and `src/services/twocaptcha-service.js` are present in the project.

3. **Captcha Not Solved**

   - Check your 2captcha account balance
   - Verify the API key is correct
   - Check the console for parameter interception logs

4. **Browser Launch Issues**
   - Ensure you have sufficient system resources
   - Try running in headless mode: `HEADLESS=true`
   - Check if Chrome/Chromium is installed

### Debugging

1. **Enable Debug Logging:**

   ```env
   LOG_LEVEL=debug
   ```

2. **Check 2captcha Integration:**

   - Open browser developer tools
   - Look for parameter interception logs in the console
   - Check for any error messages in the console

3. **Verify Captcha Detection:**

   - Monitor the application logs for captcha detection messages
   - Check if the 2captcha service is properly solving captchas

4. **Check Logs:**
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

- **2captcha**: Contact [2captcha Support](https://2captcha.com/)
- **This Application**: Open an issue in this repository

## Changelog

### v1.0.0

- Initial release
- 2captcha integration for Cloudflare captchas
- Multiple search types
- Comprehensive data extraction
- Parameter interception for stealth mode
