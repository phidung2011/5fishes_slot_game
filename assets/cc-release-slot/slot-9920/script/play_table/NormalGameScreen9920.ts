import { _decorator, Node, Label, Vec3, Button, SpriteFrame, Prefab, instantiate, v3, log, tween, Sprite, Camera, RenderTexture, sp } from 'cc';
import { SlotBoard9920 } from '../base_slot/SlotBoard9920';
import { SlotConfig9920, SlotConfig9920Type } from '../base_slot/SlotConfig9920';
import { SpinButton9920 } from '../base_slot/SpinButton9920';
import { Director9920 } from '../core/Director9920';
import * as utils from '../../../../cc-common/cc-share/common/utils';
import SlotUtils9920 from '../base_slot/SlotUtils9920';
import { ExtSlotBoard, SlotBoardDelegate } from '../../../../cc-slot-common/ext-slot/ExtSlotBoard';
import ExtUtils from '../../../../ext-framework/ExtUtils';
import ExtBaseScreen from '../../../../ext-framework/ui/ExtBaseScreen';
import ExtControlEvent from '../../../../ext-framework/ui/ExtControlEvent';
import ExtAsyncTaskMgr from '../../../../ext-framework/async_task/ExtAsyncTaskMgr';
import ExtBaseTask from '../../../../ext-framework/async_task/ExtBaseTask';
import ExtSequenceTask from '../../../../ext-framework/async_task/ExtSequenceTask';
import { ExtAudioManager } from '../../../../ext-framework/ExtAudioManager';
import ExtScreenManager from '../../../../ext-framework/ui/ExtScreenManager';
import ExtBasePopup from '../../../../ext-framework/ui/ExtBasePopup';
import { SLOT_GAME_STATE } from '../../../../cc-slot-common/ext-slot/ExtSlotGame';
import { SPIN_STATE } from '../../../../cc-slot-common/ext-slot/ExtSpinButton';
import { WaitingProgress9920 } from '../popup/WaitingProgress9920';
import gameCommonUtils from '../../../../cc-common/cc-share/common/gameCommonUtils';
import { PopupMegaWin9920 } from '../popup/PopupMegaWin9920';
import { FxTransition9920 } from './FxTransition9920';
import { PopupDecreaseBet9920 } from '../popup/PopupDecreaseBet9920';
import { PopupSymbolInfo9920 } from '../popup/PopupSymbolInfo9920';
import { PopupAutoSpin9920 } from '../popup/PopupAutoSpin9920';
import { MoneyWinBar9920 } from './MoneyWinBar9920';
import { PopupChosenBetLevel9920 } from '../popup/PopupChosenBetLevel9920';

const { ccclass, property } = _decorator;

@ccclass('NormalGameScreen9920')
export class NormalGameScreen9920 extends ExtBaseScreen implements SlotBoardDelegate {

    @property(SlotBoard9920)
    protected slotBoard: SlotBoard9920 = null!;

    @property(SpinButton9920)
    spinButton: SpinButton9920 = null!;

    @property(MoneyWinBar9920)
    moneyWinBar: MoneyWinBar9920 = null!;

    @property(Label)
    labelJackpot: Label = null!;

    @property(Label)
    labelTotalWin: Label = null!;

    @property(Label)
    labelWallet: Label = null!;

    @property(Label)
    labelMoneyBet: Label = null!;

    @property(Node)
    btnAdd: Node = null!;

    @property(Node)
    btnMinus: Node = null!;

    @property(Button)
    btnDecreaseBet: Button = null!;

    @property(Button)
    btnTurbo: Button = null!;

    @property(Button)
    btnAuto: Button = null!;

    @property(Button)
    btnClickChosenBetlevel: Button = null!;

    @property(Button)
    btnClickHistory: Button = null!;

    @property(Button)
    btnMenu: Button = null!;

    @property(Button)
    btnJackpot: Button = null!;

    @property(Sprite)
    public spBgAnim: Sprite = null!;
    @property(Camera)
    public cam1: Camera = null!;

    @property(Sprite)
    public spFrontAnim: Sprite = null!;
    @property(Camera)
    public cam2: Camera = null!;

    @property(Node)
    public nodeAnimFishYellow: Node = null!;

    @property(Node)
    public nodeAnimFishRed: Node = null!;

    @property(Node)
    public nodeAnimFishChild: Node = null!;

    @property(PopupDecreaseBet9920)
    public popupDecreaseBet: PopupDecreaseBet9920 = null!;

    @property(Node)
    listAnimCoinWin: Node[] = [];

    public isAutoSpin: boolean = false;
    public state: SLOT_GAME_STATE = SLOT_GAME_STATE.IDLE;
    private _hasResult: boolean = false;
    private _symbolHelpNode: Node | null = null;
    private _shouldTurbo: boolean = false;

    private _mx: any = [];
    private _payLine: any = [];

    numberOfAutoSpin = 0;
    moneyScatterWin: number = 0;

    private _winAmount: number = 0;
    private _countFishWin: number = 0;
    private _posOriginFishYellow: Vec3 = Vec3.ZERO;
    private _posOriginFishRed: Vec3 = Vec3.ZERO;
    private _updateMoneyWin: boolean = false;

    public enableLazyActive = false;

    private _idTestAnim = 2;

    onLoad() {
        this.slotBoard.boardDelegate = this;
        this.updateWallet(Director9920.instance.getMoneyWallet());

        WaitingProgress9920.instance.init();
        this._posOriginFishYellow = this.nodeAnimFishYellow.getPosition();
        this._posOriginFishRed = this.nodeAnimFishRed.getPosition();
    }

