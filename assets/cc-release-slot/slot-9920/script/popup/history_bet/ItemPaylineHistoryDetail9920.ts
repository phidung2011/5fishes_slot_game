import { _decorator, Component, Label } from 'cc';
import { SlotSymbol9920 } from '../../base_slot/SlotSymbol9920';
import * as utils from '../../../../../cc-common/cc-share/common/utils';
import { SlotConfig9920 } from '../../base_slot/SlotConfig9920';

const { ccclass, property } = _decorator;

@ccclass('ItemPaylineHistoryDetail9920')
export class ItemPaylineHistoryDetail9920 extends Component {

    @property(SlotSymbol9920)
    slotSymbol: SlotSymbol9920 = null!;

    @property(Label)
    labelBo: Label = null!;

    @property(Label)
    labelMoneyWin: Label = null!;

    @property(Label)
    labelMoneyMulti: Label = null;

    setData4NormalSymbol(payLine: any) {
        // log("@ setData4NormalSymbol: payLine  " + JSON.stringify(payLine));
        let multiplier = parseInt(payLine[5]);
        this.slotSymbol.symbolCode = payLine[0];
        this.slotSymbol.isBlur = false;
        this.labelBo.string = "THẮNG TỔ HỢP " + payLine[2] + " x " + payLine[3];
        this.labelMoneyWin.node.active = true;
        this.labelMoneyWin.string = utils.formatMoney(Math.floor(payLine[1]));
        this.labelMoneyMulti.node.active = true;
        this.labelMoneyMulti.string = utils.formatMoney(Math.floor(payLine[1] / multiplier)) + " x " + multiplier;

    }

    setData4ScatterSymbol(count: number) {
        // log("@ setData4ScatterSymbol: count  " + count);
        this.labelMoneyWin.node.active = false;
        this.labelMoneyMulti.node.active = false;
        this.slotSymbol.symbolCode = SlotConfig9920.scatterSymbolCode;
        this.slotSymbol.isBlur = false;
        this.labelBo.string = "TRÚNG " + count + " LƯỢT QUAY MIỄN PHÍ";
    }

    setDataJackpot(money: any) {
        this.slotSymbol.symbolCode = SlotConfig9920.jackpotSymbolCode;
        this.slotSymbol.isBlur = false;
        this.labelBo.string = "NỔ HŨ";
        this.labelMoneyWin.node.active = true;
        this.labelMoneyWin.string = utils.formatMoney(Math.floor(money));
        this.labelMoneyMulti.node.active = false;
    }

}
