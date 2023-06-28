import { _decorator, Node, Label, Prefab, instantiate, ScrollView, Vec2, Button, log, UITransform, Layout } from 'cc';
import connectNetwork from '../../../../../cc-common/cc-network/connectNetwork';
import loadConfigAsync from '../../../../../cc-common/cc-share/shareServices/loadConfigAsync';
import serviceRest from '../../../../../cc-common/cc-share/shareServices/serviceRest';
import { ItemBtnBottomHistoryDetail9920 } from './ItemBtnBottomHistoryDetail9920';
import { ItemHistoryDetail9920 } from './ItemHistoryDetail9920';
import { ItemHistorySummary9920 } from './ItemHistorySummary9920';
import { ExtAudioManager } from '../../../../../ext-framework/ExtAudioManager';
import ExtScreenManager from '../../../../../ext-framework/ui/ExtScreenManager';
import ExtBaseScreen from '../../../../../ext-framework/ui/ExtBaseScreen';
import { WaitingProgress9920 } from '../WaitingProgress9920';
import { ConfigApi9920, SlotConfig9920 } from '../../base_slot/SlotConfig9920';
import { ItemHistoryChooseWild9920 } from './ItemHistoryChooseWild9920';

const { ccclass, property } = _decorator;

@ccclass('PopupHistoryDetail9920')
export class PopupHistoryDetail9920 extends ExtBaseScreen {

    @property(Label)
    lbPage: Label = null!;

    @property(Node)
    nodeSummary: Node = null!;

    @property(Node)
    nodeDetail: Node = null!;

    @property(Node)
    nodeChooseWild: Node = null!;

    @property(Node)
    nodeBtnChangePage: Node = null!;

    @property(Node)
    nodeCenter: Node = null!;

    @property(ItemHistoryDetail9920)
    itemHistoryDetail: ItemHistoryDetail9920 = null!;

    @property(ItemHistorySummary9920)
    itemHistorySummary: ItemHistorySummary9920 = null!;

    @property([ItemBtnBottomHistoryDetail9920])
    itemBtnBottom: ItemBtnBottomHistoryDetail9920[] = [];

    @property(Prefab)
    prefabItemBottom: Prefab = null!;

    @property(Node)
    contentBottomScroll: Node = null!;

    @property(ScrollView)
    baseBottomScrollView: ScrollView = null!;

    @property(Button)
    btnNext: Button = null!;

    @property(Button)
    btnBack: Button = null!;

    @property(Button)
    btnNextPage: Button = null;

    @property(Button)
    btnBackPage: Button = null!;

    selectedIndex = 0;

    listIndexMapingPage: number[] = [];

    _currentSessionId: string = "";

    summaryData: any = null;

    totalPage: number = -1;
    totalTurnFree: number = -1;
    curSelectedIdFree: number = -1;

    mode: number = 0; // mode =0: user, mode =1: admin

    tokenType: string = "";

    userId: string = "";

    _offsetScrollMoving: number = 0;

    onLoad() {
        this._initOffsetScrollMoving();

        this._setFirstValueForBtnBottom();
    }

    _setFirstValueForBtnBottom() {
        this.itemBtnBottom[0].selected = true;
        this.itemBtnBottom[0].setData('summary', 0, () => {
            this.resetItemBtnBottom();
            this.getUserSpinSumarry();
            this._curPage = -1;
            this.selectedIndex = 0;
        })
    }

    _initOffsetScrollMoving() {
        let widthBtn = this.itemBtnBottom[0].node.getComponent(UITransform).width;
        let spaceX = this.contentBottomScroll.getComponent(Layout).spacingX;
        this._offsetScrollMoving = widthBtn + spaceX;
    }

    resetItemBtnBottom() {
        for (let i = 0; i < this.itemBtnBottom.length; i++) {
            this.itemBtnBottom[i].selected = false;
        }
    }

    private _curPage: number = 0;
    public get curPage(): number {
        return this._curPage;
    }

