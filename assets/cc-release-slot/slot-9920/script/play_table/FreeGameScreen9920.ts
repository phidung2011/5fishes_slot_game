import { log, Vec2, Vec3, sp, Node, Label, _decorator, v3, Tween, tween } from 'cc';
import { SlotBoardDelegate, ExtSlotBoard } from '../../../../cc-slot-common/ext-slot/ExtSlotBoard';
import { SLOT_GAME_STATE } from '../../../../cc-slot-common/ext-slot/ExtSlotGame';
import ExtBaseScreen from '../../../../ext-framework/ui/ExtBaseScreen';
import ExtScreenManager from '../../../../ext-framework/ui/ExtScreenManager';
import { SlotBoard9920 } from '../base_slot/SlotBoard9920';
import { SlotConfig9920Type, SlotConfig9920 } from '../base_slot/SlotConfig9920';
import { SpinButton9920 } from '../base_slot/SpinButton9920';
import { Director9920 } from '../core/Director9920';
import * as utils from '../../../../cc-common/cc-share/common/utils';
import { PopupMegaWin9920 } from '../popup/PopupMegaWin9920';
import { Prefab, instantiate } from 'cc';
import { SPIN_STATE } from '../../../../cc-slot-common/ext-slot/ExtSpinButton';
import ExtBasePopup from '../../../../ext-framework/ui/ExtBasePopup';
import ExtControlEvent from '../../../../ext-framework/ui/ExtControlEvent';
import SlotUtils9920 from '../base_slot/SlotUtils9920';
import { PopupTotalWin9920 } from '../popup/PopupTotalWin9920';
import { FxTransition9920 } from './FxTransition9920';
import { ExtAudioManager } from '../../../../ext-framework/ExtAudioManager';
import ExtAsyncTaskMgr from '../../../../ext-framework/async_task/ExtAsyncTaskMgr';
import ExtBaseTask from '../../../../ext-framework/async_task/ExtBaseTask';
import ExtSequenceTask from '../../../../ext-framework/async_task/ExtSequenceTask';
import ExtUtils from '../../../../ext-framework/ExtUtils';
import { PopupJackpotWin9920 } from '../popup/PopupJackpotWin9920';
import { FxTransitionFlash9920 } from '../popup/FxTransitionFlash9920';
import { MoneyWinBar9920 } from './MoneyWinBar9920';


const { ccclass, property } = _decorator;

@ccclass('FreeGameScreen9920')
export class FreeGameScreen9920 extends ExtBaseScreen implements SlotBoardDelegate {

    @property(SlotBoard9920)
    protected slotBoard: SlotBoard9920 = null!;

    @property(Node)
    nodeAnimLotus: Node = null!;

    @property(Node)
    nodeVfxLotus: Node = null!;

    @property(Node)
    animFishYellow: Node = null!;

    @property(Node)
    animFishRed: Node = null!;

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

    @property(Label)
    lbCurFreeSpin: Label = null!;

    @property(Label)
    lbMulti: Label = null!;

    @property(Node)
    sprGold: Node = null!;

    @property(Label)
    lbReactiveFree: Label = null!;

    @property(Node)
    vfxLightIdle: Node = null!;

    @property(Node)
    vfxLightHut: Node = null!;

    @property(Node)
    animGold: Node = null!;

    @property(Node)
    animGoldEat: Node = null!;

    public state: SLOT_GAME_STATE = SLOT_GAME_STATE.IDLE;
    private _hasResult: boolean = false;

    private _mx: any = [];
    private _payLine: any = [];

    moneyScatterWin: number = 0;
    multiValue: number = 1;

    private _showedMoneyWin: boolean = false;
    private _needUpdateJackpot: boolean = true;
    private _winAmount: number = 0;
    private _curFreeSpin: number = 0;
    private _posOldLbMulti: Vec3 = Vec3.ZERO;

    private _posOriginFishYellow: Vec3 = Vec3.ZERO;
    private _posOriginFishRed: Vec3 = Vec3.ZERO;

    private _isReactive: boolean = false;

