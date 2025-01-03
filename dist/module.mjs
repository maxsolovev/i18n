import { tryResolveModule, resolvePath, useNuxt, useLogger, addTemplate, addWebpackPlugin, addVitePlugin, extendViteConfig, addServerPlugin, createResolver, addPlugin, addTypeTemplate, addComponent, addImports, addServerHandler, useNitro, updateTemplates, isIgnored, defineNuxtModule } from '@nuxt/kit';
import createDebug from 'debug';
import { isString, isArray, isRegExp, isFunction, isObject } from '@intlify/shared';
import { parse as parse$2, compileScript } from '@vue/compiler-sfc';
import { walk } from 'estree-walker';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import MagicString from 'magic-string';
import { readFileSync as readFileSync$1, promises, constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, parse, join as join$1, relative, isAbsolute, dirname, normalize } from 'pathe';
import { parse as parse$1 } from '@babel/parser';
import { defu } from 'defu';
import { genSafeVariableName, genDynamicImport, genImport } from 'knitwork';
import { transform } from 'sucrase';
import { encodePath, parseURL, parseQuery, withQuery } from 'ufo';
import { createRoutesContext } from 'unplugin-vue-router';
import { resolveOptions } from 'unplugin-vue-router/options';
import { resolveModuleExportNames } from 'mlly';
import yamlPlugin from '@rollup/plugin-yaml';
import json5Plugin from '@miyaneee/rollup-plugin-json5';
import VueI18nWebpackPlugin from '@intlify/unplugin-vue-i18n/webpack';
import VueI18nVitePlugin from '@intlify/unplugin-vue-i18n/vite';
import { createUnplugin } from 'unplugin';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { watch } from 'chokidar';

const NUXT_I18N_MODULE_ID = "@nuxtjs/i18n";
const VUE_I18N_PKG = "vue-i18n";
const SHARED_PKG = "@intlify/shared";
const MESSAGE_COMPILER_PKG = "@intlify/message-compiler";
const CORE_PKG = "@intlify/core";
const CORE_BASE_PKG = "@intlify/core-base";
const H3_PKG = "@intlify/h3";
const UTILS_PKG = "@intlify/utils";
const UTILS_H3_PKG = "@intlify/utils/h3";
const UFO_PKG = "ufo";
const IS_HTTPS_PKG = "is-https";
const STRATEGY_PREFIX_EXCEPT_DEFAULT = "prefix_except_default";
const DEFAULT_DYNAMIC_PARAMS_KEY = "nuxtI18nInternal";
const DEFAULT_COOKIE_KEY = "i18n_redirected";
const SWITCH_LOCALE_PATH_LINK_IDENTIFIER = "nuxt-i18n-slp";
const DEFAULT_OPTIONS = {
  restructureDir: "i18n",
  experimental: {
    localeDetector: "",
    switchLocalePathLinkSSR: false,
    autoImportTranslationFunctions: false,
    typedPages: true,
    typedOptionsAndMessages: false,
    generatedLocaleFilePathFormat: "absolute"
  },
  bundle: {
    compositionOnly: true,
    runtimeOnly: false,
    fullInstall: true,
    dropMessageCompiler: false
  },
  compilation: {
    jit: true,
    strictMessage: true,
    escapeHtml: false
  },
  customBlocks: {
    defaultSFCLang: "json",
    globalSFCScope: false
  },
  vueI18n: "",
  locales: [],
  defaultLocale: "",
  defaultDirection: "ltr",
  routesNameSeparator: "___",
  trailingSlash: false,
  defaultLocaleRouteNameSuffix: "default",
  strategy: STRATEGY_PREFIX_EXCEPT_DEFAULT,
  lazy: false,
  langDir: "locales",
  rootRedirect: void 0,
  detectBrowserLanguage: {
    alwaysRedirect: false,
    cookieCrossOrigin: false,
    cookieDomain: null,
    cookieKey: DEFAULT_COOKIE_KEY,
    cookieSecure: false,
    fallbackLocale: "",
    redirectOn: "root",
    useCookie: true
  },
  differentDomains: false,
  baseUrl: "",
  customRoutes: "page",
  pages: {},
  skipSettingLocaleOnNavigate: false,
  types: "composition",
  debug: false,
  parallelPlugin: false,
  multiDomainLocales: false
};
const NUXT_I18N_TEMPLATE_OPTIONS_KEY = "i18n.options.mjs";
const NUXT_I18N_COMPOSABLE_DEFINE_ROUTE = "defineI18nRoute";
const NUXT_I18N_COMPOSABLE_DEFINE_LOCALE = "defineI18nLocale";
const NUXT_I18N_COMPOSABLE_DEFINE_CONFIG = "defineI18nConfig";
const NUXT_I18N_COMPOSABLE_DEFINE_LOCALE_DETECTOR = "defineI18nLocaleDetector";
const TS_EXTENSIONS = [".ts", ".cts", ".mts"];
const JS_EXTENSIONS = [".js", ".cjs", ".mjs"];
const EXECUTABLE_EXTENSIONS = [...JS_EXTENSIONS, ...TS_EXTENSIONS];
const NULL_HASH = "00000000";

const debug$a = createDebug("@nuxtjs/i18n:alias");
async function setupAlias({ userOptions: options, isDev, isPrepare }, nuxt) {
  const runtimeOnly = options.bundle?.runtimeOnly;
  const modules = {};
  modules[VUE_I18N_PKG] = isDev || isPrepare ? `${VUE_I18N_PKG}/dist/vue-i18n.mjs` : `${VUE_I18N_PKG}/dist/vue-i18n${runtimeOnly ? ".runtime" : ""}.mjs`;
  modules[SHARED_PKG] = `${SHARED_PKG}/dist/shared.mjs`;
  modules[MESSAGE_COMPILER_PKG] = `${MESSAGE_COMPILER_PKG}/dist/message-compiler.mjs`;
  modules[CORE_BASE_PKG] = `${CORE_BASE_PKG}/dist/core-base.mjs`;
  modules[CORE_PKG] = `${CORE_PKG}/dist/core.node.mjs`;
  modules[UTILS_H3_PKG] = `${UTILS_PKG}/dist/h3.mjs`;
  modules[UFO_PKG] = UFO_PKG;
  modules[IS_HTTPS_PKG] = IS_HTTPS_PKG;
  const moduleDirs = nuxt.options.modulesDir || [];
  const enhancedModulesDirs = [...moduleDirs, ...moduleDirs.map((dir) => `${dir}/${NUXT_I18N_MODULE_ID}/node_modules`)];
  for (const [moduleName, moduleFile] of Object.entries(modules)) {
    const module = await tryResolveModule(moduleFile, enhancedModulesDirs);
    if (!module)
      throw new Error(`Could not resolve module "${moduleFile}"`);
    nuxt.options.alias[moduleName] = module;
    nuxt.options.build.transpile.push(moduleName);
    debug$a(`${moduleName} alias`, nuxt.options.alias[moduleName]);
  }
}

