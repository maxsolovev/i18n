import type { I18nHeadMetaInfo, MetaAttrs, LocaleObject, I18nHeadOptions } from '../../shared-types.js';
import type { CommonComposableOptions } from '../../utils.js';
/**
 * Returns localized head properties for locale-related aspects.
 *
 * @param common - Common options used internally by composable functions.
 * @param options - An options, see about details {@link I18nHeadOptions}.
 *
 * @returns The localized {@link I18nHeadMetaInfo | head properties}.
 *
 * @public
 */
export declare function localeHead(common: CommonComposableOptions, { dir, lang, seo, key }: I18nHeadOptions): I18nHeadMetaInfo;
export declare function getHreflangLinks(common: CommonComposableOptions, locales: LocaleObject[], key: NonNullable<I18nHeadOptions['key']>): MetaAttrs[];
export declare function getCanonicalUrl(common: CommonComposableOptions, baseUrl: string, seo: I18nHeadOptions['seo']): string;
export declare function getCanonicalLink(common: CommonComposableOptions, key: NonNullable<I18nHeadOptions['key']>, seo: I18nHeadOptions['seo']): {
    [x: string]: string;
    rel: string;
    href: string;
}[];
export declare function getOgUrl(common: CommonComposableOptions, key: NonNullable<I18nHeadOptions['key']>, seo: I18nHeadOptions['seo']): {
    [x: string]: string;
    property: string;
    content: string;
}[];
export declare function getCurrentOgLocale(currentLocale: LocaleObject, currentLanguage: string | undefined, key: NonNullable<I18nHeadOptions['key']>): {
    [x: string]: string;
    property: string;
    content: string;
}[];
export declare function getAlternateOgLocales(locales: LocaleObject[], currentLanguage: string | undefined, key: NonNullable<I18nHeadOptions['key']>): {
    [x: string]: string;
    property: string;
    content: string;
}[];
