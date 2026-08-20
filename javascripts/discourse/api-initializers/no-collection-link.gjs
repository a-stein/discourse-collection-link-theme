import { apiInitializer } from "discourse/lib/api";

const NO_USER_ID_PLACEHOLDER = "{no_user_id}";
const POSITIVE_INTEGER = /^[1-9]\d*$/;

function collectionUrl(template, noUserId) {
  const normalizedId = String(noUserId || "").trim();

  if (
    !POSITIVE_INTEGER.test(normalizedId) ||
    typeof template !== "string" ||
    !template.includes(NO_USER_ID_PLACEHOLDER)
  ) {
    return;
  }

  try {
    const url = new URL(
      template.replaceAll(
        NO_USER_ID_PLACEHOLDER,
        encodeURIComponent(normalizedId),
      ),
    );

    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return;
  }
}

export default apiInitializer((api) => {
  api.addTrackedPostProperties("no_user_id");

  api.addPosterIcons((_customFields, post) => {
    const url = collectionUrl(settings.collection_url_template, post.no_user_id);

    if (!url) {
      return;
    }

    return {
      className: "no-collection-link",
      icon: "gamepad",
      text: "Spielesammlung",
      title: `Spielesammlung von ${post.username}`,
      url,
    };
  });
});
