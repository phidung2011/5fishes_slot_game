import { _decorator, Node, Label, Button } from 'cc';
import connectNetwork from '../../../../../cc-common/cc-network/connectNetwork';
import loadConfigAsync from '../../../../../cc-common/cc-share/shareServices/loadConfigAsync';
import serviceRest from '../../../../../cc-common/cc-share/shareServices/serviceRest';
import { ItemHistoryBet9920 } from './ItemHistoryBet9920';
import { ExtAudioManager } from '../../../../../ext-framework/ExtAudioManager';
import ExtBasePopup from '../../../../../ext-framework/ui/ExtBasePopup';
import ExtScreenManager from '../../../../../ext-framework/ui/ExtScreenManager';
import ExtTableView, { ExtTableViewDataSource, ExtTableViewDelegate } from '../../../../../ext-framework/ui/ExtTableView';
import { WaitingProgress9920 } from '../WaitingProgress9920';
import { ConfigApi9920, SlotConfig9920 } from '../../base_slot/SlotConfig9920';

const { ccclass, property } = _decorator;

@ccclass('PopupHistoryBet9920')
export class PopupHistoryBet9920 extends ExtBasePopup implements ExtTableViewDataSource, ExtTableViewDelegate {
    @property(ExtTableView)
    tableView: ExtTableView = null!;

    @property(Label)
    lbPage: Label = null!;

    @property(Button)
    btnNext: Button = null!;

    @property(Button)
    btnBack: Button = null!;

    @property(Node)
    nodeLabelNoData = null!;


    totalRecords: number = -1;

    public listItems: any[] = [];
    private _numOfRow: number = 10;
    private _total: number = 0;
    private _from: number = 0;
    private _numPage: number = 1;

    private _curPage: number = 0;
    public get curPage(): number {
        return this._curPage;
    }
    public set curPage(v: number) {
        if (this._curPage == v) return;
        if (this.totalRecords > 0) {
            if ((v - 1) * this._numOfRow > this.totalRecords) {
                return;
            }
        }

        this._curPage = v;

        let { API_URL } = loadConfigAsync.getConfig();
        let token = connectNetwork.getToken();
        let _this = this;
        // log('@@@ PopupHistoryBet api call: ' + Config9920.getBetHistoryURL);
        WaitingProgress9920.instance.show();
        serviceRest.getWithHeader({
            url: ConfigApi9920.getHistoryUserSpins,
            headers: {
                authorization: token
            },
            params: {
                serviceId: SlotConfig9920.GAME_ID,
                from: (v - 1) * this._numOfRow,
                size: this._numOfRow
            },
            callback: (data) => {
                // log('@@@ PopupHistoryBet api response: \n' + JSON.stringify(data));
                WaitingProgress9920.instance.hide();
                _this.updateData(data, v);
            },
            callbackErr: () => {
                // log('@@@ PopupHistoryBet api error: ');
                WaitingProgress9920.instance.hide();
                this.nodeLabelNoData.active = true;
                this.resetStateBtnNextBack(false);
            },
            apiUrl: API_URL
        })
    }

    updateData(data: any, curPage: number) {
        // log(`updateData: ${JSON.stringify(data)}`);
        if (this.curPage != curPage) return;
        if (data && data.data) {
            this._total = data.data.total;
            this._from = data.data.from;
        }
        if (data && data.data && data.data.resultList) {
            if (data.data.total == 0 && data.data.resultList.length == 0) {
                this.nodeLabelNoData.active = true;
                this.resetStateBtnNextBack(false);
                return;
            } else {
                this.nodeLabelNoData.active = false;
            }
            this.listItems = [];
            this.listItems = this.listItems.concat(data.data.resultList);
            this.tableView.reloadData();
        } else {
            this.nodeLabelNoData.active = true;
            this.resetStateBtnNextBack(false);
            return;
        }
        this.totalRecords = data.data.total;
        this.totalRecords > 0 && (this._numPage = Math.ceil(this.totalRecords / this._numOfRow));
        this.lbPage.string = `Trang ${this._curPage} / ${this._numPage}`;
        this.resetStateBtnNextBack(true);
        if (this.curPage * this._numOfRow >= this.totalRecords) {
            this.btnNext.node.active = false;
            // return;
        }
        if (this.curPage == 1) {
            this.btnBack.node.active = false;
        }
    }

    resetStateBtnNextBack(isActive) {
        this.btnNext.node.active = isActive;
        this.btnBack.node.active = isActive;
    }

    // table view data source methods
    numberOfCellsInTableView(tableView: ExtTableView): number {
        // log(`numberOfCellsInTableView ${this.listItems.length}`);
        return this.listItems.length;
    }

    tableCellAtIndex(tableView: ExtTableView, idx: number): Node {
        let cell = tableView.dequeueCell();
        let comp = cell?.getComponent(ItemHistoryBet9920);
        comp?.setData(this.listItems[idx], idx);
        return cell;
    }

    // table view delegate method
    tableCellClicked(tableView: ExtTableView, cell: Node, idx: number) {
        // log(`tableCellClicked: ${idx}`);
    }

    tableCellDidSelected(tableView: ExtTableView, idx: number) {
        // log(`tableCellDidSelected: ${idx}`);

    }

    onLoad() {
        this.tableView.dataSource = this;
        this.tableView.delegate = this;
    }

    start() {
        this.curPage = 1;
    }

    onBtnLeftClicked() {
        if (this.curPage <= 1) return;

        ExtAudioManager.instance.playEffect("sfx_click_btn");
        this.curPage--;
    }

    onBtnRightClicked() {
        if (this._from + this._numOfRow >= this._total) return;

        ExtAudioManager.instance.playEffect("sfx_click_btn");
        this.curPage++;
    }

    onBtnCloseClicked() {
        ExtAudioManager.instance.playEffect("sfx_click_btn");
        // ExtScreenManager.instance.hidePopup(true);
        ExtScreenManager.instance.popScreen();
    }

}
