
import { _decorator, Component, Label, CCString } from 'cc';
import { PAY_LINES } from '../base_slot/SlotConfig9920';
const { ccclass, property } = _decorator;

@ccclass('ItemPayTable9924')
export class ItemPayTable9924 extends Component {

    @property(Label)
    listLabelMulti: Label[] = [];

    @property(CCString)
    symbolCode: string = '';

    onLoad() {
        this.setData(this.symbolCode);
    }

    setData(symbolCode: string) {
        let payLine = PAY_LINES[symbolCode + ""];
        if (payLine != null) {
            for (let i = 0; i < this.listLabelMulti.length; i++) {
                this.listLabelMulti[i].string = payLine[i] + "";
            }
        }
    }
}
