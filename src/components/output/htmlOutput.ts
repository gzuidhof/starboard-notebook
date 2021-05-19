import { html, render } from "lit";
import { isProbablyTemplateResult } from "../../cellTypes/javascript/util";

export function renderIfHtmlOutput(val: any, intoElement: HTMLElement) {
  let didRender = false;
  if (val instanceof HTMLElement) {
    intoElement.appendChild(val);
    didRender = true;
  } else if (isProbablyTemplateResult(val)) {
    render(html`${val}`, intoElement);
    didRender = true;
  }

  if (didRender) {
    intoElement.classList.add("cell-output-html");
  }

  return didRender;
}
