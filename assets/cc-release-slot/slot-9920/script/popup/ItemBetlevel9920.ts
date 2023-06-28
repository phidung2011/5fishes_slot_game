
import { _decorator, Component, Node, Label, Color } from 'cc';
const { ccclass, property } = _decorator;
import * as utils from '../../../../cc-common/cc-share/common/utils';
import { Director9920 } from '../core/Director9920';
import { ExtAudioManager } from '../../../../ext-framework/ExtAudioManager';

@ccclass('ItemBetlevel9920')
export class ItemBetlevel9920 extends Component {

    @property(Label)
    labelText: Label = null!;

    @property(Node)
    chosen: Node = null!;

    betLevel: number = -1;

    onClickCallback: any = null!;

    onClickBtn() {
        ExtAudioManager.instance.playEffect("sfx_click_btn");
        if (this.onClickCallback) {
            this.onClickCallback(this.betLevel);
        }
    }

    setData(betLevelIndex: number, callback: any) {
        // log("ItemBetlevel   " + betLevelIndex);
        this.betLevel = betLevelIndex;
        this.onClickCallback = callback;
        this.labelText.string = utils.formatMoney(Director9920.instance.getAmountBetInfo(this.betLevel));
        // this.setChosen(Director9920.instance.getCurrentBetIndex());
    }

    setChosen(index: number) {
        this.chosen.active = this.betLevel == index;
        this.labelText.color = this.betLevel == index ? new Color(247, 187, 101, 255) : new Color(255, 255, 255, 255);
    }
}
