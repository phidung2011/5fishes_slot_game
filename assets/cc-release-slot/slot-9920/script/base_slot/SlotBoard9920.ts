
import { _decorator, Node, Vec3, log, Tween, Mask } from 'cc';
import { SlotConfig9920 } from './SlotConfig9920';
import { SlotReel9920 } from './SlotReel9920';
import * as utils from '../../../../cc-common/cc-share/common/utils';
import SlotUtils9920 from './SlotUtils9920';
import { ExtSlotBoard } from '../../../../cc-slot-common/ext-slot/ExtSlotBoard';
import ExtSequenceTask from '../../../../ext-framework/async_task/ExtSequenceTask';
import ExtAsyncTaskMgr from '../../../../ext-framework/async_task/ExtAsyncTaskMgr';
import ExtBaseTask from '../../../../ext-framework/async_task/ExtBaseTask';
import { ExtAudioManager } from '../../../../ext-framework/ExtAudioManager';
import { SlotSymbol9920 } from './SlotSymbol9920';
import { ExtSlotReel } from '../../../../cc-slot-common/ext-slot/ExtSlotReel';
import { tween, v3 } from 'cc';
import { ExtSlotSymbol } from '../../../../cc-slot-common/ext-slot/ExtSlotSymbol';
import { PaylineWinInfo9920 } from './PaylineWinInfo9920';
import { Director9920 } from '../core/Director9920';

const { ccclass, property } = _decorator;

@ccclass('SlotBoard9920')
export class SlotBoard9920 extends ExtSlotBoard {

    @property(PaylineWinInfo9920)
    protected paylineInfo: PaylineWinInfo9920 = null!;

    @property(Node)
    arrLock: Node[] = [];

    private _indexPl = 0;
    private _moneyScatterWin: number = 0;
    private _tweenFocusScatterArr: Tween<object>[] = [];

    private _canWinScatter: boolean = true;
    public isF2R = false;

    onLoad() {
        super.onLoad();
        this.paylineInfo && (this.paylineInfo.node.active = false);
    }

    setPaylines(combinations: any[], firstTime: boolean = true) {
        this._paylines.length = 0;
        this._winAmount = 0;
        this._moneyScatterWin = 0;
        this._canWinScatter = true;
        for (let combination of combinations) {
            // if (combination.symbol == this.slotConfig.scatterSymbolCode) continue;
            this._paylines.push(combination);
            this._winAmount += combination.winAmount;
            if (combination.symbol == SlotConfig9920.scatterSymbolCode) {
                this._moneyScatterWin = combination.winAmount;
            }
        }
        if (this._paylines.length) {
            this.fadeInLayerShowResult();
            this._showTotalWin(firstTime);
        }
    }

