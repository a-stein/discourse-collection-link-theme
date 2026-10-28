# Nintendo-Online Collection Link theme component

This component renders a compact **Spielesammlung** link with a bookshelf icon and a small game-count pill beside an author's name. It appears only after Nintendo-Online confirms that the author's collection is public. A public empty collection shows **0**.

It requires the `discourse-no-user-id` plugin, the NO-2025 ID route at `/u/id/:id/collection`, and `GET /api/public-collections/:id/count` returning `{ "count": 128 }` for public collections. Deploy the endpoint before updating the theme. The server-side Discourse plugin needs no update.

## Installation

1. Publish this directory as its own Git repository.
2. In Discourse, open **Admin → Customize → Themes → Install → From a Git repository** and add that repository URL.
3. Attach the component to the active theme.
4. Keep `collection_url_template` at its default, or set another HTTPS URL which includes `{no_user_id}` at least once.
5. Keep `collection_count_url_template` at its default, or configure the matching public-count endpoint for the same site/tenant. It must allow cross-origin GET requests without credentials. A blank setting, private collection, invalid response, or failed request hides the entire link.

## Accessibility and responsive behaviour

The visible text remains **Spielesammlung**, with screen-reader context for the count; the title adds the poster's username. The decorative bookshelf is an inline SVG, so it does not depend on the forum's Font Awesome sprite. Smaller Discourse typography, theme colours, a neutral count pill and a visible keyboard focus keep it aligned with post metadata in light and dark themes. On mobile it follows the user title and can wrap as a unit with Discourse's metadata layout. No animation is added.

The component uses Discourse's `renderAfterWrapperOutlet("post-meta-data-poster-name", ...)` API instead of changing existing DOM elements. See the [Discourse Plugin API](https://github.com/discourse/discourse/blob/main/frontend/discourse/app/lib/plugin-api.gjs).

Public checks are deduplicated per endpoint URL and cached in memory for up to one minute (at most 200 entries). No cookies are sent. The link stays hidden while loading; requests time out after five seconds. A privacy change takes effect on the next check, so already displayed links can remain until the topic is reloaded; access to the collection itself is always checked by Nintendo-Online.

## Browser verification

1. Open a topic whose post JSON contains `"no_user_id": "43"` for a public collection; confirm the bookshelf, link to `/u/id/43/collection`, and correct count appear after the check.
2. Check an empty public collection: its pill must show **0**.
3. Check a private collection, a post without `no_user_id`, a failed request and a pending request: none should render a link, icon, count or placeholder.
4. Check desktop and mobile widths, long user titles, light/dark schemes and keyboard focus. Multiple posts by the same author should share one request within a minute.

Run the URL/count checks with Node 24: `node --test tests/*.test.mjs`. Full rendering verification requires a Discourse checkout or a theme preview.
