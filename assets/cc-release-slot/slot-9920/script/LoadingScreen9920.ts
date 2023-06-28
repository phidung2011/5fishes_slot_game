import { _decorator, Component, Node, Prefab, tween, Vec3, Asset, AudioClip, log, setDisplayStats, sys, Tween, sp, Vec2 } from 'cc';
import gameCommonUtils from '../../../cc-common/cc-share/common/gameCommonUtils';
import { ExtAudioManager } from '../../../ext-framework/ExtAudioManager';
import ExtLocalDataManager from '../../../ext-framework/ExtLocalDataManager';
import ExtBaseScreen from '../../../ext-framework/ui/ExtBaseScreen';
import ExtScreenManager from '../../../ext-framework/ui/ExtScreenManager';
import ExtUtils from '../../../ext-framework/ExtUtils';
import loadConfigAsync from '../../../cc-common/cc-share/shareServices/loadConfigAsync';
import { SlotConfig9920 } from './base_slot/SlotConfig9920';
import { Director9920 } from './core/Director9920';
import { RippleController } from './ripple_transition/RippleController';
import { ProgressBarCustom9920 } from './play_table/ProgressBarCustom9920';
import { PopupHistoryDetail9920 } from './popup/history_bet/PopupHistoryDetail9920';
import { NormalGameScreen9920 } from './play_table/NormalGameScreen9920';
// import { PopupHistoryDetail9920 } from './popup/history_bet/PopupHistoryDetail9920';

const { ccclass, property } = _decorator;

@ccclass('LoadingScreen9920')
export class LoadingScreen9920 extends Component {
    @property(Node)
    nodeProgressBar: Node = null!;

    @property(ProgressBarCustom9920)
    progressBar: ProgressBarCustom9920 = null!;

    @property(Node)
    btnPlay: Node = null!;

    @property(Node)
    animFish: Node = null!;

    @property(RippleController)
    rippleTransition: RippleController = null!;

    @property(Node)
    listTooltip: Node[] = [];

    private _audios: { [key: string]: string } = {};
    private _items: string[] = [];
    private _showFPS = false;

    private curTexttipID: number = 0;
    private curTexttipNode: Node = null!;

    onLoad() {
        let soundDirs = [
            'res/sounds/bgm/',
            'res/sounds/sfx/',
        ];

        let imageDirs = [
            'res/images/loadingTemp/',

            'res/images/bgr/',
            'res/images/symbols/',
            'res/images/symbols_blur/',
            'res/images/symbols_small/',
            'res/images/pop_up/',
            'res/images/buttons/',
            'res/images/vi/',
            'res/images/normal_game/',
            'res/images/free_game/'
        ];

        let prefabDirs = [
            'res/vfx/prefabs/',
            'res/prefabs/popup/',
        ];

        let prefabs = [
            'res/prefabs/normal_game_screen',
            'res/prefabs/free_game_screen',
            'res/prefabs/choose_wild_screen',
            'res/prefabs/payline_win',
            'res/prefabs/slot_symbol',
            'res/prefabs/waiting_progress'
        ];

        this._items = this._items
            .concat(soundDirs)
            .concat(imageDirs)
            .concat(prefabDirs)
            .concat(prefabs);

        setDisplayStats(this._showFPS);
    }

    start() {
        this.progressBar.progress = 0;

        let percent = 1.0 / (this._items.length + 1);
        this._loadAsset(0, percent);

        this._randomTextTip();
        this.schedule(this._changeTextTip, 2.5);
    }

    private _randomTextTip() {
        this.curTexttipID = Math.floor(Math.random() * 3);
        this.curTexttipNode = this.listTooltip[this.curTexttipID];
        this.curTexttipNode.active = true;
    }

    private _changeTextTip() {
        if (this.curTexttipID < this.listTooltip.length - 1) {
            this.curTexttipID++;
        } else {
            this.curTexttipID = 0;
        }

        this.curTexttipNode.active = false;
        this.listTooltip[this.curTexttipID].active = true;
        this.curTexttipNode = this.listTooltip[this.curTexttipID];
    }

    private _stopTexttip() {
        this.unschedule(this._changeTextTip);
        this.curTexttipNode.active = false;
    }