    protected _showTotalWin(firstTime: boolean = false) {

        log(`_showTotalWin SlotBoard Extend: ${firstTime}`);

        if (this._paylines == null || this._paylines.length == 0) return;

        let hasWild = false;
        for (let index = 0; index < this._paylines.length; index++) {
            let combination = this._paylines[index % this._paylines.length];
            for (let i = 0; i < combination.winReelCount; i++) {
                let reel = this.reels[i];
                for (let j = 0; j < reel.slotSymbols.length; j++) {
                    if (i > (SlotConfig9920.numReelOpenFull - 1) && (j == 0 || j == 2)) continue;
                    let slotSymbol = reel.slotSymbols[j];
                    if (combination.symbol == SlotConfig9920.scatterSymbolCode && slotSymbol.symbolCode == SlotConfig9920.scatterSymbolCode) {
                        // combination for Scatter
                        let pos = utils.getPostionInOtherNode(this.layerShowResult, slotSymbol.node) as Vec3;
                        slotSymbol.node.parent = this.layerShowResult;
                        slotSymbol.node.setPosition(pos);
                        !this._winSymbols.includes(slotSymbol.node) && this._winSymbols.push(slotSymbol.node);
                        slotSymbol.node.setZIndex(100 + reel.slotSymbols.indexOf(slotSymbol));
                    }
                    else if (combination.symbol != SlotConfig9920.scatterSymbolCode && (slotSymbol.symbolCode == combination.symbol || slotSymbol.symbolCode == this.slotConfig.wildSymbolCode)) {
                        // combination has no Scatter
                        !hasWild && (hasWild = slotSymbol.symbolCode == this.slotConfig.wildSymbolCode);

                        let pos = utils.getPostionInOtherNode(this.layerShowResult, slotSymbol.node) as Vec3;
                        slotSymbol.node.parent = this.layerShowResult;
                        slotSymbol.node.setPosition(pos);
                        !this._winSymbols.includes(slotSymbol.node) && this._winSymbols.push(slotSymbol.node);
                        if (slotSymbol.symbolCode == this.slotConfig.wildSymbolCode) {
                            slotSymbol.node.setZIndex(100 + reel.slotSymbols.indexOf(slotSymbol));
                        } else {
                            slotSymbol.node.setZIndex(1 + reel.slotSymbols.indexOf(slotSymbol));
                        }
                    }
                }
            }
        }

        for (let winSymbol of this._winSymbols) {
            let winSymbolComp = winSymbol.getComponent(ExtSlotSymbol);
            winSymbolComp.playWinAnimation();
        }

        let info = {
            'hasWild': hasWild,
        };
        this.boardDelegate?.boardWillShowTotalWin && this.boardDelegate.boardWillShowTotalWin(this, this._winAmount, info);

        let showTotalWinDuration = 1.5;
        if (this.isF2R) {
            showTotalWinDuration = 0.5; // F2R thi sau 0.5s thong bao finish show total win duoc roi.
        }
        else {
            if (hasWild && Director9920.instance.isInFreeGame()) {
                showTotalWinDuration = 4.9;
            }
        }
        log('@@@ SlotBoard9920: showTotalWinDuration = ' + showTotalWinDuration);
        this.scheduleOnce(this._finishedShowTotalWin, showTotalWinDuration - 0.1);
        this.schedule(this._updateShowPayline, 1.5, NaN, showTotalWinDuration);
    }

    forceFinishShowTotalWin() {
        this.unschedule(this._finishedShowTotalWin);
        this.scheduleOnce(this._finishedShowTotalWin, 0.5);
    }

    protected _finishedShowTotalWin() {
        this.boardDelegate?.boardDidShowTotalWin && this.boardDelegate.boardDidShowTotalWin(this, this._winAmount, null);
    }

    protected _updateShowPayline() {
        log('@@@ _updateShowPayline');
        if (!this.boardDelegate.allowShowPayline || !this.boardDelegate.allowShowPayline() || this._paylines == null || this._paylines.length == 0) {
            this.unschedule(this.showPaylines);
            return;
        }
        if (this._indexPl >= this._paylines.length && this._paylines.length > 1) {
            this._showAllPaylines();
            this._indexPl = 0;
            return;
        }
        if (this._indexPl >= this._paylines.length) {
            this._indexPl = 0;
        }
        this._showPayline(this._indexPl);
        this._indexPl++;
    }

    stopShowPaylines() {
        log('@@@ stopShowPaylines');
        this.unschedule(this._updateShowPayline);
    }

