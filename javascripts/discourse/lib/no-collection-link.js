const NO_USER_ID_PLACEHOLDER = "{no_user_id}";
const POSITIVE_INTEGER = /^[1-9]\d*$/;
const countRequests = new Map();
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

export function requestCollectionCount(url) {
  const cached = countRequests.get(url);
  if (cached && cached.expires > Date.now()) {
    return cached.promise;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  const promise = Promise.resolve()
    .then(() =>
      fetch(url, {
        credentials: "omit",
        cache: "no-store",
        signal: controller.signal,
      }),
    )
    .then(async (response) => {
      if (!response.ok) {
        return null;
      }
      const { count } = await response.json();
      return Number.isSafeInteger(count) && count >= 0 ? count : null;
    })
    .catch(() => null)
    .finally(() => clearTimeout(timeout));

  countRequests.delete(url);
  countRequests.set(url, { promise, expires: Date.now() + CACHE_DURATION_MS });
  if (countRequests.size > MAX_CACHE_ENTRIES) {
    countRequests.delete(countRequests.keys().next().value);
  }

  return promise;
}