    private _loadAsset(index: number, totalPercent: number) {
        if (index >= this._items.length) {
            this.progressBar.progress = 1;
            this._finishedLoading();
            return;
        }
        let path = this._items[index];
        log("_loadAsset  " + path);
        if (this._isDirectory(path)) {
            ExtScreenManager.instance.assetBundle.loadDir(path,
                (finished, total) => {
                    // log(`items #${index}:  ${finished} / ${total} `);
                    this.progressBar.progress = index * totalPercent + finished / total * totalPercent;
                },
                (err, data) => {
                    if (sys.isBrowser && (path.endsWith('/bgm/') || path.endsWith('/sfx/'))) {
                        // log(`AudioClip loaded:${JSON.stringify(this._audios)}`);
                        let assets: Asset[] = data;
                        for (let as of assets) {
                            if (as instanceof AudioClip) {
                                this._audios[`${path}${as.name}`] = `${as._nativeAsset.url}`;
                            }
                        }
                    }
                    if (path.endsWith('/sfx/')) {
                        ExtAudioManager.instance.init(this._audios);
                        let music_mute = ExtAudioManager.ENABLE_MUSIC;
                        let sfx_mute = ExtAudioManager.ENABLE_SFX;

                        let appConfig = loadConfigAsync.getConfig();
                        if (appConfig.ENABLE_BGM) music_mute = appConfig.ENABLE_BGM;
                        if (appConfig.ENABLE_SFX) sfx_mute = appConfig.ENABLE_SFX;

                        let isMuteMusic = ExtLocalDataManager.getBoolean(music_mute, false);
                        let isMuteSfx = ExtLocalDataManager.getBoolean(sfx_mute, false);

                        ExtAudioManager.instance.isMutingEffect = isMuteSfx;
                        ExtAudioManager.instance.isMutingMusic = isMuteMusic;
                        ExtAudioManager.instance.musicVolume = 0.6;
                        ExtAudioManager.instance.playBGM('bgm_loading');
                    }

                    if (!err) {
                        this.scheduleOnce(() => {
                            this._loadAsset(index + 1, totalPercent);
                        }, 0);
                    } else {
                        log("load error  " + err + "    " + path);
                        if (sys.isBrowser) {
                            alert("Không có kết nối, vui lòng thử lại");
                        }
                    }
                });
        }
        else {
            ExtScreenManager.instance.assetBundle.load(path,
                (finished, total) => {
                    // log(`${finished} / ${total} `);
                    this.progressBar.progress = index * totalPercent + finished / total * totalPercent;
                },
                (err, data) => {
                    if (!err) {
                        this.scheduleOnce(() => {
                            this._loadAsset(index + 1, totalPercent);
                        }, 0);
                    }
                    else {
                        log("load error  " + err + "    " + path);
                        if (sys.isBrowser) {
                            alert("Không có kết nối, vui lòng thử lại");
                        }
                    }
                });
        }
    }

    private _finishedLoading() {
        log(`LoadingScreen: _finishedLoading`);
        Director9920.instance.loadingSuccess = true;

        if (sys.isBrowser) {
            let url = gameCommonUtils.getUrlParam("ru");
            SlotConfig9920.redirectURL = url;
            log("redirectUrl   " + url);
        }

        if (this.needAdminLSC()) {
            return;
        }

        Director9920.instance.login(() => {
            log(`login is successful`);
            this.nodeProgressBar.active = false;
            if (sys.isNative) {
                this._go2NormalScreen();
                return;
            }
            this._runActionBtnPlay();
            this.btnPlay.active = true;
            this._stopTexttip();
        });
    }

    private _runActionBtnPlay() {
        tween(this.btnPlay)
            .to(0.75, { scale: new Vec3(0.86, 0.86, 1) })
            .to(0.75, { scale: new Vec3(1, 1, 1) })
            .union()
            .repeatForever()
            .start();
    }

    private _isDirectory(path: string | null): boolean {
        return path != null && typeof path == 'string' && path.length > 0 && path[path.length - 1] == '/';
    }

    onClickBtnPlay() {
        ExtAudioManager.instance.playEffect("sfx_loading_play_click");
        this.btnPlay.active = false;
        Tween.stopAllByTarget(this.btnPlay);

        let koiAnim = this.animFish?.getComponent(sp.Skeleton);
        if (koiAnim) {
            koiAnim.clearTracks();
            let entry = koiAnim.setAnimation(0, 'start4', false);

            koiAnim.setTrackEventListener(entry, (x: any, ev: any) => {
                if (ev && ev.data && ev.data.name && ev.data.name == 'jump') {
                    this._go2NormalScreen();
                }
            });
        }
    }

    private _go2NormalScreen() {
        this.animFish.active = false;
        ExtUtils.transitionBackgroundWeb('launch-bg', 'normal-bg');
        ExtAudioManager.instance.playEffect("sfx_loading2normal");
        this.scheduleOnce(() => {
            ExtScreenManager.instance.showEffect(this.rippleTransition.node);
            let posEff = new Vec2(SlotConfig9920.maxResolution.width / 2, SlotConfig9920.maxResolution.height / 2);
            this.rippleTransition && this.rippleTransition.startEffectFullScreen(posEff);
        }, 0.0);

        this.scheduleOnce(() => {
            let normal_game_screen = ExtScreenManager.instance.assetBundle.get('res/prefabs/normal_game_screen', Prefab)!;
            ExtScreenManager.instance.replaceScreenAtIndex(normal_game_screen, 0, (screen: ExtBaseScreen) => {
                Director9920.instance.normalGameScreen = screen as NormalGameScreen9920;
                Director9920.instance.normalGameScreen.enableLazyActive = true;
                ExtAudioManager.instance.playBGM('bgm_main');
            });
        }, 0.5);
    }

    needAdminLSC() {
        let tokenType = gameCommonUtils.getUrlParam("tokenType");
        let userId = gameCommonUtils.getUrlParam("userId");
        let psId = gameCommonUtils.getUrlParam("psId");
        let history = gameCommonUtils.getUrlParam("history");
        if (tokenType && userId && psId && history) {
            let popup_history_detail = ExtScreenManager.instance.assetBundle.get('res/prefabs/popup/history_bet/popup_history_detail', Prefab)!;
            ExtScreenManager.instance.pushScreen(popup_history_detail, (screen: ExtBaseScreen) => {
                let popupDisplay = screen as PopupHistoryDetail9920;
                popupDisplay._currentSessionId = psId;
                popupDisplay.mode = 1;
                popupDisplay.tokenType = tokenType;
                popupDisplay.userId = userId;
                popupDisplay.getUserSpinSumarry();
            });
            return true;
        }
        return false;
    }

}