    protected _showPayline(index: number) {
        log(`_showPayline: ${index}`);

        if (this._paylines == undefined || this._paylines == null || this._paylines.length == 0 || index > this._paylines.length) {
            return;
        }
        if (this.boardDelegate?.allowShowPayline && !this.boardDelegate.allowShowPayline()) {
            return;
        }

        let combination = this._paylines[index];
        if (combination == null || combination === undefined) {
            return;
        }

        if (this.paylineInfo) {
            !this.paylineInfo.node.active && (this.paylineInfo.node.active = true);
            this.paylineInfo.setPaylineInfo(combination);
        }

        let activeSymbols = [];
        for (let i = 0; i < combination.winReelCount; i++) {
            let reel = this.reels[i];
            for (let slotSymbol of reel.slotSymbols) {
                if (combination.symbol == SlotConfig9920.scatterSymbolCode && slotSymbol.symbolCode == SlotConfig9920.scatterSymbolCode) {
                    activeSymbols.push(slotSymbol.node);
                } else if (combination.symbol != SlotConfig9920.scatterSymbolCode && (slotSymbol.symbolCode == combination.symbol || slotSymbol.symbolCode == this.slotConfig.wildSymbolCode)) {
                    activeSymbols.push(slotSymbol.node);
                }
            }
        }

        for (let winSymbol of this._winSymbols) {
            let winSymbolComp = winSymbol.getComponent(SlotSymbol9920);

            if (activeSymbols.includes(winSymbol)) {
                winSymbolComp.playWinAnimation();
                if (winSymbol.parent != this.layerShowResult) {
                    let pos = utils.getPostionInOtherNode(this.layerShowResult, winSymbol) as Vec3;
                    winSymbol.parent = this.layerShowResult;
                    winSymbol.setPosition(pos);
                }
            }
            else {
                winSymbolComp.stopAction();
                winSymbolComp.disableEffSymbol();
                winSymbolComp.spSymbol.node.active = true;
                for (let reel of this.reels) {
                    if (reel.slotSymbols.includes(winSymbolComp)) {
                        if (winSymbol.parent != reel.contentView) {
                            let pos = utils.getPostionInOtherNode(reel.contentView, winSymbol) as Vec3;
                            winSymbol.setPosition(pos);
                            winSymbol.parent = reel.contentView;
                        }
                        break;
                    }
                }
            }
        }
        this.scheduleOnce(() => {
            this.boardDelegate?.boardShowPayline && this.boardDelegate.boardShowPayline(this, index, combination.winAmount, null);
        }, 1.45);
    }

    protected _showAllPaylines() {
        this.paylineInfo && (this.paylineInfo.node.active = false);
        for (let winSymbol of this._winSymbols) {
            let winSymbolComp = winSymbol.getComponent(SlotSymbol9920);
            if (winSymbol.parent != this.layerShowResult) {
                let pos = utils.getPostionInOtherNode(this.layerShowResult, winSymbol) as Vec3;
                winSymbol.parent = this.layerShowResult;
                winSymbol.setPosition(pos);
                winSymbolComp.playWinAnimation();
            }
        }
    }

    onStoppedAtReel(reel: SlotReel9920) {
        if (this.isNearWin() && reel.index >= this._startNearWinReelId) {
            if (reel.index == this._startNearWinReelId) {
                this.startNearWin(reel.index);
            }
            else {
                this.vfxNearWins[reel.index].active && (this.vfxNearWins[reel.index].active = false);
                let pos = utils.getPostionInOtherNode(this.layerPlayTable, reel.node) as Vec3;
                reel.node.parent = this.layerPlayTable;
                reel.node.setPosition(pos);
                reel.stopNearWin();

                for (let j = 0; j < reel.numberOfRows; j++) {
                    let slotSymbol = reel.slotSymbols[j];
                    if (slotSymbol.symbolCode == SlotConfig9920.scatterSymbolCode) {
                        // let pos = utils.getPostionInOtherNode(this.layerShowResult, slotSymbol.node) as Vec3;
                        // slotSymbol.node.setPosition(pos);
                        // slotSymbol.node.parent = this.layerShowResult;
                        !this._scatterSymbols.includes(slotSymbol.node) && this._scatterSymbols.push(slotSymbol.node);
                        slotSymbol.playAction('near_win', true);
                    }
                }
            }

            if (this._nextNearWinReelId <= this.numberOfReels() - 1) {
                ExtAudioManager.instance.playEffect('sfx_near_win');
                let nextReel = this.reels[this._nextNearWinReelId];
                this._nextNearWinReelId++;
                this.nearWinForReel(nextReel);
            }
            else {
                if (this._numberOfScatter < 3) {
                    ExtAudioManager.instance.playEffect('sfx_scatter_miss');
                }
                this.hideAllScatters();
                this.layerShowResult.active = false;
            }
        }

        this._checkScatterWinOrMiss(reel);

        this._numberOfSpiningReels--;
        // log(`onStoppedAtReel ${reel.index}: ${this._numberOfSpiningReels} - ${reel.getResult()}`);

        if (this._numberOfSpiningReels == 0) {
            this.onStoppedSpin();
        }
    }

