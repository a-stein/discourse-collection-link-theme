import assert from "node:assert/strict";
import { after, test } from "node:test";
import {
  collectionUrl,
  requestCollection,
  requestCollectionCount,
} from "../javascripts/discourse/lib/no-collection-link.js";

const originalFetch = globalThis.fetch;
after(() => (globalThis.fetch = originalFetch));
const template = "https://nintendo-online.de/u/id/{no_user_id}/collection";

test("builds collection URLs only for valid IDs and HTTPS templates", () => {
  assert.equal(collectionUrl(template, " 43 "), "https://nintendo-online.de/u/id/43/collection");
  for (const id of [null, "", "0", "01", "-1", "1.5", "abc", "9007199254740992"]) {
    assert.equal(collectionUrl(template, id), undefined);
  }
  for (const url of ["", "https://example.com/", "http://example.com/{no_user_id}", "javascript:{no_user_id}", "https://user:password@example.com/{no_user_id}"]) {
    assert.equal(collectionUrl(url, 43), undefined);
  }
});

test("deduplicates public checks for repeated posts without sending credentials", async () => {
  let calls = 0;
  globalThis.fetch = async (requestUrl, options) => {
    calls++;
    assert.equal(new URL(requestUrl).searchParams.get("include"), "playing");
    assert.equal(options.credentials, "omit");
    assert.equal(options.cache, "no-store");
    return { ok: true, json: async () => ({ count: 128 }) };
  };
  const url = "https://example.com/count/43";
  assert.deepEqual(await Promise.all([requestCollectionCount(url), requestCollectionCount(url)]), [128, 128]);
  assert.equal(await requestCollectionCount(url), 128);
  assert.equal(calls, 1);
});

test("normalizes playing data while keeping legacy count-only responses valid", async () => {
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      count: 4,
      playing: [
        {
          id: 12,
          title: "  Zelda <script>alert(1)</script>  ",
          url: "https://nintendo-online.de/games/zelda",
          cover: {
            url: "https://cdn.nintendo-online.de/zelda.jpg",
            width: 300,
            height: 420,
          },
        },
        {
          id: 13,
          title: "Unsafe URL",
          url: "javascript:alert(1)",
          cover: null,
        },
        {
          id: 14,
          title: "Credential URL",
          url: "https://user:pass@nintendo-online.de/game",
          cover: null,
        },
        { id: 15, title: "Unsafe cover", url: "https://nintendo-online.de/game", cover: { url: "http://cdn.example/game.jpg" } },
      ],
    }),
  });
  assert.deepEqual(await requestCollection("https://example.com/count/playing-normalize"), {
    count: 4,
    playing: [
      {
        id: 12,
        title: "  Zelda <script>alert(1)</script>  ",
        url: "https://nintendo-online.de/games/zelda",
        cover: {
          url: "https://cdn.nintendo-online.de/zelda.jpg",
          width: 300,
          height: 420,
        },
      },
      {
        id: 15,
        title: "Unsafe cover",
        url: "https://nintendo-online.de/game",
        cover: null,
      },
    ],
  });

  globalThis.fetch = async () => ({ ok: true, json: async () => ({ count: 128 }) });
  assert.deepEqual(await requestCollection("https://example.com/count/legacy-response"), {
    count: 128,
    playing: [],
  });
  assert.equal(await requestCollectionCount("https://example.com/count/legacy-count-helper"), 128);
});

test("malformed optional playing data does not discard a valid count", async () => {
  for (const [index, playing] of [null, {}, "playing", [{ id: 0, title: "Game", url: "https://example.com/game" }]].entries()) {
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ count: 7, playing }) });
    assert.deepEqual(await requestCollection(`https://example.com/count/malformed-playing-${index}`), {
      count: 7,
      playing: [],
    });
  }
});

test("accepts a public empty collection, keeping zero distinct from unavailable", async () => {
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ count: 0 }) });
  assert.equal(await requestCollectionCount("https://example.com/count/empty"), 0);
});

test("private, missing and failing responses never confirm a public collection", async () => {
  for (const status of [404, 403, 500]) {
    globalThis.fetch = async () => ({ ok: false, status });
    assert.equal(await requestCollectionCount(`https://example.com/count/status-${status}`), null);
  }
  globalThis.fetch = async () => { throw new Error("network unavailable"); };
  assert.equal(await requestCollectionCount("https://example.com/count/network"), null);
  globalThis.fetch = async () => ({ ok: true, json: async () => { throw new Error("invalid JSON"); } });
  assert.equal(await requestCollectionCount("https://example.com/count/json"), null);
});

test("does not display missing, negative, fractional, string or unsafe counts", async () => {
  for (const [index, count] of [undefined, null, -1, 1.5, "128", Number.MAX_SAFE_INTEGER + 1].entries()) {
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ count }) });
    assert.equal(await requestCollectionCount(`https://example.com/count/invalid-${index}`), null);
  }
});
