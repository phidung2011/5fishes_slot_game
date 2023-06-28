
import { _decorator, Node, Button } from 'cc';
import { ExtAudioManager } from '../../../../ext-framework/ExtAudioManager';
import ExtBasePopup from '../../../../ext-framework/ui/ExtBasePopup';
import ExtScreenManager from '../../../../ext-framework/ui/ExtScreenManager';
import { Director9920 } from '../core/Director9920';
const { ccclass, property } = _decorator;

@ccclass('PopupAutoSpin9920')
export class PopupAutoSpin9920 extends ExtBasePopup {

    @property(Node)
    listBtnNode: Node[] = [];

    numberAutoSpin = [10, 30, 50, 80, 99];

    chosenIndex = 0;

    finishedCallback: any = null;

    onLoad() {

    }

    onEnable() {
        super.onEnable();
        Director9920.instance.normalGameScreen.spinButton.interactable = false;
    }

    onDisable() {
        super.onDisable();
        Director9920.instance.normalGameScreen.spinButton.interactable = true;
    }

    onClickBtnChosenNumberAuto(target: any, index: number) {
        ExtAudioManager.instance.playEffect("sfx_click_btn");
        this.chosenIndex = index;
        for (let i = 0; i < this.listBtnNode.length; i++) {
            let btn = this.listBtnNode[i].getComponent(Button);
            if (btn != null) {
                this.setActiveBtn(btn, i != index);
            }
        }
    }

    setActiveBtn(btn: Button, isActive: boolean) {
        btn.interactable = isActive;
        let label1 = btn.node.getChildByName("bg_cell_press");
        let label2 = btn.node.getChildByName("label_2");
        if (label1) {
            label1.active = !isActive;
        }
        if (label2) {
            label2.active = isActive;
        }
    }

    onClickBtnBack() {
        //play music
        ExtAudioManager.instance.playEffect("sfx_click_btn");
        ExtScreenManager.instance.hidePopup(true);
        this.finishedCallback && this.finishedCallback(0);
    }

    onClickBtnStartSpin() {
        ExtAudioManager.instance.playEffect("sfx_click_btn");
        ExtScreenManager.instance.hidePopup(true);
        this.finishedCallback && this.finishedCallback(this.numberAutoSpin[this.chosenIndex]);
        // Director9920.instance.normalGameScreen.setNumberAutoSpin(this.numberAutoSpin[this.chosenIndex]);
    }


}
