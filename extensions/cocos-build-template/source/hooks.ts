import { IBuildTaskOption } from '../@types';
import { IBuildResult } from '../@types';
import fs from 'fs';

interface IOptions {
    commonTest1: number;
    commonTest2: 'opt1' | 'opt2';
    webTestOption: boolean;
}

const PACKAGE_NAME = 'cocos-build-template';

interface ITaskOptions extends IBuildTaskOption {
    packages: {
        'cocos-plugin-template': IOptions;
    };
}

function log(...arg: any[]) {
    return console.log(`[${PACKAGE_NAME}] `, ...arg);
}

let allAssets = [];

export const throwError = true;

export async function load() {
    console.log(`[${PACKAGE_NAME}] Load cocos plugin example in builder.`);
    allAssets = await Editor.Message.request('asset-db', 'query-assets');
}

export async function onBeforeBuild(options: ITaskOptions) {
    // Todo some thing
    log(`${PACKAGE_NAME}.webTestOption`, 'onBeforeBuild');
}

export async function onBeforeCompressSettings(options: ITaskOptions, result: IBuildResult) {
    const pkgOptions = options.packages[PACKAGE_NAME];
    if (pkgOptions.webTestOption) {
        console.debug('webTestOption', true);
    }
    // Todo some thing
    console.debug('get settings test', result.settings);
    // console.log('onBeforeCompressSettings::');
    // console.log('aaaaaa  result.paths: ', JSON.stringify(result.paths));
    // console.log('aaaaaa  result.settings: ', JSON.stringify(result.settings));
}

export async function onAfterCompressSettings(options: ITaskOptions, result: IBuildResult) {
    // Todo some thing
    // console.log('onAfterCompressSettings::');
    // console.log('bababa  result.paths: ', JSON.stringify(result.paths));
    // console.log('bababa  result.settings: ', JSON.stringify(result.settings));
}

export async function onAfterBuild(options: ITaskOptions, result: IBuildResult) {
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
        if (fs.existsSync(appJSTemplate)) {
            let appJS = fs.readFileSync(appJSTemplate).toString();
            let settingsFilename = result.paths.settings.substring(result.paths.settings.lastIndexOf('/') + 1);
            appJS = appJS.replace('src/settings.json', `src/${settingsFilename}`);
            fs.writeFileSync(result.paths.applicationJS, appJS);
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
}

export function unload() {
    console.log(`[${PACKAGE_NAME}] Unload cocos plugin example in builder.`);
}