    onEnable() {
        this.spinButton.node.on(ExtControlEvent.SpinButtonClick, this.onBtnSpinClicked, this);
        this.node.on(ExtControlEvent.ScreenDidAppear, this.screenDidAppear, this);
    }

    onDisable() {
        this.spinButton.node.off(ExtControlEvent.SpinButtonClick, this.onBtnSpinClicked, this);
        this.node.off(ExtControlEvent.ScreenDidAppear, this.screenDidAppear, this);
    }

    screenDidAppear() { }

    lazyActive() {
        log(`lazyActive`);
        this.enableLazyActive = true;
        let gui_bgr = this.node.getChildByName('gui_bgr');
        let gui_board_play_table = this.node.getChildByName('gui_board_play_table');
        let gui_jackpot = this.node.getChildByName('gui_jackpot');
        let gui_board_control = this.node.getChildByName('gui_board_control');
        let gui_win_amount = this.node.getChildByName('gui_win_amount');

        let allGuis = [gui_bgr, gui_board_play_table, gui_jackpot, gui_board_control, gui_win_amount];
        for (let gui of allGuis) {
            gui.active = false;
        }
        let idx = 0;
        let func = () => {
            log(`active ${allGuis[idx].name}`);
            allGuis[idx].active = true;
            if (allGuis[idx].name == 'gui_bgr') {
                this.initBgAnim();
                this.playAnimFishIdle();
            }
            else if (allGuis[idx].name == 'gui_board_play_table') {
                // Director9920.instance.resumeGame();
                this._showBoardGame();
            } else if (allGuis[idx].name == 'gui_board_control') {
                this.setLabelMoneyBet();
            }
            idx++;
            if (idx >= allGuis.length) this.unschedule(func);
        };
        this.schedule(func, 0.05, allGuis.length);
    }

    start() {
        this.scheduleOnce(() => {
            log('@@@@@ ExtScreenManager.instance.removeAllEffects');
            ExtScreenManager.instance.removeAllEffects();
        }, 2);

        if (!this.enableLazyActive) {
            this.initBgAnim();
            this.playAnimFishIdle();
            this._showBoardGame();
        }
        else this.lazyActive();

        this.setCurLevelDecreaseBet();
        this.setLabelMoneyBet();
        this.updateUIOpenReel();
        this.updateJackpot(Director9920.instance.getJackpotAmount());
    }

    // Slot Boar delegate methods - BEGIN

    public isFTR = false;
    slotConfig: SlotConfig9920Type = SlotConfig9920;

    allowNearWin() {
        return false;
    }

    allowShowPayline(): boolean {
        return !(SlotConfig9920.isTurboMode && this.isAutoSpin);
    }

    boardDidStopSpining(board: ExtSlotBoard) {
        log(`NormalGameScreen: boardDidStopSpining`);
        this.spinButton.disable = false;
        this.spinButton.spinState = SPIN_STATE.IDLE;
        this.state = SLOT_GAME_STATE.SHOW_RESULT;

        this.showWinInfo();

        if (!this.isAutoSpin) {
            this.openAllBtn();
        }
    }

    boardWillShowTotalWin(board: ExtSlotBoard, amount: number, exInfo: object | null): void {
        log(`boardWillShowTotalWin ${amount} `);
        this._winAmount = 0;
        for (let index = 0; index < this._payLine.length; index++) {
            let combination = this._payLine[index % this._payLine.length];
            this._winAmount += combination.winAmount;
        }

        let type = 0;
        if (!SlotConfig9920.isUnitTest) {
            type = this._playAnimFishWin(this._winAmount);
        } else {
            type = this._playAnimFishWinTest();
        }
        if (!this._updateMoneyWin) {
            let timeDelay = 0;
            if (type == 0) timeDelay = 0.9;
            this.scheduleOnce(this.updateMoneyWin, timeDelay);
        }

        if (this.isFTR) {
            // this._speedUpPlayingAnim();
            // this.moneyWinBar.quickFinishShowingWinAmount(this._winAmount);
            this._cancelShowResultAnims();
        }

        if (this.moneyScatterWin) {
            this.spinButton.interactable = false;
        }
    }

    boardDidShowTotalWin(board: ExtSlotBoard, amount: number, exInfo: object | null): void {
        log(`boardDidShowTotalWin ${amount} `);
        if (this.moneyScatterWin && this.isAutoSpin && SlotConfig9920.isTurboMode) {
            this.slotBoard.stopShowPaylines();
            this.switchToFreeSpinMode();
            return;
        }
        if (this.moneyScatterWin) {
            return;
        }

        this.updateWallet(Director9920.instance.getMoneyWallet());

        if (SlotUtils9920.isBigWin(amount)) {
            // this.slotBoard.stopShowPaylines();
            this._showPopupBigWin(() => {
                this.startNewSession();
            });
        }
        else {
            if (this.isAutoSpin && SlotConfig9920.isTurboMode) {
                this.startNewSession();
            } else {
                if (!this.isAutoSpin) this.startNewSession();
            }
        }
    }

    boardShowPayline(board: ExtSlotBoard, plIndex: number, amount: number, exInfo: object | null): void {
        log(`boardShowPayline: ${plIndex} - ${amount}`);
        if (plIndex === this._payLine.length - 1) {
            if (this.moneyScatterWin) {
                this.slotBoard.stopShowPaylines();
                this.switchToFreeSpinMode();
                return;
            }

            if (!SlotUtils9920.isBigWin(this._winAmount) && this.isAutoSpin && !SlotConfig9920.isTurboMode) this.startNewSession();
        }
    }
    // Slot Boar delegate methods - END

