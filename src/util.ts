import { TemplateResult } from "lit-html";

export function isProbablyTemplateResult(value: any) {
    if (typeof value !== "object") {
        return false;
    }
    if (value instanceof TemplateResult) {
        return true;
    }

    if (value.prototype?.hasOwnProperty("strings")
    && value.prototype?.hasOwnProperty("values")
    && value.prototype?.hasOwnProperty("type")
    && value.prototype?.hasOwnProperty("processor")
    && !!(value as any)["getHTML"]
    ) {
        return true;
    }
    return false;
}