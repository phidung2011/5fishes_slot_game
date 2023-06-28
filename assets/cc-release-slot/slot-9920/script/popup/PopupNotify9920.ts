
import { _decorator, Node, Label, log } from 'cc';
import { ExtAudioManager } from '../../../../ext-framework/ExtAudioManager';
import ExtBasePopup from '../../../../ext-framework/ui/ExtBasePopup';

const { ccclass, property } = _decorator;

@ccclass('PopupNotify9920')
export class PopupNotify9920 extends ExtBasePopup {

    @property(Label)
    contentPopup: Label = null!;

    @property(Node)
    layoutNodeBtn: Node = null;

    @property(Node)
    btnYes: Node = null;

    @property(Node)
    btnNo: Node = null!;

    @property(Node)
    btnConfirm: Node = null!;

    btnYesCallback: any = null!;

    btnNoCallback: any = null!;

    btnConfirmCallback: any = null!;

    onLoad() {

    }

    disableAllBtn() {
        this.btnYes.active = false;
        this.btnNo.active = false;
        this.btnConfirm.active = false;
        this.layoutNodeBtn.active = false;
    }

    setupPopup(content: string, listCallback: VoidFunction[]) {
        log("listCallback   " + listCallback.length);
        this.contentPopup.string = content;
        this.disableAllBtn();

        if (listCallback.length == 2) {
            this.layoutNodeBtn.active = true;
            this.btnYes.active = true;
            this.btnNo.active = true;
            this.btnYesCallback = listCallback[0];
            this.btnNoCallback = listCallback[1];
        } else {
            if (listCallback.length == 1) {
                this.layoutNodeBtn.active = true;
                this.btnConfirm.active = true;
                this.btnConfirmCallback = listCallback[0];
            }
        }
    }

    onClickBtnYes() {
        log("onClickBtnYes")
        ExtAudioManager.instance.playEffect("sfx_click_btn");
        if (this.btnYesCallback) {
            this.btnYesCallback();
        }
    }

    onClickBtnNo() {
        log("onClickBtnNo")
        ExtAudioManager.instance.playEffect("sfx_click_btn");
        if (this.btnNoCallback) {
            this.btnNoCallback();
        }
    }

    onClickBtnConfirm() {
        log("onClickBtnConfirm")
        ExtAudioManager.instance.playEffect("sfx_click_btn");
        if (this.btnConfirmCallback) {
            this.btnConfirmCallback();
        }
    }
}
