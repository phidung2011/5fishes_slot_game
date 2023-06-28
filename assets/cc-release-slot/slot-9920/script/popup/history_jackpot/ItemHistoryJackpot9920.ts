import { _decorator, Component, Label, Sprite } from 'cc';
import * as utils from '../../../../../cc-common/cc-share/common/utils';

const { ccclass, property } = _decorator;

@ccclass('ItemHistoryJackpot9920')
export class ItemHistoryJackpot9920 extends Component {
    @property(Label)
    lbDate: Label = null!;
    @property(Label)
    lbTime: Label = null!;
    @property(Label)
    lbUsername: Label = null!;
    @property(Label)
    lbBet: Label = null!;
    @property(Label)
    lbJackpot: Label = null!;
    @property(Sprite)
    bgSprite: Sprite = null!;


    private _data: any = null!;

    setData(data: any, index: number) {
        if (this._data && data && this._data.psId == data.psId) return;
        if (!data) return;

        this._data = data;
        this.lbUsername.string = this._data.dn.trim();
        let time = utils.toLocalTime(this._data.time, '#DD#/#MM# #hh#:#mm#:#ss#').split(" ");
        this.lbDate.string = time[0];
        this.lbTime.string = time[1];
        this.bgSprite.node.active = index % 2 == 0;
        this.lbBet.string = utils.formatMoney(this._data.betAmt);
        this.lbJackpot.string = utils.formatMoney(this._data.jpAmt);
    }

}