    // Slot Boar delegate methods - BEGIN

    public isFTR = false;
    slotConfig: SlotConfig9920Type = SlotConfig9920;

    allowNearWin() {
        return false;
    }

    allowShowPayline(): boolean {
        return !SlotConfig9920.isTurboMode;
    }

    boardDidStopSpining(board: ExtSlotBoard) {
        log(`FreeGameScreen: boardDidStopSpining`);

        this.spinButton.disable = false;
        this.spinButton.spinState = SPIN_STATE.IDLE;
        this.state = SLOT_GAME_STATE.SHOW_RESULT;

        let isNeedShowJP = !SlotConfig9920.isUnitTest ? Director9920.instance.isJackpotWin() : 0;
        if (isNeedShowJP) {
            this.showJackpot(this.showWinInfo.bind(this));
        } else {
            this.showWinInfo();
        }
    }

    boardWillShowTotalWin(board: ExtSlotBoard, amount: number, exInfo: object | null): void {
        this._winAmount = amount;
        let hasWild = false;
        exInfo && (hasWild = exInfo['hasWild']);

        log(`boardWillShowTotalWin: ${amount} - hasWild: ${hasWild}`);
        if (this.isFTR) {
            this.quickShowWinAmount();
            return;
        }

        if (hasWild) {
            this._showMultiWin(this._winAmount, () => {
                this._showedMoneyWin = true;
                this.moneyWinBar.showSpecialXWinAmount(this._winAmount);
                this.updateMoneyAllWin();
            });
        } else {
            this._showedMoneyWin = true;
            this.moneyWinBar.showTotalWinAmount(this._winAmount);
            this.updateMoneyAllWin();
        }
    }

    boardDidShowTotalWin(board: ExtSlotBoard, amount: number, exInfo: object | null): void {
        log(`boardDidShowTotalWin: ${amount}`);
        if (this.moneyScatterWin) {
            this.spinButton.interactable = false;
            this._showEffReactiveFree(() => {
                this.spinButton.interactable = true;
                this.showBigWinIfNeed(amount, this.newSessionIfNeedAfterShowBigWin.bind(this));
            });
        } else {
            this.showBigWinIfNeed(amount, this.newSessionIfNeedAfterShowBigWin.bind(this));
        }
    }

    boardShowPayline(board: ExtSlotBoard, plIndex: number, amount: number, exInfo: object | null): void {
        log(`boardShowPayline: ${plIndex} - ${amount}`);
        if (plIndex === this._payLine.length - 1) {
            (!SlotUtils9920.isBigWin(this._winAmount)) && (!SlotConfig9920.isTurboMode) && this.startNewSession();
        }
    }

    // Slot Boar delegate methods - END

    onLoad() {
        this.lbMulti && (this._posOldLbMulti = this.lbMulti.node.getPosition());
        this.slotBoard.boardDelegate = this;
        this.slotBoard.allowClickSymbols(false);
        Director9920.instance.freeGameScreen = this;
        Director9920.instance.updateCurrentJackpot();
        this.updateWallet(Director9920.instance.getMoneyWallet());

        this._posOriginFishYellow = this.animFishYellow.getPosition();
        this._posOriginFishRed = this.animFishRed.getPosition();

        if (SlotConfig9920.isUnitTest) {
            this._curFreeSpin = 2;
        } else {
            this._curFreeSpin = Director9920.instance.getNumberFreeSpin();
        }
        log(`_curFreeSpin = ${this._curFreeSpin}`);
    }

    onEnable() {
        this.spinButton.node.on(ExtControlEvent.SpinButtonClick, this.onBtnSpinClicked, this);
        this.node.on(ExtControlEvent.ScreenDidAppear, this.screenDidAppear, this);
    }

    onDisable() {
        this.spinButton.node.off(ExtControlEvent.SpinButtonClick, this.onBtnSpinClicked, this);
        this.node.off(ExtControlEvent.ScreenDidAppear, this.screenDidAppear, this);
    }

    screenDidAppear() {
    }