    public set curPage(v: number) {
        log("curPage   " + v + "   " + this.totalPage)
        if (this._curPage == v) return;
        if (this.totalPage > 0) {
            if (v > this.totalPage) {
                return;
            }
        }
        if (v < 1) return;
        this.lbPage.string = v + '';
        this._curPage = v;
        // log("this.totalPage  " + this.totalPage);
        let index = this.getCurrentIndex();
        log("curPage index   " + index);
        if (index >= 0) {
            this.selectedIndex = index; //+ 1;
            this.setItemBottomWithNoAPI();
        }
        log("call api getHistoryUserSpinDetails from page: " + (v - 1));
        let { API_URL } = loadConfigAsync.getConfig();
        let token = connectNetwork.getToken();
        let _this = this;
        if (this.mode == 0) {
            WaitingProgress9920.instance.show();
            serviceRest.getWithHeader({
                url: ConfigApi9920.getHistoryUserSpinDetails,
                headers: {
                    authorization: token
                },

                params: {
                    serviceId: SlotConfig9920.GAME_ID,
                    from: (v - 1),
                    size: 1,
                    psId: this._currentSessionId,
                    scroll: true,
                },

                callback: (data) => {
                    WaitingProgress9920.instance.hide();
                    if (_this) {
                        _this.updateDataDetail(data.data);
                    }
                },
                callbackErr: () => {
                    WaitingProgress9920.instance.hide();
                    let err = null
                },
                apiUrl: API_URL
            })
        } else {
            WaitingProgress9920.instance.show();
            serviceRest.getWithHeader({
                url: ConfigApi9920.getHistoryUserSpinDetails,
                headers: {
                    authorization: token
                },

                params: {
                    serviceId: SlotConfig9920.GAME_ID,
                    from: (v - 1),
                    size: 1,
                    psId: this._currentSessionId,
                    scroll: true,
                    "token-type": _this.tokenType,
                    "user-id": _this.userId
                },

                callback: (data) => {
                    WaitingProgress9920.instance.hide();
                    if (_this) {
                        _this.updateDataDetail(data.data);
                    }
                },
                callbackErr: () => {
                    WaitingProgress9920.instance.hide();
                    let err = null
                },
                apiUrl: API_URL
            })
        }
    }

    setDataSummary() {
        // log("setDataSummary");
        this.nodeSummary.active = true;
        this.nodeDetail.active = false;
        this.nodeChooseWild.active = false;
        this.nodeBtnChangePage.active = !this.nodeSummary.active;
        this.itemHistorySummary.setData(this.summaryData);
    }

    setDataChooseWild() {
        // log("setDataChooseWild");
        this.nodeSummary.active = false;
        this.nodeDetail.active = false;
        this.nodeChooseWild.active = true;
        this.nodeBtnChangePage.active = !this.nodeSummary.active;
    }

    getUserSpinSumarry() {
        if (this.summaryData != null) {
            this.selectedIndex = 0;
            this.setDataSummary();
            this.activeBtnNextBack();
            return;
        }
        let { API_URL } = loadConfigAsync.getConfig();
        let token = connectNetwork.getToken();
        let _this = this;
        if (this.mode == 0) {
            log('@@@ PopupHistoryDetail getUserSpinSumarry api: ' + ConfigApi9920.getHistoryUserSpinSummary);
            WaitingProgress9920.instance.show();
            serviceRest.getWithHeader({
                url: ConfigApi9920.getHistoryUserSpinSummary,
                headers: {
                    authorization: token
                },
                params: {
                    serviceId: SlotConfig9920.GAME_ID,
                    psId: this._currentSessionId
                },

                callback: (data) => {
                    // log("api2   " + JSON.stringify(data));
                    log('@@@ getUserSpinSumarry api response: \n' + JSON.stringify(data));
                    WaitingProgress9920.instance.hide();
                    if (_this) {
                        _this.summaryData = data;
                        if (_this.summaryData.data.resultList.length < 1) return;
                        _this.setDataSummary();
                        _this.createDataBottom();
                    }
                },
                callbackErr: () => {
                    // log('@@@ PopupHistoryDetail api error ');
                    WaitingProgress9920.instance.hide();
                    let err = null
                },
                apiUrl: API_URL
            })
        } else {
            WaitingProgress9920.instance.show();
            serviceRest.getWithHeader({
                url: ConfigApi9920.getHistoryUserSpinSummary,
                headers: {
                    authorization: token
                },
                params: {
                    serviceId: SlotConfig9920.GAME_ID,
                    psId: this._currentSessionId,
                    "token-type": _this.tokenType,
                    "user-id": _this.userId
                },

                callback: (data) => {
                    log("api2   " + JSON.stringify(data));
                    WaitingProgress9920.instance.hide();
                    if (_this) {
                        _this.summaryData = data;
                        if (!_this.summaryData.data || _this.summaryData.data.resultList.length < 1) return;
                        _this.setDataSummary();
                        _this.createDataBottom();
                    }
                },
                callbackErr: () => {
                    WaitingProgress9920.instance.hide();
                    let err = null
                },
                apiUrl: API_URL
            })
        }
    }

    createDataBottom() {
        let scrollData = this.summaryData.data.scroll;
        for (let i = 0; i < scrollData.length; i++) {
            scrollData[i] = scrollData[i].split(":")[1];
        }
        log("scrollData  " + JSON.stringify(scrollData));
        let indexFree = 0;
        for (let i = 0; i < scrollData.length; i++) {
            // if (i > 0 && scrollData[i] == "free" && scrollData[i - 1] == "free") continue
            this.listIndexMapingPage.push(i);
            if (this.prefabItemBottom) {
                let initNode = instantiate(this.prefabItemBottom);
                if (initNode) {
                    this.contentBottomScroll.addChild(initNode);
                    let comp = initNode.getComponent(ItemBtnBottomHistoryDetail9920);
                    if (comp) {
                        this.itemBtnBottom.push(comp);
                        let listSize = this.itemBtnBottom.length;
                        log("scrollData " + i + " = " + scrollData[i]);
                        if (scrollData[i] == 'free') {
                            indexFree++;
                        }
                        comp.setData(scrollData[i], indexFree, (indexFreeSpin: number) => {
                            this.resetItemBtnBottom();
                            this.curPage = i + 1;
                            this.selectedIndex = listSize - 1;
                            this.curSelectedIdFree = indexFreeSpin;
                            log('@@@ click selectedIndex = ' + this.selectedIndex);
                            this.activeBtnNextBack();
                        })
                    }
                }
            }
        }
        this.totalTurnFree = indexFree;
        this.listIndexMapingPage.push(scrollData.length)
        this.activeBtnNextBack();
    }