    _checkScatterWinOrMiss(reel: SlotReel9920) {
        if (!this._canWinScatter) return;

        if (reel.needPlayEffectScatterReel(reel)) {
            this._numberOfScatter++;
            if (this._numberOfScatter <= SlotConfig9920.numberWinScatter) {
                ExtAudioManager.instance.playEffect(SlotUtils9920.scatterSound.shift());
            }
            if (this._numberOfScatter == SlotConfig9920.numberWinScatter) {
                ExtAudioManager.instance.playEffect('sfx_scatter_win');
            }
        } else {
            if (reel.index > 0 && this._canWinScatter) {
                ExtAudioManager.instance.playEffect('sfx_scatter_miss');
            }
            this._canWinScatter = false;
        }
        log('@@@ onStoppedAtReel ' + reel.index + ': _numberOfScatter = ' + this._numberOfScatter);
    }

    onStoppedSpin() {
        log(`onStoppedSpin`);

        ExtAudioManager.instance.stopEffectByName("sfx_rolling", true);
        SlotUtils9920.resetScatterSound();
        SlotUtils9920.resetJackpotSound();

        this.playAllSymbolsActionIdle();
        let maskCmp = this.layerPlayTable.getComponent(Mask)!;
        maskCmp && (maskCmp.enabled = false);
        super.onStoppedSpin();
    }

    startSpin() {
        ExtAudioManager.instance.playEffect("sfx_rolling", true);
        let maskCmp = this.layerPlayTable.getComponent(Mask)!;
        maskCmp && (maskCmp.enabled = true);
        super.startSpin();
    }

    reset() {
        this._resetWinSymbols();
        if (this.layerEffect.active) {
            this.layerEffect.active = false;
        }
        this.paylineInfo && (this.paylineInfo.node.active = false);
        // SlotUtils9940.resetScatterSound();

        this._indexPl = 0;
        this.isF2R = false;
        this.stopShowPaylines();

        super.reset();
    }

    fastToResult() {

    }

    forceStop() {
        this.isF2R = true;
        super.forceStop();
    }

    private _resetWinSymbols() {
        log(`_resetWinSymbols: ${this._winSymbols.length}`);
        for (let winSymbol of this._winSymbols) {
            let slotCom = winSymbol.getComponent(SlotSymbol9920) as ExtSlotSymbol;
            winSymbol.getComponent(SlotSymbol9920).disableEffSymbol();
            winSymbol.getComponent(SlotSymbol9920).stopAction();
            for (let reel of this.reels) {
                if (reel.slotSymbols.includes(slotCom) && winSymbol.parent != reel.contentView) {
                    let pos = utils.getPostionInOtherNode(reel.contentView, winSymbol) as Vec3;
                    winSymbol.setPosition(pos);
                    winSymbol.parent = reel.contentView;
                }
            }
        }
        this._winSymbols.length = 0;
        return;
    }

    startNearWin(rIndex: number) {
        log(`startNearWin: ${rIndex}`);

        // this.fadeInLayerShowResult();

        for (let i = 0; i <= rIndex; i++) {
            let reel = this.reels[i];
            for (let j = 0; j < reel.numberOfRows; j++) {
                let slotSymbol = reel.slotSymbols[j];
                if (slotSymbol.symbolCode == SlotConfig9920.scatterSymbolCode) {
                    // let pos = utils.getPostionInOtherNode(this.layerShowResult, slotSymbol.node) as Vec3;
                    // slotSymbol.node.setPosition(pos);
                    // slotSymbol.node.parent = this.layerShowResult;
                    !this._scatterSymbols.includes(slotSymbol.node) && this._scatterSymbols.push(slotSymbol.node);
                    slotSymbol.playAction('near_win', true);
                }
            }
        }

        for (let i = rIndex + 1; i < this.numberOfReels(); i++) {
            let reel = this.reels[i];
            reel.speed = 1.5;
        }
    }

