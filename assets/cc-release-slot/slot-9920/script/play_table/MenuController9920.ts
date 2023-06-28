
import { _decorator, Component, Node, Vec3, tween, UIOpacity, SpriteFrame, sys, Layout, Prefab, Sprite } from 'cc';
import { ExtAudioManager } from '../../../../ext-framework/ExtAudioManager';
import ExtLocalDataManager from '../../../../ext-framework/ExtLocalDataManager';
import ExtScreenManager from '../../../../ext-framework/ui/ExtScreenManager';
import { SlotConfig9920 } from '../base_slot/SlotConfig9920';
import { Director9920 } from '../core/Director9920';
import loadConfigAsync from '../../../../cc-common/cc-share/shareServices/loadConfigAsync';
import ExtBaseScreen from '../../../../ext-framework/ui/ExtBaseScreen';
import { log } from 'cc';

const { ccclass, property } = _decorator;


@ccclass('MenuController9920')
export class MenuController9920 extends Component {

    @property(Node)
    guiGamePlayBtns: Node = null!;

    @property(Node)
    guiMenuBtns: Node = null!;

    @property(UIOpacity)
    guiGamePlayOpacity: UIOpacity = null!;

    @property(UIOpacity)
    guiMenuOpacity: UIOpacity = null!;

    @property(Sprite)
    sprActiveSound: Sprite = null!;

    @property(Sprite)
    sprActiveBGM: Sprite = null!;

    @property(Node)
    btnQuit: Node = null!;

    @property(Layout)
    layout: Layout = null;

    posCurrent = new Vec3(0, -260, 0);
    posMove = new Vec3(0, -500, 0);

    activeSound = true;
    activeBGM = true;

    onLoad() {
        if (!(sys.isMobile || (sys.isBrowser && SlotConfig9920.redirectURL != null))) {
            this.btnQuit.active = false;
            this.layout.spacingX = 50;
        }
    }

    onEnable() {
        let music_mute = ExtAudioManager.ENABLE_MUSIC;
        let sfx_mute = ExtAudioManager.ENABLE_MUSIC;

        let appConfig = loadConfigAsync.getConfig();
        if (appConfig.ENABLE_BGM) music_mute = appConfig.ENABLE_BGM;
        if (appConfig.ENABLE_SFX) sfx_mute = appConfig.ENABLE_SFX;

        this.activeBGM = !ExtLocalDataManager.getBoolean(music_mute, false);
        this.activeSound = !ExtLocalDataManager.getBoolean(sfx_mute, false);

        this.updateSpriteBGMBtn();
        this.updateSpriteSoundBtn();
    }

    updateSpriteBGMBtn() {
        if (this.activeBGM) {
            this.sprActiveBGM.spriteFrame = ExtScreenManager.instance.assetBundle.get('res/images/buttons/bt_music_on/spriteFrame', SpriteFrame);
        } else {
            this.sprActiveBGM.spriteFrame = ExtScreenManager.instance.assetBundle.get('res/images/buttons/bt_music_off/spriteFrame', SpriteFrame);
        }
    }

    updateSpriteSoundBtn() {
        if (this.activeSound) {
            this.sprActiveSound.spriteFrame = ExtScreenManager.instance.assetBundle.get('res/images/buttons/bt_sound_on/spriteFrame', SpriteFrame);
        } else {
            this.sprActiveSound.spriteFrame = ExtScreenManager.instance.assetBundle.get('res/images/buttons/bt_sound_off/spriteFrame', SpriteFrame);
        }
    }

    onClickBtnBGM() {
        this.activeBGM = !this.activeBGM;
        log("onClickBtnBGM  " + this.activeBGM);

        let music_mute = ExtAudioManager.ENABLE_MUSIC;

        let appConfig = loadConfigAsync.getConfig();
        if (appConfig.ENABLE_BGM) music_mute = appConfig.ENABLE_BGM;

        ExtLocalDataManager.setBoolean(music_mute, !this.activeBGM);

        ExtAudioManager.instance.isMutingMusic = !this.activeBGM;

        this.updateSpriteBGMBtn();

        ExtAudioManager.instance.playEffect("sfx_custom_bar");
    }

    onClickBtnSound() {
        this.activeSound = !this.activeSound;
        log("onClickBtnSound  " + this.activeSound);

        let sfx_mute = ExtAudioManager.ENABLE_MUSIC;

        let appConfig = loadConfigAsync.getConfig();
        if (appConfig.ENABLE_SFX) sfx_mute = appConfig.ENABLE_SFX;

        ExtLocalDataManager.setBoolean(sfx_mute, !this.activeSound);

        ExtAudioManager.instance.isMutingEffect = !this.activeSound;

        this.updateSpriteSoundBtn();

        ExtAudioManager.instance.playEffect("sfx_custom_bar");
    }

    onClickBtnMenu() {
        log("onClickBtnMenu")
        ExtAudioManager.instance.playEffect("sfx_custom_bar");
        tween(this.guiGamePlayBtns).to(0.2, { position: this.posMove }).call(() => {
            this.guiGamePlayBtns.active = false;
        }).start();
        tween(this.guiGamePlayOpacity).to(0.2, { opacity: 0 }).start();

        this.guiMenuBtns.active = true;
        tween(this.guiMenuBtns).to(0.2, { position: this.posCurrent }).start();
        tween(this.guiMenuOpacity).to(0.2, { opacity: 255 }).start();

        Director9920.instance.normalGameScreen.spinButton.interactable = false;
    }

    onClickBtnClose() {
        ExtAudioManager.instance.playEffect("sfx_custom_bar");
        this.guiGamePlayBtns.active = true;
        tween(this.guiGamePlayBtns).to(0.2, { position: this.posCurrent }).start();
        tween(this.guiGamePlayOpacity).to(0.2, { opacity: 255 }).start();

        tween(this.guiMenuBtns).to(0.2, { position: this.posMove }).call(() => {
            this.guiMenuBtns.active = false;
        }).start();
        tween(this.guiMenuOpacity).to(0.2, { opacity: 0 }).start();
        Director9920.instance.normalGameScreen.spinButton.interactable = true;
    }

    onClickBtnShowPayTable() {
        ExtAudioManager.instance.playEffect("sfx_custom_bar");

        let popup_pay_table = ExtScreenManager.instance.assetBundle.get('res/prefabs/popup/popup_pay_table', Prefab)!;
        ExtScreenManager.instance.pushScreen(popup_pay_table, (screen: ExtBaseScreen) => {});
    }

    onClickBtnQuit() {
        ExtAudioManager.instance.playEffect("sfx_custom_bar");
        Director9920.instance.showPopupExit();
    }

    onClickBtnRule() {
        ExtAudioManager.instance.playEffect("sfx_custom_bar");

        let popup_rule = ExtScreenManager.instance.assetBundle.get('res/prefabs/popup/popup_rule', Prefab)!;
        ExtScreenManager.instance.pushScreen(popup_rule, (screen: ExtBaseScreen) => {});
    }

    onClickBtnHistory() {
        ExtAudioManager.instance.playEffect("sfx_custom_bar");
        let popup_history_bet = ExtScreenManager.instance.assetBundle.get('res/prefabs/popup/history_bet/popup_history_bet', Prefab)!;
        ExtScreenManager.instance.pushScreen(popup_history_bet, (screen: ExtBaseScreen) => {});
    }


}

