# Login Test Script

This script is designed to test only the login functionality of the Whitepages automation on your server.

## Purpose

The main server script is experiencing issues on the server environment. This simplified test script focuses only on:

1. Navigating to Whitepages
2. Handling captcha
3. Redirecting to login page
4. Filling login credentials
5. Submitting the login form

## Setup

1. **Environment Variables**: Make sure your `.env` file has the required credentials:

   ```bash
   TWOCAPTCHA_API_KEY=your_2captcha_api_key_here
   WHITEPAGES_EMAIL=your_actual_email@example.com
   WHITEPAGES_PASSWORD=your_actual_password
   ```

2. **Dependencies**: Ensure all dependencies are installed:
   ```bash
   yarn install
   ```

## Running the Test

```bash
yarn test-login
```

## What the Script Does

1. **Browser Launch**: Launches a non-headless browser with server-optimized settings
2. **Navigation**: Goes to Whitepages homepage
3. **Captcha Handling**: Automatically detects and solves any captcha using 2captcha
4. **Login Status Check**: Checks if user is already logged in
5. **Login Process**: If not logged in:
   - Redirects to login page
   - Waits for form to load
   - Fills email and password fields
   - Submits the form
   - Checks for success/error messages
6. **Debugging**: Takes screenshots and logs detailed information for troubleshooting

## Debugging Features

- **Screenshots**: If login form elements aren't found, a screenshot is saved as `login-form-debug.png`
- **Detailed Logging**: Every step is logged with emojis for easy identification
- **Error Messages**: Captures and displays any error messages from the login form
- **URL Tracking**: Shows the current URL after login attempts

## Expected Output

```
🚀 Starting login test...
📧 Using email: your_email@example.com
🔑 Password provided: Yes
🌐 Navigating to Whitepages...
⏳ Checking for captcha...
✅ Captcha solved or not present, proceeding...
📊 Login status: { isLoggedIn: false, loggedInVisible: false, loggedOutVisible: null }
❌ User is not logged in, redirecting to login page...
✅ Redirected to login page
📝 Filling login form...
🔍 Form elements found:
  - Email input: true
  - Password input: true
  - Submit button: true
✅ Email entered
✅ Password entered
✅ Login form submitted
📍 Current URL after login attempt: https://www.whitepages.com/
📊 Login status after attempt: { isLoggedIn: true, loggedInVisible: true, loggedOutVisible: false }
✅ Login test completed
🔒 Browser closed
```

## Troubleshooting

If the script fails:

1. **Check credentials**: Ensure `WHITEPAGES_EMAIL` and `WHITEPAGES_PASSWORD` are correct
2. **Check 2captcha**: Ensure `TWOCAPTCHA_API_KEY` is valid and has credits
3. **Check screenshots**: Look at `login-form-debug.png` if form elements aren't found
4. **Check logs**: Look for specific error messages in the console output

## Server Deployment

This script is optimized for server environments with:

- Non-headless browser mode for better reliability
- Server-optimized Chrome arguments
- Proper timeout handling
- Detailed error logging
