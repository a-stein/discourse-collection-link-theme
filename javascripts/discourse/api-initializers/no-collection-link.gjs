import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { on } from "@ember/modifier";
import helperFn from "discourse/helpers/helper-fn";
import DMenu from "discourse/float-kit/components/d-menu";
import { apiInitializer } from "discourse/lib/api";
import {
  collectionUrl,
  requestCollection,
} from "../lib/no-collection-link";

class CollectionData {
  @tracked value = null;

  get available() {
    return this.value !== null;
  }

  get count() {
    return this.value?.count;
  }

  get firstPlaying() {
    return this.playing[0];
  }

  get moreCount() {
    return this.playing.length - 1;
  }

  get playing() {
    return this.value?.playing ?? [];
  }

  get label() {
    return this.count === 1 ? "Spiel in der Sammlung" : "Spiele in der Sammlung";
  }

  get moreGamesLabel() {
    return this.moreCount === 1
      ? "1 weiteres Spiel anzeigen"
      : `${this.moreCount} weitere Spiele anzeigen`;
  }

  get playingHeading() {
    return `Spielt gerade · ${this.playing.length} Spiele`;
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

  loadCollection = helperFn(({ url }, on) => {
    const data = new CollectionData();
    let active = true;
    on.cleanup(() => (active = false));

    if (url) {
      requestCollection(url).then((value) => {
        if (active) {
          data.value = value;
        }
      });
    }

    return data;
  });

  coverFailed = (event) => {
    event.currentTarget.hidden = true;
    event.currentTarget.nextElementSibling.hidden = false;
  };

  <template>
    {{#let (this.loadCollection url=this.countUrl) as |collection|}}
      {{#if collection.available}}
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
              {{collection.count}}
              <span class="sr-only">{{collection.label}}</span>
            </span>
          </a>
          {{#if collection.playing.length}}
            <span class="no-collection-link__playing">
              <svg
                class="no-collection-link__playing-icon"
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                focusable="false"
              ><circle cx="12" cy="12" r="10" /><path d="m10 8 6 4-6 4z" /></svg>
              <span class="sr-only">Spielt gerade:</span>
              <a
                class="no-collection-link__playing-title"
                href={{collection.firstPlaying.url}}
                title={{collection.firstPlaying.title}}
              >{{collection.firstPlaying.title}}</a>
              {{#if collection.moreCount}}
                <DMenu
                  @closeOnEscape={{true}}
                  @modalForMobile={{false}}
                  @animated={{false}}
                  @maxWidth={{320}}
                  @identifier="no-collection-link-playing"
                  @placement="bottom-end"
                  @autofocus={{true}}
                  @ariaLabel={{collection.moreGamesLabel}}
                  @triggerClass="no-collection-link__more-trigger"
                  @contentClass="no-collection-link__popover-shell"
                  aria-haspopup="dialog"
                >
                  <:trigger>
                    +{{collection.moreCount}}
                  </:trigger>
                  <:content>
                    <section class="no-collection-link__popover">
                      <h3 class="no-collection-link__popover-heading">{{collection.playingHeading}}</h3>
                      <ul class="no-collection-link__games">
                        {{#each collection.playing as |game|}}
                          <li class="no-collection-link__game">
                            <a href={{game.url}}>
                              {{#if game.cover}}
                                <span class="no-collection-link__cover-frame">
                                  <img
                                    class="no-collection-link__cover"
                                    src={{game.cover.url}}
                                    width={{game.cover.width}}
                                    height={{game.cover.height}}
                                    loading="lazy"
                                    decoding="async"
                                    alt=""
                                    {{on "error" this.coverFailed}}
                                  />
                                  <span class="no-collection-link__cover-placeholder" hidden aria-hidden="true"></span>
                                </span>
                              {{else}}
                                <span class="no-collection-link__cover-placeholder" aria-hidden="true"></span>
                              {{/if}}
                              <span class="no-collection-link__game-title">{{game.title}}</span>
                            </a>
                          </li>
                        {{/each}}
                      </ul>
                      <a class="no-collection-link__popover-footer" href={{this.url}}>Zur Spielesammlung</a>
                    </section>
                  </:content>
                </DMenu>
              {{/if}}
            </span>
          {{/if}}
        </span>
      {{/if}}
    {{/let}}
  </template>
}

export default apiInitializer((api) => {
  api.addTrackedPostProperties("no_user_id");

  api.renderAfterWrapperOutlet("post-meta-data-poster-name", CollectionLink);
});