    initBgAnim() {
        const renderTex1 = new RenderTexture();
        renderTex1.reset({
            width: SlotConfig9920.maxResolution.width,
            height: SlotConfig9920.maxResolution.height,
            colorFormat: RenderTexture.PixelFormat.RGBA8888,
            // depthStencilFormat: RenderTexture.DepthStencilFormat.DEPTH_24_STENCIL_8,
        });
        this.cam1.targetTexture = renderTex1;
        const spriteFrame1 = this.spBgAnim.spriteFrame!;
        const sp1 = new SpriteFrame();
        sp1.reset({
            originalSize: spriteFrame1.originalSize,
            rect: spriteFrame1.rect,
            offset: spriteFrame1.offset,
            isRotate: spriteFrame1.rotated,
        });
        sp1.texture = renderTex1;
        this.spBgAnim.spriteFrame = sp1;
        this.spBgAnim.updateMaterial();

        const renderTex2 = new RenderTexture();
        renderTex2.reset({
            width: SlotConfig9920.maxResolution.width,
            height: SlotConfig9920.maxResolution.height,
            colorFormat: RenderTexture.PixelFormat.RGBA8888,
            // depthStencilFormat: RenderTexture.DepthStencilFormat.DEPTH_24_STENCIL_8,
        });
        this.cam2.targetTexture = renderTex2;
        const spriteFrame2 = this.spFrontAnim.spriteFrame!;
        const sp2 = new SpriteFrame();
        sp2.reset({
            originalSize: spriteFrame2.originalSize,
            rect: spriteFrame2.rect,
            offset: spriteFrame2.offset,
            isRotate: spriteFrame2.rotated,
        });
        sp2.texture = renderTex2;
        this.spFrontAnim.spriteFrame = sp2;
        this.spFrontAnim.updateMaterial();
    }

    playAnimFishIdle() {
        let anim = this.nodeAnimFishYellow?.getComponent(sp.Skeleton);
        if (anim) {
            anim.clearTracks();
            let spineEntry = anim.setAnimation(0, 'animation', true);
        }

        this.scheduleOnce(() => {
            let anim = this.nodeAnimFishRed?.getComponent(sp.Skeleton);
            if (anim) {
                anim.clearTracks();
                let spineEntry = anim.setAnimation(0, 'animation', true);
            }
        }, 0.5);
    }

    isFreeSpin() {
        return false;
    }

    private _showBoardGame() {
        if (Director9920.instance.playerState.normalMatrix) {
            let normalMx = Director9920.instance.playerState.normalMatrix;

            this.hideAllBtn();

            this.slotBoard.setPreviousMatrix(normalMx);
            this.slotBoard.showAllScatters();
            this.slotBoard.allowClickSymbols(false);

            this.moneyWinBar.showSpinWinAmount(Director9920.instance.playerState.normalWinAmount);
            this.updateMoneyAllWin();

            this.scheduleOnce(() => {
                this.switchToFreeSpinMode();
            }, 1.25);
        }
        else {
            this.slotBoard.randomSymbols();
            this.slotBoard.playAllSymbolsActionIdle();
            this.slotBoard.allowClickSymbols(true);
        }
    }

    resumeGame(matrix: any, payline: any) {
        // log("resumeGameNormal  callback " + JSON.stringify(matrix) + JSON.stringify(payline));
        // this.slotBoard.setPreviousMatrix(matrix);
        // this.slotBoard.playAllSymbolsActionIdle();

        // payline ? this._payLine = payline : this._payLine = [];

        // for (let combination of this._payLine) {
        //     if (combination.symbol == SlotConfig9920.scatterSymbolCode) {
        //         this.moneyScatterWin = combination.winAmount;
        //         break;
        //     }
        // }

        // if (this._payLine.length > 0) {
        //     this.state = SLOT_GAME_STATE.SHOW_RESULT;
        //     this.slotBoard.setPaylines(this._payLine);
        //     this.hideAllBtn();
        //     this.slotBoard.allowClickSymbols(false);
        // }
        // else {
        //     this.slotBoard.allowClickSymbols(true);
        // }
    }

    showWinInfo() {
        log("this._payLine   " + JSON.stringify(this._payLine));
        if (!SlotConfig9920.isUnitTest) {
            if (this._payLine && this._payLine.length) {
                this.slotBoard.setPaylines(this._payLine);
            }
            else {
                this.startNewSession();
            }
        }
        else {
            this.testSetPaylines();
        }
        this.slotBoard.playWildsActionIdle();
    }

    startNewSession() {
        log('@@@ startNewSession ');
        this.spinButton.disable = false;
        this.state = SLOT_GAME_STATE.IDLE;
        // this.slotBoard.fadeOutLayerShowResult();

        if (this.isAutoSpin) {
            this.autoSpin();
        }
        else {
            // this.slotBoard.hideAllScatters();
            this.slotBoard.allowClickSymbols(true);
        }
    }

    onBtnSpinClicked() {
        log(`onBtnSpinClicked ${this.state}`);

        if (this.isAutoSpin) {
            this.stopAutoSpin();
            return;
        }
        this._spinOrStop();
    }

    stopAutoSpin() {
        this.numberOfAutoSpin = 0;
        this.isAutoSpin = false;
        this.spinButton.stopAutoSpin();
        (this.state == SLOT_GAME_STATE.SHOW_RESULT) && this.openAllBtn();
    }