    start() {
        this.setLabelMoneyBet();
        this.updateUIOpenReel();
        this._showEffReactiveFree();

        this.scheduleOnce(() => {
            log('@@@@@ ExtScreenManager.instance.removeAllEffects');
            ExtScreenManager.instance.removeAllEffects();
        }, 1.5);

        this.playAnimIdleLotus();

        this.playAnimFish();
        this.randomSpeedFishAnim();
        this.updateMoneyAllWin();
        this.updateRemainFreeSpin();

        this._showBoardGame();
    }

    private _showBoardGame() {
        log(`_showBoardGame: ${JSON.stringify(Director9920.instance.playerState)}`);
        if (SlotConfig9920.isUnitTest) {
            this.slotBoard.randomSymbols();
            this.slotBoard.playAllSymbolsActionIdle();
            this.slotBoard.playAllSymbolsActionIdle();

            this.scheduleOnce(() => {
                this.spin();
            }, 1.5);
            return;
        }

        if (Director9920.instance.playerState.freeMatrix) {
            // resume game
            let matrix = Director9920.instance.playerState.freeMatrix;
            let payline = Director9920.instance.playerState.freePayLine;
            this.resumeFreeGame(matrix, payline);
        }
        else {
            let matrix = Director9920.instance.playerState.normalMatrix;
            this.slotBoard.setPreviousMatrix(matrix);
            this.slotBoard.playAllSymbolsActionIdle();

            this.scheduleOnce(() => {
                this.spin();
            }, 1.5);
        }
    }

    resumeFreeGame(matrix: any, payline: any) {
        log("resumeFreeGame  callback " + JSON.stringify(matrix) + JSON.stringify(payline));
        this.slotBoard.setPreviousMatrix(matrix);
        this.slotBoard.playAllSymbolsActionIdle();

        payline ? this._payLine = payline : this._payLine = [];

        for (let combination of this._payLine) {
            this.multiValue = combination.multiple;
            if (combination.symbol == SlotConfig9920.scatterSymbolCode) {
                this.moneyScatterWin = combination.winAmount;
                break;
            }
        }

        if (this._payLine.length > 0) {
            this.state = SLOT_GAME_STATE.SHOW_RESULT;
            this.slotBoard.setPaylines(this._payLine);
        } else {
            this.scheduleOnce(() => {
                this.spin();
            }, 2.0);
        }
    }

    playAnimIdleLotus() {
        log('@@@ playAnimIdleLotus');
        let animLotus = this.nodeAnimLotus?.getComponent(sp.Skeleton);
        if (animLotus) {
            animLotus.clearTracks();
            animLotus.timeScale = 1;
            animLotus.setAnimation(0, 'idle', true);
        }

        // let vfxLotus = this.nodeVfxLotus?.getComponent(sp.Skeleton);
        // if (vfxLotus) {
        //     vfxLotus.node.active = true;
        //     vfxLotus.clearTracks();
        //     vfxLotus.setAnimation(0, 'action', true);
        // }
    }

    playAnimWinLotus(finishCallback: any) {
        ExtAudioManager.instance.playEffect("sfx_multiply");
        let animLotus = this.nodeAnimLotus?.getComponent(sp.Skeleton);
        if (animLotus) {
            animLotus.clearTracks();
            let spineEntry = animLotus.setAnimation(0, 'action', false);
            animLotus.setTrackCompleteListener(spineEntry, (x: any, ev: any) => {
                this.playAnimIdleLotus();
            });
        }

        let vfxLotus = this.nodeVfxLotus?.getComponent(sp.Skeleton);
        if (vfxLotus) {
            vfxLotus.node.active = true;
            vfxLotus.clearTracks();
            let entry = vfxLotus.setAnimation(0, 'action', false);

            vfxLotus.setTrackEventListener(entry, (x: any, ev: any) => {
                if (ev && ev.data && ev.data.name && ev.data.name == 'nhan') {
                    this.showMultiInLotus(finishCallback);
                }
            });
        }
    }

