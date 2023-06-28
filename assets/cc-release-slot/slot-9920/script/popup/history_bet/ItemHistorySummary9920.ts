import { _decorator, Component, Label } from 'cc';
import * as utils from '../../../../../cc-common/cc-share/common/utils';
const { ccclass, property } = _decorator;

@ccclass('ItemHistorySummary9920')
export class ItemHistorySummary9920 extends Component {
    @property(Label)
    labelMoneyBet: Label = null!;

    @property(Label)
    labelNormalWin: Label = null!;

    @property(Label)
    labelFreeSpinWin: Label = null!;

    @property(Label)
    labelJackPot: Label = null!;

    @property(Label)
    labelTotalWin: Label = null!;


    setData(dataSummary: any) {
        let data = dataSummary.data.resultList[0];
        this.labelMoneyBet.string = utils.formatMoney(data.totalBetAmount);
        this.labelNormalWin.string = utils.formatMoney(data.totalNormalWinAmount);

        this.labelFreeSpinWin.string = utils.formatMoney(data.totalFreeWinAmount);
        this.labelJackPot.string = utils.formatMoney(data.totalJpWinAmount);

        this.labelTotalWin.string = utils.formatMoney(data.totalWinAmount);
    }
}