    private _spinOrStop() {
        if ((this.state == SLOT_GAME_STATE.SPINING || this.state == SLOT_GAME_STATE.SHOW_RESULT) && this._hasResult && !this.isFTR) {
            // Reels are spining and it's already has received the results from server 
            // Go to "Fast to Result" mode
            log(`goto "Fast to Result"`);

            this.spinButton.interactable = false;

            this.isFTR = true;
            ExtAudioManager.instance.stopAllEffects();
            ExtAudioManager.instance.playEffect("sfx_f2r");

            if (this.state == SLOT_GAME_STATE.SPINING) {
                this.slotBoard.forceStop();
            }
            else if (this.state == SLOT_GAME_STATE.SHOW_RESULT) {
                this._cancelShowResultAnims();
                this.slotBoard.forceFinishShowTotalWin();
            }
            return;
        }

        if (this.state == SLOT_GAME_STATE.SPINING || this.state == SLOT_GAME_STATE.CANCEL_SHOW_RESULT) {
            return;
        }
        // if (this.state == SLOT_GAME_STATE.SHOW_RESULT) {
        //     this.state = SLOT_GAME_STATE.CANCEL_SHOW_RESULT;
        //     this.spinButton.disable = true;
        //     this.spinButton.spinState = SPIN_STATE.STOP;

        //     this._cancelShowResultAnims();
        //     return;
        // }

        if (!Director9920.instance.canSpin()) {
            Director9920.instance.showPopupNotEnoughMoney();
            this.openAllBtn();

            this.stopAutoSpin();
            return;
        }

        ExtAudioManager.instance.playEffect("sfx_spin");
        this.state = SLOT_GAME_STATE.IDLE;
        this.moneyScatterWin = 0;
        this.hideAllBtn();
        this.spin();
    }

    spin() {
        // log(`normalgame startSpin`);
        this.unscheduleAllCallbacks();

        let walletMoney = Director9920.instance.getMoneyWallet() - Director9920.instance.getCurrentBetAmount();
        this.updateWallet(walletMoney);

        if (this.isFTR) {
            // neu F2R thi hide label total win cham 1 chut de co them thoi gian user nhin
            this.scheduleOnce(() => {
                this.moneyWinBar.hideTotalWinLabel();
            }, 0.5);
        }
        else {
            this.moneyWinBar.hideTotalWinLabel();
        }

        this._hasResult = false;
        this.isFTR = false;
        SlotConfig9920.isTurboMode = this._shouldTurbo;

        this._hideSymbolHelp();

        this.spinButton.spinState = SPIN_STATE.SPINING;
        this.spinButton.disable = true;
        this.state = SLOT_GAME_STATE.SPINING;
        this.slotBoard.allowClickSymbols(false);

        this.labelTotalWin.string = "0";
        this._updateMoneyWin = false;

        this.slotBoard.startSpin();

        if (SlotConfig9920.isUnitTest) {
            this.scheduleOnce(() => {
                this.testSetSpinResults();
            }, 0.1);
        }
        else {
            Director9920.instance.spin();
            gameCommonUtils.setBetValueWithGame(SlotConfig9920.GAME_ID, Director9920.instance.getCurrentBetIndex());
        }
    }

    private _cancelShowResultAnims() {
        log(`_cancelShowResultAnims`);

        this._speedUpPlayingAnim();
        this.moneyWinBar.quickFinishShowingWinAmount(this._winAmount);
        this.unschedule(this.updateMoneyWin);

        // this.startNewSession();
        // this.spinButton.disable = false;
        // this.state = SLOT_GAME_STATE.IDLE;

        // if (!this._updateMoneyWin) {
        //     this.unschedule(this.updateMoneyWin);
        //     this.updateMoneyWin();
        // }
    }

    private _speedUpPlayingAnim() {
        let skeletonY = this.nodeAnimFishYellow?.getComponent(sp.Skeleton);
        if (skeletonY) {
            if (skeletonY.animation === 'win'
                || skeletonY.animation === 'win_coin_1'
                || skeletonY.animation === 'win_coin_2'
                || skeletonY.animation === 'win_coin_3'
            ) {
                skeletonY.timeScale = 3.0;
            }
        }

        let skeletonR = this.nodeAnimFishRed?.getComponent(sp.Skeleton);
        if (skeletonR) {
            if (skeletonR.animation === 'win'
                || skeletonR.animation === 'win_coin_3'
                || skeletonR.animation === 'win_coin_4'
                || skeletonR.animation === 'win_coin_5'
            ) {
                skeletonR.timeScale = 3.0;
            }
        }
    }

    setSpinResults(mx: any, payline: any) {
        this._mx = mx;
        this._payLine = payline;
        for (let combination of this._payLine) {
            if (combination.symbol == SlotConfig9920.scatterSymbolCode) {
                this.moneyScatterWin = combination.winAmount;
                break;
            }
        }

        this.setResultMatrixs(mx);
    }

    setResultMatrixs(mx: string[], mx0: string[] | null = null) {
        this._hasResult = true;
        this.spinButton.disable = false;
        this.slotBoard.setMatrixs(mx, mx0);
    }

    updateUIOpenReel() {
        this.slotBoard.updateUIOpenReel();
    }

    updateJackpot(valueJackpot: number) {
        utils.tweenMoney(this.labelJackpot, 3, valueJackpot);
    }

    updateWallet(money: number) {
        utils.tweenMoney(this.labelWallet, 0.5, money);
    }

    updateMoneyLabelBet() {
        this.labelMoneyBet.string = utils.formatMoney(Director9920.instance.getCurrentBetAmount());
    }

