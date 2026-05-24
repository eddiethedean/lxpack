export type ComponentMount = (
  el: HTMLElement,
  props: Record<string, unknown>,
  baseUrl: string,
) => void;

const registry = new Map<string, ComponentMount>();

export function registerComponent(id: string, mount: ComponentMount): void {
  registry.set(id, mount);
}

export function getComponentMount(id: string): ComponentMount | undefined {
  return registry.get(id);
}

export function listBuiltinComponentIds(): string[] {
  return [...registry.keys()];
}
