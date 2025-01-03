import type { ModuleHooks, ModuleRuntimeHooks, ModulePublicRuntimeConfig } from './module'

declare module '#app' {
  interface RuntimeNuxtHooks extends ModuleRuntimeHooks {}
}

declare module '@nuxt/schema' {
  interface NuxtHooks extends ModuleHooks {}
  interface PublicRuntimeConfig extends ModulePublicRuntimeConfig {}
}

export { type BaseUrlResolveHandler, type BundleOptions, type ComputedRouteOptions, type CustomBlocksOptions, type CustomRoutePages, type DetectBrowserLanguageOptions, type Directions, type ExperimentalFeatures, type FileMeta, type I18nHeadMetaInfo, type I18nHeadOptions, type I18nPublicRuntimeConfig, type LocaleFile, type LocaleInfo, type LocaleMessageCompilationOptions, type LocaleObject, type LocaleType, type MetaAttrs, type ModuleHooks, type ModuleOptions, type ModulePublicRuntimeConfig, type ModuleRuntimeHooks, type NuxtI18nOptions, type PrefixLocalizedRouteOptions, type PrefixableOptions, type RedirectOnOptions, type RootRedirectOptions, type RouteOptionsResolver, type STRATEGIES, type STRATEGY_NO_PREFIX, type STRATEGY_PREFIX, type STRATEGY_PREFIX_AND_DEFAULT, type STRATEGY_PREFIX_EXCEPT_DEFAULT, type SeoAttributesOptions, type Strategies, type SwitchLocalePathIntercepter, type VueI18nConfig, type VueI18nConfigPathInfo, default } from './module'