    private showMultiInLotus(finishCallback: any) {
        log('@@@ _showMultipleAction');
        if (this.lbMulti) {
            // lock btn Spin
            this.spinButton.interactable = false;

            this.lbMulti.string = 'x' + this.multiValue;
            this.lbMulti.node.scale = new Vec3(0.1, 0.1, 1);
            this.lbMulti.node.setOpacity(0);
            this.lbMulti.node.active = true;

            let fr2TimeScale = this.isFTR ? 0.2 : 1;

            log('@@@ showMultiInLotus');
            utils.fadeIn(this.lbMulti.node, 0.45 * fr2TimeScale);
            let tweenMain = tween(this.lbMulti.node)
                .to(0.25 * fr2TimeScale, { scale: new Vec3(1.5, 1.5, 1) }, { easing: 'quintOut' })
                .to(0.5 * fr2TimeScale, { scale: new Vec3(1, 1, 1) }, { easing: 'quintInOut' })
                .delay(1 * fr2TimeScale)
                .call(() => {
                    this._multiNumberFly(finishCallback);
                });

            tweenMain.start();
        }
    }

    _multiNumberFly(finishCallback: any) {
        let timeMoveToBoard = this.isFTR ? 0.05 : 0.15;
        console.log('@@@ _multiNumberFly');
        let posTarget = this.moneyWinBar.node.getPosition();

        let tweenHide = tween(this.lbMulti.node)
            .parallel(
                tween().to(timeMoveToBoard, { scale: new Vec3(0.8, 0.8, 0.8) }),
                tween().to(timeMoveToBoard, { position: new Vec3(posTarget.x, posTarget.y, posTarget.z) }),
            )
            .call(() => {
                finishCallback && finishCallback();

                // unlock btn Spin
                this.spinButton.interactable = true;

                utils.fadeOut(this.lbMulti.node, 0.25, {
                    onComplete: () => {
                        this._resetLbMulti();
                    }
                });
            });

        tweenHide.start();
    }

    private _resetLbMulti() {
        this.lbMulti.node.active = false;
        this.lbMulti.node.setPosition(this._posOldLbMulti);
    }

    private quickShowWinAmount() {
        this._showedMoneyWin = true;
        this.moneyWinBar.quickFinishShowingWinAmount(this._winAmount);
        this.updateMoneyAllWin();
    }

    private _cancelShowResultAnims() {
        log(`_cancelShowResultAnims`);
        let showMultiWinTask = ExtAsyncTaskMgr.instance.getTaskByKey('show_multi_win');
        if (showMultiWinTask) {
            ExtAsyncTaskMgr.instance.removeTaskByKey('show_multi_win');
            if (showMultiWinTask.completedTask === 0) {
                this.quickShowWinAmount();
            } else {
                this.speedUpAnimLotus();
            }
        }
    }

    private speedUpAnimLotus() {
        let animLotus = this.nodeAnimLotus?.getComponent(sp.Skeleton);
        if (animLotus && animLotus.animation === 'action') {
            animLotus.timeScale = 5.0;
        }

        let vfxLotus = this.nodeVfxLotus?.getComponent(sp.Skeleton);
        if (vfxLotus && vfxLotus.animation === 'action') {
            vfxLotus.timeScale = 5.0;
        }
    }

    playAnimFish() {
        let animFY = this.animFishYellow?.getComponent(sp.Skeleton);
        animFY && (animFY.setAnimation(0, 'animation', true));

        let animFR = this.animFishRed?.getComponent(sp.Skeleton);
        animFR && (animFR.setAnimation(0, 'animation', true));
    }

    randomSpeedFishAnim() {
        log('@@@ randomSpeedFishAnim');
        let timeY = Math.random() * 0.5 + 1;
        let timeR = Math.random() * 0.5 + 1;

        let animFY = this.animFishYellow?.getComponent(sp.Skeleton);
        if (animFY) {
            animFY.timeScale = timeY;
        }

        let animFR = this.animFishRed?.getComponent(sp.Skeleton);
        if (animFR) {
            animFR.timeScale = timeR;
        }

        this.schedule(this.randomSpeedFishAnim, 5);
    }

