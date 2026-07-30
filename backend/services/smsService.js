const https = require("https");
const http = require("http");

/**
 * Helper to send HTTPS/HTTP requests using built-in Node modules.
 * Supports GET and POST with custom headers.
 */
const makeRequest = (url, headers = {}, method = "GET", postData = null) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === "https:";
    const lib = isHttps ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        ...headers,
      },
    };

    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(
              new Error(
                `HTTP ${res.statusCode}: ${parsed.message || parsed.status_code || data}`
              )
            );
          }
        } catch {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    // Set a 15-second timeout
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("SMS request timed out after 15 seconds"));
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

/**
 * Checks whether real SMS delivery is configured.
 * Returns the provider name or null if none configured.
 */
const getConfiguredProvider = () => {
  if (process.env.FAST2SMS_API_KEY) return "Fast2SMS";
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  )
    return "Twilio";
  return null;
};

/**
 * Sends OTP via Fast2SMS DLT OTP route (free for Indian numbers).
 * Uses the dedicated OTP route which is free and doesn't need DLT registration.
 *
 * @param {string} phone 10-digit Indian phone number
 * @param {string} otp 6-digit OTP code
 */
const sendViaFast2SMS = async (phone, otp) => {
  const apiKey = process.env.FAST2SMS_API_KEY;

  // Use the Quick OTP route (free, no DLT needed)
  const postData = JSON.stringify({
    route: "otp",
    variables_values: otp,
    numbers: phone,
    flash: 0,
  });

  const headers = {
    authorization: apiKey,
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(postData),
  };

  const result = await makeRequest(
    "https://www.fast2sms.com/dev/bulkV2",
    headers,
    "POST",
    postData
  );

  if (result && result.return === true) {
    console.log(`✅ OTP sent to +91 ${phone} via Fast2SMS (OTP Route)`);
    return { success: true, provider: "Fast2SMS" };
  } else {
    throw new Error(
      `Fast2SMS response: ${result?.message || JSON.stringify(result)}`
    );
  }
};

/**
 * Sends OTP via Twilio (paid, international support).
 *
 * @param {string} phone 10-digit Indian phone number
 * @param {string} otp 6-digit OTP code
 */
const sendViaTwilio = async (phone, otp) => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  const to = phone.startsWith("+") ? phone : `+91${phone}`;

  const message = `Your Jageshwar Cafe verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`;

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const postData = new URLSearchParams({
    To: to,
    From: from,
    Body: message,
  }).toString();

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const headers = {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/x-www-form-urlencoded",
    "Content-Length": Buffer.byteLength(postData),
  };

  await makeRequest(url, headers, "POST", postData);
  console.log(`✅ OTP sent to ${to} via Twilio`);
  return { success: true, provider: "Twilio" };
};

/**
 * Sends an OTP to the customer's phone number.
 *
 * Priority:
 * 1. Fast2SMS (free for Indian numbers — recommended)
 * 2. Twilio (paid — international support)
 * 3. Console fallback (development only)
 *
 * @param {string} phone 10-digit Indian phone number
 * @param {string} otp 6-digit OTP code
 * @param {string} purpose "login" or "register"
 * @returns {object} { success: boolean, provider: string }
 */
const sendOtpSms = async (phone, otp, purpose) => {
  // 1. Fast2SMS (India – Free OTP Route)
  if (process.env.FAST2SMS_API_KEY) {
    try {
      return await sendViaFast2SMS(phone, otp);
    } catch (err) {
      console.error("❌ Fast2SMS failed:", err.message);
      // If Twilio is also configured, try it as fallback
      if (process.env.TWILIO_ACCOUNT_SID) {
        console.log("🔄 Falling back to Twilio...");
      }
    }
  }

  // 2. Twilio (Paid)
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  ) {
    try {
      return await sendViaTwilio(phone, otp);
    } catch (err) {
      console.error("❌ Twilio failed:", err.message);
    }
  }

  // 3. Fallback: Development console (NO real SMS sent)
  console.log("\n" + "═".repeat(60));
  console.log("  📱  JAGESHWAR CAFE — OTP (Development Mode)");
  console.log("═".repeat(60));
  console.log(`  Phone:    +91 ${phone}`);
  console.log(`  OTP:      ${otp}`);
  console.log(`  Purpose:  ${purpose.toUpperCase()}`);
  console.log("─".repeat(60));
  console.log("  ⚠️  No SMS provider configured.");
  console.log("  Add FAST2SMS_API_KEY to backend/.env for real SMS.");
  console.log("  Get free API key: https://www.fast2sms.com");
  console.log("═".repeat(60) + "\n");

  return { success: true, provider: "console" };
};

module.exports = { sendOtpSms, getConfiguredProvider };
