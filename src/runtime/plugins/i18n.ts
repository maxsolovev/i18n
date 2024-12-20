import { computed, isRef, ref, watch } from 'vue'
import { createI18n } from 'vue-i18n'
import { defineNuxtPlugin, useNuxtApp } from '#imports'
import {
  localeCodes,
  vueI18nConfigs,
  isSSG,
  hasPages,
  localeLoaders,
  parallelPlugin,
  normalizedLocales
} from '#build/i18n.options.mjs'
import { loadVueI18nOptions, loadLocale } from '../messages'
import { loadAndSetLocale, detectRedirect, navigate, extendBaseUrl, injectNuxtHelpers } from '../utils'
import {
  getBrowserLocale,
  getLocaleCookie,
  setLocaleCookie,
  getI18nCookie,
  runtimeDetectBrowserLanguage,
  getDefaultLocaleForDomain,
  setupMultiDomainLocales
} from '../internal'
import { inBrowser, resolveBaseUrl } from '../routing/utils'
import { extendI18n } from '../routing/extends/i18n'
import { createLocaleFromRouteGetter } from '../routing/extends/router'
import { createLogger } from 'virtual:nuxt-i18n-logger'
import { getI18nTarget } from '../compatibility'

import type { NuxtI18nPluginInjections } from '../injections'
import type { Locale, I18nOptions, Composer, I18n } from 'vue-i18n'
import type { NuxtApp } from '#app'
import type { LocaleObject } from '#internal-i18n-types'
import type { I18nPublicRuntimeConfig } from '#internal-i18n-types'

// from https://github.com/nuxt/nuxt/blob/2466af53b0331cdb8b17c2c3b08675c5985deaf3/packages/nuxt/src/core/templates.ts#L152
type Decorate<T extends Record<string, unknown>> = { [K in keyof T as K extends string ? `$${K}` : never]: T[K] }

// TODO: use @nuxt/module-builder to stub/prepare types
declare module '#app' {
  interface NuxtApp extends Decorate<NuxtI18nPluginInjections> {
    _vueI18n: I18n
  }
}