    updateDataDetail(data: any) {
        log("updateDataDetail = " + JSON.stringify(data));

        if (data.resultList.length <= 0) return;

        if (data.resultList[0].mode == 'free_option') {
            // choose wild
            this.nodeSummary.active = false;
            this.nodeChooseWild.active = true;
            this.nodeDetail.active = false;
            this.nodeBtnChangePage.active = !this.nodeSummary.active;
            this.nodeChooseWild.getComponent(ItemHistoryChooseWild9920).setData(data.resultList[0]);
        } else {
            this.nodeSummary.active = false;
            this.nodeChooseWild.active = false;
            this.nodeDetail.active = true;
            this.nodeBtnChangePage.active = !this.nodeSummary.active;
            this.itemHistoryDetail.setData(data, this.getDataRound());
        }
        this.totalPage = data.total;
        this.activeBtnNextBack();
        this.activeBtnNextBackPage();
    }

    getDataRound() {
        // let index = this.getNextIndex();
        // if (index != null) {
        //     let indexLast = this.listIndexMapingPage[index];
        //     let indexFirst = this.listIndexMapingPage[index - 1];
            return [this.curSelectedIdFree, this.totalTurnFree]
        // }
    }

    getCurrentIndex() {
        for (let i = 0; i < this.listIndexMapingPage.length; i++) {
            if (this.listIndexMapingPage[i] > (this.curPage - 1)) return i;
        }
        return -1;
    }

    getNextIndex() {
        log("listIndexMapingPage  " + JSON.stringify(this.listIndexMapingPage))
        log("this.curPage =  " + (this.curPage))
        for (let i = 0; i < this.listIndexMapingPage.length; i++) {
            if (this.listIndexMapingPage[i] >= this.curPage) return i;
        }
        return this.listIndexMapingPage.length - 1;
    }

    onBtnCloseClicked() {
        ExtAudioManager.instance.playEffect("sfx_click_btn");
        ExtScreenManager.instance.popScreen();
    }

    onClickBtnNext() {
        // log('@@@@@@ onClickBtnNext');
        if (this.selectedIndex < this.itemBtnBottom.length - 1) {
            this.selectedIndex++;
            this.setItemBottom();
        }
        this.activeBtnNextBack();
    }

    onClickBtnBack() {
        // log('@@@@@@ onClickBtnBack');
        log("this.selectedIndex  " + this.selectedIndex)
        if (this.selectedIndex > 0) {
            this.selectedIndex--;
            this.setItemBottom();
        }
        this.activeBtnNextBack();
    }

    activeBtnNextBack() {
        // log("activeBtnNextBack")
        this.btnBack.node.active = this.selectedIndex > 0;
        this.btnNext.node.active = this.selectedIndex < this.itemBtnBottom.length - 1;
    }

    setItemBottom() {
        this.itemBtnBottom[this.selectedIndex].onClickBtn();
        this.baseBottomScrollView.scrollToOffset(new Vec2(this.selectedIndex * this._offsetScrollMoving, 0), 0.1)
        // log("this.selectedIndex   " + this.selectedIndex);
    }

    setItemBottomWithNoAPI() {
        log("setItemBottomWithNoAPI " + this.selectedIndex)
        this.resetItemBtnBottom();
        this.itemBtnBottom[this.selectedIndex].selected = true;
        this.curSelectedIdFree = this.itemBtnBottom[this.selectedIndex].getIdFreeSpin();
        this.baseBottomScrollView.scrollToOffset(new Vec2(this.selectedIndex * this._offsetScrollMoving, 0));
    }

    onClickNextPage() {
        // log('@@@@@@ onClickNextPage');
        ExtAudioManager.instance.playEffect("sfx_click_btn");
        this.curPage = this.curPage + 1;
    }

    onClickBackPage() {
        // log('@@@@@@ onClickBackPage');
        ExtAudioManager.instance.playEffect("sfx_click_btn");
        this.curPage = this.curPage - 1;
    }

    activeBtnNextBackPage() {
        // log("activeBtnNextBackPage");
        // if (this.selectedIndex < 1) this.btnBack.
        // log("curPage  " + this.curPage)
        this.btnBackPage.node.active = this.curPage > 1;
        this.btnNextPage.node.active = this.curPage < this.totalPage;
    }
}
