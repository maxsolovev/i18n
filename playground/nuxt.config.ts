import Module1 from './app/module1'
import LayerModule from './app/layer-module'
import ModuleExperimental from './app/module-experimental'
import { fileURLToPath } from 'mlly'

// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  experimental: {
    typedPages: true
  },

  future: {
    compatibilityVersion: 4
  },

  alias: {
    '@nuxtjs/i18n': fileURLToPath(new URL('../src/module', import.meta.url))
  },

  vite: {
    // Prevent reload by optimizing dependency before discovery
    optimizeDeps: {
      include: ['@unhead/vue']
    },
    build: {
      minify: false
    }
  },

  extends: ['layers/i18n-layer'],

  modules: [Module1, ModuleExperimental, LayerModule, '@nuxtjs/i18n', '@nuxt/devtools'],

  // debug: false,

  i18n: {
    debug: false,
    // restructureDir: 'i18n',
    experimental: {
      localeDetector: './localeDetector.ts',
      switchLocalePathLinkSSR: true,
      autoImportTranslationFunctions: true,
      typedPages: true,
      typedOptionsAndMessages: 'default',
      generatedLocaleFilePathFormat: 'relative'
    },
    compilation: {
      strictMessage: false,
      escapeHtml: true
    },
    langDir: 'locales',
    lazy: true,
    baseUrl: 'http://myrentacar.test:3000',
    prefixDefaultLocales: ['en'],
    locales: [
      {
        code: 'en',
        language: 'en-US',
        file: 'en.json',
        domain: 'http://myrentacar.test:3000',
        name: 'English',
        domainDefault: true,
        shouldLocalize: false
      },
      {
        code: 'en-GB',
        language: 'en-GB',
        files: ['en.json', 'en-GB.js', 'en-KK.js', 'en-US.yaml', 'en-CA.json5'],
        name: 'English (UK)',
        domain: 'http://myrentacar.test:3000'
      },

      {
        code: 'ru',
        language: 'ru-RU',
        file: 'ja.ts',
        name: 'Русский',
        domain: 'http://myrentacar.test:3000'
        // domainDefault: true,
      },
      {
        code: 'nl',
        language: 'nl-NL',
        file: 'nl.json',
        // domain: 'localhost',
        name: 'Nederlands',
        domain: 'http://myrentacar.testpl:3000',
        domainDefault: true
      },
      {
        code: 'fr',
        language: 'fr-FR',
        file: 'fr.json',
        name: 'Français',
        domain: 'http://myrentacar.testde:3000',
        domainDefault: true
      }
    ],
    defaultLocale: 'en',
    // pages: {
    //   history: {
    //     ru: '/history-ja'
    //   },
    //   about: {
    //     ru: '/about-ja'
    //   }
    // },
    skipSettingLocaleOnNavigate: true,
    detectBrowserLanguage: {
      useCookie: false,
      forDomains: ['http://myrentacar.test:3000']
    },
    differentDomains: true,
    // detectBrowserLanguage: {
    //   // useCookie: true
    //   // alwaysRedirect: true
    //   // cookieKey: 'i18n_redirected',
    //   // // cookieKey: 'my_custom_cookie_name',
    //   // redirectOn: 'root'
    // },
    vueI18n: 'vue-i18n.options.ts',
    strategy: 'prefix_except_default'
  },

  devServer: {
    host: 'myrentacar.test',
    port: 3000
  },

  compatibilityDate: '2024-10-25'
})
