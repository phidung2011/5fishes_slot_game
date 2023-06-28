import { _decorator, Component, Node, Label, Prefab, Vec3, log, Layout } from 'cc';
import * as utils from '../../../../../cc-common/cc-share/common/utils';
import { SlotConfig9920 } from '../../base_slot/SlotConfig9920';
import { SlotSymbol9920 } from '../../base_slot/SlotSymbol9920';
import { ItemPaylineHistoryDetail9920 } from './ItemPaylineHistoryDetail9920';

const { ccclass, property } = _decorator;

@ccclass('ItemHistoryDetail9920')
export class ItemHistoryDetail9920 extends Component {

    @property(Label)
    labelDate: Label = null!;

    @property(Label)
    labelTime: Label = null!;

    @property(Label)
    labelRound: Label = null!;

    @property(Label)
    moneyBet: Label = null!;

    @property(Label)
    moneyWin: Label = null!;

    @property([SlotSymbol9920])
    listSlotSymbol: SlotSymbol9920[] = [];

    @property([ItemPaylineHistoryDetail9920])
    listItemPayLine: ItemPaylineHistoryDetail9920[] = []!;

    @property(Node)
    txtNoData: Node = null!;

    @property(Prefab)
    prefabSlotSymbol: Prefab = null!;

    @property(Label)
    lbMultiFreeWin: Label = null!;

    @property(Node)
    table: Node = null!;

    @property(Node)
    layerShowSymbolWin: Node = null!;

    @property(Node)
    nodeTopInfo: Node = null!;

    @property(Node)
    nodeRoundTop: Node = null!;

    @property(Node)
    nodeGold: Node = null!;

    listParentOfSymbolOnMask = [];

    icon = [0, 3, 6, 9, 12, 15]

    winReelCount: number = 0;

    private _opaMulti: number = 150;

    onLoad() {
        this._initListParent();
    }

    private _initListParent() {
        this.listSlotSymbol.forEach(symbol => {
            let oldParent = symbol.node.parent;
            this.listParentOfSymbolOnMask.push(oldParent);
        });
    }

    setData(data: any, dataRound: any) {
        log('@@@ ItemHistoryDetail setData = ' + data + ', dataRound = ' + dataRound);
        this.txtNoData.active = false;
        this.lbMultiFreeWin && (this.lbMultiFreeWin.node.active = false);
        this.resetParentOfWinSymbols();
        this.resetPaylineItems();
        this.winReelCount = 0;
        let dataInfo = data.resultList[0];

        // spr Gold
        if (dataInfo.mode == 'free' && dataInfo.result) {
            this.setNumReactiveFree(dataInfo.result.freeSpinOptionRemain);
        }

        for (let i = this.listSlotSymbol.length - 1; i >= 0; i--) {
            if (dataInfo.matrixResult[i] == SlotConfig9920.wildSymbolCode && dataInfo.selectedOption > 0) {
                let newWildCode = SlotConfig9920.wildSymbolCode + dataInfo.selectedOption;
                this.listSlotSymbol[i].symbolCode = newWildCode;
            } else {
                this.listSlotSymbol[i].symbolCode = dataInfo.matrixResult[i];
            }
            this.listSlotSymbol[i].isBlur = false;
            if (dataInfo.matrixResult[i] == SlotConfig9920.scatterSymbolCode
                || dataInfo.matrixResult[i] == SlotConfig9920.wildSymbolCode
                || dataInfo.matrixResult[i] == SlotConfig9920.jackpotSymbolCode) {
                this.listSlotSymbol[i].node.setZIndex(1000);
            } else {
                this.listSlotSymbol[i].node.setZIndex(0);
            }
        }

        // this.sessionID.string = "#" + dataInfo.sessionId.substr(0, 8); //+"\n" +  this._data.sessionId.substr(18, 36);
        let time = utils.toLocalTime(dataInfo.time, '#DD#/#MM# #hh#:#mm#:#ss#').split(" ");
        this.labelDate.string = time[0];
        this.labelTime.string = time[1];
        this.moneyBet.string = utils.formatMoney(dataInfo.totalBetAmount);

        let totalWinAmount = dataInfo.winAmount;
        dataInfo.latestWinJackpotInfo && dataInfo.latestWinJackpotInfo[0] && (totalWinAmount += dataInfo.latestWinJackpotInfo[0].jackpotAmount);
        this.moneyWin.string = utils.formatMoney(totalWinAmount);
        if (dataRound[0] == 0) {
            this.nodeRoundTop.active = false;
            this.nodeTopInfo.getComponent(Layout).spacingX = 50;
        } else {
            if (!this.nodeRoundTop.active) {
                this.nodeRoundTop.active = true;
                this.nodeTopInfo.getComponent(Layout).spacingX = 0;
            }
            this.labelRound.string = dataRound[0] + " / " + dataRound[1];
        }

        // map data
        let dataPayLineLeft = dataInfo.paylines;
        log("dataPayLineLeft    " + JSON.stringify(dataPayLineLeft));
        for (let i = 0; i < dataPayLineLeft.length; i++) {
            dataPayLineLeft[i] = dataPayLineLeft[i].split(";");
            log("paylines LEFT:  " + dataPayLineLeft[i]);
        }

        // multi free
        if (dataPayLineLeft.length > 0) {
            let multi = dataPayLineLeft[0][5];
            if (parseInt(multi) > 1) {
                this.lbMultiFreeWin.string = 'x' + parseInt(multi);
                this.lbMultiFreeWin.node.active = true;
            }
        }

        let curPayLineID = -1;

        // jackpot symbols
        if (dataInfo.latestWinJackpotInfo != null) {
            this.setVisibleJackpotSymbol();

            curPayLineID++;
            this.listItemPayLine[curPayLineID].node.active = true;
            this.listItemPayLine[curPayLineID].setDataJackpot(dataInfo.latestWinJackpotInfo[0].jackpotAmount);
        }

        // // scatter: symbol + payline
        // let countScatter = dataInfo.result.normalScatterCount;
        // if (countScatter && countScatter >= 3) {
        //     this.setVisibleScatterSymbol();

        //     let countFreeSpin = 0;
        //     dataInfo && dataInfo.remainingFreeSpins && (countFreeSpin = dataInfo.remainingFreeSpins);
        //     curPayLineID++;
        //     this.listItemPayLine[curPayLineID].node.active = true;
        //     this.listItemPayLine[curPayLineID].setData4ScatterSymbol(countFreeSpin);
        // }

        // win normal symbols + payline
        for (let i = 0; i < dataPayLineLeft.length; i++) {
            const data = dataPayLineLeft[i];

            this.setVisibleWinSymbolsLeft(data);

            curPayLineID++;
            this.listItemPayLine[curPayLineID].node.active = true;
            this.listItemPayLine[curPayLineID].setData4NormalSymbol(data);
        }

        // wild symbols
        this.setVisibleWildSymbolFromLeft();

        // no data
        if (curPayLineID < 0) {
            this.txtNoData.active = true;
        }
    }

