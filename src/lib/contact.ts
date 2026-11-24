export const MAX_CONTACT_LENGTH = 254;

const email = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const telegramHandle = /^@?[A-Za-z][A-Za-z0-9_]{4,31}$/;
const telegramLink = /^(https?:\/\/)?(t\.me|telegram\.me)\/[A-Za-z][A-Za-z0-9_]{4,31}\/?$/i;

/**
 * Optional way for the team to reach the partner about a request: an email or a Telegram
 * username/link. Shared by client and server; it is sent only to the team's notification.
 */
export function validateContact(value: string): string | undefined {
  const contact = value.trim();
  if (!contact) return;
  if (contact.length > MAX_CONTACT_LENGTH || Array.from(contact).some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127) ||
    !(email.test(contact) || telegramHandle.test(contact) || telegramLink.test(contact)))
    return "Enter an email or a Telegram username like @yourname, or leave it blank.";
}

/** Trimmed contact for the team's message; a bare Telegram username gets its "@". */
export function normalizeContact(value: string): string {
  const contact = value.trim();
  return /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(contact) ? `@${contact}` : contact;
}
