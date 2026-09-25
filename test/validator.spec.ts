import { describe, it, expect } from "vitest";
import { isValidEmail, isValidName, validateUser } from "../src/validator";

describe("isValidEmail", () => {
	it.each([
		"user@example.com",
		"first.last@example.com",
		"user+tag@example.co.uk",
		"USER_123@sub.domain.org",
		"a@b.io",
		"o'connor@example.com",
		"  padded@example.com  ",
	])("accepts %s", (email) => {
		expect(isValidEmail(email)).toBe(true);
	});

	it.each([
		["empty string", ""],
		["whitespace only", "   "],
		["missing @", "userexample.com"],
		["missing local part", "@example.com"],
		["missing domain", "user@"],
		["two @ signs", "user@@example.com"],
		["multiple @ in address", "a@b@example.com"],
		["no TLD", "user@example"],
		["numeric TLD", "user@example.123"],
		["one-letter TLD", "user@example.c"],
		["leading dot in local part", ".user@example.com"],
		["trailing dot in local part", "user.@example.com"],
		["consecutive dots in local part", "us..er@example.com"],
		["consecutive dots in domain", "user@example..com"],
		["domain label starting with hyphen", "user@-example.com"],
		["domain label ending with hyphen", "user@example-.com"],
		["space inside address", "us er@example.com"],
		["local part over 64 chars", `${"a".repeat(65)}@example.com`],
		["address over 254 chars", `user@${"a".repeat(250)}.com`],
	])("rejects %s", (_label, email) => {
		expect(isValidEmail(email)).toBe(false);
	});

	it.each([undefined, null, 42, {}, ["user@example.com"]])("rejects non-string %j", (value) => {
		expect(isValidEmail(value)).toBe(false);
	});
});

describe("isValidName", () => {
	it.each(["Ian", "Ian Rodríguez", "Mary-Jane", "O'Brien", "J. R. R. Tolkien", "José", "李雷", "  Ana  "])(
		"accepts %s",
		(name) => {
			expect(isValidName(name)).toBe(true);
		},
	);

	it.each([
		["empty string", ""],
		["whitespace only", "   "],
		["single character", "A"],
		["over 100 characters", "a".repeat(101)],
		["digits", "Ian123"],
		["symbols", "Ian@Home"],
		["HTML", "<script>"],
		["SQL injection attempt", "Robert'); DROP TABLE users;--"],
		["double space", "Ian  Wong"],
		["leading hyphen", "-Ian"],
	])("rejects %s", (_label, name) => {
		expect(isValidName(name)).toBe(false);
	});

	it("accepts exactly 100 characters", () => {
		expect(isValidName("a".repeat(100))).toBe(true);
	});

	it.each([undefined, null, 42, {}, ["Ian"]])("rejects non-string %j", (value) => {
		expect(isValidName(value)).toBe(false);
	});
});

describe("validateUser", () => {
	it("returns valid with no errors for a correct name and email", () => {
		expect(validateUser("Ian", "ian@example.com")).toEqual({ valid: true, errors: [] });
	});

	it("reports only the name error when the name is invalid", () => {
		const result = validateUser("1", "ian@example.com");
		expect(result.valid).toBe(false);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toMatch(/name/i);
	});

	it("reports only the email error when the email is invalid", () => {
		const result = validateUser("Ian", "not-an-email");
		expect(result.valid).toBe(false);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toMatch(/email/i);
	});

	it("reports both errors when both fields are invalid", () => {
		const result = validateUser(undefined, undefined);
		expect(result.valid).toBe(false);
		expect(result.errors).toHaveLength(2);
	});
});