    nearWinForReel(reel: ExtSlotReel) {
        // log(`nearWinForReel: ${reel.index}`);
        // let pos = utils.getPostionInOtherNode(this.layerShowResult, reel.node) as Vec3;
        // reel.node.parent = this.layerShowResult;
        // reel.node.setPosition(pos);
        // this.vfxNearWins[reel.index].active = true;
        reel.startNearWin();
    }

    randomSymbols() {
        SlotUtils9920.randomStartPlayTable();
        for (let reel of this.reels) {
            reel.showSymbols(this._radomItemsForReel(reel.index), false);
        }
    }

    isJackpotWin() {
        let numberSymbolJackpot = this.getNumberSymbolJackpot();
        return (numberSymbolJackpot > 2);
    }

    showAllJackpots() {
        log(`showAllJackpots`);
        this.layerShowResult.active = true;
        let bgr = this.layerShowResult.getChildByName('bgr')!;
        bgr.setOpacity(0);
        this.fadeInLayerShowResult();

        for (let i = 0; i < this.reels.length; i++) {
            let reel = this.reels[i];
            for (let j = 0; j < reel.numberOfRows; j++) {
                let slotSymbol = reel.slotSymbols[j];

                if (slotSymbol && slotSymbol.symbolCode == SlotConfig9920.jackpotSymbolCode) {
                    let pos = utils.getPostionInOtherNode(this.layerShowResult, slotSymbol.node) as Vec3;
                    slotSymbol.node.setPosition(pos);
                    slotSymbol.node.parent = this.layerShowResult;
                    !this._scatterSymbols.includes(slotSymbol.node) && this._scatterSymbols.push(slotSymbol.node);
                    slotSymbol.playAction('animation', false);
                }
            }
        }
    }

    hideAllJackpots() {
        if (this._scatterSymbols.length == 0) return;

        log(`hideAllJackpots`);
        for (let scatterSymbol of this._scatterSymbols) {
            let slotCom = scatterSymbol.getComponent(SlotSymbol9920);
            for (let reel of this.reels) {
                if (reel.slotSymbols.includes(slotCom) && scatterSymbol.parent != reel.contentView) {
                    let pos = utils.getPostionInOtherNode(reel.contentView, scatterSymbol) as Vec3;
                    scatterSymbol.setPosition(pos);
                    scatterSymbol.parent = reel.contentView;
                    // slotCom.playAction('Idle', true);
                    slotCom.changeJackpotSymbolWin();
                }
            }
        }
        this.fadeOutLayerShowResult();
    }

    focusAllScatters() {
        log(`focusAllScatters`);

        for (let winSymbol of this._winSymbols) {
            let slotSymbol = winSymbol.getComponent(SlotSymbol9920);
            if (slotSymbol && slotSymbol.symbolCode == SlotConfig9920.scatterSymbolCode) {
                !this._scatterSymbols.includes(slotSymbol.node) && this._scatterSymbols.push(slotSymbol.node);

                let _tween = this._focusAction(slotSymbol.node);
                this._tweenFocusScatterArr.push(_tween);
            } else {
                slotSymbol.stopAction();
                slotSymbol.disableEffSymbol();
                slotSymbol.spSymbol.node.active = true;
                for (let reel of this.reels) {
                    if (reel.slotSymbols.includes(slotSymbol)) {
                        if (winSymbol.parent != reel.contentView) {
                            let pos = utils.getPostionInOtherNode(reel.contentView, winSymbol) as Vec3;
                            winSymbol.setPosition(pos);
                            winSymbol.parent = reel.contentView;
                        }
                        break;
                    }
                }
            }
        }
    }

