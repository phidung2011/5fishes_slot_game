import { _decorator } from 'cc';
import { ExtAudioManager } from '../../../../ext-framework/ExtAudioManager';
import ExtBaseScreen from '../../../../ext-framework/ui/ExtBaseScreen';
import ExtScreenManager from '../../../../ext-framework/ui/ExtScreenManager';
const { ccclass, property } = _decorator;

@ccclass('PopupRule9920')
export class PopupRule9920 extends ExtBaseScreen {

    onClickBtnBack() {
        //play music
        ExtAudioManager.instance.playEffect("sfx_click_btn");
        // ScreenManager.instance.hidePopup(true);
        ExtScreenManager.instance.popScreen();

    }

}
