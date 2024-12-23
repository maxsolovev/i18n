import createDebug from 'debug'
import { resolve } from 'pathe'
import { extendViteConfig, addWebpackPlugin, addBuildPlugin } from '@nuxt/kit'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n'
import { TransformMacroPlugin } from './transform/macros'
import { ResourcePlugin } from './transform/resource'
import { TransformI18nFunctionPlugin } from './transform/i18n-function-injection'
import { getLayerLangPaths } from './layers'

import type { Nuxt } from '@nuxt/schema'
import type { PluginOptions } from '@intlify/unplugin-vue-i18n'
import type { BundlerPluginOptions } from './transform/utils'
import type { I18nNuxtContext } from './context'

const debug = createDebug('@nuxtjs/i18n:bundler')

export async function extendBundler({ options: nuxtOptions }: I18nNuxtContext, nuxt: Nuxt) {
  const langPaths = getLayerLangPaths(nuxt)
  debug('langPaths -', langPaths)
  const i18nModulePaths =
    nuxtOptions?.i18nModules?.map(module => resolve(nuxt.options._layers[0].config.rootDir, module.langDir ?? '')) ?? []
  debug('i18nModulePaths -', i18nModulePaths)
  const localePaths = [...langPaths, ...i18nModulePaths]
  const localeIncludePaths = localePaths.length ? localePaths.map(x => resolve(x, './**')) : undefined

  const sourceMapOptions: BundlerPluginOptions = {
    sourcemap: !!nuxt.options.sourcemap.server || !!nuxt.options.sourcemap.client
  }

  const vueI18nPluginOptions: PluginOptions = {
    allowDynamic: true,
    include: localeIncludePaths,
    runtimeOnly: nuxtOptions.bundle.runtimeOnly,
    fullInstall: nuxtOptions.bundle.fullInstall,
    onlyLocales: nuxtOptions.bundle.onlyLocales,
    escapeHtml: nuxtOptions.compilation.escapeHtml,
    compositionOnly: nuxtOptions.bundle.compositionOnly,
    strictMessage: nuxtOptions.compilation.strictMessage,
    defaultSFCLang: nuxtOptions.customBlocks.defaultSFCLang,
    globalSFCScope: nuxtOptions.customBlocks.globalSFCScope,
    dropMessageCompiler: nuxtOptions.bundle.dropMessageCompiler,
    optimizeTranslationDirective: nuxtOptions.bundle.optimizeTranslationDirective
  }

  /**
   * shared plugins
   */
  addBuildPlugin({
    vite: () => VueI18nPlugin.vite(vueI18nPluginOptions),
    webpack: () => VueI18nPlugin.webpack(vueI18nPluginOptions)
  })
  addBuildPlugin(TransformMacroPlugin(sourceMapOptions))
  addBuildPlugin(ResourcePlugin(sourceMapOptions))
  if (nuxtOptions.experimental.autoImportTranslationFunctions) {
    addBuildPlugin(TransformI18nFunctionPlugin(sourceMapOptions))
  }

  /**
   * webpack plugin
   */
  try {
    const webpack = await import('webpack').then(m => m.default || m)

    addWebpackPlugin(
      new webpack.DefinePlugin({
        ...getFeatureFlags(nuxtOptions.bundle),
        __DEBUG__: String(!!nuxtOptions.debug)
      })
    )
  } catch (e: unknown) {
    debug((e as Error).message)
  }

  /**
   * vite plugin
   */
  extendViteConfig(config => {
    config.define ??= {}
    config.define['__DEBUG__'] = JSON.stringify(!!nuxtOptions.debug)

    debug('vite.config.define', config.define)
  })
}

export function getFeatureFlags({ compositionOnly = true, fullInstall = true, dropMessageCompiler = false }) {
  return {
    __VUE_I18N_FULL_INSTALL__: String(fullInstall),
    __VUE_I18N_LEGACY_API__: String(!compositionOnly),
    __INTLIFY_PROD_DEVTOOLS__: 'false',
    __INTLIFY_DROP_MESSAGE_COMPILER__: String(dropMessageCompiler)
  }
}
