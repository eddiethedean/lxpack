import { getComponentMount } from "./registry.js";
import "./builtins.js";

declare global {
  interface Window {
    __LXPACK_COMPONENTS__?: {
      mount: (
        el: HTMLElement,
        componentId: string,
        props: Record<string, unknown>,
        baseUrl: string,
      ) => void;
    };
  }
}

window.__LXPACK_COMPONENTS__ = {
  mount(el, componentId, props, baseUrl) {
    const mount = getComponentMount(componentId);
    if (!mount) {
      el.innerHTML = `<p class="lxpack-error">Unknown component: ${componentId}</p>`;
      return;
    }
    mount(el, props, baseUrl);
  },
};
