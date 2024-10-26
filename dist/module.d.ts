import * as _nuxt_schema from '@nuxt/schema';
import { HookResult } from '@nuxt/schema';
import { NuxtI18nOptions, LocaleObject, I18nPublicRuntimeConfig } from '../dist/runtime/shared-types.js';
export * from '../dist/runtime/shared-types.js';
import { Locale } from 'vue-i18n';

declare const _default: _nuxt_schema.NuxtModule<NuxtI18nOptions, NuxtI18nOptions, false>;

type UserNuxtI18nOptions = Omit<NuxtI18nOptions, 'locales'> & {
    locales?: string[] | LocaleObject<string>[];
};
interface ModuleOptions extends UserNuxtI18nOptions {
}
interface ModulePublicRuntimeConfig {
    i18n: I18nPublicRuntimeConfig;
}
interface ModuleHooks {
    'i18n:registerModule': (registerModule: (config: Pick<NuxtI18nOptions<unknown>, 'langDir' | 'locales'>) => void) => HookResult;
}
interface ModuleRuntimeHooks {
    'i18n:beforeLocaleSwitch': <Context = unknown>(params: {
        oldLocale: Locale;
        newLocale: Locale;
        initialSetup: boolean;
        context: Context;
    }) => HookResult;
    'i18n:localeSwitched': (params: {
        oldLocale: Locale;
        newLocale: Locale;
    }) => HookResult;
}
declare module '#app' {
    interface RuntimeNuxtHooks extends ModuleRuntimeHooks {
    }
}
declare module '@nuxt/schema' {
    interface NuxtConfig {
        ['i18n']?: Partial<UserNuxtI18nOptions>;
    }
    interface NuxtOptions {
        ['i18n']: UserNuxtI18nOptions;
    }
    interface NuxtHooks extends ModuleHooks {
    }
    interface PublicRuntimeConfig extends ModulePublicRuntimeConfig {
    }
}

export { type ModuleHooks, type ModuleOptions, type ModulePublicRuntimeConfig, type ModuleRuntimeHooks, _default as default };
