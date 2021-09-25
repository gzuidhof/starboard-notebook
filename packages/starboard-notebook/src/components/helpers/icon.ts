import { html, TemplateResult } from "lit";
import { ifDefined } from "lit/directives/if-defined";
import { IconTemplate } from "src/types";

export function renderIcon(
  icon: IconTemplate,
  opts: { width?: number; height?: number; title?: string } = {}
): TemplateResult | string {
  if (typeof icon === "string") {
    // font-based icon (e.g. bootstrap icon)
    const size = Math.max(opts.height || 0, opts.width || 0);
    const style = size ? `font-size: ${size}px` : undefined;
    return html`<span class="${icon}" style="${ifDefined(style)}" title=${ifDefined(opts.title)}></span>`;
  }
  return icon(opts);
}
