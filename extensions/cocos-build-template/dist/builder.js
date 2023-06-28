"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = exports.unload = exports.load = void 0;
function load() {
}
exports.load = load;
function unload() {
}
exports.unload = unload;
exports.configs = {
    '*': {
        hooks: './hooks',
        options: {
            remoteAddress: {
                label: 'i18n:cocos-build-template.options.remoteAddress',
                render: {
                    ui: 'ui-input',
                    attributes: {
                        placeholder: 'Enter remote address...',
                    },
                },
                verifyRules: ['require', 'http'],
            },
            enterCocos: {
                label: 'i18n:cocos-build-template.options.enterCocos',
                description: 'i18n:cocos-build-template.options.enterCocos',
                default: '',
                render: {
                    /**
                     * @en Please refer to Developer -> UI Component for a list of all supported UI components
                     * @zh 请参考 开发者 -> UI 组件 查看所有支持的 UI 组件列表
                     */
                    ui: 'ui-input',
                    attributes: {
                        placeholder: 'i18n:cocos-build-template.options.enterCocos',
                    },
                },
                verifyRules: ['ruleTest']
            }
        },
        verifyRuleMap: {
            ruleTest: {
                message: 'i18n:cocos-build-template.ruleTest_msg',
                func(val, option) {
                    if (val === 'cocos') {
                        return true;
                    }
                    return false;
                }
            }
        }
    },
};