    updateMoneyWin() {
        this._updateMoneyWin = true;
        this.moneyWinBar.showTotalWinAmount(this._winAmount);
        this.updateMoneyAllWin();
    }

    updateMoneyAllWin() {
        let money = Director9920.instance.getTotalWinAmount();
        if (money > 0) {
            utils.tweenMoney(this.labelTotalWin, 0.5, money);
        } else {
            this.labelTotalWin.string = utils.formatMoney(money);
        }
    }

    onClickBtnChosenBetlevel() {
        ExtAudioManager.instance.playEffect("sfx_click_btn");
        this.spinButton.interactable = false;
        ExtScreenManager.instance.showPopupFromPrefabName("res/prefabs/popup/popup_chosen_betlevel",
            (popup: ExtBasePopup) => {
                let popupBet = popup as PopupChosenBetLevel9920;
                popupBet.setCurBetInfo(Director9920.instance.getCurrentBetIndex(), SlotConfig9920.numReelOpenFull);
                popupBet.finishedCallback = (curBetIndex: number) => {
                    log('@@@ PopupChosenBetLevel9920 finishedCallback curBetIndex = ' + curBetIndex);
                    if (curBetIndex >= 0) {
                        Director9920.instance.setBetInfo(curBetIndex);
                        this.setLabelMoneyBet();
                        this.setCurLevelDecreaseBet();
                    }
                    this.spinButton.interactable = true;
                };

            }, false, true, true);
    }

    onClickBtnDecreaseBet() {
        ExtAudioManager.instance.playEffect("sfx_click_btn");
        if (this.popupDecreaseBet) {
            this.spinButton.interactable = false;

            if (!this.popupDecreaseBet.finishedCallback) {
                this.popupDecreaseBet.finishedCallback = (curBetIndex: number) => {
                    if (curBetIndex >= 0) {
                        Director9920.instance.setBetInfo(curBetIndex);
                        this.setLabelMoneyBet();
                    }
                    this.spinButton.interactable = true;
                };
            }
            this.popupDecreaseBet.setCurBetIndex(Director9920.instance.getCurrentBetIndex());
            this.popupDecreaseBet.show();
        }
    }

    onClickAdd() {
        ExtAudioManager.instance.playEffect("sfx_click_btn");
        Director9920.instance.increaseBet();
        this.setLabelMoneyBet();
    }

    onClickMinus() {
        ExtAudioManager.instance.playEffect("sfx_click_btn");
        Director9920.instance.decreaseBet();
        this.setLabelMoneyBet();
    }

    setLabelMoneyBet() {
        this.updateMoneyLabelBet();
        this.setStateBtnBet();
    }

    setStateBtnBet() {
        if (Director9920.instance.isMaxiumBet()) {
            this.btnMinus.getComponent(Button).interactable = true;
            this.btnAdd.getComponent(Button).interactable = false;
            return;
        }
        if (Director9920.instance.isMiniumBet()) {
            this.btnMinus.getComponent(Button).interactable = false;
            this.btnAdd.getComponent(Button).interactable = true;
            return;
        }
        this.btnMinus.getComponent(Button).interactable = true;
        this.btnAdd.getComponent(Button).interactable = true;
    }

    setCurLevelDecreaseBet() {
        this.popupDecreaseBet && this.popupDecreaseBet.setCurSprContent(5 - SlotConfig9920.numReelOpenFull);
    }

    disableAllBtnBet() {
        // this.btnAdd.setOpacity(150);
        // this.btnMinus.setOpacity(150);
        this.btnMinus.getComponent(Button).interactable = false;
        this.btnAdd.getComponent(Button).interactable = false;
    }

    onBtnTurboClicked() {
        ExtAudioManager.instance.playEffect("sfx_quick_spin");

        this._shouldTurbo = !this._shouldTurbo;
        if (this._shouldTurbo) {
            this.btnTurbo.normalSprite = ExtScreenManager.instance.assetBundle.get('res/images/buttons/bt_turbo_on/spriteFrame', SpriteFrame);
            // this.btnTurbo.pressedSprite = ExtScreenManager.instance.assetBundle.get('res/images/buttons/btn_turbo_off/spriteFrame', SpriteFrame);
            this.btnTurbo.hoverSprite = ExtScreenManager.instance.assetBundle.get('res/images/buttons/bt_turbo_on_hover/spriteFrame', SpriteFrame);
        }
        else {
            this.btnTurbo.normalSprite = ExtScreenManager.instance.assetBundle.get('res/images/buttons/bt_turbo_off/spriteFrame', SpriteFrame);
            // this.btnTurbo.pressedSprite = ExtScreenManager.instance.assetBundle.get('res/images/buttons/btn_turbo/spriteFrame', SpriteFrame);
            this.btnTurbo.hoverSprite = ExtScreenManager.instance.assetBundle.get('res/images/buttons/bt_turbo_off_hover/spriteFrame', SpriteFrame);
        }

    }

    autoSpin() {
        this.numberOfAutoSpin--;
        this.spinButton.lbAutospinNumber.string = this.numberOfAutoSpin + "";
        if (this.numberOfAutoSpin == 0) {
            this.stopAutoSpin();
        }
        this._spinOrStop();
    }

