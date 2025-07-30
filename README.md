# Whitepages API

A headless browser automation API for searching and extracting person data from Whitepages using Puppeteer and 2captcha integration.

## 🚀 Features

- **Automated Login**: Handles Whitepages login with provided credentials
- **Captcha Solving**: Integrates with 2captcha for automatic Cloudflare captcha solving
- **Person Search**: Search for people by name and location
- **Data Extraction**: Extract comprehensive person information including:
  - Address and location details
  - Contact information (email, phone)
  - Personal information (birthday, age)
  - Geographic data (city, state, zip code, county)

## 📋 Requirements

- Node.js 16+
- Yarn package manager
- 2captcha API key
- Whitepages account credentials

## 🛠️ Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd whitepagesapi-headless
   ```

2. **Install dependencies:**

   ```bash
   yarn install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   TWOCAPTCHA_API_KEY=your_2captcha_api_key_here
   PORT=3000
   ```

## 🚀 Usage

### Starting the Server

```bash
# Development mode with auto-restart
yarn dev

# Production mode
yarn start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

### API Endpoints

#### Health Check

```http
GET /health
```

**Response:**

```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Person Search

```http
POST /api/search
```

**Headers:**

```
email: your_email@example.com
password: your_password
```

**Request Body:**

```json
[
  {
    "name": "John Doe",
    "location": "New York, NY"
  }
]
```

**Response:**

```json
{
  "success": true,
  "data": {
    "state": "CA",
    "city": "Los Angeles",
    "birthday": "1985-05-15",
    "emails": "john.doe@example.com",
    "phone_number": "(555) 123-4567",
    "zip_code": "90210",
    "county": "Los Angeles County",
    "address": "123 Main Street, Los Angeles, CA 90210"
  }
}
```

### Error Responses

```json
{
  "success": false,
  "error": "Error message description"
}
```

## 🔧 Configuration

### Environment Variables

| Variable             | Description           | Required | Default |
| -------------------- | --------------------- | -------- | ------- |
| `TWOCAPTCHA_API_KEY` | Your 2captcha API key | Yes      | -       |
| `PORT`               | Server port           | No       | 3000    |

### Rate Limiting

The API includes rate limiting to prevent abuse:

- **Limit**: 10 requests per 15 minutes per IP
- **Response**: 429 status code with error message

## 🛡️ Security Features

- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Prevents abuse
- **Input Validation**: Validates all incoming requests
- **Error Handling**: Comprehensive error handling

## 📊 Data Extraction

The API extracts the following information from Whitepages person results:

| Field          | Description             | Example                     |
| -------------- | ----------------------- | --------------------------- |
| `state`        | State abbreviation      | "CA"                        |
| `city`         | City name               | "Los Angeles"               |
| `birthday`     | Birth date (YYYY-MM-DD) | "1985-05-15"                |
| `emails`       | Email address           | "john.doe@example.com"      |
| `phone_number` | Phone number            | "(555) 123-4567"            |
| `zip_code`     | ZIP code                | "90210"                     |
| `county`       | County name             | "Los Angeles County"        |
| `address`      | Full address            | "123 Main St, LA, CA 90210" |

## 🔍 Browser Automation

The API uses Puppeteer for browser automation with the following features:

- **Headless Mode**: Runs without GUI for server deployment
- **Persistent Sessions**: Saves login sessions to avoid repeated logins
- **Captcha Handling**: Automatic Cloudflare captcha solving
- **Error Recovery**: Robust error handling and recovery

## 🚨 Important Notes

1. **Rate Limiting**: Respect Whitepages' terms of service and rate limits
2. **Captcha Costs**: 2captcha API calls incur costs
3. **Session Management**: Login sessions are cached to improve performance
4. **Error Handling**: The API includes comprehensive error handling for various scenarios

## 🐛 Troubleshooting

### Common Issues

1. **Captcha Solving Fails**

   - Check your 2captcha API key
   - Ensure sufficient balance in your 2captcha account
   - Verify the API key is correctly set in `.env`

2. **Login Fails**

   - Verify your Whitepages credentials
   - Check if the account is active and not locked
   - Ensure the email/password format is correct

3. **No Results Found**
   - Try different location formats
   - Verify the person's name spelling
   - Check if the person has a public profile on Whitepages

### Debug Mode

For debugging, you can run the original test script:

```bash
yarn test-website
```

This will open a browser window where you can see the automation in action.

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:

- Check the troubleshooting section
- Review the error logs
- Ensure all requirements are met
- Verify your API keys and credentials
# automation-headless-whitepages
