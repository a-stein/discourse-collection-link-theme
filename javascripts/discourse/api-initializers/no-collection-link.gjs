import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import helperFn from "discourse/helpers/helper-fn";
import { apiInitializer } from "discourse/lib/api";
import {
  collectionUrl,
  requestCollectionCount,
} from "../lib/no-collection-link";

class CollectionCount {
  @tracked value = null;

  get available() {
    return this.value !== null;
  }

  get label() {
    return this.value === 1 ? "Spiel in der Sammlung" : "Spiele in der Sammlung";
  }
}

class CollectionLink extends Component {
  get post() {
    return this.args.outletArgs.post;
  }

  get url() {
    return collectionUrl(settings.collection_url_template, this.post.no_user_id);
  }

  get countUrl() {
    return this.url
      ? collectionUrl(settings.collection_count_url_template, this.post.no_user_id)
      : undefined;
  }

  get title() {
    return `Spielesammlung von ${this.post.username}`;
  }

  loadCount = helperFn(({ url }, on) => {
    const count = new CollectionCount();
    let active = true;
    on.cleanup(() => (active = false));

    if (url) {
      requestCollectionCount(url).then((value) => {
        if (active) {
          count.value = value;
        }
      });
    }

    return count;
  });

  <template>
    {{#let (this.loadCount url=this.countUrl) as |count|}}
      {{#if count.available}}
        <span class="no-collection-link">
          <a href={{this.url}} title={{this.title}}>
            <svg
              class="no-collection-link__icon"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M3 21h18M4 18V5h4v13M8 18V3h4v15M16 4l4 13-4 1-4-13z" />
            </svg>
            <span class="no-collection-link__label">Spielesammlung</span>
            <span class="no-collection-link__count">
              {{count.value}}
              <span class="sr-only">{{count.label}}</span>
            </span>
          </a>
        </span>
      {{/if}}
    {{/let}}
  </template>
}

export default apiInitializer((api) => {
  api.addTrackedPostProperties("no_user_id");

  api.renderAfterWrapperOutlet("post-meta-data-poster-name", CollectionLink);
});