    onClickBtnAutoSpin() {
        if (this.state != SLOT_GAME_STATE.IDLE) {
            return;
        }
        ExtAudioManager.instance.playEffect("sfx_click_btn");
        this.spinButton.interactable = false;
        ExtScreenManager.instance.showPopupFromPrefabName("res/prefabs/popup/popup_auto_spin", (popup: ExtBasePopup) => {
            let popupAutospin = popup as PopupAutoSpin9920;
            popupAutospin.finishedCallback = (value: number) => {
                if (value > 0) {
                    this.numberOfAutoSpin = value;
                    this.isAutoSpin = true;
                    this.spinButton.switchToAutoSpin(this.numberOfAutoSpin);
                    this.scheduleOnce(() => {
                        this.spinButton.interactable = true;
                        this.autoSpin();
                    }, 0.5);
                }
                else {
                    this.spinButton.interactable = true;
                }
            };
        }, false, true, true);
    }

    onClickBtnJackpot() {
        ExtAudioManager.instance.playEffect("sfx_click_btn");
        let jackpotPopupScreen = ExtScreenManager.instance.assetBundle.get('res/prefabs/popup/history_jackpot/popup_history_jackpot', Prefab)!;
        ExtScreenManager.instance.pushScreen(jackpotPopupScreen, (screen: ExtBaseScreen) => { });
    }

    hideAllBtn() {
        this.btnAuto.interactable = false;
        this.btnDecreaseBet.interactable = false;
        this.btnClickChosenBetlevel.interactable = false;
        this.btnClickHistory.interactable = false;
        this.btnMenu.interactable = false;
        this.btnJackpot.interactable = false;
        this.btnMenu.node.setOpacity(150);
        this.disableAllBtnBet();
    }

    openAllBtn() {
        this.btnAuto.interactable = true;
        this.btnDecreaseBet.interactable = true;
        this.btnClickChosenBetlevel.interactable = true;
        this.btnClickHistory.interactable = true;
        this.btnMenu.interactable = true;
        this.btnJackpot.interactable = true;
        this.btnMenu.node.setOpacity(255);
        this.setStateBtnBet();
    }

    onClickedSymbol(board: ExtSlotBoard, column: number, row: number) {
        log(`onClickedSymbol`);
        ExtAudioManager.instance.playEffect("sfx_click_btn");
        let symbol = this.slotBoard.getSymbolAtIndex(column, row);
        let symbolCode = symbol.symbolCode;
        if (symbolCode.length > 1) return;

        this._hideSymbolHelp();

        let prefabName = 'res/prefabs/popup/show_symbol/popup_symbol_normal';
        if (symbolCode == SlotConfig9920.wildSymbolCode) {
            prefabName = 'res/prefabs/popup/show_symbol/popup_symbol_wild';
        } else if (symbolCode == SlotConfig9920.scatterSymbolCode) {
            prefabName = 'res/prefabs/popup/show_symbol/popup_symbol_scatter';
        }

        let prefab = ExtScreenManager.instance.assetBundle.get(prefabName, Prefab);
        let symbolHelpNode = instantiate(prefab);
        let popupInfo = symbolHelpNode.getComponent(PopupSymbolInfo9920);
        let pos = utils.getPostionInOtherNode(this, symbol.node) as Vec3;
        popupInfo.mapPosition(pos);
        popupInfo.setData(symbolCode, column > 2);
        popupInfo.hideCallback = () => {
            this._hideSymbolHelp();
            this.slotBoard.fadeOutLayerShowResult();
        };
        this.node.addChild(symbolHelpNode);
        this.slotBoard.fadeInLayerShowResult();
        this._symbolHelpNode = symbolHelpNode;
    }

    private _hideSymbolHelp() {
        if (this._symbolHelpNode) {
            this._symbolHelpNode.removeFromParent();
            this._symbolHelpNode.destroy();
            this._symbolHelpNode = null;
        }
    }

    switchToNormalMode() {
        log('@@@ Normal Game: switchToNormalMode');
        this.spinButton.disable = true;
        this.openAllBtn();

        utils.fadeIn(this.slotBoard.node, 0.25);
        this._resetAnimFish();

        this.scheduleOnce(() => {
            this.moneyWinBar.showTotalWinAmount(Director9920.instance.getTotalWinAmount());
            this.updateMoneyAllWin();
        }, 0.25);

        this.moneyScatterWin = 0;

        // if (this._payLine && this._payLine.length) {
        //     this.slotBoard.setPaylines(this._payLine, false);
        // }
        this.slotBoard.reset();

        this.scheduleOnce(() => {
            this.startNewSession();
        }, 2);
    }

    switchToFreeSpinMode() {
        log("@@@ Normal Game: switchToFreeSpinMode");
        this.spinButton.spinState = SPIN_STATE.STOP;
        this.spinButton.disable = true;
        SlotConfig9920.isTurboMode = this._shouldTurbo;

        let sequenceTasks = new ExtSequenceTask();
        sequenceTasks.setKey('show_scatter_win_anim');

        let task = new ExtBaseTask(this.slotBoard, this.slotBoard.focusAllScatters, [], 0);
        sequenceTasks.pushTask(task);

        task = new ExtBaseTask(this, () => {
            // this.slotBoard.fadeOutLayerShowResult();
            utils.fadeOut(this.slotBoard.node, 0.5);
        }, [], 2.1);
        sequenceTasks.pushTask(task);

        task = new ExtBaseTask(this, this._2FishMoveToWaterfall, [], 0.25);
        sequenceTasks.pushTask(task);

        task = new ExtBaseTask(this, this._showTransitionToChooseWild, [], 2);
        sequenceTasks.pushTask(task);

        task = new ExtBaseTask(this, this._releaseScatterWin, [], 3);
        sequenceTasks.pushTask(task);

        ExtAsyncTaskMgr.instance.executeTask(sequenceTasks);
    }

