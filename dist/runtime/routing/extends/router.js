import { getLocalesRegex, getRouteName } from "../utils.js";
import { localeCodes } from "#build/i18n.options.mjs";
import { useRuntimeConfig } from "#imports";
const localesPattern = `(${localeCodes.join("|")})`;
const regexpPath = getLocalesRegex(localeCodes);
export function createLocaleFromRouteGetter() {
  const { routesNameSeparator, defaultLocaleRouteNameSuffix } = useRuntimeConfig().public.i18n;
  const defaultSuffixPattern = `(?:${routesNameSeparator}${defaultLocaleRouteNameSuffix})?`;
  const regexpName = new RegExp(`${routesNameSeparator}${localesPattern}${defaultSuffixPattern}$`, "i");
  const getLocaleFromRoute = (route) => {
    let matches = null;
    if (typeof route === "string") {
      matches = route.match(regexpPath);
      return matches?.[1] ?? "";
    }
    if (route.name) {
      matches = getRouteName(route.name).match(regexpName);
    } else if (route.path) {
      matches = route.path.match(regexpPath);
    }
    return matches?.[1] ?? "";
  };
  return getLocaleFromRoute;
}