function formatMessage(message) {
  return `[${NUXT_I18N_MODULE_ID}]: ${message}`;
}
function castArray(value) {
  return Array.isArray(value) ? value : [value];
}
function normalizeIncludingLocales(locales) {
  return (castArray(locales) ?? []).filter(isString);
}
function filterLocales(options, nuxt) {
  const project = getLayerI18n(nuxt.options._layers[0]);
  const includingLocales = normalizeIncludingLocales(project?.bundle?.onlyLocales);
  if (!includingLocales.length) {
    return;
  }
  options.locales = options.locales.filter((locale) => {
    const code = isString(locale) ? locale : locale.code;
    return includingLocales.includes(code);
  });
}
function getNormalizedLocales(locales) {
  locales = locales || [];
  const normalized = [];
  for (const locale of locales) {
    if (isString(locale)) {
      normalized.push({ code: locale, language: locale });
    } else {
      normalized.push(locale);
    }
  }
  return normalized;
}
const IMPORT_ID_CACHES = /* @__PURE__ */ new Map();
const normalizeWithUnderScore = (name) => name.replace(/-/g, "_").replace(/\./g, "_").replace(/\//g, "_");
function convertToImportId(file) {
  if (IMPORT_ID_CACHES.has(file)) {
    return IMPORT_ID_CACHES.get(file);
  }
  const { dir, base } = parse(file);
  const id = normalizeWithUnderScore(`${dir}/${base}`);
  IMPORT_ID_CACHES.set(file, id);
  return id;
}
async function resolveLocales(srcDir, locales, buildDir) {
  const files = await Promise.all(locales.flatMap((x) => getLocalePaths(x)).map((x) => resolve(srcDir, x)));
  const find = (f) => files.find((file) => file === resolve(srcDir, f));
  const localesResolved = [];
  for (const { file, ...locale } of locales) {
    const resolved = { ...locale, files: [], meta: [] };
    const files2 = getLocaleFiles(locale);
    for (const f of files2) {
      const filePath = find(f.path) ?? "";
      const localeType = getLocaleType(filePath);
      const isCached = filePath ? localeType !== "dynamic" : true;
      const parsed = parse(filePath);
      const importKey = join$1(parsed.root, parsed.dir, parsed.base);
      const key = genSafeVariableName(`locale_${convertToImportId(importKey)}`);
      const metaFile = {
        path: filePath,
        loadPath: relative(buildDir, filePath),
        type: localeType,
        hash: getHash(filePath),
        parsed,
        key,
        file: {
          path: f.path,
          cache: f.cache ?? isCached
        }
      };
      resolved.meta.push(metaFile);
      resolved.files.push(metaFile.file);
    }
    localesResolved.push(resolved);
  }
  return localesResolved;
}
function getLocaleType(path) {
  const ext = parse(path).ext;
  if (EXECUTABLE_EXTENSIONS.includes(ext)) {
    const code = readCode(path, ext);
    const parsed = parseCode(code, path);
    const analyzed = scanProgram(parsed.program);
    if (analyzed === "object") {
      return "static";
    } else if (analyzed === "function" || analyzed === "arrow-function") {
      return "dynamic";
    } else {
      return "unknown";
    }
  } else {
    return "static";
  }
}
const PARSE_CODE_CACHES = /* @__PURE__ */ new Map();
function parseCode(code, path) {
  if (PARSE_CODE_CACHES.has(path)) {
    return PARSE_CODE_CACHES.get(path);
  }
  const parsed = parse$1(code, {
    allowImportExportEverywhere: true,
    sourceType: "module"
  });
  PARSE_CODE_CACHES.set(path, parsed);
  return parsed;
}
function scanProgram(program) {
  let ret = false;
  let variableDeclaration;
  for (const node of program.body) {
    if (node.type !== "ExportDefaultDeclaration")
      continue;
    if (node.declaration.type === "ObjectExpression") {
      ret = "object";
      break;
    }
    if (node.declaration.type === "Identifier") {
      variableDeclaration = node.declaration;
      break;
    }
    if (node.declaration.type === "CallExpression" && node.declaration.callee.type === "Identifier") {
      const [fnNode] = node.declaration.arguments;
      if (fnNode.type === "FunctionExpression") {
        ret = "function";
        break;
      }
      if (fnNode.type === "ArrowFunctionExpression") {
        ret = "arrow-function";
        break;
      }
    }
  }
  if (variableDeclaration) {
    for (const node of program.body) {
      if (node.type !== "VariableDeclaration")
        continue;
      for (const decl of node.declarations) {
        if (decl.type !== "VariableDeclarator")
          continue;
        if (decl.init == null)
          continue;
        if ("name" in decl.id === false || decl.id.name !== variableDeclaration.name)
          continue;
        if (decl.init.type === "ObjectExpression") {
          ret = "object";
          break;
        }
        if (decl.init.type === "CallExpression" && decl.init.callee.type === "Identifier") {
          const [fnNode] = decl.init.arguments;
          if (fnNode.type === "FunctionExpression") {
            ret = "function";
            break;
          }
          if (fnNode.type === "ArrowFunctionExpression") {
            ret = "arrow-function";
            break;
          }
        }
      }
    }
  }
  return ret;
}
function readCode(absolutePath, ext) {
  let code = readFileSync(absolutePath);
  if (TS_EXTENSIONS.includes(ext)) {
    const out = transform(code, {
      transforms: ["typescript", "jsx"],
      keepUnusedImports: true
    });
    code = out.code;
  }
  return code;
}
function readFileSync(path) {
  return readFileSync$1(path, { encoding: "utf-8" });
}
async function isExists(path) {
  try {
    await promises.access(path, constants.F_OK);
    return true;
  } catch (_e) {
    return false;
  }
}
async function resolveVueI18nConfigInfo(rootDir, configPath = "i18n.config", buildDir = useNuxt().options.buildDir) {
  const configPathInfo = {
    relativeBase: relative(buildDir, rootDir),
    relative: configPath,
    absolute: "",
    rootDir,
    hash: NULL_HASH,
    type: "unknown",
    meta: {
      path: "",
      loadPath: "",
      type: "unknown",
      hash: NULL_HASH,
      key: "",
      parsed: { base: "", dir: "", ext: "", name: "", root: "" }
    }
  };
  const absolutePath = await resolvePath(configPathInfo.relative, { cwd: rootDir, extensions: EXECUTABLE_EXTENSIONS });
  if (!await isExists(absolutePath))
    return void 0;
  const parsed = parse(absolutePath);
  const loadPath = join$1(configPathInfo.relativeBase, relative(rootDir, absolutePath));
  configPathInfo.absolute = absolutePath;
  configPathInfo.type = getLocaleType(absolutePath);
  configPathInfo.hash = getHash(loadPath);
  const key = `${normalizeWithUnderScore(configPathInfo.relative)}_${configPathInfo.hash}`;
  configPathInfo.meta = {
    path: absolutePath,
    type: configPathInfo.type,
    hash: configPathInfo.hash,
    loadPath,
    parsed,
    key
  };
  return configPathInfo;
}
function toCode(code) {
  if (code === null) {
    return `null`;
  }
  if (code === void 0) {
    return `undefined`;
  }
  if (isString(code)) {
    return JSON.stringify(code);
  }
  if (isRegExp(code) && code.toString) {
    return code.toString();
  }
  if (isFunction(code) && code.toString) {
    return `(${code.toString().replace(new RegExp(`^${code.name}`), "function ")})`;
  }
  if (isArray(code)) {
    return `[${code.map((c) => toCode(c)).join(`,`)}]`;
  }
  if (isObject(code)) {
    return stringifyObj(code);
  }
  return code + ``;
}
function stringifyObj(obj) {
  return `Object({${Object.entries(obj).map(([key, value]) => `${JSON.stringify(key)}:${toCode(value)}`).join(`,`)}})`;
}
const getLocalePaths = (locale) => {
  return getLocaleFiles(locale).map((x) => x.path);
};
const getLocaleFiles = (locale) => {
  if (locale.file != null) {
    return [locale.file].map((x) => isString(x) ? { path: x, cache: void 0 } : x);
  }
  if (locale.files != null) {
    return [...locale.files].map((x) => isString(x) ? { path: x, cache: void 0 } : x);
  }
  return [];
};
function resolveRelativeLocales(locale, config) {
  const fileEntries = getLocaleFiles(locale);
  return fileEntries.map((file) => ({
    path: resolve(useNuxt().options.rootDir, resolve(config.langDir ?? "", file.path)),
    cache: file.cache
  }));
}
const mergeConfigLocales = (configs, baseLocales = []) => {
  const mergedLocales = /* @__PURE__ */ new Map();
  for (const locale of baseLocales) {
    mergedLocales.set(locale.code, locale);
  }
  for (const config of configs) {
    if (config.locales == null)
      continue;
    for (const locale of config.locales) {
      const code = isString(locale) ? locale : locale.code;
      const merged = mergedLocales.get(code);
      if (typeof locale === "string") {
        mergedLocales.set(code, merged ?? { language: code, code });
        continue;
      }
      const resolvedFiles = resolveRelativeLocales(locale, config);
      delete locale.file;
      if (merged != null) {
        merged.files ??= [];
        merged.files.unshift(...resolvedFiles);
        mergedLocales.set(code, {
          ...locale,
          ...merged
        });
        continue;
      }
      mergedLocales.set(code, { ...locale, files: resolvedFiles });
    }
  }
  return Array.from(mergedLocales.values());
};
const mergeI18nModules = async (options, nuxt) => {
  if (options)
    options.i18nModules = [];
  const registerI18nModule = (config) => {
    if (config.langDir == null)
      return;
    options?.i18nModules?.push(config);
  };
  await nuxt.callHook("i18n:registerModule", registerI18nModule);
  const modules = options?.i18nModules ?? [];
  if (modules.length > 0) {
    const baseLocales = [];
    const layerLocales = options.locales ?? [];
    for (const locale of layerLocales) {
      if (typeof locale !== "object")
        continue;
      baseLocales.push({ ...locale, file: void 0, files: getLocaleFiles(locale) });
    }
    const mergedLocales = mergeConfigLocales(modules, baseLocales);
    options.locales = mergedLocales;
  }
};
function getHash(text) {
  return createHash("sha256").update(text).digest("hex").substring(0, 8);
}
function getLayerI18n(configLayer) {
  const layerInlineOptions = (configLayer.config.modules || []).find(
    (mod) => isArray(mod) && typeof mod[0] === "string" && [NUXT_I18N_MODULE_ID, `${NUXT_I18N_MODULE_ID}-edge`].includes(mod[0])
  )?.[1];
  if (configLayer.config.i18n) {
    return defu(configLayer.config.i18n, layerInlineOptions);
  }
  return layerInlineOptions;
}
const applyOptionOverrides = (options, nuxt) => {
  const project = nuxt.options._layers[0];
  const { overrides, ...mergedOptions } = options;
  if (overrides) {
    delete options.overrides;
    project.config.i18n = defu(overrides, project.config.i18n);
    Object.assign(options, defu(overrides, mergedOptions));
  }
};
function toArray(value) {
  return Array.isArray(value) ? value : [value];
}

const COLON_RE = /:/g;
function getRoutePath(tokens) {
  return tokens.reduce((path, token) => {
    return path + (token.type === 2 /* optional */ ? `:${token.value}?` : token.type === 1 /* dynamic */ ? `:${token.value}()` : token.type === 3 /* catchall */ ? `:${token.value}(.*)*` : token.type === 4 /* group */ ? "" : encodePath(token.value).replace(COLON_RE, "\\:"));
  }, "/");
}
const PARAM_CHAR_RE = /[\w.]/;
function parseSegment(segment) {
  let state = 0 /* initial */;
  let i = 0;
  let buffer = "";
  const tokens = [];
  function consumeBuffer() {
    if (!buffer) {
      return;
    }
    if (state === 0 /* initial */) {
      throw new Error("wrong state");
    }
    tokens.push({
      type: state === 1 /* static */ ? 0 /* static */ : state === 2 /* dynamic */ ? 1 /* dynamic */ : state === 3 /* optional */ ? 2 /* optional */ : state === 4 /* catchall */ ? 3 /* catchall */ : 4 /* group */,
      value: buffer
    });
    buffer = "";
  }
  while (i < segment.length) {
    const c = segment[i];
    switch (state) {
      case 0 /* initial */:
        buffer = "";
        if (c === "[") {
          state = 2 /* dynamic */;
        } else if (c === "(") {
          state = 5 /* group */;
        } else {
          i--;
          state = 1 /* static */;
        }
        break;
      case 1 /* static */:
        if (c === "[") {
          consumeBuffer();
          state = 2 /* dynamic */;
        } else if (c === "(") {
          consumeBuffer();
          state = 5 /* group */;
        } else {
          buffer += c;
        }
        break;
      case 4 /* catchall */:
      case 2 /* dynamic */:
      case 3 /* optional */:
      case 5 /* group */:
        if (buffer === "...") {
          buffer = "";
          state = 4 /* catchall */;
        }
        if (c === "[" && state === 2 /* dynamic */) {
          state = 3 /* optional */;
        }
        if (c === "]" && (state !== 3 /* optional */ || segment[i - 1] === "]")) {
          if (!buffer) {
            throw new Error("Empty param");
          } else {
            consumeBuffer();
          }
          state = 0 /* initial */;
        } else if (c === ")" && state === 5 /* group */) {
          if (!buffer) {
            throw new Error("Empty group");
          } else {
            consumeBuffer();
          }
          state = 0 /* initial */;
        } else if (c && PARAM_CHAR_RE.test(c)) {
          buffer += c;
        } else ;
        break;
    }
    i++;
  }
  if (state === 2 /* dynamic */) {
    throw new Error(`Unfinished param "${buffer}"`);
  }
  consumeBuffer();
  return tokens;
}

const join = (...args) => args.filter(Boolean).join("");
function prefixLocalizedRoute(localizeOptions, options, extra = false) {
  const isDefaultLocale = localizeOptions.locale === (localizeOptions.defaultLocale ?? "") && !options.prefixDefaultLocales.includes(localizeOptions.locale);
  const isChildWithRelativePath = localizeOptions.parent != null && !localizeOptions.path.startsWith("/");
  return !extra && !isChildWithRelativePath && options.strategy !== "no_prefix" && // skip default locale if strategy is 'prefix_except_default'
  !(isDefaultLocale && options.strategy === "prefix_except_default");
}
function adjustRoutePathForTrailingSlash(localized, trailingSlash) {
  const isChildWithRelativePath = localized.parent != null && !localized.path.startsWith("/");
  return localized.path.replace(/\/+$/, "") + (trailingSlash ? "/" : "") || (isChildWithRelativePath ? "" : "/");
}
function shouldLocalizeRoutes(options) {
  if (options.strategy === "no_prefix") {
    if (!options.differentDomains)
      return false;
    const domains = /* @__PURE__ */ new Set();
    for (const locale of options.locales || []) {
      if (typeof locale === "string")
        continue;
      if (locale.domain) {
        if (domains.has(locale.domain)) {
          console.error(
            `Cannot use \`strategy: no_prefix\` when using multiple locales on the same domain - found multiple entries with ${locale.domain}`
          );
          return false;
        }
        domains.add(locale.domain);
      }
    }
  }
  return true;
}
function localizeRoutes(routes, options) {
  if (!shouldLocalizeRoutes(options))
    return routes;
  let defaultLocales = [options.defaultLocale ?? ""];
  if (options.differentDomains) {
    const domainDefaults = options.locales.filter((locale) => isObject(locale) ? locale.domainDefault : false).map((locale) => isObject(locale) ? locale.code : locale);
    defaultLocales = defaultLocales.concat(domainDefaults);
  }
  function localizeRoute(route, { locales = [], parent, parentLocalized, extra = false }) {
    if (route.redirect && !route.file) {
      return [route];
    }
    const routeOptions = options.optionsResolver?.(route, locales);
    if (options.optionsResolver != null && routeOptions == null) {
      return [route];
    }
    const componentOptions = {
      // filter locales to prevent child routes from being localized even though they are disabled in the configuration.
      locales: locales.filter((locale) => (routeOptions?.locales ?? locales).includes(locale)),
      paths: {},
      ...routeOptions
    };
    const localizedRoutes = [];
    for (const locale of componentOptions.locales) {
      const localized = { ...route, locale, parent };
      const isDefaultLocale = defaultLocales.includes(locale);
      const addDefaultTree = isDefaultLocale && options.strategy === "prefix_and_default" && parent == null && !extra;
      if (addDefaultTree && parent == null && !extra) {
        localizedRoutes.push(...localizeRoute(route, { locales: [locale], extra: true }));
      }
      const nameSegments = [localized.name, options.routesNameSeparator, locale];
      if (extra) {
        nameSegments.push(options.routesNameSeparator, options.defaultLocaleRouteNameSuffix);
      }
      localized.name &&= join(...nameSegments);
      localized.path = componentOptions.paths?.[locale] ?? localized.path;
      const localePrefixable = prefixLocalizedRoute(
        { defaultLocale: isDefaultLocale ? locale : options.defaultLocale, ...localized },
        options,
        extra
      );
      if (localePrefixable) {
        if (options.multiDomainLocales && (options.strategy === "prefix_except_default" || options.strategy === "prefix_and_default")) {
          localizedRoutes.push({
            ...localized,
            name: `${localized.name}___default`
          });
        }
        localized.path = join("/", locale, localized.path);
        if (isDefaultLocale && options.strategy === "prefix" && options.includeUnprefixedFallback) {
          localizedRoutes.push({ ...route, locale, parent });
        }
      }
      if (localized.alias) {
        const aliases = toArray(localized.alias);
        const localizedAliases = [];
        for (const alias of aliases) {
          const aliasPrefixable = prefixLocalizedRoute(
            { defaultLocale: isDefaultLocale ? locale : options.defaultLocale, ...localized, path: alias },
            options,
            extra
          );
          let localizedAlias = alias;
          if (aliasPrefixable) {
            localizedAlias = join("/", locale, localizedAlias);
          }
          localizedAlias &&= adjustRoutePathForTrailingSlash(
            { ...localized, path: localizedAlias },
            options.trailingSlash
          );
          localizedAliases.push(localizedAlias);
        }
        localized.alias = localizedAliases;
      }
      localized.path &&= adjustRoutePathForTrailingSlash(localized, options.trailingSlash);
      if (parentLocalized != null) {
        localized.path = localized.path.replace(parentLocalized.path + "/", "");
      }
      localized.children &&= localized.children.flatMap(
        (child) => localizeRoute(child, { locales: [locale], parent: route, parentLocalized: localized, extra })
      );
      localizedRoutes.push(localized);
    }
    return localizedRoutes.flatMap((x) => {
      delete x.parent;
      delete x.locale;
      return x;
    });
  }
  return routes.flatMap(
    (route) => localizeRoute(route, { locales: getNormalizedLocales(options.locales).map((x) => x.code) })
  );
}

const debug$9 = createDebug("@nuxtjs/i18n:layers");
const checkLayerOptions = (_options, nuxt) => {
  const logger = useLogger(NUXT_I18N_MODULE_ID);
  const project = nuxt.options._layers[0];
  const layers = nuxt.options._layers;
  for (const layer of layers) {
    const layerI18n = getLayerI18n(layer);
    if (layerI18n == null)
      continue;
    const configLocation = project.config.rootDir === layer.config.rootDir ? "project layer" : "extended layer";
    const layerHint = `In ${configLocation} (\`${resolve(project.config.rootDir, layer.configFile)}\`) -`;
    try {
      if (layerI18n.langDir) {
        const locales = layerI18n.locales || [];
        if (isString(layerI18n.langDir) && isAbsolute(layerI18n.langDir)) {
          logger.warn(
            `${layerHint} \`langDir\` is set to an absolute path (\`${layerI18n.langDir}\`) but should be set a path relative to \`srcDir\` (\`${layer.config.srcDir}\`). Absolute paths will not work in production, see https://i18n.nuxtjs.org/options/lazy#langdir for more details.`
          );
        }
        for (const locale of locales) {
          if (isString(locale)) {
            throw new Error("When using the `langDir` option the `locales` must be a list of objects.");
          }
          if (!(locale.file || locale.files)) {
            throw new Error(
              `All locales must have the \`file\` or \`files\` property set when using \`langDir\`.
Found none in:
${JSON.stringify(locale, null, 2)}.`
            );
          }
        }
      }
    } catch (err) {
      if (!(err instanceof Error))
        throw err;
      throw new Error(formatMessage(`${layerHint} ${err.message}`));
    }
  }
};
const applyLayerOptions = (options, nuxt) => {
  const project = nuxt.options._layers[0];
  const layers = nuxt.options._layers;
  const resolvedLayerPaths = layers.map((l) => resolve(project.config.rootDir, l.config.rootDir));
  debug$9("using layers at paths", resolvedLayerPaths);
  const mergedLocales = mergeLayerLocales(options, nuxt);
  debug$9("merged locales", mergedLocales);
  options.locales = mergedLocales;
};
const mergeLayerPages = (analyzer, nuxt) => {
  const project = nuxt.options._layers[0];
  const layers = nuxt.options._layers;
  if (layers.length === 1)
    return;
  for (const l of layers) {
    const lPath = resolve(project.config.rootDir, l.config.srcDir, l.config.dir?.pages ?? "pages");
    debug$9("mergeLayerPages: path ->", lPath);
    analyzer(lPath);
  }
};
function resolveI18nDir(layer, i18n, fromRootDir = false) {
  if (i18n.restructureDir !== false) {
    return resolve(layer.config.rootDir, i18n.restructureDir ?? "i18n");
  }
  return resolve(layer.config.rootDir, fromRootDir ? "" : layer.config.srcDir);
}
function resolveLayerLangDir(layer, i18n) {
  i18n.restructureDir ??= "i18n";
  i18n.langDir ??= i18n.restructureDir !== false ? "locales" : "";
  return resolve(resolveI18nDir(layer, i18n), i18n.langDir);
}
const mergeLayerLocales = (options, nuxt) => {
  debug$9("project layer `lazy` option", options.lazy);
  options.locales ??= [];
  const configs = [];
  for (const layer of nuxt.options._layers) {
    const i18n = getLayerI18n(layer);
    if (i18n?.locales == null)
      continue;
    configs.push({ ...i18n, langDir: resolveLayerLangDir(layer, i18n) });
  }
  const installModuleConfigMap = /* @__PURE__ */ new Map();
  outer:
    for (const locale of options.locales) {
      if (typeof locale === "string")
        continue;
      const files = getLocaleFiles(locale);
      if (files.length === 0)
        continue;
      const langDir = parse(files[0].path).dir;
      const locales = installModuleConfigMap.get(langDir)?.locales ?? [];
      for (const file of files) {
        if (!isAbsolute(file.path))
          continue outer;
        if (configs.find((config) => config.langDir === parse(file.path).dir) != null)
          continue outer;
      }
      locales.push(locale);
      installModuleConfigMap.set(langDir, { langDir, locales });
    }
  configs.unshift(...Array.from(installModuleConfigMap.values()));
  return mergeConfigLocales(configs);
};
const getLayerLangPaths = (nuxt) => {
  const langPaths = [];
  for (const layer of nuxt.options._layers) {
    const i18n = getLayerI18n(layer);
    if (i18n?.restructureDir === false && i18n?.langDir == null)
      continue;
    langPaths.push(resolveLayerLangDir(layer, i18n || {}));
  }
  return langPaths;
};
async function resolveLayerVueI18nConfigInfo(options) {
  const logger = useLogger(NUXT_I18N_MODULE_ID);
  const nuxt = useNuxt();
  const resolveArr = nuxt.options._layers.map(async (layer) => {
    const i18n = getLayerI18n(layer);
    const res = await resolveVueI18nConfigInfo(resolveI18nDir(layer, i18n || {}, true), i18n?.vueI18n);
    if (res == null && i18n?.vueI18n != null) {
      logger.warn(
        `Ignore Vue I18n configuration file does not exist at ${i18n.vueI18n} in ${layer.config.rootDir}. Skipping...`
      );
      return void 0;
    }
    return res;
  });
  const resolved = await Promise.all(resolveArr);
  if (options.vueI18n && isAbsolute(options.vueI18n)) {
    resolved.unshift(await resolveVueI18nConfigInfo(parse(options.vueI18n).dir, options.vueI18n));
  }
  return resolved.filter((x) => x != null);
}

const debug$8 = createDebug("@nuxtjs/i18n:pages");
async function setupPages({ localeCodes, options, isSSR }, nuxt) {
  if (!localeCodes.length)
    return;
  let includeUnprefixedFallback = !isSSR;
  nuxt.hook("nitro:init", () => {
    debug$8("enable includeUprefixedFallback");
    includeUnprefixedFallback = options.strategy !== "prefix";
  });
  const pagesDir = nuxt.options.dir && nuxt.options.dir.pages ? nuxt.options.dir.pages : "pages";
  const srcDir = nuxt.options.srcDir;
  debug$8(`pagesDir: ${pagesDir}, srcDir: ${srcDir}, trailingSlash: ${options.trailingSlash}`);
  const typedRouter = await setupExperimentalTypedRoutes(options, nuxt);
  const pagesHook = nuxt.options.experimental.scanPageMeta === "after-resolve" ? "pages:resolved" : "pages:extend";
  nuxt.hook(pagesHook, async (pages) => {
    debug$8("pages making ...", pages);
    const ctx = {
      stack: [],
      srcDir,
      pagesDir,
      pages: /* @__PURE__ */ new Map()
    };
    analyzeNuxtPages(ctx, pages);
    const analyzer = (pageDirOverride) => analyzeNuxtPages(ctx, pages, pageDirOverride);
    mergeLayerPages(analyzer, nuxt);
    if (typedRouter) {
      await typedRouter.createContext(pages).scanPages(false);
    }
    const localizedPages = localizeRoutes(pages, {
      ...options,
      includeUnprefixedFallback,
      optionsResolver: getRouteOptionsResolver(ctx, options)
    });
    const indexPage = pages.find((x) => x.path === "/");
    if (!nuxt.options._generate && options.strategy === "prefix" && indexPage != null) {
      localizedPages.unshift(indexPage);
    }
    if (pages !== localizedPages) {
      pages.splice(0, pages.length);
      pages.unshift(...localizedPages);
    }
    debug$8("... made pages", pages);
  });
}
const routeNamedMapTypeRE = /RouteNamedMap\b/;
const declarationFile = "./types/typed-router-i18n.d.ts";
async function setupExperimentalTypedRoutes(userOptions, nuxt) {
  if (!nuxt.options.experimental.typedPages || userOptions.experimental?.typedPages === false) {
    return void 0;
  }
  const dtsFile = resolve(nuxt.options.buildDir, declarationFile);
  function createContext(pages) {
    const typedRouteroptions = {
      routesFolder: [],
      dts: dtsFile,
      logs: nuxt.options.debug,
      watch: false,
      // eslint-disable-next-line @typescript-eslint/require-await
      async beforeWriteFiles(rootPage) {
        rootPage.children.forEach((child) => child.delete());
        function addPage(parent, page) {
          const route = parent.insert(page.path, page.file);
          if (page.meta) {
            route.addToMeta(page.meta);
          }
          if (page.alias) {
            route.addAlias(page.alias);
          }
          if (page.name) {
            route.name = page.name;
          }
          if (page.children) {
            page.children.forEach((child) => addPage(route, child));
          }
        }
        for (const page of pages) {
          addPage(rootPage, page);
        }
      }
    };
    const context = createRoutesContext(resolveOptions(typedRouteroptions));
    const originalScanPages = context.scanPages.bind(context);
    context.scanPages = async function(watchers = false) {
      await mkdir(dirname(dtsFile), { recursive: true });
      await originalScanPages(watchers);
      const dtsContent = await readFile(dtsFile, "utf-8");
      if (routeNamedMapTypeRE.test(dtsContent)) {
        await writeFile(dtsFile, dtsContent.replace(routeNamedMapTypeRE, "RouteNamedMapI18n"));
      }
    };
    return context;
  }
  addTemplate({
    filename: resolve(nuxt.options.buildDir, "./types/i18n-generated-route-types.d.ts"),
    getContents: () => {
      return `// Generated by @nuxtjs/i18n
declare module 'vue-router' {
  import type { RouteNamedMapI18n } from 'vue-router/auto-routes'

  export interface TypesConfig {
    RouteNamedMapI18n: RouteNamedMapI18n
  }
}

export {}`;
    }
  });
  nuxt.hook("prepare:types", ({ references }) => {
    references.push({ path: declarationFile });
    references.push({ types: "./types/i18n-generated-route-types.d.ts" });
  });
  await createContext(nuxt.apps.default?.pages ?? []).scanPages(false);
  return { createContext };
}
function analyzePagePath(pagePath, parents = 0) {
  const { dir, name } = parse(pagePath);
  if (parents > 0 || dir !== "/") {
    return `${dir.slice(1, dir.length)}/${name}`;
  }
  return name;
}
function analyzeNuxtPages(ctx, pages, pageDirOverride) {
  if (pages == null || pages.length === 0)
    return;
  const pagesPath = resolve(ctx.srcDir, pageDirOverride ?? ctx.pagesDir);
  for (const page of pages) {
    if (page.file == null)
      continue;
    const splits = page.file.split(pagesPath);
    const filePath = splits.at(1);
    if (filePath == null)
      continue;
    ctx.pages.set(page, {
      path: analyzePagePath(filePath, ctx.stack.length),
      inRoot: ctx.stack.length === 0
    });
    ctx.stack.push(page.path);
    analyzeNuxtPages(ctx, page.children, pageDirOverride);
    ctx.stack.pop();
  }
}
function getRouteOptionsResolver(ctx, options) {
  const { pages, defaultLocale, customRoutes } = options;
  const useConfig = customRoutes === "config";
  debug$8("getRouteOptionsResolver useConfig", useConfig);
  return (route, localeCodes) => {
    const ret = useConfig ? getRouteOptionsFromPages(ctx, route, localeCodes, pages, defaultLocale) : getRouteOptionsFromComponent(route, localeCodes);
    debug$8("getRouteOptionsResolver resolved", route.path, route.name, ret);
    return ret;
  };
}
function resolveRoutePath(path) {
  const normalizePath = path.slice(1, path.length);
  const tokens = parseSegment(normalizePath);
  const routePath = getRoutePath(tokens);
  return routePath;
}
function getRouteOptionsFromPages(ctx, route, localeCodes, pages, defaultLocale) {
  const options = {
    locales: localeCodes,
    paths: {}
  };
  const pageMeta = ctx.pages.get(route);
  if (pageMeta == null) {
    console.warn(
      formatMessage(`Couldn't find AnalyzedNuxtPageMeta by NuxtPage (${route.path}), so no custom route for it`)
    );
    return options;
  }
  const pageOptions = pageMeta.path ? pages[pageMeta.path] : void 0;
  if (pageOptions === false) {
    return void 0;
  }
  if (!pageOptions) {
    return options;
  }
  options.locales = options.locales.filter((locale) => pageOptions[locale] !== false);
  for (const locale of options.locales) {
    const customLocalePath = pageOptions[locale];
    if (isString(customLocalePath)) {
      options.paths[locale] = resolveRoutePath(customLocalePath);
      continue;
    }
    const customDefaultLocalePath = pageOptions[defaultLocale];
    if (isString(customDefaultLocalePath)) {
      options.paths[locale] = resolveRoutePath(customDefaultLocalePath);
    }
  }
  return options;
}
function getRouteOptionsFromComponent(route, localeCodes) {
  debug$8("getRouteOptionsFromComponent", route);
  const file = route.file;
  if (!isString(file)) {
    return void 0;
  }
  const options = {
    locales: localeCodes,
    paths: {}
  };
  const componentOptions = readComponent(file);
  if (componentOptions == null) {
    return options;
  }
  if (componentOptions === false) {
    return void 0;
  }
  options.locales = componentOptions.locales || localeCodes;
  for (const [locale, path] of Object.entries(componentOptions.paths ?? {})) {
    if (isString(path)) {
      options.paths[locale] = resolveRoutePath(path);
    }
  }
  return options;
}
function readComponent(target) {
  let options = void 0;
  try {
    const content = readFileSync(target);
    const { descriptor } = parse$2(content);
    if (!content.includes(NUXT_I18N_COMPOSABLE_DEFINE_ROUTE)) {
      return options;
    }
    const desc = compileScript(descriptor, { id: target });
    const { scriptSetupAst, scriptAst } = desc;
    let extract = "";
    const genericSetupAst = scriptSetupAst || scriptAst;
    if (genericSetupAst) {
      const s = new MagicString(desc.loc.source);
      genericSetupAst.forEach((ast) => {
        walk(ast, {
          enter(_node) {
            const node = _node;
            if (node.type === "CallExpression" && node.callee.type === "Identifier" && node.callee.name === NUXT_I18N_COMPOSABLE_DEFINE_ROUTE) {
              const arg = node.arguments[0];
              if (arg.type === "ObjectExpression") {
                if (verifyObjectValue(arg.properties) && arg.start != null && arg.end != null) {
                  extract = s.slice(arg.start, arg.end);
                }
              } else if (arg.type === "BooleanLiteral" && arg.start != null && arg.end != null) {
                extract = s.slice(arg.start, arg.end);
              }
            }
          }
        });
      });
    }
    if (extract) {
      options = evalValue(extract);
    }
  } catch (e) {
    console.warn(formatMessage(`Couldn't read component data at ${target}: (${e.message})`));
  }
  return options;
}
function verifyObjectValue(properties) {
  let ret = true;
  for (const prop of properties) {
    if (prop.type === "ObjectProperty") {
      if (prop.key.type === "Identifier" && prop.key.name === "locales" || prop.key.type === "StringLiteral" && prop.key.value === "locales") {
        if (prop.value.type === "ArrayExpression") {
          ret = verifyLocalesArrayExpression(prop.value.elements);
        } else {
          console.warn(formatMessage(`'locale' value is required array`));
          ret = false;
        }
      } else if (prop.key.type === "Identifier" && prop.key.name === "paths" || prop.key.type === "StringLiteral" && prop.key.value === "paths") {
        if (prop.value.type === "ObjectExpression") {
          ret = verifyPathsObjectExpress(prop.value.properties);
        } else {
          console.warn(formatMessage(`'paths' value is required object`));
          ret = false;
        }
      }
    } else {
      console.warn(formatMessage(`'defineI18nRoute' is required object`));
      ret = false;
    }
  }
  return ret;
}
function verifyPathsObjectExpress(properties) {
  let ret = true;
  for (const prop of properties) {
    if (prop.type === "ObjectProperty") {
      if (prop.key.type === "Identifier" && prop.value.type !== "StringLiteral") {
        console.warn(formatMessage(`'paths.${prop.key.name}' value is required string literal`));
        ret = false;
      } else if (prop.key.type === "StringLiteral" && prop.value.type !== "StringLiteral") {
        console.warn(formatMessage(`'paths.${prop.key.value}' value is required string literal`));
        ret = false;
      }
    } else {
      console.warn(formatMessage(`'paths' is required object`));
      ret = false;
    }
  }
  return ret;
}
function verifyLocalesArrayExpression(elements) {
  let ret = true;
  for (const element of elements) {
    if (element?.type !== "StringLiteral") {
      console.warn(formatMessage(`required 'locales' value string literal`));
      ret = false;
    }
  }
  return ret;
}
function evalValue(value) {
  try {
    return new Function(`return (${value})`)();
  } catch (_e) {
    console.error(formatMessage(`Cannot evaluate value: ${value}`));
    return;
  }
}

const VIRTUAL_PREFIX_HEX = "\0";
function isVue(id, opts = {}) {
  const { search } = parseURL(decodeURIComponent(pathToFileURL(id).href));
  if (id.endsWith(".vue") && !search) {
    return true;
  }
  if (!search) {
    return false;
  }
  const query = parseQuery(search);
  if (query.nuxt_component) {
    return false;
  }
  if (query.macro && (search === "?macro=true" || !opts.type || opts.type.includes("script"))) {
    return true;
  }
  const type = "setup" in query ? "script" : query.type;
  if (!("vue" in query) || opts.type && !opts.type.includes(type)) {
    return false;
  }
  return true;
}

const debug$7 = createDebug("@nuxtjs/i18n:transform:macros");
const TransformMacroPlugin = createUnplugin((options) => {
  return {
    name: "nuxtjs:i18n-macros-transform",
    enforce: "pre",
    transformInclude(id) {
      if (!id || id.startsWith(VIRTUAL_PREFIX_HEX)) {
        return false;
      }
      return isVue(id, { type: ["script"] });
    },
    transform(code, id) {
      debug$7("transform", id);
      const parsed = parse$2(code, { sourceMap: false });
      const script = parsed.descriptor.scriptSetup ?? parsed.descriptor.script;
      if (!script) {
        return;
      }
      const s = new MagicString(code);
      const match = script.content.match(new RegExp(`\\b${NUXT_I18N_COMPOSABLE_DEFINE_ROUTE}\\s*\\(\\s*`));
      if (match?.[0]) {
        const scriptString = new MagicString(script.content);
        scriptString.overwrite(match.index, match.index + match[0].length, `false && /*#__PURE__*/ ${match[0]}`);
        s.overwrite(script.loc.start.offset, script.loc.end.offset, scriptString.toString());
      }
      if (s.hasChanged()) {
        debug$7("transformed: id -> ", id);
        debug$7("transformed: code -> ", s.toString());
        return {
          code: s.toString(),
          map: options.sourcemap ? s.generateMap({ hires: true }) : void 0
        };
      }
    }
  };
});

const debug$6 = createDebug("@nuxtjs/i18n:transform:resource");
const ResourcePlugin = createUnplugin((options) => {
  debug$6("options", options);
  return {
    name: "nuxtjs:i18n-resource",
    enforce: "post",
    transformInclude(id) {
      debug$6("transformInclude", id);
      if (!id || id.startsWith(VIRTUAL_PREFIX_HEX)) {
        return false;
      }
      const { pathname, search } = parseURL(decodeURIComponent(pathToFileURL(id).href));
      const query = parseQuery(search);
      return /\.([c|m]?[j|t]s)$/.test(pathname) && (!!query.locale || !!query.config);
    },
    transform(code, id) {
      debug$6("transform", id);
      const { pathname, search } = parseURL(decodeURIComponent(pathToFileURL(id).href));
      const query = parseQuery(search);
      const s = new MagicString(code);
      function result() {
        if (s.hasChanged()) {
          return {
            code: s.toString(),
            map: options.sourcemap && !/\.([c|m]?ts)$/.test(pathname) ? s.generateMap({ hires: true }) : null
          };
        }
      }
      const pattern = query.locale ? NUXT_I18N_COMPOSABLE_DEFINE_LOCALE : NUXT_I18N_COMPOSABLE_DEFINE_CONFIG;
      const matches = code.matchAll(new RegExp(`\\b${pattern}\\s*`, "g"));
      for (const match of matches) {
        s.remove(match.index, match.index + match[0].length);
      }
      return result();
    }
  };
});

const debug$5 = createDebug("@nuxtjs/i18n:function:injection");
const TRANSLATION_FUNCTIONS = ["$t", "$rt", "$d", "$n", "$tm", "$te"];
const TRANSLATION_FUNCTIONS_RE = /\$(t|rt|d|n|tm|te)\s*\(\s*/;
const TRANSLATION_FUNCTIONS_MAP = {
  $t: "t: $t",
  $rt: "rt: $rt",
  $d: "d: $d",
  $n: "n: $n",
  $tm: "tm: $tm",
  $te: "te: $te"
};
const TransformI18nFunctionPlugin = createUnplugin((options) => {
  return {
    name: "nuxtjs:i18n-function-injection",
    enforce: "pre",
    transformInclude(id) {
      return isVue(id, { type: ["script"] });
    },
    transform(code, id) {
      debug$5("transform", id);
      const script = extractScriptContent(code);
      if (!script || !TRANSLATION_FUNCTIONS_RE.test(script)) {
        return;
      }
      const scriptSetup = parse$2(code, { sourceMap: false }).descriptor.scriptSetup;
      if (!scriptSetup) {
        return;
      }
      const scriptTransformed = transform(script, { transforms: ["typescript", "jsx"] }).code;
      const ast = this.parse(scriptTransformed, { sourceType: "module", ecmaVersion: "latest" });
      let scopeTracker = new ScopeTracker();
      const varCollector = new ScopedVarsCollector();
      walk(ast, {
        enter(_node) {
          if (_node.type === "BlockStatement") {
            scopeTracker.enterScope();
            varCollector.refresh(scopeTracker.curScopeKey);
          } else if (_node.type === "FunctionDeclaration" && _node.id) {
            varCollector.addVar(_node.id.name);
          } else if (_node.type === "VariableDeclarator") {
            varCollector.collect(_node.id);
          }
        },
        leave(_node) {
          if (_node.type === "BlockStatement") {
            scopeTracker.leaveScope();
            varCollector.refresh(scopeTracker.curScopeKey);
          }
        }
      });
      const missingFunctionDeclarators = /* @__PURE__ */ new Set();
      scopeTracker = new ScopeTracker();
      walk(ast, {
        enter(_node) {
          if (_node.type === "BlockStatement") {
            scopeTracker.enterScope();
          }
          if (_node.type !== "CallExpression" || _node.callee.type !== "Identifier") {
            return;
          }
          const node = _node;
          const name = "name" in node.callee && node.callee.name;
          if (!name || !TRANSLATION_FUNCTIONS.includes(name)) {
            return;
          }
          if (varCollector.hasVar(scopeTracker.curScopeKey, name)) {
            return;
          }
          missingFunctionDeclarators.add(name);
        },
        leave(_node) {
          if (_node.type === "BlockStatement") {
            scopeTracker.leaveScope();
          }
        }
      });
      const s = new MagicString(code);
      if (missingFunctionDeclarators.size > 0) {
        debug$5(`injecting ${Array.from(missingFunctionDeclarators).join(", ")} declaration to ${id}`);
        const assignments = [];
        for (const missing of missingFunctionDeclarators) {
          assignments.push(TRANSLATION_FUNCTIONS_MAP[missing]);
        }
        s.overwrite(
          scriptSetup.loc.start.offset,
          scriptSetup.loc.end.offset,
          `
const { ${assignments.join(", ")} } = useI18n()
` + scriptSetup.content
        );
      }
      if (s.hasChanged()) {
        debug$5("transformed: id -> ", id);
        debug$5("transformed: code -> ", s.toString());
        return {
          code: s.toString(),
          map: options.sourcemap ? s.generateMap({ hires: true }) : void 0
        };
      }
    }
  };
});
const SFC_SCRIPT_RE = /<script\s*[^>]*>([\s\S]*?)<\/script\s*[^>]*>/i;
function extractScriptContent(html) {
  const match = html.match(SFC_SCRIPT_RE);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}
class ScopeTracker {
  // the top of the stack is not a part of current key, it is used for next level
  scopeIndexStack;
  curScopeKey;
  constructor() {
    this.scopeIndexStack = [0];
    this.curScopeKey = "";
  }
  getKey() {
    return this.scopeIndexStack.slice(0, -1).join("-");
  }
  enterScope() {
    this.scopeIndexStack.push(0);
    this.curScopeKey = this.getKey();
  }
  leaveScope() {
    this.scopeIndexStack.pop();
    this.curScopeKey = this.getKey();
    this.scopeIndexStack[this.scopeIndexStack.length - 1]++;
  }
}
class ScopedVarsCollector {
  curScopeKey;
  all;
  constructor() {
    this.all = /* @__PURE__ */ new Map();
    this.curScopeKey = "";
  }
  refresh(scopeKey) {
    this.curScopeKey = scopeKey;
  }
  addVar(name) {
    let vars = this.all.get(this.curScopeKey);
    if (!vars) {
      vars = /* @__PURE__ */ new Set();
      this.all.set(this.curScopeKey, vars);
    }
    vars.add(name);
  }
  hasVar(scopeKey, name) {
    const indices = scopeKey.split("-").map(Number);
    for (let i = indices.length; i >= 0; i--) {
      if (this.all.get(indices.slice(0, i).join("-"))?.has(name)) {
        return true;
      }
    }
    return false;
  }
  collect(n) {
    const t = n.type;
    if (t === "Identifier") {
      this.addVar(n.name);
    } else if (t === "RestElement") {
      this.collect(n.argument);
    } else if (t === "AssignmentPattern") {
      this.collect(n.left);
    } else if (t === "ArrayPattern") {
      n.elements.forEach((e) => e && this.collect(e));
    } else if (t === "ObjectPattern") {
      n.properties.forEach((p) => {
        if (p.type === "RestElement") {
          this.collect(p);
        } else {
          this.collect(p.value);
        }
      });
    }
  }
}

const debug$4 = createDebug("@nuxtjs/i18n:bundler");
async function extendBundler({ options: nuxtOptions }, nuxt) {
  const langPaths = getLayerLangPaths(nuxt);
  debug$4("langPaths -", langPaths);
  const i18nModulePaths = nuxtOptions?.i18nModules?.map((module) => resolve(nuxt.options._layers[0].config.rootDir, module.langDir ?? "")) ?? [];
  debug$4("i18nModulePaths -", i18nModulePaths);
  const localePaths = [...langPaths, ...i18nModulePaths];
  const localeIncludePaths = localePaths.length ? localePaths.map((x) => resolve(x, "./**")) : void 0;
  const sourceMapOptions = {
    sourcemap: !!nuxt.options.sourcemap.server || !!nuxt.options.sourcemap.client
  };
  try {
    const webpack = await import('webpack').then((m) => m.default || m);
    const webpackPluginOptions = {
      allowDynamic: true,
      runtimeOnly: nuxtOptions.bundle.runtimeOnly,
      compositionOnly: nuxtOptions.bundle.compositionOnly,
      onlyLocales: nuxtOptions.bundle.onlyLocales,
      dropMessageCompiler: nuxtOptions.bundle.dropMessageCompiler,
      optimizeTranslationDirective: true,
      strictMessage: nuxtOptions.compilation.strictMessage,
      escapeHtml: nuxtOptions.compilation.escapeHtml,
      include: localeIncludePaths
    };
    addWebpackPlugin(VueI18nWebpackPlugin(webpackPluginOptions));
    addWebpackPlugin(TransformMacroPlugin.webpack(sourceMapOptions));
    addWebpackPlugin(ResourcePlugin.webpack(sourceMapOptions));
    if (nuxtOptions.experimental.autoImportTranslationFunctions) {
      addWebpackPlugin(TransformI18nFunctionPlugin.webpack(sourceMapOptions));
    }
    addWebpackPlugin(
      new webpack.DefinePlugin({
        ...getFeatureFlags(nuxtOptions.bundle),
        __DEBUG__: String(!!nuxtOptions.debug)
      })
    );
  } catch (e) {
    debug$4(e.message);
  }
  const vitePluginOptions = {
    allowDynamic: true,
    runtimeOnly: nuxtOptions.bundle.runtimeOnly,
    compositionOnly: nuxtOptions.bundle.compositionOnly,
    fullInstall: nuxtOptions.bundle.fullInstall,
    onlyLocales: nuxtOptions.bundle.onlyLocales,
    dropMessageCompiler: nuxtOptions.bundle.dropMessageCompiler,
    optimizeTranslationDirective: true,
    strictMessage: nuxtOptions.compilation.strictMessage,
    escapeHtml: nuxtOptions.compilation.escapeHtml,
    defaultSFCLang: nuxtOptions.customBlocks.defaultSFCLang,
    globalSFCScope: nuxtOptions.customBlocks.globalSFCScope,
    include: localeIncludePaths
  };
  addVitePlugin(VueI18nVitePlugin(vitePluginOptions));
  addVitePlugin(TransformMacroPlugin.vite(sourceMapOptions));
  addVitePlugin(ResourcePlugin.vite(sourceMapOptions));
  if (nuxtOptions.experimental.autoImportTranslationFunctions) {
    addVitePlugin(TransformI18nFunctionPlugin.vite(sourceMapOptions));
  }
  extendViteConfig((config) => {
    config.define ??= {};
    config.define["__DEBUG__"] = JSON.stringify(!!nuxtOptions.debug);
    debug$4("vite.config.define", config.define);
  });
}
function getFeatureFlags({ compositionOnly = true, fullInstall = true, dropMessageCompiler = false }) {
  return {
    __VUE_I18N_FULL_INSTALL__: String(fullInstall),
    __VUE_I18N_LEGACY_API__: String(!compositionOnly),
    __INTLIFY_PROD_DEVTOOLS__: "false",
    __INTLIFY_DROP_MESSAGE_COMPILER__: String(dropMessageCompiler)
  };
}

const VIRTUAL_NUXT_I18N_LOGGER = "virtual:nuxt-i18n-logger";
const RESOLVED_VIRTUAL_NUXT_I18N_LOGGER = `\0${VIRTUAL_NUXT_I18N_LOGGER}`;
function i18nVirtualLoggerPlugin(debug) {
  return {
    name: "nuxtjs:i18n-logger",
    enforce: "pre",
    resolveId(id) {
      if (id === VIRTUAL_NUXT_I18N_LOGGER)
        return RESOLVED_VIRTUAL_NUXT_I18N_LOGGER;
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_NUXT_I18N_LOGGER)
        return;
      if (!debug) {
        return `export function createLogger() {}`;
      }
      return `
import { createConsola } from 'consola'

const debugLogger = createConsola({ level: ${debug === "verbose" ? 999 : 4} }).withTag('i18n')

export function createLogger(label) {
  return debugLogger.withTag(label)
}`;
    }
  };
}

const debug$3 = createDebug("@nuxtjs/i18n:nitro");
async function setupNitro({ genTemplate, isSSR, localeInfo, resolver, options: nuxtOptions, isDev }, nuxt) {
  const [enableServerIntegration, localeDetectionPath] = await resolveLocaleDetectorPath(nuxt);
  nuxt.hook("nitro:config", async (nitroConfig) => {
    if (enableServerIntegration || nuxtOptions.experimental.typedOptionsAndMessages && isDev) {
      const additionalParams = {
        optionsCode: genTemplate(true, true),
        localeInfo
      };
      nitroConfig.externals = defu(typeof nitroConfig.externals === "object" ? nitroConfig.externals : {}, {
        inline: [resolver.resolve("./runtime")]
      });
      nitroConfig.rollupConfig = nitroConfig.rollupConfig || {};
      nitroConfig.rollupConfig.plugins = await nitroConfig.rollupConfig.plugins || [];
      nitroConfig.rollupConfig.plugins = Array.isArray(nitroConfig.rollupConfig.plugins) ? nitroConfig.rollupConfig.plugins : [nitroConfig.rollupConfig.plugins];
      nitroConfig.rollupConfig.plugins.push(i18nVirtualLoggerPlugin(nuxtOptions.debug));
      const yamlPaths = getResourcePaths(additionalParams.localeInfo, /\.ya?ml$/);
      if (yamlPaths.length > 0) {
        nitroConfig.rollupConfig.plugins.push(yamlPlugin({ include: yamlPaths }));
      }
      const json5Paths = getResourcePaths(additionalParams.localeInfo, /\.json5?$/);
      if (json5Paths.length > 0) {
        nitroConfig.rollupConfig.plugins.push(json5Plugin({ include: json5Paths }));
      }
      nitroConfig.virtual = nitroConfig.virtual || {};
      nitroConfig.virtual["#internal/i18n/options.mjs"] = () => additionalParams.optionsCode;
      nitroConfig.virtual["#internal/i18n/locale.detector.mjs"] = () => `
import localeDetector from ${JSON.stringify(localeDetectionPath)}
export { localeDetector }
`;
      if (nitroConfig.imports) {
        nitroConfig.imports.presets = nitroConfig.imports.presets || [];
        nitroConfig.imports.presets.push({
          from: H3_PKG,
          imports: ["useTranslation"]
        });
        const h3UtilsExports = await resolveModuleExportNames(UTILS_H3_PKG, { url: import.meta.url });
        nitroConfig.imports.imports = nitroConfig.imports.imports || [];
        nitroConfig.imports.imports.push(
          ...[
            ...h3UtilsExports.map((key) => ({
              name: key,
              as: key,
              from: resolver.resolve(nuxt.options.alias[UTILS_H3_PKG])
            })),
            ...[NUXT_I18N_COMPOSABLE_DEFINE_LOCALE, NUXT_I18N_COMPOSABLE_DEFINE_CONFIG].map((key) => ({
              name: key,
              as: key,
              from: resolver.resolve("runtime/composables/shared")
            })),
            ...[
              {
                name: NUXT_I18N_COMPOSABLE_DEFINE_LOCALE_DETECTOR,
                as: NUXT_I18N_COMPOSABLE_DEFINE_LOCALE_DETECTOR,
                from: resolver.resolve("runtime/composables/server")
              }
            ]
          ]
        );
      }
    }
    nitroConfig.replace = nitroConfig.replace || {};
    if (isSSR) {
      nitroConfig.replace = {
        ...nitroConfig.replace,
        ...getFeatureFlags(nuxtOptions.bundle)
      };
    }
    nitroConfig.replace["__DEBUG__"] = String(!!nuxtOptions.debug);
    debug$3("nitro.replace", nitroConfig.replace);
  });
  if (enableServerIntegration) {
    addServerPlugin(resolver.resolve("runtime/server/plugin"));
  }
}
async function resolveLocaleDetectorPath(nuxt) {
  const serverI18nLayer = nuxt.options._layers.find((l) => {
    const layerI18n = getLayerI18n(l);
    return layerI18n?.experimental?.localeDetector != null && layerI18n?.experimental?.localeDetector !== "";
  });
  let enableServerIntegration = serverI18nLayer != null;
  if (serverI18nLayer != null) {
    const serverI18nLayerConfig = getLayerI18n(serverI18nLayer);
    const i18nDir = resolveI18nDir(serverI18nLayer, serverI18nLayerConfig, true);
    const pathTo = resolve(i18nDir, serverI18nLayerConfig.experimental.localeDetector);
    const localeDetectorPath = await resolvePath(pathTo, {
      cwd: nuxt.options.rootDir,
      extensions: EXECUTABLE_EXTENSIONS
    });
    const hasLocaleDetector = await isExists(localeDetectorPath);
    if (!hasLocaleDetector) {
      const logger = useLogger(NUXT_I18N_MODULE_ID);
      logger.warn(`localeDetector file '${localeDetectorPath}' does not exist. skip server-side integration ...`);
      enableServerIntegration = false;
    }
    return [enableServerIntegration, localeDetectorPath];
  } else {
    return [enableServerIntegration, ""];
  }
}
function getResourcePaths(localeInfo, extPattern) {
  return localeInfo.reduce((acc, locale) => {
    if (locale.meta) {
      const collected = locale.meta.map((meta) => extPattern.test(meta.path) ? meta.path : void 0).filter(Boolean);
      return [...acc, ...collected];
    } else {
      return acc;
    }
  }, []);
}

const debug$2 = createDebug("@nuxtjs/i18n:context");
const resolver = createResolver(import.meta.url);
function createContext(userOptions, nuxt) {
  const options = userOptions;
  return {
    resolver,
    logger: useLogger(NUXT_I18N_MODULE_ID),
    debug: debug$2,
    userOptions,
    options,
    isDev: nuxt.options.dev,
    isSSR: nuxt.options.ssr,
    isPrepare: nuxt.options._prepare,
    isSSG: nuxt.options._generate,
    isBuild: nuxt.options._build,
    isTest: nuxt.options.test,
    genTemplate: void 0,
    normalizedLocales: void 0,
    localeCodes: void 0,
    localeInfo: void 0,
    vueI18nConfigPaths: void 0
  };
}

function prepareOptions({ debug, logger, options }, nuxt) {
  applyOptionOverrides(options, nuxt);
  debug("options", options);
  checkLayerOptions(options, nuxt);
  if (options.bundle.compositionOnly && options.types === "legacy") {
    throw new Error(
      formatMessage(
        `\`bundle.compositionOnly\` option and \`types\` option is conflicting: bundle.compositionOnly: ${options.bundle.compositionOnly}, types: ${JSON.stringify(options.types)}`
      )
    );
  }
  if (options.experimental.autoImportTranslationFunctions && nuxt.options.imports.autoImport === false) {
    logger.warn(
      "Disabling `autoImports` in Nuxt is not compatible with `experimental.autoImportTranslationFunctions`, either enable `autoImports` or disable `experimental.autoImportTranslationFunctions`."
    );
  }
  if (nuxt.options.experimental.scanPageMeta === false) {
    logger.warn(
      "Route localization features (e.g. custom name, prefixed aliases) require Nuxt's `experimental.scanPageMeta` to be enabled.\nThis feature will be enabled in future Nuxt versions (https://github.com/nuxt/nuxt/pull/27134), check out the docs for more details: https://nuxt.com/docs/guide/going-further/experimental-features#scanpagemeta"
    );
  }
}

async function resolveLocaleInfo(ctx, nuxt) {
  const { options, debug } = ctx;
  const normalizedLocales = getNormalizedLocales(options.locales);
  const localeCodes = normalizedLocales.map((locale) => locale.code);
  const localeInfo = await resolveLocales(nuxt.options.srcDir, normalizedLocales, nuxt.options.buildDir);
  debug("localeInfo", localeInfo);
  const vueI18nConfigPaths = await resolveLayerVueI18nConfigInfo(options);
  debug("VueI18nConfigPaths", vueI18nConfigPaths);
  ctx.normalizedLocales = normalizedLocales;
  ctx.localeCodes = localeCodes;
  ctx.localeInfo = localeInfo;
  ctx.vueI18nConfigPaths = vueI18nConfigPaths;
}

function generateTemplateNuxtI18nOptions(options) {
  return `
// @ts-nocheck
${options.importStrings.length > 0 ? options.importStrings.join("\n") + "\n" : ""}

export const localeCodes =  ${JSON.stringify(options.localeCodes, null, 2)}

export const localeLoaders = {
${options.localeLoaders.map(([key, val]) => {
    return `  "${key}": [${val.map(
      (entry) => `{ key: ${entry.key}, load: ${entry.load}, cache: ${entry.cache} }`
    ).join(",\n")}]`;
  }).join(",\n")}
}

export const vueI18nConfigs = [
  ${options.vueI18nConfigs.length > 0 ? options.vueI18nConfigs.join(",\n  ") : ""}
]

export const nuxtI18nOptions = ${JSON.stringify(options.nuxtI18nOptions, null, 2)}

export const normalizedLocales = ${JSON.stringify(options.normalizedLocales, null, 2)}

export const NUXT_I18N_MODULE_ID = "${NUXT_I18N_MODULE_ID}"
export const parallelPlugin = ${options.parallelPlugin}
export const isSSG = ${options.isSSG}

export const DEFAULT_DYNAMIC_PARAMS_KEY = ${JSON.stringify(DEFAULT_DYNAMIC_PARAMS_KEY)}
export const DEFAULT_COOKIE_KEY = ${JSON.stringify(DEFAULT_COOKIE_KEY)}
export const SWITCH_LOCALE_PATH_LINK_IDENTIFIER = ${JSON.stringify(SWITCH_LOCALE_PATH_LINK_IDENTIFIER)}
`;
}

const debug$1 = createDebug("@nuxtjs/i18n:dirs");
const distDir = dirname(fileURLToPath(import.meta.url));
const runtimeDir = fileURLToPath(new URL("./runtime", import.meta.url));
const pkgDir = resolve(distDir, "..");
debug$1("distDir", distDir);
debug$1("runtimeDir", runtimeDir);
debug$1("pkgDir", pkgDir);

const debug = createDebug("@nuxtjs/i18n:gen");
const generateVueI18nConfiguration = (config, isServer = false) => {
  return genDynamicImport(
    genImportSpecifier({ ...config.meta, isServer }, "config"),
    !isServer ? {
      comment: `webpackChunkName: "${config.meta.key}"`
    } : {}
  );
};
function simplifyLocaleOptions(nuxt, options) {
  const isLocaleObjectsArray = (locales2) => locales2?.some((x) => typeof x !== "string");
  const hasLocaleObjects = nuxt.options._layers.some((layer) => isLocaleObjectsArray(getLayerI18n(layer)?.locales)) || options?.i18nModules?.some((module) => isLocaleObjectsArray(module?.locales));
  const locales = options.locales ?? [];
  const pathFormat = options.experimental?.generatedLocaleFilePathFormat ?? "absolute";
  return locales.map(({ meta, ...locale }) => {
    if (!hasLocaleObjects) {
      return locale.code;
    }
    if (locale.file || (locale.files?.length ?? 0) > 0) {
      locale.files = getLocalePaths(locale);
      if (pathFormat === "relative") {
        locale.files = locale.files.map((x) => relative(nuxt.options.rootDir, x));
      }
    } else {
      delete locale.files;
    }
    delete locale.file;
    return locale;
  });
}
function generateLoaderOptions(nuxt, { nuxtI18nOptions, vueI18nConfigPaths, localeInfo, isServer, normalizedLocales }) {
  debug("generateLoaderOptions: lazy", nuxtI18nOptions.lazy);
  const importMapper = /* @__PURE__ */ new Map();
  const importStrings = [];
  function generateLocaleImports(locale, meta, isServer2 = false) {
    if (importMapper.has(meta.key))
      return;
    const importSpecifier = genImportSpecifier({ ...meta, isServer: isServer2 }, "locale", { locale });
    const importer = { code: locale, key: meta.loadPath, load: "", cache: meta.file.cache ?? true };
    if (nuxtI18nOptions.lazy) {
      importer.load = genDynamicImport(importSpecifier, !isServer2 ? { comment: `webpackChunkName: "${meta.key}"` } : {});
    } else {
      importStrings.push(genImport(importSpecifier, meta.key));
      importer.load = `() => Promise.resolve(${meta.key})`;
    }
    importMapper.set(meta.key, {
      key: toCode(importer?.key),
      load: importer?.load,
      cache: toCode(importer?.cache)
    });
  }
  for (const locale of localeInfo) {
    locale?.meta?.forEach((meta) => generateLocaleImports(locale.code, meta, isServer));
  }
  const vueI18nConfigImports = [...vueI18nConfigPaths].reverse().filter((config) => config.absolute !== "").map((config) => generateVueI18nConfiguration(config, isServer));
  const localeLoaders = localeInfo.map((locale) => [locale.code, locale.meta?.map((meta) => importMapper.get(meta.key))]);
  const pathFormat = nuxtI18nOptions.experimental?.generatedLocaleFilePathFormat ?? "absolute";
  const generatedNuxtI18nOptions = {
    ...nuxtI18nOptions,
    locales: simplifyLocaleOptions(nuxt, nuxtI18nOptions),
    i18nModules: nuxtI18nOptions.i18nModules?.map((x) => {
      if (pathFormat === "absolute")
        return x;
      if (x.langDir == null)
        return x;
      return {
        ...x,
        langDir: relative(nuxt.options.rootDir, x.langDir)
      };
    }) ?? []
  };
  delete nuxtI18nOptions.vueI18n;
  const processedNormalizedLocales = normalizedLocales.map((x) => {
    if (pathFormat === "absolute")
      return x;
    if (x.files == null)
      return x;
    return {
      ...x,
      files: x.files.map((f) => {
        if (typeof f === "string")
          return relative(nuxt.options.rootDir, f);
        return {
          ...f,
          path: relative(nuxt.options.rootDir, f.path)
        };
      })
    };
  });
  const generated = {
    importStrings,
    localeLoaders,
    nuxtI18nOptions: generatedNuxtI18nOptions,
    vueI18nConfigs: vueI18nConfigImports,
    normalizedLocales: processedNormalizedLocales
  };
  debug("generate code", generated);
  return generated;
}
function genImportSpecifier({
  loadPath,
  path,
  parsed,
  hash,
  type,
  isServer
}, resourceType, query = {}) {
  const getLoadPath = () => !isServer ? loadPath : path;
  if (!EXECUTABLE_EXTENSIONS.includes(parsed.ext)) {
    return getLoadPath();
  }
  if (resourceType != null && type === "unknown") {
    throw new Error(`'unknown' type in '${path}'.`);
  }
  if (resourceType === "locale") {
    return !isServer ? withQuery(getLoadPath(), type === "dynamic" ? { hash, ...query } : {}) : getLoadPath();
  }
  if (resourceType === "config") {
    return !isServer ? withQuery(getLoadPath(), { hash, ...query, ...{ config: 1 } }) : getLoadPath();
  }
  return getLoadPath();
}
const typedRouterAugmentations = `
declare module 'vue-router' {
  import type { RouteNamedMapI18n } from 'vue-router/auto-routes'

  export interface TypesConfig {
    RouteNamedMapI18n: RouteNamedMapI18n
  }

  export type RouteMapI18n =
    TypesConfig extends Record<'RouteNamedMapI18n', infer RouteNamedMap> ? RouteNamedMap : RouteMapGeneric
    
  // Prefer named resolution for i18n
  export type RouteLocationNamedI18n<Name extends keyof RouteMapI18n = keyof RouteMapI18n> =
      | Name
      | Omit<RouteLocationAsRelativeI18n, 'path'> & { path?: string }
      /**
       * Note: disabled route path string autocompletion, this can break depending on \`strategy\`
       * this can be enabled again after route resolve has been improved.
      */
      // | RouteLocationAsStringI18n
      // | RouteLocationAsPathI18n

  export type RouteLocationRawI18n<Name extends keyof RouteMapI18n = keyof RouteMapI18n> =
    RouteMapGeneric extends RouteMapI18n
      ? RouteLocationAsStringI18n | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric
      :
          | _LiteralUnion<RouteLocationAsStringTypedList<RouteMapI18n>[Name], string>
          | RouteLocationAsRelativeTypedList<RouteMapI18n>[Name]

  export type RouteLocationResolvedI18n<Name extends keyof RouteMapI18n = keyof RouteMapI18n> =
    RouteMapGeneric extends RouteMapI18n
      ? RouteLocationResolvedGeneric
      : RouteLocationResolvedTypedList<RouteMapI18n>[Name]

  export interface RouteLocationNormalizedLoadedTypedI18n<
    RouteMapI18n extends RouteMapGeneric = RouteMapGeneric,
    Name extends keyof RouteMapI18n = keyof RouteMapI18n
  > extends RouteLocationNormalizedLoadedGeneric {
    name: Extract<Name, string | symbol>
    params: RouteMapI18n[Name]['params']
  }
  export type RouteLocationNormalizedLoadedTypedListI18n<RouteMapOriginal extends RouteMapGeneric = RouteMapGeneric> = {
    [N in keyof RouteMapOriginal]: RouteLocationNormalizedLoadedTypedI18n<RouteMapOriginal, N>
  }
  export type RouteLocationNormalizedLoadedI18n<Name extends keyof RouteMapI18n = keyof RouteMapI18n> =
    RouteMapGeneric extends RouteMapI18n
      ? RouteLocationNormalizedLoadedGeneric
      : RouteLocationNormalizedLoadedTypedListI18n<RouteMapI18n>[Name]

  type _LiteralUnion<LiteralType, BaseType extends string = string> = LiteralType | (BaseType & Record<never, never>)

  export type RouteLocationAsStringI18n<Name extends keyof RouteMapI18n = keyof RouteMapI18n> =
    RouteMapGeneric extends RouteMapI18n
      ? string
      : _LiteralUnion<RouteLocationAsStringTypedList<RouteMapI18n>[Name], string>

  export type RouteLocationAsRelativeI18n<Name extends keyof RouteMapI18n = keyof RouteMapI18n> =
    RouteMapGeneric extends RouteMapI18n
      ? RouteLocationAsRelativeGeneric
      : RouteLocationAsRelativeTypedList<RouteMapI18n>[Name]

  export type RouteLocationAsPathI18n<Name extends keyof RouteMapI18n = keyof RouteMapI18n> =
    RouteMapGeneric extends RouteMapI18n ? RouteLocationAsPathGeneric : RouteLocationAsPathTypedList<RouteMapI18n>[Name]

  /**
   * Helper to generate a type safe version of the {@link RouteLocationAsRelative} type.
   */
  export interface RouteLocationAsRelativeTypedI18n<
    RouteMapI18n extends RouteMapGeneric = RouteMapGeneric,
    Name extends keyof RouteMapI18n = keyof RouteMapI18n
  > extends RouteLocationAsRelativeGeneric {
    name?: Extract<Name, string | symbol>
    params?: RouteMapI18n[Name]['paramsRaw']
  }
}`;
function generateI18nTypes(nuxt, options) {
  const vueI18nTypes = options.types === "legacy" ? ["VueI18n"] : ["ExportedGlobalComposer", "Composer"];
  const generatedLocales = simplifyLocaleOptions(nuxt, options);
  const resolvedLocaleType = typeof generatedLocales === "string" ? "Locale[]" : "LocaleObject[]";
  const localeCodeStrings = getNormalizedLocales(options.locales).map((x) => JSON.stringify(x.code));
  const narrowedLocaleType = localeCodeStrings.join(" | ") || "string";
  const i18nType = `${vueI18nTypes.join(" & ")} & NuxtI18nRoutingCustomProperties<${resolvedLocaleType}>`;
  const globalTranslationTypes = `
declare global {
  var $t: (${i18nType})['t']
  var $rt: (${i18nType})['rt']
  var $n: (${i18nType})['n']
  var $d: (${i18nType})['d']
  var $tm: (${i18nType})['tm']
  var $te: (${i18nType})['te']
}`;
  return `// Generated by @nuxtjs/i18n
import type { ${vueI18nTypes.join(", ")} } from 'vue-i18n'
import type { NuxtI18nRoutingCustomProperties, ComposerCustomProperties } from '${relative(
    join$1(nuxt.options.buildDir, "types"),
    resolve(runtimeDir, "types.ts")
  )}'
import type { Strategies, Directions, LocaleObject } from '${relative(
    join$1(nuxt.options.buildDir, "types"),
    resolve(distDir, "types.d.ts")
  )}'

declare module 'vue-i18n' {
  interface ComposerCustom extends ComposerCustomProperties<${resolvedLocaleType}> {}
  interface ExportedGlobalComposer extends NuxtI18nRoutingCustomProperties<${resolvedLocaleType}> {}
  interface VueI18n extends NuxtI18nRoutingCustomProperties<${resolvedLocaleType}> {}
}

declare module '@intlify/core-base' {
  // generated based on configured locales
  interface GeneratedTypeConfig { 
    locale: ${narrowedLocaleType}
  }
}


declare module '#app' {
  interface NuxtApp {
    $i18n: ${i18nType}
  }
}

${typedRouterAugmentations}

${options.experimental?.autoImportTranslationFunctions && globalTranslationTypes || ""}

export {}`;
}

function prepareRuntime(ctx, nuxt) {
  const { isDev: dev, isSSG, localeCodes, localeInfo, normalizedLocales, options, resolver, vueI18nConfigPaths } = ctx;
  addPlugin(resolver.resolve("./runtime/plugins/i18n"));
  addPlugin(resolver.resolve("./runtime/plugins/switch-locale-path-ssr"));
  nuxt.options.alias["#i18n"] = resolver.resolve("./runtime/composables/index");
  nuxt.options.alias["#internal-i18n-types"] = resolver.resolve("./types");
  nuxt.options.build.transpile.push("#i18n");
  nuxt.options.build.transpile.push("#internal-i18n-types");
  nuxt.options.build.transpile.push(VIRTUAL_NUXT_I18N_LOGGER);
  const genTemplate = (isServer, lazy) => {
    const nuxtI18nOptions = defu({}, options);
    if (lazy != null) {
      nuxtI18nOptions.lazy = lazy;
    }
    return generateTemplateNuxtI18nOptions({
      ...generateLoaderOptions(nuxt, {
        vueI18nConfigPaths,
        localeInfo,
        nuxtI18nOptions,
        isServer,
        normalizedLocales
      }),
      localeCodes,
      dev,
      isSSG,
      parallelPlugin: options.parallelPlugin
    });
  };
  ctx.genTemplate = genTemplate;
  nuxt.options.runtimeConfig.public.i18n.locales = simplifyLocaleOptions(nuxt, defu({}, options));
  addTemplate({
    filename: NUXT_I18N_TEMPLATE_OPTIONS_KEY,
    write: true,
    getContents: () => genTemplate(false)
  });
  nuxt.options.imports.transform ??= {};
  nuxt.options.imports.transform.include ??= [];
  nuxt.options.imports.transform.include.push(new RegExp(`${RESOLVED_VIRTUAL_NUXT_I18N_LOGGER}$`));
  nuxt.hook("vite:extendConfig", (cfg) => {
    cfg.plugins ||= [];
    cfg.plugins.push(i18nVirtualLoggerPlugin(options.debug));
  });
  addTypeTemplate({
    filename: "types/i18n-plugin.d.ts",
    getContents: () => generateI18nTypes(nuxt, ctx.userOptions)
  });
}

function prepareRuntimeConfig({ options }, nuxt) {
  nuxt.options.runtimeConfig.public.i18n = defu(nuxt.options.runtimeConfig.public.i18n, {
    baseUrl: options.baseUrl,
    defaultLocale: options.defaultLocale,
    defaultDirection: options.defaultDirection,
    strategy: options.strategy,
    lazy: options.lazy,
    rootRedirect: options.rootRedirect,
    routesNameSeparator: options.routesNameSeparator,
    defaultLocaleRouteNameSuffix: options.defaultLocaleRouteNameSuffix,
    skipSettingLocaleOnNavigate: options.skipSettingLocaleOnNavigate,
    differentDomains: options.differentDomains,
    trailingSlash: options.trailingSlash,
    locales: options.locales,
    detectBrowserLanguage: options.detectBrowserLanguage ?? DEFAULT_OPTIONS.detectBrowserLanguage,
    experimental: options.experimental,
    multiDomainLocales: options.multiDomainLocales
    // TODO: we should support more i18n module options. welcome PRs :-)
  });
}

async function prepareAutoImports({ debug }, nuxt) {
  const vueI18nPath = nuxt.options.alias[VUE_I18N_PKG];
  debug("vueI18nPath for auto-import", vueI18nPath);
  await Promise.all([
    addComponent({
      name: "NuxtLinkLocale",
      filePath: resolve(runtimeDir, "components/NuxtLinkLocale")
    }),
    addComponent({
      name: "SwitchLocalePathLink",
      filePath: resolve(runtimeDir, "components/SwitchLocalePathLink")
    })
  ]);
  addImports([
    { name: "useI18n", from: vueI18nPath },
    ...[
      "useRouteBaseName",
      "useLocalePath",
      "useLocaleRoute",
      "useSwitchLocalePath",
      "useLocaleHead",
      "useBrowserLocale",
      "useCookieLocale",
      "useSetI18nParams",
      NUXT_I18N_COMPOSABLE_DEFINE_ROUTE,
      NUXT_I18N_COMPOSABLE_DEFINE_LOCALE,
      NUXT_I18N_COMPOSABLE_DEFINE_CONFIG
    ].map((key) => ({
      name: key,
      as: key,
      from: resolve(runtimeDir, "composables/index")
    }))
  ]);
}

function prepareBuildManifest({ options, localeInfo }, nuxt) {
  nuxt.hook("build:manifest", (manifest) => {
    if (options.lazy) {
      const langFiles = localeInfo.flatMap((locale) => getLocaleFiles(locale)).map((x) => relative(nuxt.options.srcDir, x.path));
      const langPaths = [...new Set(langFiles)];
      for (const key in manifest) {
        if (langPaths.some((x) => key.startsWith(x))) {
          manifest[key].prefetch = false;
          manifest[key].preload = false;
        }
      }
    }
  });
}

function prepareStrategy({ options, isSSG, normalizedLocales }, nuxt) {
  if (options.strategy === "prefix" && isSSG) {
    const localizedEntryPages = normalizedLocales.map((x) => ["/", x.code].join(""));
    nuxt.hook("nitro:config", (config) => {
      config.prerender ??= {};
      config.prerender.ignore ??= [];
      config.prerender.ignore.push(/^\/$/);
      config.prerender.routes ??= [];
      config.prerender.routes.push(...localizedEntryPages);
    });
  }
}

async function prepareLayers({ options }, nuxt) {
  applyLayerOptions(options, nuxt);
  await mergeI18nModules(options, nuxt);
  filterLocales(options, nuxt);
}

function prepareTranspile(nuxt) {
  nuxt.options.build.transpile.push("@nuxtjs/i18n");
  nuxt.options.build.transpile.push("@nuxtjs/i18n-edge");
}

function prepareVite(nuxt) {
  nuxt.options.vite.optimizeDeps = nuxt.options.vite.optimizeDeps || {};
  nuxt.options.vite.optimizeDeps.exclude = nuxt.options.vite.optimizeDeps.exclude || [];
  nuxt.options.vite.optimizeDeps.exclude.push("vue-i18n");
}

function generateInterface(obj, indentLevel = 1) {
  const indent = "  ".repeat(indentLevel);
  let str = "";
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key))
      continue;
    if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
      str += `${indent}"${key}": {
`;
      str += generateInterface(obj[key], indentLevel + 1);
      str += `${indent}};
`;
    } else {
      let propertyType = Array.isArray(obj[key]) ? "unknown[]" : typeof obj[key];
      if (propertyType === "function") {
        propertyType = "() => string";
      }
      str += `${indent}"${key}": ${propertyType};
`;
    }
  }
  return str;
}
const MERGED_OPTIONS_ENDPOINT = "__nuxt_i18n/merged";
function prepareTypeGeneration({ resolver, options, localeInfo, vueI18nConfigPaths, isDev }, nuxt) {
  if (options.experimental.typedOptionsAndMessages === false || !isDev)
    return;
  addServerHandler({
    route: "/" + MERGED_OPTIONS_ENDPOINT,
    // @ts-ignore
    handler: resolver.resolve("./runtime/server/api/merged-options.get")
  });
  let res;
  const fetchMergedOptions = () => fetch(nuxt.options.devServer.url + MERGED_OPTIONS_ENDPOINT, { cache: "no-cache" });
  nuxt.hooks.hookOnce("vite:serverCreated", () => {
    const afterEachFn = useNitro().hooks.afterEach(async (e) => {
      if (e.name === "dev:reload") {
        try {
          res = await (await fetchMergedOptions()).json();
          await updateTemplates({ filter: (template) => template.filename === "types/i18n-messages.d.ts" });
          afterEachFn();
        } catch {
        }
      }
    });
  });
  addTypeTemplate({
    filename: "types/i18n-messages.d.ts",
    getContents: () => {
      if (res == null)
        return "";
      return `// generated by @nuxtjs/i18n
import type { DateTimeFormatOptions, NumberFormatOptions, SpecificNumberFormatOptions, CurrencyNumberFormatOptions } from '@intlify/core'

interface GeneratedLocaleMessage {
  ${generateInterface(res.messages || {}).trim()}
}

interface GeneratedDateTimeFormat {
  ${Object.keys(res.datetimeFormats || {}).map((k) => `${k}: DateTimeFormatOptions;`).join(`
  `)}
}

interface GeneratedNumberFormat {
  ${Object.entries(res.numberFormats || {}).map(([k]) => `${k}: NumberFormatOptions;`).join(`
  `)}
}

declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends GeneratedLocaleMessage {}
  export interface DefineDateTimeFormat extends GeneratedDateTimeFormat {}
  export interface DefineNumberFormat extends GeneratedNumberFormat {}
}

declare module '@intlify/core' {
  export interface DefineCoreLocaleMessage extends GeneratedLocaleMessage {}
}

export {}`;
    }
  });
  if (nuxt.options.future?.compatibilityVersion === 4 || options.restructureDir === false) {
    const watcher = watch(
      localeInfo.flatMap((x) => x.files.map((f) => resolve(nuxt.options.srcDir, f.path))),
      {
        awaitWriteFinish: true,
        ignoreInitial: true,
        ignored: [isIgnored, "node_modules"]
      }
    );
    watcher.on("all", (event, path) => nuxt.callHook("builder:watch", event, normalize(path)));
    nuxt.hook("close", () => watcher?.close());
  }
  const localePaths = localeInfo.flatMap((x) => x.files.map((f) => relative(nuxt.options.srcDir, f.path)));
  nuxt.hook("builder:watch", async (_, path) => {
    path = relative(nuxt.options.srcDir, resolve(nuxt.options.srcDir, path));
    if (!localePaths.includes(path) && !vueI18nConfigPaths.some((x) => x.absolute.includes(path)))
      return;
    res = await (await fetchMergedOptions()).json();
    await updateTemplates({ filter: (template) => template.filename === "types/i18n-messages.d.ts" });
  });
}

const module = defineNuxtModule({
  meta: {
    name: NUXT_I18N_MODULE_ID,
    configKey: "i18n",
    compatibility: {
      nuxt: ">=3.0.0-rc.11",
      bridge: false
    }
  },
  defaults: DEFAULT_OPTIONS,
  async setup(i18nOptions, nuxt) {
    const ctx = createContext(i18nOptions, nuxt);
    prepareOptions(ctx, nuxt);
    await prepareLayers(ctx, nuxt);
    prepareRuntimeConfig(ctx, nuxt);
    await resolveLocaleInfo(ctx, nuxt);
    await setupPages(ctx, nuxt);
    prepareStrategy(ctx, nuxt);
    await setupAlias(ctx, nuxt);
    prepareRuntime(ctx, nuxt);
    prepareTypeGeneration(ctx, nuxt);
    prepareBuildManifest(ctx, nuxt);
    await extendBundler(ctx, nuxt);
    await setupNitro(ctx, nuxt);
    await prepareAutoImports(ctx, nuxt);
    prepareTranspile(nuxt);
    prepareVite(nuxt);
  }
});

export { module as default };