    private _focusAction(node: Node) {
        let _tweenScale = tween(node)
            .to(0.35, { scale: new Vec3(1.2, 1.2, 1.2) })
            .to(0.35, { scale: new Vec3(1.0, 1.0, 1.0) })
            .union()
            .repeat(3)
            .start();
        return _tweenScale;
    }

    showAllScatters() {
        log(`showAllScatters`);

        for (let i = 0; i < this.reels.length; i++) {
            let reel = this.reels[i];
            let reelHaveScatter = false;
            for (let j = 0; j < reel.numberOfRows; j++) {
                let slotSymbol = reel.slotSymbols[j];

                if (slotSymbol && slotSymbol.symbolCode == SlotConfig9920.scatterSymbolCode) {
                    reelHaveScatter = true;
                    let pos = utils.getPostionInOtherNode(this.layerShowResult, slotSymbol.node) as Vec3;
                    slotSymbol.node.setPosition(pos);
                    slotSymbol.node.parent = this.layerShowResult;
                    !this._scatterSymbols.includes(slotSymbol.node) && this._scatterSymbols.push(slotSymbol.node);
                }
            }
            if (!reelHaveScatter) break;
        }

        this.fadeInLayerShowResult();
        for (let scatterSymbol of this._scatterSymbols) {
            let scatterSymbolComp = scatterSymbol.getComponent(ExtSlotSymbol);
            scatterSymbolComp.playWinAnimation();

            let _tween = this._focusAction(scatterSymbol);
            let _tweenFocus = tween(scatterSymbol)
                .delay(1)
                .then(_tween)
                .call(() => {
                    log('@@@ end focus 112 !!!');
                })
                .start();
            this._tweenFocusScatterArr.push(_tweenFocus);
        }
    }

    hideAllScatters() {
        if (this._scatterSymbols.length == 0) return;

        log(`hideAllScatters`);
        for (let scatterSymbol of this._scatterSymbols) {
            let slotCom = scatterSymbol.getComponent(SlotSymbol9920);
            for (let reel of this.reels) {
                if (reel.slotSymbols.indexOf(slotCom) >= 0 && scatterSymbol.parent != reel.contentView) {
                    let pos = utils.getPostionInOtherNode(reel.contentView, scatterSymbol) as Vec3;
                    scatterSymbol.setPosition(pos);
                    scatterSymbol.parent = reel.contentView;
                    this._scatterSymbols.length < SlotConfig9920.numberWinScatter && slotCom.playAction('idle', true);
                    break;
                }
            }
        }
    }

    showWildSpecialAnim() {
        // console.log(`_showWildSpecialAnim`);
        for (let i = 0; i < this._winSymbols.length; i++) {
            let winSymbolComp = this._winSymbols[i].getComponent(SlotSymbol9920)!;
            if (winSymbolComp.symbolCode == SlotConfig9920.wildSymbolCode) {
                // winSymbolComp.playAction('win', true);

                tween(this._winSymbols[i])
                    .to(0.25, { scale: v3(1.15, 1.15, 1.0) }, { easing: 'quintOut' })
                    .delay(1.0)
                    .to(0.25, { scale: v3(1.0, 1.0, 1.0) }, { easing: 'quintIn' })
                    .call(() => {
                        // winSymbolComp?.playAction('idle', true);
                    })
                    .start();
            }
            else {
                let pos = utils.getPostionInOtherNode(this.layerPlayTable, winSymbolComp?.node) as Vec3;
                winSymbolComp && (winSymbolComp.node.parent = this.layerPlayTable);
                pos && winSymbolComp && (winSymbolComp.node.setPosition(pos));
            }
        }
    }

