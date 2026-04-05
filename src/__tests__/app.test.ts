import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "~/app";

async function loginAs(
  username: string,
  password = "password123",
): Promise<string> {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ username, password });

  if (res.status !== 200) {
    throw new Error(
      `Login failed for ${username}: ${res.status} ${JSON.stringify(res.body)}`,
    );
  }

  const cookie = res.headers["set-cookie"]?.[0];
  if (!cookie) throw new Error(`No session cookie returned for ${username}`);

  return cookie.split(";")[0];
}

describe("E2E — login (correct credentials)", () => {
  it("valid credentials → 200, session cookie set, profile returned", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "viewer1", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.username).toBe("viewer1");
    expect(res.body.data.role).toBe("viewer");
    expect(res.body.data.hashedPassword).toBeUndefined();

    const cookie = res.headers["set-cookie"]?.[0];
    expect(cookie).toMatch(/session_id=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });
});

describe("E2E — login rate limit", () => {
  it("6 rapid login attempts → 429 TOO_MANY_LOGIN_ATTEMPTS on 6th", async () => {
    const fire = () =>
      request(app)
        .post("/api/auth/login")
        .send({ username: "ratelimit_target", password: "wrongpassword" });

    for (let i = 0; i < 5; i++) await fire();

    const res = await fire(); // 6th attempt
    expect(res.status).toBe(429);
    expect(res.body.ok).toBe(false);
    expect(res.body.code).toBe("TOO_MANY_LOGIN_ATTEMPTS");
  });
});

describe("E2E — schema validation", () => {
  it("POST /api/auth/register with invalid username → 422 + fields.username", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "Bad User!", password: "password123" });

    expect(res.status).toBe(422);
    expect(res.body.ok).toBe(false);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(res.body.fields.username)).toBe(true);
  });

  it("POST /api/records with missing required fields → 422 + fields", async () => {
    const cookie = await loginAs("analyst1");

    const res = await request(app)
      .post("/api/records")
      .set("Cookie", cookie)
      .send({ amount: 50 });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(res.body.fields).toBeDefined();
    expect(
      res.body.fields.category ?? res.body.fields.occurredAt,
    ).toBeDefined();
  });
});

describe("E2E — authorization", () => {
  it("viewer cannot create a record → 403 FORBIDDEN", async () => {
    const cookie = await loginAs("viewer1");

    const res = await request(app)
      .post("/api/records")
      .set("Cookie", cookie)
      .send({
        category: "Food",
        amount: 100,
        occurredAt: "2024-03-01T00:00:00Z",
      });

    expect(res.status).toBe(403);
    expect(res.body.ok).toBe(false);
    expect(res.body.code).toBe("FORBIDDEN");
  });
});

describe("E2E — soft delete", () => {
  it("create → delete → fetch returns 404", async () => {
    const cookie = await loginAs("analyst1");

    const createRes = await request(app)
      .post("/api/records")
      .set("Cookie", cookie)
      .send({
        category: "E2E Test",
        amount: 99,
        occurredAt: "2024-03-01T00:00:00Z",
        type: "expense",
      });

    expect(createRes.status).toBe(201);
    const recordId = createRes.body.data.id;
    expect(recordId).toBeDefined();

    const adminCookie = await loginAs("admin1");

    const deleteRes = await request(app)
      .delete(`/api/records/${recordId}`)
      .set("Cookie", adminCookie);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.ok).toBe(true);

    const fetchRes = await request(app)
      .get(`/api/records/${recordId}`)
      .set("Cookie", cookie);

    expect(fetchRes.status).toBe(404);
    expect(fetchRes.body.code).toBe("NOT_FOUND");
  });
});