    showJackpot(finishCallback: any) {
        this.spinButton.interactable = false;
        this._needUpdateJackpot = false;
        // this.showJackpotResult(123456789, () => {
        this.showJackpotResult(Director9920.instance.getMoneyJackpotWin(), () => {
            this._resetGameAfterWinJP();
            this.spinButton.interactable = true;
            this._needUpdateJackpot = true;
            Director9920.instance.updateCurrentJackpot();
            this.updateMoneyAllWin();
            finishCallback && finishCallback();
        });
    }

    showBigWinIfNeed(amount: number, callback: any) {
        if (SlotUtils9920.isBigWin(amount)) {
            // this.slotBoard.stopShowPaylines();
            this._showPopupBigWin(() => {
                callback && callback(1);
            });
        } else {
            callback && callback(0);
        }
    }

    newSessionIfNeedAfterShowBigWin(isBigWin: boolean) {
        if (isBigWin || SlotConfig9920.isTurboMode) this.startNewSession();
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
        if (this._curFreeSpin < 0) return;
        log('@@@ startNewSession');
        this.spinButton.disable = true;
        this.state = SLOT_GAME_STATE.IDLE;

        // auto spin
        (!SlotConfig9920.isUnitTest) && (this._curFreeSpin = Director9920.instance.getNumberFreeSpin());
        if (this._curFreeSpin <= 0) {
            this._curFreeSpin--;
            this.slotBoard.unscheduleAllCallbacks();
            this.showPopupTotalWinIfNeed();
            return;
        }

        this.slotBoard.fadeOutLayerShowResult();
        this.slotBoard.playAllSymbolsActionIdle();

        this.moneyWinBar.hideTotalWinLabel();

        this.moneyScatterWin = 0;
        this._winAmount = 0;
        this.multiValue = 1;
        this._showedMoneyWin = false;
        this.spin();
    }

    showPopupTotalWinIfNeed() {
        log('@@@ show Popup TotalWin');
        let totalMoneyWin = Director9920.instance.getTotalWinAmount();
        // let totalMoneyWin = 123456;
        if (totalMoneyWin && totalMoneyWin > Director9920.instance.getCurrentBetAmount() * SlotUtils9920.moneyShowEffectConfig[0]) {
            ExtScreenManager.instance.showPopupFromPrefabName("res/prefabs/popup/popup_total_win", (popup: ExtBasePopup) => {
                let popupDisplay = popup as PopupTotalWin9920;

                popupDisplay.showAnimWin(totalMoneyWin, () => {
                    this.switchToOtherScreen();
                });
            }, false, true, true);
        } else {
            this.switchToOtherScreen();
        }
    }

    switchToOtherScreen() {
        this.fadeGUIs();
        if (SlotConfig9920.freeOptionRemain > 0) {
            this._transition2ChooseWild();
        } else {
            this._transition2Normal();
        }
        this.scheduleOnce(this.moveFishAndLotus, 0.6);
    }

    fadeGUIs() {
        let timeFadeOut = 0.25;
        let guiBoardControl = this.node.getChildByName('gui_board_control');
        utils.fadeOut(guiBoardControl, timeFadeOut);
        utils.fadeOut(this.slotBoard.node, timeFadeOut);
        utils.fadeOut(this.moneyWinBar.node, timeFadeOut);
    }

    moveFishAndLotus() {
        let guiLotus = this.node.getChildByName('gui_lotus');
        this._movingByWaterFall(guiLotus);
        this._movingByWaterFall(this.animFishYellow);
        this._movingByWaterFall(this.animFishRed);
    }

    private _movingByWaterFall(node: Node) {
        let time_eff = 0.35;
        tween(node)
            .by(time_eff, { position: v3(0, -600, 0) }, { easing: 'linear' })
            .start();
    }

