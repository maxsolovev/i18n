import { joinURL } from "ufo";
import { isArray, isObject } from "@intlify/shared";
import { unref, useNuxtApp, useRuntimeConfig } from "#imports";
import { getNormalizedLocales } from "../utils.js";
import { getRouteBaseName, localeRoute, switchLocalePath } from "./routing.js";
import { getComposer, getLocale, getLocales } from "../../compatibility.js";
export function localeHead(common, { dir = true, lang = true, seo = true, key = "hid" }) {
  const { defaultDirection } = useRuntimeConfig().public.i18n;
  const i18n = getComposer(common.i18n);
  const metaObject = {
    htmlAttrs: {},
    link: [],
    meta: []
  };
  const i18nBaseUrl = unref(i18n.baseUrl);
  if (!i18nBaseUrl) {
    console.warn("I18n `baseUrl` is required to generate valid SEO tag links.");
  }
  if (unref(i18n.locales) == null || i18nBaseUrl == null) {
    return metaObject;
  }
  const locale = getLocale(common.i18n);
  const locales = getLocales(common.i18n);
  const currentLocale = getNormalizedLocales(locales).find((l) => l.code === locale) || {
    code: locale
  };
  const currentLanguage = currentLocale.language;
  const currentDir = currentLocale.dir || defaultDirection;
  if (dir) {
    metaObject.htmlAttrs.dir = currentDir;
  }
  if (lang && currentLanguage) {
    metaObject.htmlAttrs.lang = currentLanguage;
  }
  if (seo && locale && unref(i18n.locales)) {
    metaObject.link.push(
      ...getHreflangLinks(common, unref(locales), key),
      ...getCanonicalLink(common, key, seo)
    );
    metaObject.meta.push(
      ...getOgUrl(common, key, seo),
      ...getCurrentOgLocale(currentLocale, currentLanguage, key),
      ...getAlternateOgLocales(unref(locales), currentLanguage, key)
    );
  }
  return metaObject;
}
function getBaseUrl() {
  const nuxtApp = useNuxtApp();
  const i18n = getComposer(nuxtApp.$i18n);
  return joinURL(unref(i18n.baseUrl), nuxtApp.$config.app.baseURL);
}
export function getHreflangLinks(common, locales, key) {
  const baseUrl = getBaseUrl();
  const { defaultLocale, strategy } = useRuntimeConfig().public.i18n;
  const links = [];
  if (strategy === "no_prefix") return links;
  const localeMap = /* @__PURE__ */ new Map();
  for (const locale of locales) {
    const localeLanguage = locale.language;
    if (!localeLanguage) {
      console.warn("Locale `language` ISO code is required to generate alternate link");
      continue;
    }
    const [language, region] = localeLanguage.split("-");
    if (language && region && (locale.isCatchallLocale || !localeMap.has(language))) {
      localeMap.set(language, locale);
    }
    localeMap.set(localeLanguage, locale);
  }
  for (const [language, mapLocale] of localeMap.entries()) {
    const localePath = switchLocalePath(common, mapLocale.code);
    if (localePath) {
      links.push({
        [key]: `i18n-alt-${language}`,
        rel: "alternate",
        href: toAbsoluteUrl(localePath, baseUrl),
        hreflang: language
      });
    }
  }
  if (defaultLocale) {
    const localePath = switchLocalePath(common, defaultLocale);
    if (localePath) {
      links.push({
        [key]: "i18n-xd",
        rel: "alternate",
        href: toAbsoluteUrl(localePath, baseUrl),
        hreflang: "x-default"
      });
    }
  }
  return links;
}
export function getCanonicalUrl(common, baseUrl, seo) {
  const route = common.router.currentRoute.value;
  const currentRoute = localeRoute(common, {
    ...route,
    path: void 0,
    name: getRouteBaseName(common, route)
  });
  if (!currentRoute) return "";
  let href = toAbsoluteUrl(currentRoute.path, baseUrl);
  const canonicalQueries = isObject(seo) && seo.canonicalQueries || [];
  const currentRouteQueryParams = currentRoute.query;
  const params = new URLSearchParams();
  for (const queryParamName of canonicalQueries) {
    if (queryParamName in currentRouteQueryParams) {
      const queryParamValue = currentRouteQueryParams[queryParamName];
      if (isArray(queryParamValue)) {
        queryParamValue.forEach((v) => params.append(queryParamName, v || ""));
      } else {
        params.append(queryParamName, queryParamValue || "");
      }
    }
  }
  const queryString = params.toString();
  if (queryString) {
    href = `${href}?${queryString}`;
  }
  return href;
}
export function getCanonicalLink(common, key, seo) {
  const baseUrl = getBaseUrl();
  const href = getCanonicalUrl(common, baseUrl, seo);
  if (!href) return [];
  return [{ [key]: "i18n-can", rel: "canonical", href }];
}
export function getOgUrl(common, key, seo) {
  const baseUrl = getBaseUrl();
  const href = getCanonicalUrl(common, baseUrl, seo);
  if (!href) return [];
  return [{ [key]: "i18n-og-url", property: "og:url", content: href }];
}
export function getCurrentOgLocale(currentLocale, currentLanguage, key) {
  if (!currentLocale || !currentLanguage) return [];
  return [{ [key]: "i18n-og", property: "og:locale", content: hypenToUnderscore(currentLanguage) }];
}
export function getAlternateOgLocales(locales, currentLanguage, key) {
  const alternateLocales = locales.filter((locale) => locale.language && locale.language !== currentLanguage);
  return alternateLocales.map((locale) => ({
    [key]: `i18n-og-alt-${locale.language}`,
    property: "og:locale:alternate",
    content: hypenToUnderscore(locale.language)
  }));
}
function hypenToUnderscore(str) {
  return (str || "").replace(/-/g, "_");
}
function toAbsoluteUrl(urlOrPath, baseUrl) {
  if (urlOrPath.match(/^https?:\/\//)) return urlOrPath;
  return joinURL(baseUrl, urlOrPath);
}