    _2FishMoveToWaterfall() {
        this.nodeAnimFishYellow.setRotationFromEuler(0, 0, -15);
        this.nodeAnimFishRed.setRotationFromEuler(0, 0, 15);
        this._moveAnimFish(this.nodeAnimFishYellow, v3(120, 0, 0));
        this._moveAnimFish(this.nodeAnimFishRed, v3(-120, 0, 0));
    }

    private _moveAnimFish(nodeAnim: Node, offset?: Vec3) {
        let ranTimeScale = Math.random() + 2; // 2->3

        nodeAnim.active = true;
        let anim = nodeAnim?.getComponent(sp.Skeleton);
        anim && (anim.timeScale = ranTimeScale);

        let time_eff = Math.random() / 2 + 1.5;  // 1.5-> 2
        tween(nodeAnim)
            .parallel(
                tween().by(time_eff, { position: v3(0, 700, 0).add(offset) }, { easing: 'linear' }),
                tween().to(time_eff, { scale: new Vec3(0.3, 0.3, 0.3) })
            )
            .start();

        this.scheduleOnce(() => {
            anim && (anim.timeScale = 1.0);
            nodeAnim.active = false;
        }, 2.0);
    }

    _resetAnimFish() {
        this.nodeAnimFishYellow.setRotationFromEuler(0, 0, 0);
        this.nodeAnimFishRed.setRotationFromEuler(0, 0, 0);

        this.nodeAnimFishYellow.setPosition(this._posOriginFishYellow);
        this.nodeAnimFishRed.setPosition(this._posOriginFishRed);

        this.nodeAnimFishYellow.active = true;
        this.nodeAnimFishRed.active = true;

        this.nodeAnimFishYellow.setScale(new Vec3(1, 1, 1));
        this.nodeAnimFishRed.setScale(new Vec3(1, 1, 1));
    }

    _playAnimFishWin(winAmount: number) {
        if (this.moneyScatterWin > 0) {
            // 2 fish circle win
            this._playAnimCircleSwimming(this.nodeAnimFishYellow);
            this._playAnimCircleSwimming(this.nodeAnimFishRed);
            return 0;
        }

        let type = 1;
        let ratio = winAmount / Director9920.instance.getCurrentBetAmount();
        if (ratio < 1) {
            // 1 fish win
            let ran = Math.random();
            if (ran < 0.5) {
                let coinId = Math.floor(Math.random() * 3 + 1);
                this._playAnimWinOfFish(this.nodeAnimFishYellow, coinId);
            } else {
                let coinId = Math.floor(Math.random() * 3 + 3);
                this._playAnimWinOfFish(this.nodeAnimFishRed, coinId);
            }
        } else if (ratio <= 2) {
            // 2 fish win
            let coinId_Y = Math.floor(Math.random() * 3 + 1);
            this._playAnimWinOfFish(this.nodeAnimFishYellow, coinId_Y);
            let coinId_R = Math.floor(Math.random() * 3 + 3);
            this._playAnimWinOfFish(this.nodeAnimFishRed, coinId_R);
        } else {
            // 2 fish circle win
            this._playAnimCircleSwimming(this.nodeAnimFishYellow);
            this._playAnimCircleSwimming(this.nodeAnimFishRed);
            type = 0;
        }
        return type;
    }

    _playAnimFishWinTest() {
        let sd = this._countFishWin % 4;
        if (sd == 0) {
            this._playAnimCircleSwimming(this.nodeAnimFishYellow);
            this._playAnimCircleSwimming(this.nodeAnimFishRed);
        } else if (sd == 1) {
            let id = Math.floor(Math.random() * 3 + 1);
            this._playAnimWinOfFish(this.nodeAnimFishYellow, id);
            // this._idTestAnim++;
            // this._playAnimWinOfFish(this.nodeAnimFishYellow, this._idTestAnim);
        } else if (sd == 2) {
            let id = Math.floor(Math.random() * 3 + 3);
            this._playAnimWinOfFish(this.nodeAnimFishRed, id);
            // this._idTestAnim++;
            // this._playAnimWinOfFish(this.nodeAnimFishRed, this._idTestAnim);
        } else {
            let idY = Math.floor(Math.random() * 3 + 1);
            this._playAnimWinOfFish(this.nodeAnimFishYellow, idY);
            let idR = Math.floor(Math.random() * 3 + 3);
            this._playAnimWinOfFish(this.nodeAnimFishRed, idR);
        }
        this._countFishWin++;

        return sd;
    }

    _playAnimWinOfFish(node: Node, coinId: number) {
        let skeleton = node?.getComponent(sp.Skeleton);
        if (skeleton) {
            skeleton.clearTracks();
            let spineEntry = skeleton.setAnimation(0, 'win_coin_' + coinId, false);
            spineEntry.timeScale = 1.5;
            // track event
            skeleton.setTrackEventListener(spineEntry, (x: any, ev: any) => {
                if (ev && ev.data && ev.data.name && ev.data.name == 'coin') {
                    let coinAnim = this.listAnimCoinWin[coinId - 1]?.getComponent(sp.Skeleton);
                    if (coinAnim) {
                        coinAnim.clearTracks();
                        coinAnim.setAnimation(0, 'win', false);
                    }
                }
            });

            // track complete
            skeleton.setTrackCompleteListener(spineEntry, (x: any, ev: any) => {
                skeleton.clearTracks();
                skeleton.setAnimation(0, 'animation', true);
                skeleton.timeScale = 1.0;
            });
        }

    }

