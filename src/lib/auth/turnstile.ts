const VERIFYING_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const TURNSTILE_SECRET: string = process.env.TURNSTILE_SECRET as string;
if (!TURNSTILE_SECRET) {
  throw new Error('Missing env variable "TURNSTILE_SECRET"');
}

// https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
export const validateTurnstileToken = async (
  token: string,
  ip: string
): Promise<boolean> => {
  const formData = new FormData();
  formData.append('secret', TURNSTILE_SECRET);
  formData.append('response', token);
  formData.append('remoteip', ip);

  const result = await fetch(VERIFYING_URL, {
    body: formData,
    method: 'POST',
  });

  const outcome = await result.json();

  if (outcome.success) {
    return true;
  }

  return false;
};
