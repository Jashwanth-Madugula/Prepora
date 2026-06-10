import nodemailer from "nodemailer";

const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || "";
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || "";
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || "";
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY || "";

const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS || "";

// Fail fast: make sure at least one email delivery method is configured
const isEmailJSConfigured = !!(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY && EMAILJS_PRIVATE_KEY);
const isSmtpConfigured = !!(SMTP_USER && SMTP_PASS);

if (!isEmailJSConfigured && !isSmtpConfigured) {
  throw new Error("Prepora mail setup failed: Neither EmailJS nor SMTP credentials are fully configured.");
}

// Dynamically determine host and port based on SMTP user configuration
const isGmail = SMTP_USER.includes("gmail.com");
const SMTP_HOST = process.env.SMTP_HOST || (isGmail ? "smtp.gmail.com" : "smtp.mailtrap.io");
const SMTP_PORT = parseInt(process.env.SMTP_PORT || (isGmail ? "465" : "2525"));
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER || "no-reply@example.com";

// Lazy-create transporter to avoid connection attempts if SMTP settings are placeholders
let transporter: any = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // Use SSL/TLS for port 465
      auth: SMTP_USER && SMTP_PASS ? {
        user: SMTP_USER,
        pass: SMTP_PASS,
      } : undefined,
    });
  }
  return transporter;
}

export async function sendEmailJS({
  to_email,
  template_params,
}: {
  to_email: string;
  template_params: Record<string, any>;
}) {
  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      accessToken: EMAILJS_PRIVATE_KEY, // EmailJS private key (needed for REST API from backend)
      template_params: {
        to_email,
        ...template_params,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`EmailJS delivery failed: ${errText}`);
  }
}

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const mailOptions = {
    from: FROM_EMAIL,
    to,
    subject,
    html,
  };

  return getTransporter().sendMail(mailOptions);
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email?token=${token}`;
  
  // Try sending via EmailJS first if environment variables are provided
  if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
    return sendEmailJS({
      to_email: email,
      template_params: {
        subject: "Verify your email address",
        title: "Welcome to Prepora!",
        description: "Thank you for registering. Please verify your email address by clicking the button below:",
        action_url: verifyUrl,
        action_text: "Verify Email",
      },
    });
  }

  // Fallback to Nodemailer SMTP
  return sendMail({
    to: email,
    subject: "Verify your email address",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2>Welcome to Prepora!</h2>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <div style="margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verify Email</a>
        </div>
        <p>If the button doesn't work, you can copy and paste the following link in your browser:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 12px;">If you did not request this email, you can safely ignore it.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;
  
  // Try sending via EmailJS first if environment variables are provided
  if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
    return sendEmailJS({
      to_email: email,
      template_params: {
        subject: "Reset your password",
        title: "Password Reset Request",
        description: "We received a request to reset the password for your account. Click the button below to set a new password:",
        action_url: resetUrl,
        action_text: "Reset Password",
      },
    });
  }

  // Fallback to Nodemailer SMTP
  return sendMail({
    to: email,
    subject: "Reset your password",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2>Password Reset Request</h2>
        <p>We received a request to reset the password for your account. Click the button below to set a new password:</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>If the button doesn't work, you can copy and paste the following link in your browser:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 12px;">If you did not request this change, you can safely ignore this email.</p>
      </div>
    `,
  });
}
