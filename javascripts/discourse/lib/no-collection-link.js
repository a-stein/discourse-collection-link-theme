const NO_USER_ID_PLACEHOLDER = "{no_user_id}";
const POSITIVE_INTEGER = /^[1-9]\d*$/;
const collectionRequests = new Map();
const CACHE_DURATION_MS = 60_000;
const MAX_CACHE_ENTRIES = 200;

export function collectionUrl(template, noUserId) {
  const normalizedId = String(noUserId || "").trim();

  if (
    !POSITIVE_INTEGER.test(normalizedId) ||
    !Number.isSafeInteger(Number(normalizedId)) ||
    typeof template !== "string" ||
    !template.includes(NO_USER_ID_PLACEHOLDER)
  ) {
    return;
  }

  try {
    const url = new URL(
      template.replaceAll(NO_USER_ID_PLACEHOLDER, normalizedId),
    );

    return url.protocol === "https:" && !url.username && !url.password
      ? url.toString()
      : undefined;
  } catch {
    return;
  }
}

function safePublicUrl(value) {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function normalizePlaying(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((game) => {
    if (
      !game ||
      !Number.isSafeInteger(game.id) ||
      game.id <= 0 ||
      typeof game.title !== "string" ||
      !game.title.trim()
    ) {
      return [];
    }

    const url = safePublicUrl(game.url);
    if (!url) {
      return [];
    }

    let cover = null;
    if (game.cover && typeof game.cover === "object") {
      const coverUrl = safePublicUrl(game.cover.url);
      if (coverUrl) {
        cover = {
          url: coverUrl,
          width: Number.isSafeInteger(game.cover.width) && game.cover.width > 0
            ? game.cover.width
            : null,
          height: Number.isSafeInteger(game.cover.height) && game.cover.height > 0
            ? game.cover.height
            : null,
        };
      }
    }

    return [{ id: game.id, title: game.title, url, cover }];
  });
}

export function requestCollection(url) {
  const cached = collectionRequests.get(url);
  if (cached && cached.expires > Date.now()) {
    return cached.promise;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  const promise = Promise.resolve()
    .then(() => {
      const requestUrl = new URL(url);
      requestUrl.searchParams.set("include", "playing");
      return fetch(requestUrl.toString(), {
        credentials: "omit",
        cache: "no-store",
        signal: controller.signal,
      });
    })
    .then(async (response) => {
      if (!response.ok) {
        return null;
      }
      const body = await response.json();
      const count = body?.count;
      return Number.isSafeInteger(count) && count >= 0
        ? { count, playing: normalizePlaying(body.playing) }
        : null;
    })
    .catch(() => null)
    .finally(() => clearTimeout(timeout));

  collectionRequests.delete(url);
  collectionRequests.set(url, { promise, expires: Date.now() + CACHE_DURATION_MS });
  if (collectionRequests.size > MAX_CACHE_ENTRIES) {
    collectionRequests.delete(collectionRequests.keys().next().value);
  }

  return promise;
}

export async function requestCollectionCount(url) {
  return (await requestCollection(url))?.count ?? null;
}