    private _transition2ChooseWild() {
        let pfFxTran = ExtScreenManager.instance.assetBundle.get('res/vfx/prefabs/transition_water_fall', Prefab)!;
        let node = instantiate(pfFxTran);
        ExtScreenManager.instance.showEffect(node);
        node.getComponent(FxTransition9920)?.transition2ChooseWild();
    }

    private _transition2Normal() {
        let pfFxTran = ExtScreenManager.instance.assetBundle.get('res/vfx/prefabs/transition_water_fall', Prefab)!;
        let node = instantiate(pfFxTran);
        ExtScreenManager.instance.showEffect(node);
        node.getComponent(FxTransition9920)?.transition2Normal();
    }

    onBtnSpinClicked() {
        log(`onBtnSpinClicked ${this.state}`);

        if ((this.state == SLOT_GAME_STATE.SPINING || this.state == SLOT_GAME_STATE.SHOW_RESULT) && this._hasResult && !this.isFTR) {
            // Reels are spining and it's already has recieved the results from server 
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
    }

    spin() {
        this.unscheduleAllCallbacks();

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

        this.spinButton.spinState = SPIN_STATE.SPINING;
        this.spinButton.disable = true;
        this.state = SLOT_GAME_STATE.SPINING;
        this.slotBoard.startSpin();

        if (this._curFreeSpin > 0) {
            if (SlotConfig9920.isUnitTest) {
                this.scheduleOnce(this.testSetSpinResults, 0.3);
            } else {
                Director9920.instance.spin();
            }
            this._curFreeSpin--;
        }
    }

    updateRemainFreeSpin() {
        this.lbCurFreeSpin.string = this._curFreeSpin.toString();
    }

    setSpinResults(mx: any, payline: any) {
        this._mx = mx;
        this._payLine = payline;
        for (let combination of this._payLine) {
            this.multiValue = combination.multiple;
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

    _showMultiWin(winAmount: number, finishCallback: any) {
        let sequenceTasks = new ExtSequenceTask();
        sequenceTasks.setKey('show_multi_win');

        let task = new ExtBaseTask(this.moneyWinBar, this.moneyWinBar.showTotalWinAmount, [Math.floor(winAmount / this.multiValue)], 0);
        sequenceTasks.pushTask(task);

        task = new ExtBaseTask(this, this.playAnimWinLotus, [finishCallback], 1.0);
        sequenceTasks.pushTask(task);

        ExtAsyncTaskMgr.instance.executeTask(sequenceTasks);
    }

    _showPopupBigWin(callback?: any) {
        this.spinButton.interactable = false;
        ExtScreenManager.instance.showPopupFromPrefabName("res/prefabs/popup/popup_mega_win", (popup: ExtBasePopup) => {
            let popupWin = popup as PopupMegaWin9920;
            let moneyWin = this._winAmount;
            popupWin.betAmount = Director9920.instance.currentBetInfo.betAmount;
            popupWin.winAmount = moneyWin;
            popupWin.autoHide = true;
            popupWin.hideCallback = () => {
                callback && callback();
                this.spinButton.interactable = true;
            };
        }, true, true, true);
    }

    _showPopupJackpotWin(moneyWin: number, callback: any) {
        ExtScreenManager.instance.showPopupFromPrefabName("res/prefabs/popup/popup_jackpot_win", (popup: ExtBasePopup) => {
            let popupDisplay = popup as PopupJackpotWin9920;
            popupDisplay.showAnimWin(moneyWin, () => {
                this.slotBoard.node.active = true;
                callback && callback();
            })
        }, false, true, false);
    }

    _showEffReactiveFree(callback?: any) {
        log('@@@ _showEffReactiveFree = ' + SlotConfig9920.freeOptionRemain);
        if (SlotConfig9920.freeOptionRemain > 0) {
            this.updateLabelReactiveFree();
            if (!this._isReactive) {
                this._isReactive = true;
                this.sprGold.active = true;
                ExtUtils.playAnimation(this.animGold, 'action', false, () => {
                    ExtUtils.playAnimation(this.animGold, 'idle', true);
                    callback && callback();
                });
            } else {
                this.animGoldEat.active = true;
                ExtUtils.playAnimation(this.animGoldEat, 'action', false, () => {
                    this.animGoldEat.active = false;
                    callback && callback();
                });
            }
        } else {
            this.sprGold.active = false;
            callback && callback();
        }
    }

    showJackpotResult(moneyWin: number, callback: any) {
        let sequenceTasks = new ExtSequenceTask();
        sequenceTasks.setKey('show_jackpot');

        let task = new ExtBaseTask(this, () => {
            this.slotBoard.showAllJackpots();
        }, [], 0);
        sequenceTasks.pushTask(task);

        task = new ExtBaseTask(this, () => {
            this.slotBoard.fadeOutLayerShowResult();
            utils.fadeOut(this.slotBoard.node, 0.5);
            this._switchLight(true);
        }, [], 1.0);
        sequenceTasks.pushTask(task);

        task = new ExtBaseTask(this, this._2FishMoveToGate, [], 0.25);
        sequenceTasks.pushTask(task);

        task = new ExtBaseTask(this, this._fadeOutLotus, [], 0.0);
        sequenceTasks.pushTask(task);

        task = new ExtBaseTask(this, this._showFlash, [], 0.9);
        sequenceTasks.pushTask(task);

        task = new ExtBaseTask(this, this._showPopupJackpotWin, [moneyWin, callback], 0.25);
        sequenceTasks.pushTask(task);

        task = new ExtBaseTask(this, this._switchLight, [false], 0);
        sequenceTasks.pushTask(task);

        ExtAsyncTaskMgr.instance.executeTask(sequenceTasks);
    }

    _switchLight(isHut: boolean) {
        this.vfxLightHut.active = isHut;
        this.vfxLightIdle.active = !isHut;
    }

    _fadeOutLotus() {
        utils.fadeOut(this.nodeAnimLotus, 0.25);
    }

    _2FishMoveToGate() {
        log('@@@ _2FishMoveToGate');
        this.unschedule(this.randomSpeedFishAnim);
        this.animFishYellow.setRotationFromEuler(0, 0, -15);
        this.animFishRed.setRotationFromEuler(0, 0, 15);
        this._moveAnimFish(this.animFishYellow, v3(150, 0, 0));
        this._moveAnimFish(this.animFishRed, v3(-150, 0, 0));
    }

    private _moveAnimFish(nodeAnim: Node, offset?: Vec3) {
        log('@@@ _moveAnimFish');
        let ranTimeScale = 1.75;

        nodeAnim.active = true;
        let anim = nodeAnim?.getComponent(sp.Skeleton);
        anim && (anim.timeScale = ranTimeScale);
        anim?.setAnimation(0, "idle", true);

        let time_eff = 1.0;
        tween(nodeAnim)
            .parallel(
                tween().by(time_eff, { position: v3(0, 600, 0).add(offset) }, { easing: 'linear' }),
                tween().to(time_eff, { scale: new Vec3(0.5, 0.5, 0.5) })
            )
            .start();

        this.scheduleOnce(() => {
            nodeAnim.active = false;
        }, 1.0);
    }

    _showFlash() {
        let pfFxTran = ExtScreenManager.instance.assetBundle.get('res/prefabs/popup/fx_flash_jp', Prefab)!;
        let node = instantiate(pfFxTran);
        let fxTransition = node.getComponent(FxTransitionFlash9920);
        ExtScreenManager.instance.showEffect(node);
        fxTransition?.transitionOut();
    }

    private _resetGameAfterWinJP() {
        utils.fadeIn(this.slotBoard.node, 0.25);
        utils.fadeIn(this.nodeAnimLotus, 0.25);
        this._resetAnimFish();
        // this.schedule(this.randomSpeedFishAnim, 5);
    }

    private _resetAnimFish() {
        log('@@@ _resetAnimFish');

        this.animFishYellow.setScale(new Vec3(1, 1, 1));
        this.animFishRed.setScale(new Vec3(1, 1, 1));
        let animY = this.animFishYellow?.getComponent(sp.Skeleton);
        animY && (animY.timeScale = 1.0);
        let animR = this.animFishRed?.getComponent(sp.Skeleton);
        animR && (animR.timeScale = 1.0);
        this.animFishYellow.setRotationFromEuler(0, 0, 0);
        this.animFishRed.setRotationFromEuler(0, 0, 0);
        this.animFishYellow.setPosition(this._posOriginFishYellow);
        this.animFishRed.setPosition(this._posOriginFishRed);
        this.animFishYellow.active = true;
        this.animFishRed.active = true;
        this.playAnimFish();
    }

    setLabelMoneyBet() {
        this.updateMoneyLabelBet();
    }

    updateMoneyLabelBet() {
        this.labelMoneyBet.string = utils.formatMoney(Director9920.instance.getCurrentBetAmount());
    }

    updateLabelReactiveFree() {
        this.lbReactiveFree.string = '+' + SlotConfig9920.freeOptionRemain;
        tween(this.lbReactiveFree.node)
            .set({ scale: v3(0, 0, 1.0) })
            .to(0.25, { scale: v3(1.3, 1.3, 1.0) }, { easing: 'sineIn' })
            .to(0.1, { scale: v3(1.0, 1.0, 1.0) }, { easing: 'sineOut' })
            .union()
            .start();
    }

    updateJackpot(valueJackpot: number) {
        if (this._needUpdateJackpot) {
            utils.tweenMoney(this.labelJackpot, 3, valueJackpot);
        }
    }

    updateMoneyAllWin() {
        let money = Director9920.instance.getTotalWinAmount();
        if (money > 0) {
            utils.tweenMoney(this.labelTotalWin, 0.5, money);
        } else {
            this.labelTotalWin.string = utils.formatMoney(money);
        }
    }

    updateWallet(money: number) {
        utils.tweenMoney(this.labelWallet, 0.5, money);
    }

    isFreeSpin() {
        return true;
    }

    /// Unit test methods
    private _countSpinTest = 0;
    private _idxUnitTest = 0;
    private _unitTestData = [
        {
            "matrix0": ["5", "8", "6", "8", "3", "6", "7", "8", "6", "6", "6", "3", "A", "2", "4"],
            "normalPayLine": [
                { "symbol": "8", "winAmount": 50, "winReelCount": 3, "combinationCount": 1, "payTable": 5, "multiple": 1, "hasWild": false },
                { "symbol": "6", "winAmount": 3000000, "winReelCount": 4, "combinationCount": 2, "payTable": 15, "multiple": 1, "hasWild": false }
            ]
        }
        ,
        {
            "matrix0": ["5", "7", "A", "8", "A", "7", "7", "A", "7", "4", "2", "4", "8", "6", "7"],
            "normalPayLine": [
                { "symbol": "7", "winAmount": 150, "winReelCount": 3, "combinationCount": 1, "payTable": 15, "multiple": 1, "hasWild": false },
                { "symbol": "A", "winAmount": 200, "winReelCount": 3, "combinationCount": 1, "payTable": 20, "multiple": 1, "hasWild": false }
            ]
        },
        {
            "matrix0": ["5", "7", "2", "8", "3", "7", "7", "A", "7", "4", "K", "4", "8", "6", "7"],
            "normalPayLine": [
                { "symbol": "7", "winAmount": 10000, "winReelCount": 5, "combinationCount": 1, "payTable": 15, "multiple": 10, "hasWild": true }
            ]
        },
        // ,
        // {
        //     "matrix0": ["5", "7", "JP", "8", "JP", "7", "7", "JP", "7", "4", "2", "4", "8", "6", "7"],
        //     "normalPayLine": [

        //     ]
        // },
        {
            "matrix0": ["5", "8", "6", "8", "3", "6", "7", "8", "6", "6", "6", "3", "A", "2", "4"],
            "normalPayLine": []
        }
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
        if (this._payLine && this._payLine.length) {
            this.slotBoard.setPaylines(this._payLine);
        }
        else {
            this.startNewSession();
        }
    }
}

