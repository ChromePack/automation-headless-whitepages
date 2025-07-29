// Override console.clear to prevent Cloudflare from clearing our logs
console.clear = () => console.log("Console was cleared");

// Set up an interval to wait for turnstile to be available
const i = setInterval(() => {
  if (window.turnstile) {
    clearInterval(i);

    // Override the turnstile.render function to intercept parameters
    window.turnstile.render = (a, b) => {
      let params = {
        sitekey: b.sitekey,
        pageurl: window.location.href,
        data: b.cData,
        pagedata: b.chlPageData,
        action: b.action,
        userAgent: navigator.userAgent,
        json: 1,
      };

      // Log the intercepted parameters
      console.log("intercepted-params:" + JSON.stringify(params));

      // Store the callback function globally
      window.cfCallback = b.callback;

      return;
    };
  }
}, 50);
