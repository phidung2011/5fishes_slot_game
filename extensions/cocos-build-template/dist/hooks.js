"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unload = exports.onAfterBuild = exports.onAfterCompressSettings = exports.onBeforeCompressSettings = exports.onBeforeBuild = exports.load = exports.throwError = void 0;
const fs_1 = __importDefault(require("fs"));
const PACKAGE_NAME = 'cocos-build-template';
function log(...arg) {
    return console.log(`[${PACKAGE_NAME}] `, ...arg);
}
let allAssets = [];
exports.throwError = true;
function load() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`[${PACKAGE_NAME}] Load cocos plugin example in builder.`);
        allAssets = yield Editor.Message.request('asset-db', 'query-assets');
    });
}
exports.load = load;
function onBeforeBuild(options) {
    return __awaiter(this, void 0, void 0, function* () {
        // Todo some thing
        log(`${PACKAGE_NAME}.webTestOption`, 'onBeforeBuild');
    });
}
exports.onBeforeBuild = onBeforeBuild;
function onBeforeCompressSettings(options, result) {
    return __awaiter(this, void 0, void 0, function* () {
        const pkgOptions = options.packages[PACKAGE_NAME];
        if (pkgOptions.webTestOption) {
            console.debug('webTestOption', true);
        }
        // Todo some thing
        console.debug('get settings test', result.settings);
        // console.log('onBeforeCompressSettings::');
        // console.log('aaaaaa  result.paths: ', JSON.stringify(result.paths));
        // console.log('aaaaaa  result.settings: ', JSON.stringify(result.settings));
    });
}
exports.onBeforeCompressSettings = onBeforeCompressSettings;
function onAfterCompressSettings(options, result) {
    return __awaiter(this, void 0, void 0, function* () {
        // Todo some thing
        // console.log('onAfterCompressSettings::');
        // console.log('bababa  result.paths: ', JSON.stringify(result.paths));
        // console.log('bababa  result.settings: ', JSON.stringify(result.settings));
    });
}
exports.onAfterCompressSettings = onAfterCompressSettings;
function onAfterBuild(options, result) {
    return __awaiter(this, void 0, void 0, function* () {
        // change the uuid to test
        console.log('onAfterBuild::');
        // let appJS = fs.readFileSync(result.paths.applicationJS).toString();
        // console.log('kakaka  result.paths: ', JSON.stringify(result.paths));
        // console.log('kakaka  result.settings: ', JSON.stringify(result.settings));
        // // console.log('kakaka  options: ', JSON.stringify(options));
        // appJS = appJS.replace('cc.view.resizeWithBrowserSize(true);',
        //     '   cc.view.resizeWithBrowserSize(true);\n' +
        //     '   cc.sys.isMobile ? cc.view._maxPixelRatio = 1.9 : cc.view._maxPixelRatio = 1.3;\n' +
        //     `    const initLoader = document.getElementById('initial-loader');
        //         initLoader && initLoader.parentElement && initLoader.parentElement.removeChild(initLoader);
        //     `);
        let appJSTemplate = `${result.paths.dir}/application.js`;
        try {
            if (fs_1.default.existsSync(appJSTemplate)) {
                let appJS = fs_1.default.readFileSync(appJSTemplate).toString();
                let settingsFilename = result.paths.settings.substring(result.paths.settings.lastIndexOf('/') + 1);
                appJS = appJS.replace('src/settings.json', `src/${settingsFilename}`);
                fs_1.default.writeFileSync(result.paths.applicationJS, appJS);
            }
        }
        catch (err) {
        }
        // const uuidTestMap = {
        //     image: '57520716-48c8-4a19-8acf-41c9f8777fb0',
        // }
        // for (const name of Object.keys(uuidTestMap)) {
        //     const uuid = uuidTestMap[name];
        //     console.debug(`containsAsset of ${name}`, result.containsAsset(uuid));
        //     console.debug(`getAssetPathInfo of ${name}`, result.getAssetPathInfo(uuid));
        //     console.debug(`getRawAssetPaths of ${name}`, result.getRawAssetPaths(uuid));
        //     console.debug(`getJsonPathInfo of ${name}`, result.getJsonPathInfo(uuid));
        // }
    });
}
exports.onAfterBuild = onAfterBuild;
function unload() {
    console.log(`[${PACKAGE_NAME}] Unload cocos plugin example in builder.`);
}
exports.unload = unload;
