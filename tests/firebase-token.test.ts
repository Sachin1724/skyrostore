import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { verifyFirebaseIdToken } from "../apps/backend/src/lib/firebase-token";

const PROJECT = "skyrostore-test";
const now = 1_800_000_000;
const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const other = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const certs = async () => ({ k1: publicKey.export({ type: "spki", format: "pem" }) as string });

function sign(payload: Record<string, unknown>, key = privateKey, header = { alg: "RS256", kid: "k1" }) {
  const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const data = `${enc(header)}.${enc(payload)}`;
  return `${data}.${crypto.sign("RSA-SHA256", Buffer.from(data), key).toString("base64url")}`;
}

const good = {
  aud: PROJECT,
  iss: `https://securetoken.google.com/${PROJECT}`,
  sub: "uid_123",
  iat: now - 10,
  exp: now + 3600,
  auth_time: now - 10,
  phone_number: "+919876543210",
};

describe("firebase id token verification", () => {
  it("accepts a valid token", async () => {
    const claims = await verifyFirebaseIdToken(sign(good), PROJECT, certs, now);
    expect(claims.sub).toBe("uid_123");
    expect(claims.phone_number).toBe("+919876543210");
  });

  it("rejects a token signed by another key", async () => {
    await expect(verifyFirebaseIdToken(sign(good, other.privateKey), PROJECT, certs, now)).rejects.toThrow(/signature/);
  });

  it("rejects another project, wrong issuer, expiry and unknown key", async () => {
    await expect(verifyFirebaseIdToken(sign({ ...good, aud: "evil" }), PROJECT, certs, now)).rejects.toThrow(/project/);
    await expect(verifyFirebaseIdToken(sign({ ...good, iss: "https://evil" }), PROJECT, certs, now)).rejects.toThrow(/issuer/);
    await expect(verifyFirebaseIdToken(sign({ ...good, exp: now - 120 }), PROJECT, certs, now)).rejects.toThrow(/expired/);
    await expect(verifyFirebaseIdToken(sign(good, privateKey, { alg: "RS256", kid: "nope" }), PROJECT, certs, now)).rejects.toThrow(/key/);
    await expect(verifyFirebaseIdToken(sign(good, privateKey, { alg: "none", kid: "k1" } as any), PROJECT, certs, now)).rejects.toThrow(/algorithm/);
  });

  it("rejects a tampered payload", async () => {
    const [h, , s] = sign(good).split(".");
    const forged = Buffer.from(JSON.stringify({ ...good, sub: "someone_else" })).toString("base64url");
    await expect(verifyFirebaseIdToken(`${h}.${forged}.${s}`, PROJECT, certs, now)).rejects.toThrow(/signature/);
  });
});