    setNumReactiveFree(value: number) {
        log('@@@ setNumReactiveFree value = ' + value);
        if (value > 0) {
            this.nodeGold.getChildByName('lb_reactive_free').getComponent(Label).string = '+' + value;
            this.nodeGold.active = true;
        } else {
            this.nodeGold.active = false;
        }
    }

    setVisibleScatterSymbol() {
        for (let i = 0; i < this.listSlotSymbol.length; i++) {
            if (this.listSlotSymbol[i].symbolCode == SlotConfig9920.scatterSymbolCode) {
                this.changeParentToShowOnMask(this.listSlotSymbol[i].node);
            }
        }
    }

    setVisibleJackpotSymbol() {
        for (let i = 0; i < this.listSlotSymbol.length; i++) {
            if (this.listSlotSymbol[i].symbolCode == SlotConfig9920.jackpotSymbolCode) {
                this.changeParentToShowOnMask(this.listSlotSymbol[i].node);
            }
        }
    }

    setVisibleWinSymbolsLeft(payLine: any) {
        let symbolCode = payLine[0];
        if (this.winReelCount < payLine[2]) {
            this.winReelCount = payLine[2];
        }
        let limitId = this.icon[payLine[2]];
        for (let i = 0; i < limitId; i++) {
            if (this.listSlotSymbol[i].symbolCode == symbolCode) {
                this.changeParentToShowOnMask(this.listSlotSymbol[i].node);
            }
        }
    }

    setVisibleWinSymbolsRight(payLine: any) {
        let symbolCode = payLine[0];
        // log('-- setVisibleWinSymbolsRight symbolCode = ' + symbolCode);
        if (this.winReelCount < payLine[2]) {
            this.winReelCount = payLine[2];
        }
        let limitId = this.icon[6 - payLine[2]];
        for (let i = this.icon[this.icon.length - 1] - 1; i >= limitId; i--) {
            if (this.listSlotSymbol[i].symbolCode == symbolCode) {
                this.changeParentToShowOnMask(this.listSlotSymbol[i].node);
            }
        }
    }

    setVisibleWildSymbolFromLeft() {
        if (this.winReelCount === 0) return;

        let limitId = this.icon[this.winReelCount];
        for (let i = 0; i < limitId; i++) {
            if (this.listSlotSymbol[i].symbolCode.includes(SlotConfig9920.wildSymbolCode)) {
                this.changeParentToShowOnMask(this.listSlotSymbol[i].node);
            }
        }
    }

    changeParentToShowOnMask(node: any) {
        let pos = utils.getPostionInOtherNode(this.layerShowSymbolWin, node) as Vec3;
        node.parent = this.layerShowSymbolWin;
        node.setPosition(pos);
    }

    resetParentOfWinSymbols() {
        for (let i = 0; i < this.listSlotSymbol.length; i++) {
            let symbol = this.listSlotSymbol[i];
            let originParent = this.listParentOfSymbolOnMask[i];

            let pos = utils.getPostionInOtherNode(originParent, symbol.node) as Vec3;
            symbol.node.parent = originParent;
            symbol.node.setPosition(pos);
        }
    }

    resetPaylineItems() {
        this.listItemPayLine.forEach(el => {
            el.node.active = false;
        });
    }
}

