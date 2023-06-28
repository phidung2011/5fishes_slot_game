
import { _decorator, Component, Node, Label, Sprite, Vec3, Prefab, UITransform } from 'cc';
import * as utils from '../../../../../cc-common/cc-share/common/utils';
import { ExtAudioManager } from '../../../../../ext-framework/ExtAudioManager';
import ExtBaseScreen from '../../../../../ext-framework/ui/ExtBaseScreen';
import ExtScreenManager from '../../../../../ext-framework/ui/ExtScreenManager';
import { PopupHistoryDetail9920 } from './PopupHistoryDetail9920';

const { ccclass, property } = _decorator;

@ccclass('ItemHistoryBet9920')
export class ItemHistoryBet9920 extends Component {
    @property(Label)
    lbId: Label = null!;
    @property(Label)
    lbDate: Label = null!;
    @property(Label)
    lbTime: Label = null!;
    @property(Label)
    lbTotalBet: Label = null!;
    @property(Label)
    lbWinAmount: Label = null!;
    @property(Sprite)
    bgSprite: Sprite = null!;

    @property(Node)
    nodeStatus: Node = null!;

    @property(Node)
    nodeFree: Node = null!;

    @property(Node)
    nodeJP: Node = null!;

    private _data: any = null!;
    private _countChildActive = 0;
    private _arrSizeByNumChild = [32, 58, 84];

    setData(data: any, index: number) {
        // log('@@@ ItemHistoryBet setData: ' + JSON.stringify(data));
        if (this._data && data && this._data.sessionId == data.sessionId) return;
        if (!data) return;

        this._data = data;
        this._countChildActive = 0;
        if (this._data.totalWinAmount > 0) {
            this.nodeStatus.active = true;
            this.lbId.node.position = new Vec3(this.lbId.node.position.x, 15, this.lbId.node.position.z);
            this._countChildActive++;
        } else {
            this.nodeStatus.active = false;
            this.lbId.node.position = new Vec3(this.lbId.node.position.x, 0, this.lbId.node.position.z);
        }
        this.nodeFree.active = data.freeGameTotal > 0;
        this.nodeJP.active = data.totalJpWinAmount > 0;
        if (this.nodeFree.active) this._countChildActive++;
        if (this.nodeJP.active) this._countChildActive++;

        if (this._countChildActive > 0) this.nodeStatus.getComponent(UITransform)!.width = this._arrSizeByNumChild[this._countChildActive - 1];

        this.bgSprite.node.active = index % 2 == 0;
        this.lbId.string = "#" + this._data.sessionId.substr(0, 8);
        let time = utils.toLocalTime(this._data.time, '#DD#/#MM# #hh#:#mm#:#ss#').split(" ");
        this.lbDate.string = time[0];
        this.lbTime.string = time[1];
        this.lbTotalBet.string = utils.formatMoney(this._data.totalBetAmount + "");
        this.lbWinAmount.string = utils.formatMoney(this._data.totalWinAmount + "");
    }

    onBtnDetailClicked() {
        // log('@@@ onBtnDetailClicked');
        ExtAudioManager.instance.playEffect("sfx_click_btn");

        let popup_history_detail = ExtScreenManager.instance.assetBundle.get('res/prefabs/popup/history_bet/popup_history_detail', Prefab)!;
        ExtScreenManager.instance.pushScreen(popup_history_detail, (screen: ExtBaseScreen) => {
            let popupDisplay = screen as PopupHistoryDetail9920;
            popupDisplay._currentSessionId = this._data.sessionId;
            popupDisplay.getUserSpinSumarry();
        });
    }

}