    _playAnimCircleSwimming(node: Node) {
        let skeleton = node?.getComponent(sp.Skeleton);
        if (skeleton) {
            skeleton.timeScale = 1.5;
            skeleton.clearTracks();
            let spineEntry = skeleton.setAnimation(0, 'win', false);
            skeleton.setTrackCompleteListener(spineEntry, (x: any, ev: any) => {
                skeleton.clearTracks();
                skeleton.setAnimation(0, 'animation', true);
                skeleton.timeScale = 1.0;
            });
        }
    }

    private _showPopupBigWin(callback?: any) {
        this.spinButton.interactable = false;
        ExtScreenManager.instance.showPopupFromPrefabName("res/prefabs/popup/popup_mega_win", (popup: ExtBasePopup) => {
            let popupWin = popup as PopupMegaWin9920;
            let moneyWin = this._winAmount;
            popupWin.betAmount = Director9920.instance.currentBetInfo.betAmount;
            popupWin.winAmount = moneyWin;
            popupWin.autoHide = this.isAutoSpin;
            popupWin.hideCallback = () => {
                callback && callback();
                this.spinButton.interactable = true;
            };
        }, true, true, true);
    }

    private _showTransitionToChooseWild() {
        log("_showTransitionToChooseWild");
        let pfFxTran = ExtScreenManager.instance.assetBundle.get('res/vfx/prefabs/transition_water_fall', Prefab)!;
        let node = instantiate(pfFxTran);
        let fxTransition = node.getComponent(FxTransition9920);
        ExtScreenManager.instance.showEffect(node);
        fxTransition?.transition2ChooseWild();
    }

    private _releaseScatterWin() {
        log(`_releaseScatterWin`);
        this.spinButton.spinState = SPIN_STATE.IDLE;
        this.spinButton.disable = false;
        this.state = SLOT_GAME_STATE.IDLE;

        this.slotBoard.resetScatterSymbols();
        this.slotBoard.resetWildSymbols();
        this.slotBoard.playAllSymbolsActionIdle();
    }

    /// Unit test methods
    private _countSpinTest = 0;
    private _idxUnitTest = 0;
    private _unitTestData = [
        {
            "matrix0": ["5", "8", "6", "8", "3", "6", "7", "8", "6", "6", "6", "3", "A", "2", "4"],
            "normalPayLine": [
                { "symbol": "8", "winAmount": 50, "winReelCount": 3, "combinationCount": 1, "payTable": 5, "multiple": 1, "hasWild": false },
                { "symbol": "6", "winAmount": 1200, "winReelCount": 4, "combinationCount": 2, "payTable": 15, "multiple": 1, "hasWild": false }
            ]
        }
        ,
        {
            "matrix0": ["5", "8", "6", "8", "3", "6", "7", "8", "6", "6", "6", "3", "A", "2", "4"],
            "normalPayLine": [
                { "symbol": "8", "winAmount": 50, "winReelCount": 3, "combinationCount": 1, "payTable": 5, "multiple": 1, "hasWild": false },
                { "symbol": "6", "winAmount": 1300000, "winReelCount": 4, "combinationCount": 2, "payTable": 40, "multiple": 1, "hasWild": false }
            ]
        }
        ,
        {
            "matrix0": ["5", "7", "A", "8", "A", "7", "7", "A", "7", "4", "2", "4", "8", "6", "7"],
            "normalPayLine": [
                { "symbol": "7", "winAmount": 150, "winReelCount": 3, "combinationCount": 1, "payTable": 15, "multiple": 1, "hasWild": false },
                { "symbol": "A", "winAmount": 1500000, "winReelCount": 3, "combinationCount": 1, "payTable": 20, "multiple": 1, "hasWild": false }
            ]
        }
        ,
        {
            "matrix0": ["5", "7", "A", "8", "2", "7", "7", "A", "7", "4", "A", "4", "8", "6", "7"],
            "normalPayLine": [
                { "symbol": "7", "winAmount": 150, "winReelCount": 3, "combinationCount": 1, "payTable": 15, "multiple": 1, "hasWild": false }
            ]
        },
        // {
        //     "matrix0": ["A", "3", "2", "7", "A", "2", "K", "A", "2", "9", "3", "K", "6", "2", "A"],
        //     "normalPayLine": [
        //         { "symbol": "2", "winAmount": 5000, "winReelCount": 4, "combinationCount": 4, "payTable": 10 },
        //         { "symbol": "A", "winAmount": 5000, "winReelCount": 3, "combinationCount": 4, "payTable": 10 },
        //     ]
        // }
    ];

    testSetSpinResults() {
        let mx: string[] = [];

        // this._idxUnitTest = this._countSpinTest % this._unitTestData.length;
        this._idxUnitTest = 0;
        log('@@@ this._idxUnitTest = ' + this._idxUnitTest);
        // this._idxUnitTest = Math.floor(Math.random() * this._unitTestData.length);
        mx = this._unitTestData[this._idxUnitTest].matrix0;
        log(`${JSON.stringify(this._unitTestData[this._idxUnitTest])}`);
        this._payLine = this._unitTestData[this._idxUnitTest].normalPayLine;

        for (let combination of this._payLine) {
            if (combination.symbol == SlotConfig9920.scatterSymbolCode) {
                this.moneyScatterWin = combination.winAmount;
                break;
            }
        }

        this.setResultMatrixs(mx);
        this._countSpinTest++;
    }

    testSetPaylines() {
        this.slotBoard.setPaylines(this._payLine);
    }
}