// `NuxtI18nPluginInjections` should not have properties prefixed with `$`
export default defineNuxtPlugin<NuxtI18nPluginInjections>({
  name: 'i18n:plugin',
  parallel: parallelPlugin,
  async setup(nuxt) {
    const logger = /*#__PURE__*/ createLogger('plugin:i18n')
    const nuxtApp = nuxt as unknown as NuxtApp
    const currentRoute = nuxtApp.$router.currentRoute

    const defaultLocaleDomain = getDefaultLocaleForDomain(nuxtApp)
    setupMultiDomainLocales(nuxtApp, defaultLocaleDomain)

    // Fresh copy per request to prevent reusing mutated options
    const runtimeI18n = {
      ...(nuxtApp.$config.public.i18n as I18nPublicRuntimeConfig),
      defaultLocale: defaultLocaleDomain
    }

    nuxtApp.$config.public.i18n.defaultLocale = defaultLocaleDomain
    // @ts-expect-error type incompatible
    runtimeI18n.baseUrl = extendBaseUrl()

    const _detectBrowserLanguage = runtimeDetectBrowserLanguage()

    __DEBUG__ && logger.log('isSSG', isSSG)
    __DEBUG__ && logger.log('useCookie on setup', _detectBrowserLanguage && _detectBrowserLanguage.useCookie)
    __DEBUG__ && logger.log('defaultLocale on setup', runtimeI18n.defaultLocale)

    const vueI18nOptions: I18nOptions = await loadVueI18nOptions(vueI18nConfigs, useNuxtApp())
    vueI18nOptions.messages = vueI18nOptions.messages || {}
    vueI18nOptions.fallbackLocale = vueI18nOptions.fallbackLocale ?? false
    if (defaultLocaleDomain) {
      vueI18nOptions.locale = defaultLocaleDomain
    }

    const getRouteLocale = createLocaleFromRouteGetter()
    const localeCookie = getI18nCookie()

    // create i18n instance
    const i18n = createI18n(vueI18nOptions)

    i18n.__firstAccess = true
    i18n.__setLocale = (locale: string) => {
      const i = getI18nTarget(i18n)
      if (isRef(i.locale)) {
        i.locale.value = locale
      } else {
        i.locale = locale
      }
    }

    nuxtApp._vueI18n = i18n

    // extend i18n instance
    extendI18n(i18n, {
      extendComposer(composer) {
        const _locales = ref<Locale[] | LocaleObject[]>(runtimeI18n.locales)
        const _localeCodes = ref<Locale[]>(localeCodes)
        const _baseUrl = ref<string>('')

        composer.locales = computed(() => _locales.value as unknown as typeof composer.locales.value)
        composer.localeCodes = computed(() => _localeCodes.value)
        composer.baseUrl = computed(() => _baseUrl.value)

        if (inBrowser) {
          watch(
            composer.locale,
            () => {
              _baseUrl.value = resolveBaseUrl(runtimeI18n.baseUrl!, nuxtApp)
            },
            { immediate: true }
          )
        } else {
          _baseUrl.value = resolveBaseUrl(runtimeI18n.baseUrl!, nuxtApp)
        }

        composer.strategy = runtimeI18n.strategy
        composer.localeProperties = computed(
          () => normalizedLocales.find(l => l.code === composer.locale.value) || { code: composer.locale.value }
        )
        composer.setLocale = async (locale: string) => {
          await loadAndSetLocale(locale, i18n.__firstAccess)

          if (composer.strategy === 'no_prefix' || !hasPages) {
            await composer.loadLocaleMessages(locale)
            i18n.__setLocale(locale)
            return
          }

          const route = currentRoute.value
          const redirectPath = await nuxtApp.runWithContext(() =>
            detectRedirect({ to: route, locale, routeLocale: getRouteLocale(route) })
          )

          __DEBUG__ && logger.log('redirectPath on setLocale', redirectPath)

          await nuxtApp.runWithContext(() =>
            navigate({ nuxtApp, redirectPath, locale, route }, { enableNavigate: true })
          )
        }
        composer.loadLocaleMessages = async (locale: string) =>
          await loadLocale(locale, localeLoaders, composer.mergeLocaleMessage.bind(composer))
        composer.differentDomains = runtimeI18n.differentDomains
        composer.defaultLocale = runtimeI18n.defaultLocale
        composer.getBrowserLocale = () => getBrowserLocale()
        composer.getLocaleCookie = () => getLocaleCookie(localeCookie, _detectBrowserLanguage, composer.defaultLocale)
        composer.setLocaleCookie = (locale: string) => setLocaleCookie(localeCookie, locale, _detectBrowserLanguage)

        composer.onBeforeLanguageSwitch = (oldLocale, newLocale, initialSetup, context) =>
          nuxt.callHook('i18n:beforeLocaleSwitch', {
            oldLocale,
            newLocale,
            initialSetup,
            context
          }) as Promise<Locale | void>
        composer.onLanguageSwitched = (oldLocale, newLocale) =>
          nuxt.callHook('i18n:localeSwitched', { oldLocale, newLocale }) as Promise<void>

        // eslint-disable-next-line @typescript-eslint/require-await --- TODO: breaking - signature should be synchronous
        composer.finalizePendingLocaleChange = async () => {
          if (!i18n.__pendingLocale) return

          i18n.__setLocale(i18n.__pendingLocale)
          i18n.__resolvePendingLocalePromise?.()
          i18n.__pendingLocale = undefined
        }
        composer.waitForPendingLocaleChange = async () => {
          if (i18n.__pendingLocale && i18n.__pendingLocalePromise) {
            await i18n.__pendingLocalePromise
          }
        }
      },
      extendComposerInstance(instance, c) {
        const props: [keyof Composer, PropertyDescriptor['get']][] = [
          ['locales', () => c.locales.value],
          ['localeCodes', () => c.localeCodes.value],
          ['baseUrl', () => c.baseUrl.value],
          ['strategy', () => c.strategy],
          ['localeProperties', () => c.localeProperties.value],
          ['setLocale', () => async (locale: string) => Reflect.apply(c.setLocale, c, [locale])],
          ['loadLocaleMessages', () => async (locale: string) => Reflect.apply(c.loadLocaleMessages, c, [locale])],
          ['differentDomains', () => c.differentDomains],
          ['defaultLocale', () => c.defaultLocale],
          ['getBrowserLocale', () => () => Reflect.apply(c.getBrowserLocale, c, [])],
          ['getLocaleCookie', () => () => Reflect.apply(c.getLocaleCookie, c, [])],
          ['setLocaleCookie', () => (locale: string) => Reflect.apply(c.setLocaleCookie, c, [locale])],
          [
            'onBeforeLanguageSwitch',
            () => (oldLocale: string, newLocale: string, initialSetup: boolean, context: NuxtApp) =>
              Reflect.apply(c.onBeforeLanguageSwitch, c, [oldLocale, newLocale, initialSetup, context])
          ],
          [
            'onLanguageSwitched',
            () => (oldLocale: string, newLocale: string) =>
              Reflect.apply(c.onLanguageSwitched, c, [oldLocale, newLocale])
          ],
          ['finalizePendingLocaleChange', () => () => Reflect.apply(c.finalizePendingLocaleChange, c, [])],
          ['waitForPendingLocaleChange', () => () => Reflect.apply(c.waitForPendingLocaleChange, c, [])]
        ]

        for (const [key, get] of props) {
          Object.defineProperty(instance, key, { get })
        }
      }
    })

    nuxt.vueApp.use(i18n) // TODO: should implement `{ inject: false } via `nuxtjs/i18n` configuration

    // inject for nuxt helpers
    injectNuxtHelpers(nuxtApp, i18n)
  }
})
