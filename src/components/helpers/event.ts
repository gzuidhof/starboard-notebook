/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { StarboardEventInitDict, StarboardEventMap, StarboardEventName } from "../../types/events";

export function createStarboardEvent<E extends StarboardEventName>(
  name: E,
  detail: StarboardEventInitDict<StarboardEventMap[E]>
) {
  return new CustomEvent<StarboardEventMap[E]>(name, {
    bubbles: true,
    cancelable: true,
    composed: true,
    // TODO: Can we do this without the unknown cast? In usage this typing seems correct (intellisense works and type checking when called)..
    // Is the Typescript type system powerful enough?
    detail: (detail as unknown) as StarboardEventMap[E],
  });
}

/**
 * ```javascript
 * dispatchStarboardEvent(myElement, "sb:run_cell", {id: "some-id"})
 * ```
 *
 * is a shorthand for
 *
 * ```javascript
 * myElement.dispatchEvent(createStarboardEvent("sb:run_cell", {id: "some-id"}))
 * ```
 * It allows you to not have to import a bunch of complicated types.
 *
 * Dispatches a synthetic event event to target and returns true if either event's cancelable attribute value is false or its preventDefault() method was not invoked, and false otherwise.
 */
export function dispatchStarboardEvent<E extends StarboardEventName>(
  target: HTMLElement,
  name: E,
  detail: StarboardEventInitDict<StarboardEventMap[E]>
) {
  return target.dispatchEvent(createStarboardEvent(name, detail));
}
