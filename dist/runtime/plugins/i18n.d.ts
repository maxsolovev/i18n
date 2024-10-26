import type { NuxtI18nPluginInjections } from '../injections.js';
type Decorate<T extends Record<string, unknown>> = {
    [K in keyof T as K extends string ? `$${K}` : never]: T[K];
};
declare module '#app' {
    interface NuxtApp extends Decorate<NuxtI18nPluginInjections> {
    }
}
declare const _default: import("#app").Plugin<NuxtI18nPluginInjections> & import("#app").ObjectPlugin<NuxtI18nPluginInjections>;
export default _default;
