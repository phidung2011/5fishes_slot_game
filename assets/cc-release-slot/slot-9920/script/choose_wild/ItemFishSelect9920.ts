
import { _decorator, Component, Label, CCString } from 'cc';
import { OPTION_FREE_SELECT_KOI, SlotConfig9920 } from '../base_slot/SlotConfig9920';
const { ccclass, property } = _decorator;

@ccclass('ItemFishSelect9920')
export class ItemFishSelect9920 extends Component {

    @property(Label)
    listLabelMulti: Label[] = [];

    @property(CCString)
    fishCode: string = '';

    onLoad() {
        this.setData(this.fishCode);
    }

    setData(fishCode: string) {
        let multiple = OPTION_FREE_SELECT_KOI[fishCode];
        if (multiple != null && this.listLabelMulti.length >= 2) {
            this.listLabelMulti[0].string = (multiple[0] + SlotConfig9920.extraFreeGame) + '';
            this.listLabelMulti[1].string = 'x' + multiple[1] + ',' + multiple[2] + ',' + multiple[3];
        }
    }
}
