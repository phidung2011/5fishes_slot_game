
import { _decorator, Component, Node, Label, Sprite, SpriteFrame, UITransform, Size } from 'cc';
import * as utils from '../../../../cc-common/cc-share/common/utils';
import ExtScreenManager from '../../../../ext-framework/ui/ExtScreenManager';
import { SlotConfig9920 } from './SlotConfig9920';

const { ccclass, property } = _decorator;


@ccclass('PaylineWinInfo9920')
export class PaylineWinInfo9920 extends Component {

    @property(Node)
    protected guiMid: Node = null!;

    @property(Label)
    protected lbWinSymbolCount: Label = null!;

    @property(Label)
    protected lbWinAmount: Label = null!;

    @property(Label)
    protected lbPaytable: Label = null!;

    @property(Label)
    protected lbMulti: Label = null!;

    @property(Sprite)
    protected spSymbol: Sprite = null!;

    setPaylineInfo(combination: any) {
        console.log(`setPaylineInfo: ${JSON.stringify(combination)}`);
        this.lbWinSymbolCount.string = combination.winReelCount.toString();
        this.spSymbol.spriteFrame = ExtScreenManager.instance.assetBundle.get(`${SlotConfig9920.smallItemPath}/symbol_${combination.symbol}/spriteFrame`, SpriteFrame);

        // if (combination.symbol == '7' || combination.symbol == '8' || combination.symbol == '9' || combination.symbol == 'B') {
        //     this.spSymbol.getComponent(UITransform).setContentSize(new Size(28, 28));
        // } else {
        //     this.spSymbol.getComponent(UITransform).setContentSize(new Size(34, 34));
        // }
        this.lbPaytable.string = `${combination.payTable}(x${combination.combinationCount})`;
        let t1 = combination.payTable * combination.combinationCount * combination.multiple;
        let denom = Math.floor(combination.winAmount / t1);

        this.lbWinAmount.string = `= ${utils.formatMoney(t1)}x${utils.formatMoney(denom)} = ${utils.formatMoney(combination.winAmount)}`;

        // console.log(`setPaylineInfo 2: ${this.lbWinAmount.node.getComponent(UITransform)?.contentSize}`);
        if (combination.multiple == 1) {
            this.guiMid.active = false;
        }
        else {
            this.guiMid.active = true;
            this.lbMulti.string = 'x' + combination.multiple;
        }
    }
}
