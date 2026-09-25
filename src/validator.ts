export interface ValidationResult {
	valid: boolean;
	errors: string[];
}

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 254;
const EMAIL_LOCAL_MAX_LENGTH = 64;

// Letters from any language, separated by a single space, apostrophe, hyphen or dot (e.g. "J. R. O'Brien-Smith").
const NAME_REGEX = /^\p{L}+(?:(?:[ '-]|\. ?)\p{L}+)*\.?$/u;
const EMAIL_LOCAL_REGEX = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
const DOMAIN_LABEL_REGEX = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;
const TLD_REGEX = /^[A-Za-z]{2,63}$/;

export function isValidName(name: unknown): name is string {
	if (typeof name !== "string") return false;
	const trimmed = name.trim();
	if (trimmed.length < NAME_MIN_LENGTH || trimmed.length > NAME_MAX_LENGTH) return false;
	return NAME_REGEX.test(trimmed);
}

export function isValidEmail(email: unknown): email is string {
	if (typeof email !== "string") return false;
	const trimmed = email.trim();
	if (trimmed.length === 0 || trimmed.length > EMAIL_MAX_LENGTH) return false;

	const atIndex = trimmed.lastIndexOf("@");
	if (atIndex <= 0 || trimmed.indexOf("@") !== atIndex) return false;

	const local = trimmed.slice(0, atIndex);
	const domain = trimmed.slice(atIndex + 1);
	if (local.length > EMAIL_LOCAL_MAX_LENGTH || !EMAIL_LOCAL_REGEX.test(local)) return false;

	const labels = domain.split(".");
	if (labels.length < 2) return false;
	const tld = labels[labels.length - 1];
	return labels.every((label) => DOMAIN_LABEL_REGEX.test(label)) && TLD_REGEX.test(tld);
}

export function validateUser(name: unknown, email: unknown): ValidationResult {
	const errors: string[] = [];
	if (!isValidName(name)) {
		errors.push(
			`Invalid name: must be ${NAME_MIN_LENGTH}-${NAME_MAX_LENGTH} characters and contain only letters, spaces, apostrophes, hyphens or dots`,
		);
	}
	if (!isValidEmail(email)) {
		errors.push("Invalid email: must be a valid address like user@example.com");
	}
	return { valid: errors.length === 0, errors };
}
