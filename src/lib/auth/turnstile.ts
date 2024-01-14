const ENDPOINT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const SECRET: string = process.env.TURNSTILE_SECRET as string;

// https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
export const validateTurnstileToken = async (
  token: string,
  ip: string
): Promise<boolean> => {
  const formData = new FormData();
  formData.append('secret', SECRET);
  formData.append('response', token);
  formData.append('remoteip', ip);

  const result = await fetch(ENDPOINT_URL, {
    body: formData,
    method: 'POST',
  });

  const outcome = await result.json();

  if (outcome.success) {
    return true;
  }

  return false;
};