    /**
     * playScatterSymbolWinAnim
     */
    public playScatterSymbolWinAnim() {
        log("playScatterSymbolWinAnim  " + this._scatterSymbols.length)
        ExtAudioManager.instance.playEffect("sfx_scatter_appear");
        // this.layerEffect.active = true;
        for (let i = 0; i < this.reels.length; i++) {
            let reel = this.reels[i];
            for (let j = 0; j < reel.numberOfRows; j++) {
                let slotSymbol = reel.slotSymbols[j];
                if (slotSymbol.symbolCode == SlotConfig9920.scatterSymbolCode && !this._scatterSymbols.includes(slotSymbol.node)) {
                    this._scatterSymbols.push(slotSymbol.node);
                }
            }
        }
        for (let scatterSymbol of this._scatterSymbols) {
            let pos = utils.getPostionInOtherNode(this.node, scatterSymbol) as Vec3;
            scatterSymbol.parent = this.node;
            scatterSymbol.position = pos;
            scatterSymbol.setZIndex(1000);
            let symbolCom = scatterSymbol.getComponent(SlotSymbol9920);
            symbolCom.playAction('animation', false);
        }
    }

    /**
     * resetScatterSymbols
     */
    public resetScatterSymbols() {
        for (let tw of this._tweenFocusScatterArr) {
            tw.stop();
            tw = null;
        }
        this._tweenFocusScatterArr.splice(0, this._tweenFocusScatterArr.length);

        for (let scatterSymbol of this._scatterSymbols) {
            let symbolCom = scatterSymbol.getComponent(SlotSymbol9920);
            for (let reel of this.reels) {
                if (reel.slotSymbols.includes(symbolCom) && scatterSymbol.parent != reel.contentView) {
                    let pos = utils.getPostionInOtherNode(reel.contentView, scatterSymbol) as Vec3;
                    scatterSymbol.setPosition(pos);
                    scatterSymbol.parent = reel.contentView;
                    break;
                }
            }
            symbolCom.playAction('idle', true);
        }
        this.fadeOutLayerShowResult(0.1, () => {
            this.layerShowResult.active = false;
        });
        this._scatterSymbols.splice(0, this._scatterSymbols.length);
    }

    /**
     * resetWildSymbols
     */
    public resetWildSymbols() {
        let reel = this.reels[2];
        log(`resetWildSymbols: ${this._winSymbols.length} - ${reel.slotSymbols.length}`);
        for (let symbolCom of reel.slotSymbols) {
            let slotSymbol = symbolCom.node;
            if (slotSymbol.parent == reel.contentView) continue;
            let pos = utils.getPostionInOtherNode(reel.contentView, slotSymbol) as Vec3;
            slotSymbol.setPosition(pos);
            slotSymbol.parent = reel.contentView;
            // symbolCom.playAction('Idle', true);
        }
        this._winSymbols.splice(0, this._winSymbols.length);
    }

    protected _radomItemsForReel(index: number) {
        return SlotUtils9920.startPlayTable[index];
    }

    protected _randomItemID(): string {
        let itemList = SlotConfig9920.symbolCodes;
        let idx = utils.randRange(0, itemList.length - 1);
        return itemList[idx];
    }

    updateUIOpenReel() {
        this.arrLock.forEach(reelLock => {
            reelLock.active = false;
        });
        if (SlotConfig9920.numReelOpenFull >= 0 && SlotConfig9920.numReelOpenFull < this.arrLock.length) {
            this.arrLock[5 - SlotConfig9920.numReelOpenFull].active = true;
        }
    }

    testAnimSymbol(idSymbol: string, animName?: string, skinName?: string) {
        for (let i = 0; i < this.reels.length; i++) {
            for (let symbol of this.reels[i].slotSymbols) {
                if (symbol.symbolCode == idSymbol) {
                    if (idSymbol == 'K') {
                        let sb = symbol as SlotSymbol9920;
                        sb.setSkinAnim(skinName);
                        symbol.playAction(animName, true);
                    } else
                        if (idSymbol == 'A' || idSymbol == 'JP') {
                            symbol.playAction(animName, true);
                        } else
                            symbol.playAction(symbol.symbolWinAnimName, true);
                }
            }
        }
    }
}

