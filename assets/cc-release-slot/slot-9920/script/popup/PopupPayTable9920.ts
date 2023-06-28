
import { _decorator } from 'cc';
import { ExtAudioManager } from '../../../../ext-framework/ExtAudioManager';
import ExtBaseScreen from '../../../../ext-framework/ui/ExtBaseScreen';
import ExtScreenManager from '../../../../ext-framework/ui/ExtScreenManager';
const { ccclass, property } = _decorator;


@ccclass('PopupPayTable9920')
export class PopupPayTable9920 extends ExtBaseScreen {

    onClickBtnBack() {
        //play music
        ExtAudioManager.instance.playEffect("sfx_click_btn");
        ExtScreenManager.instance.popScreen();
    }

}
