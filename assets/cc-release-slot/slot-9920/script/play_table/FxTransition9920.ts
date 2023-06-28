
import { _decorator, Component, Node, Prefab, sp, log } from 'cc';
import ExtUtils from '../../../../ext-framework/ExtUtils';
import ExtScreenManager from '../../../../ext-framework/ui/ExtScreenManager';
import { ExtAudioManager } from '../../../../ext-framework/ExtAudioManager';
import ExtBaseScreen from '../../../../ext-framework/ui/ExtBaseScreen';
import { Director9920 } from '../core/Director9920';
import { NormalGameScreen9920 } from './NormalGameScreen9920';

const { ccclass, property } = _decorator;

@ccclass('FxTransition9920')
export class FxTransition9920 extends Component {
    @property(Node)
    nodeTransition: Node = null!;

    transition2ChooseWild() {
        ExtAudioManager.instance.playEffect("sfx_water_fall");
        this.scheduleOnce(() => {
            this.go2ChooseWildScreen();
        }, 1.0);

        this.scheduleOnce(() => {
            log('@@@ FxTransition9920 auto destroy');
            this.node.destroy();
        }, 5);
    }

    go2ChooseWildScreen() {
        let choose_wild_screen = ExtScreenManager.instance.assetBundle.get('res/prefabs/choose_wild_screen', Prefab)!;
        ExtScreenManager.instance.pushScreen(choose_wild_screen, (screen: ExtBaseScreen) => { });
        ExtUtils.transitionBackgroundWeb('normal-bg', 'free-bg');
    }

    transition2Normal() {
        let anim = this.nodeTransition?.getComponent(sp.Skeleton);
        anim?.clearTracks();
        anim?.setAnimation(0, "animation", false);
        this.scheduleOnce(() => {
            ExtScreenManager.instance.popToScreen(NormalGameScreen9920, false);
            Director9920.instance.freeGameScreen = null;
            ExtAudioManager.instance.playBGM("bgm_main");
            // this.scheduleOnce(() => {
            Director9920.instance.normalGameScreen!.switchToNormalMode();
            // }, 0.5);
            ExtUtils.transitionBackgroundWeb('free-bg', 'normal-bg');
        }, 1.0);

        this.scheduleOnce(() => {
            log('@@@ FxTransition9920 auto destroy');
            this.node.destroy();
        }, 5);
    }
}