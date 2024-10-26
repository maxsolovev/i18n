import type { ModuleHooks, ModuleRuntimeHooks, ModulePublicRuntimeConfig } from './module'

declare module '#app' {
  interface RuntimeNuxtHooks extends ModuleRuntimeHooks {}
}

declare module '@nuxt/schema' {
  interface NuxtHooks extends ModuleHooks {}
  interface PublicRuntimeConfig extends ModulePublicRuntimeConfig {}
}

export { type ModuleHooks, type ModuleOptions, type ModulePublicRuntimeConfig, type ModuleRuntimeHooks, default } from './module'
