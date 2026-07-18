/**
 * @file src/lib/cloudinary.ts
 * @category Utility / Helper Library
 *
 * Why this code exists:
 * Provides shared helper libraries and initializers (such as DB pools, client instances, cryptography, token management).
 * 
 *
 * What problem it solves:
 * - Avoids duplicate config setup blocks by centralizing libraries (such as Cloudinary connection pools, Groq SDK setups, mailers, JWT checkers) to keep code modular.
 *
 * How it works internally:
 * - Loads environment variables, initializes library clients with fail-fast validation checks, and exports clean utility methods for the services and API routers.
 */

import { v2 as cloudinary } from "cloudinary";

if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  throw new Error(
    "Cloudinary environment variables are missing"
  );
}

cloudinary.config({
  cloud_name:
    process.env.CLOUDINARY_CLOUD_NAME,

  api_key:
    process.env.CLOUDINARY_API_KEY,

  api_secret:
    process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;