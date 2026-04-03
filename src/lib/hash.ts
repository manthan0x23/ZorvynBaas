import argon from "argon2";

const SALT_ROUNDS = 12;

export class Hash {
  static async make(value: string): Promise<string> {
    if (!value) {
      throw new Error("Cannot hash empty value");
    }

    return argon.hash(value, {
      timeCost: SALT_ROUNDS,
    });
  }

  static async verify(value: string, hashed: string): Promise<boolean> {
    if (!value || !hashed) return false;

    return argon.verify(hashed, value);
  }
}
