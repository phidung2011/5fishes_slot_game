
import { _decorator, Node, Size, Prefab, Vec3, Component, log } from 'cc';
import ExtAsyncTaskMgr from '../../ext-framework/async_task/ExtAsyncTaskMgr';
import { ExtSlotReel, SlotReelDataSource } from './ExtSlotReel';
import * as utils from '../../cc-common/cc-share/common/utils';
import { ExtSlotSymbol } from './ExtSlotSymbol';
import { ExtSlotConfig } from './ExtSlotConfig';

const { ccclass, property } = _decorator;

export interface SlotBoardDelegate {
    allowNearWin?(): boolean;
    allowShowPayline?(): boolean;
    boardDidStopSpining?(board: ExtSlotBoard): void;
    boardShowPayline?(board: ExtSlotBoard, plIndx: number, amount: number, exInfo: object | null): void;
    boardWillShowTotalWin?(board: ExtSlotBoard, amount: number, exInfo: object | null): void;
    boardDidShowTotalWin?(board: ExtSlotBoard, amount: number, exInfo: object | null): void;
    onClickedSymbol?(board: ExtSlotBoard, column: number, row: number): void;
    isFTR?: boolean;
    slotConfig: ExtSlotConfig;

    boardStartedNearWin?(board: ExtSlotBoard): void;
    boardStopedNearWin?(oard: ExtSlotBoard, win: boolean): void;
    boardDidStartNearWinAtReel?(board: ExtSlotBoard, reel: ExtSlotReel): void;
    boardShouldStopNearWinAtReel?(board: ExtSlotBoard, reel: ExtSlotReel): void;
}

@ccclass('ExtSlotBoard')
export class ExtSlotBoard extends Component implements SlotReelDataSource {
    @property([ExtSlotReel])
    public reels: ExtSlotReel[] = [];

    @property(Node)
    public layerShowResult: Node = null!;

    @property(Prefab)
    protected pfbSlotSymbol: Prefab = null!;

    @property(Node)
    protected layerPlayTable: Node = null!;

    @property([Node])
    public vfxNearWins: Node[] = [];

    @property(Node)
    public layerEffect: Node = null!;

    protected _numberOfSpiningReels: number = 0;
    protected _mx: string[] = [];
    protected _mx0: string[] | null = null;
    protected _paylines: any[] = [];
    protected _winSymbols: Node[] = [];
    protected _scatterSymbols: Node[] = [];
    protected _hasResult: boolean = false;

    protected _spiningTime: number = 0;
    protected _winAmount: number = 0;

    protected _startNearWinReelId = -1;
    protected _nextNearWinReelId = -1;
    protected _numberOfScatter = 0;

    public speed: number = 1.0;
    public boardDelegate: SlotBoardDelegate | null = null;
    public isDropping = false;
    public slotConfig: ExtSlotConfig;

    getSymbolAtIndex(column: number, row: number): ExtSlotSymbol {
        return this.reels[column].slotSymbols[row];
    }

    numberOfReels() {
        return this.reels.length;
    }

    indexOfReel(reel: ExtSlotReel) {
        return this.reels.indexOf(reel);
    }

    getReels() {
        return this.reels;
    }

    isInFreeMode(): boolean {
        return false;
    }

    isNearWin(): boolean {
        if (this.boardDelegate?.isFTR || this.slotConfig.isTurboMode || this.isDropping) return false;

        if (this.boardDelegate?.allowNearWin && this.boardDelegate.allowNearWin())
            return (this._startNearWinReelId >= 0);
        return false;
    }

    allowClickSymbols(allow: boolean) {
        for (let reel of this.reels) {
            for (let symbol of reel.slotSymbols) {
                symbol.interactable = allow;
            }
        }
    }

    // Slot data source methods - BEGIN
    public symbolSize: Size;
    get prefabSlotSymbol(): Prefab {
        return this.pfbSlotSymbol;
    }

    onStoppedAtReel(reel: ExtSlotReel) {
        // log(`onStoppedAtReel ${reel.index}: ${this._numberOfSpiningReels} - ${reel.getResult()}`);

        if (this.isNearWin() && reel.index >= this._startNearWinReelId) {
            if (reel.index == this._startNearWinReelId) {
                this.startNearWin(reel.index);
                this.boardDelegate?.boardStartedNearWin && this.boardDelegate.boardStartedNearWin(this);
            }
            else {
                this.vfxNearWins[reel.index].active && (this.vfxNearWins[reel.index].active = false);
                let pos = utils.getPostionInOtherNode(this.layerPlayTable, reel.node) as Vec3;
                reel.node.parent = this.layerPlayTable;
                reel.node.setPosition(pos);
                reel.stopNearWin();

                for (let j = 0; j < reel.numberOfRows; j++) {
                    let slotSymbol = reel.slotSymbols[j];
                    if (slotSymbol.symbolCode == this.slotConfig.scatterSymbolCode) {
                        let pos = utils.getPostionInOtherNode(this.layerShowResult, slotSymbol.node) as Vec3;
                        slotSymbol.node.setPosition(pos);
                        slotSymbol.node.parent = this.layerShowResult;
                        !this._scatterSymbols.includes(slotSymbol.node) && this._scatterSymbols.push(slotSymbol.node);
                        slotSymbol.playAction(slotSymbol.symbolWinAnimName, true);
                    }
                }
            }

            if (this._nextNearWinReelId <= this.numberOfReels() - 1) {
                let nextReel = this.reels[this._nextNearWinReelId];
                this._nextNearWinReelId++;
                this.nearWinForReel(nextReel);
                this.boardDelegate?.boardDidStartNearWinAtReel && this.boardDelegate.boardDidStartNearWinAtReel(this, nextReel);
            }
            else {
                if (this._numberOfScatter < this.slotConfig.numberWinScatter) {
                    this.boardDelegate?.boardStopedNearWin && this.boardDelegate.boardStopedNearWin(this, false);
                }
                else {
                    this.boardDelegate?.boardStopedNearWin && this.boardDelegate.boardStopedNearWin(this, true);
                }
                this.hideAllScatters();
            }
        }

        this._numberOfSpiningReels--;
        if (this._numberOfSpiningReels == 0) {
            this.onStoppedSpin();
        }
    }

    willStopAtReel(reel: ExtSlotReel) {
        // log(`willStopAtReel: ${reel.index}`);
        // if (this._numberOfScatter > 2) return;        
        let results = reel.getResult();
        if (this.boardDelegate?.allowNearWin && this.boardDelegate.allowNearWin()) {
            for (let i = 0; i < results.length; i++) {
                if (results[i] == this.slotConfig.scatterSymbolCode) {
                    this._numberOfScatter++;
                }
            }
        }

        if (this._numberOfScatter == (this.slotConfig.numberWinScatter - 1) && (reel.index < this.numberOfReels() - 1) && !this.isNearWin()) {
            // log(`near win - ${reel.index}`);
            this._startNearWinReelId = reel.index;
            this._nextNearWinReelId = reel.index + 1;
        }
        if (!this.isNearWin()) {
            if (reel.index + 1 < this.numberOfReels()) {
                let delay = 0.0 + (this.reels[reel.index].numberOfRows + this.reels[reel.index + 1].numberOfRows) * 0.03;
                if (this.boardDelegate?.isFTR || this.slotConfig.isTurboMode) delay = 0;
                this.scheduleOnce(() => {
                    this.reels[reel.index + 1].shouldStop = true;
                }, delay);
            }
        }
    }

    onClickSymbolAtReel(reel: ExtSlotReel, symbol: ExtSlotSymbol) {
        let symbolIndex = reel.slotSymbols.indexOf(symbol);
        this.boardDelegate.onClickedSymbol && this.boardDelegate.onClickedSymbol(this, reel.index, symbolIndex);
    }
    // Slot data source methods - END

    onLoad() {
        this.layerEffect.active = false;
        this.layerShowResult.active = false;
    }

    start() {
        this.slotConfig = this.boardDelegate.slotConfig;
        this.symbolSize = this.slotConfig.symbolSize;
        for (let reel of this.reels) {
            reel.dataSource = this;
            reel.init();
        }
    }

    startSpin() {
        // this.stopActionIdle();
        this.unscheduleAllCallbacks();

        this.isDropping = false;
        this._scatterSymbols.length = 0;
        this.reset();

        let delayTime = 0.0;
        for (let reel of this.reels) {
            reel.resetState();

            delayTime += (this.slotConfig.isTurboMode ? 0.025 : 0.05);
            this.scheduleOnce(() => {
                reel.spin();
            }, delayTime);
            // log(`start spin: ${this._numberOfSpiningReels} - ${reel.hasResult} - ${reel.state} - ${reel.shouldStop}`);
            this._numberOfSpiningReels++;
        }

        this.schedule(this._waitToStop, 1.0 / 60, NaN, 0);
        !this.slotConfig.isTurboMode ? (this._spiningTime = this.slotConfig.reelSpinningTime) : (this._spiningTime = 0);
        this._mx.length = 0;
    }

    startRespin(mx: any, mx0: any) {
        this.isDropping = true;

        this._mx && (this._mx.length = 0);
        this._mx = this._mx.concat(mx);

        if (mx0) {
            this._mx0 = [];
            this._mx0 = this._mx0.concat(mx0);
        }
        else {
            this._mx0 = null;
        }

        this._hasResult = true;
        let reelResults = this._splitResult(mx);
        if (mx0) {
            reelResults = this._splitResult(mx0);
        }

        for (let i = 0; i < reelResults.length; i++) {
            this.reels[i].dropResult(reelResults[i]);
            this._numberOfSpiningReels++;
        }
        this._winAmount = 0;
    }

    reset() {
        ExtAsyncTaskMgr.instance.removeTaskByKey('show_win_combination');

        this._numberOfSpiningReels = 0;
        this._numberOfScatter = 0;
        this._startNearWinReelId = -1;
        this._nextNearWinReelId = -1;
        this._paylines.length = 0;
        this._winAmount = 0;

        for (let i = 0; i < this._winSymbols.length; i++) {
            this._winSymbols[i].removeFromParent();
            this._winSymbols[i].destroy();
        }
        this._winSymbols.length = 0;

        this.layerShowResult.active = false;
        this._hasResult = false;
    }

    protected _waitToStop(dt: number) {
        this._spiningTime -= dt;
        if (this._spiningTime <= 0 && this._hasResult) {
            // has result and spining time is enough to stop
            this.reels[0].shouldStop = true;
            this.unschedule(this._waitToStop);
        }
    }

    onStoppedSpin() {
        // log(`onStoppedSpin`);
        this.boardDelegate?.boardDidStopSpining && this.boardDelegate?.boardDidStopSpining(this);
    }

    playAllSymbolsActionIdle() {
        // log(`playActionIdle`);
        this.playScattersActionIdle();
        this.playWildsActionIdle();
        this.playJackpotsActionIdle();
    }

    playScattersActionIdle() {
        for (let i = 0; i < this.reels.length; i++) {
            for (let symbol of this.reels[i].slotSymbols) {
                if (symbol.symbolCode == this.slotConfig.scatterSymbolCode
                    && this._scatterSymbols.length < this.slotConfig.numberWinScatter) {
                    symbol.playAction(symbol.symbolIdleAnimName, true);
                }
            }
        }
    }

    playWildsActionIdle() {
        for (let i = 0; i < this.reels.length; i++) {
            for (let symbol of this.reels[i].slotSymbols) {
                if (symbol.symbolCode == this.slotConfig.wildSymbolCode && this._winAmount == 0)
                    symbol.playAction(symbol.symbolIdleAnimName, true);
            }
        }
    }

    getNumberSymbolJackpot() {
        let numberSymbolJackpot = 0;
        for (let i = 0; i < this.reels.length; i++) {
            for (let symbol of this.reels[i].slotSymbols) {
                if (symbol.symbolCode == this.slotConfig.jackpotSymbolCode)
                    numberSymbolJackpot++;
            }
        }
        return numberSymbolJackpot;
    }

    isJackpotWin() {
        return false;
    }

    playJackpotsActionIdle() {
        if (this.isJackpotWin()) return;

        for (let i = 0; i < this.reels.length; i++) {
            for (let symbol of this.reels[i].slotSymbols) {
                if (symbol.symbolCode == this.slotConfig.jackpotSymbolCode)
                    symbol.playAction(symbol.symbolIdleAnimName, true);
            }
        }
    }

    setMatrixs(mx: string[], mx0: string[] | null = null) {
        log(`setMatrixs: ${mx}`);

        this._mx && (this._mx.length = 0);
        this._mx = this._mx.concat(mx);

        if (mx0) {
            this._mx0 = [];
            this._mx0 = this._mx0.concat(mx0);
        }
        else {
            this._mx0 = null;
        }

        this._hasResult = true;
        let reelResults = this._splitResult(mx);
        if (mx0) {
            reelResults = this._splitResult(mx0);
        }

        for (let i = 0; i < reelResults.length; i++) {
            this.reels[i].setResult(reelResults[i]);
        }
    }

    forceStop() {
        // Fast to result 
        this.unschedule(this._waitToStop);
        for (let reel of this.reels) {
            if (this._startNearWinReelId >= 0 && this.vfxNearWins[reel.index].active) {
                this.vfxNearWins[reel.index].active = false;
                let pos = utils.getPostionInOtherNode(this.layerPlayTable, reel.node) as Vec3;
                reel.node.parent = this.layerPlayTable;
                reel.node.setPosition(pos);
                reel.stopNearWin();
            }
            reel.shouldStop = true;
            reel.isF2R = true;
            reel.speed = 2.0; //* reel.numberOfRows / 3;
        }
        this.hideAllScatters();
        this.layerShowResult.active = false;
    }

    setPaylines(combinations: any[]) {
        this._paylines.length = 0;
        this._winAmount = 0;
        for (let combination of combinations) {
            if (combination.symbol == this.slotConfig.scatterSymbolCode) continue;
            this._paylines.push(combination);
            this._winAmount += combination.winAmount;
        }
        if (this._paylines.length) {
            this.fadeInLayerShowResult();
            this._showTotalWin(true);
        }
    }

    startNearWin(rIndex: number) {
        log(`startNearWin: ${rIndex}`);

        this.fadeInLayerShowResult();

        for (let i = 0; i <= rIndex; i++) {
            let reel = this.reels[i];
            for (let j = 0; j < reel.numberOfRows; j++) {
                let slotSymbol = reel.slotSymbols[j];
                if (slotSymbol.symbolCode == this.slotConfig.scatterSymbolCode) {
                    let pos = utils.getPostionInOtherNode(this.layerShowResult, slotSymbol.node) as Vec3;
                    slotSymbol.node.setPosition(pos);
                    slotSymbol.node.parent = this.layerShowResult;
                    !this._scatterSymbols.includes(slotSymbol.node) && this._scatterSymbols.push(slotSymbol.node);
                    slotSymbol.playAction(slotSymbol.symbolWinAnimName, true);
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
        let pos = utils.getPostionInOtherNode(this.layerShowResult, reel.node) as Vec3;
        reel.node.parent = this.layerShowResult;
        reel.node.setPosition(pos);
        this.vfxNearWins[reel.index].active = true;
        reel.startNearWin(() => {
            this.boardDelegate?.boardShouldStopNearWinAtReel && this.boardDelegate.boardShouldStopNearWinAtReel(this, reel);
        });
    }

    randomSymbols() {
        for (let reel of this.reels) {
            reel.showSymbols(this._radomItemsForReel(reel.index), false);
        }
    }

    setPreviousMatrix(mx: string[]) {
        log(`setPreviousMatrix`);
        if (!mx || mx.length == 0) return;

        let reelResults = this._splitResult(mx);
        for (let i = 0; i < reelResults.length; i++) {
            this.reels[i].showSymbols(reelResults[i], false);
        }
    }

    protected _splitResult(mx: string[]) {
        let reelResults: string[][] = [];
        let startIndex = 0;
        for (let reel of this.reels) {
            let reelResult: string[] = [];
            for (let j = 0; j < reel.numberOfRows; j++) {
                reelResult.push(mx[startIndex + j]);
            }
            reelResults.push(reelResult);
            reelResult.reverse();
            startIndex += reel.numberOfRows;
        }
        return reelResults;
    }

    showAllJackpots() {
        log(`showAllJackpots`);
        // this.fadeInLayerShowResult();
        this.layerShowResult.active = true;
        let bgr = this.layerShowResult.getChildByName('bgr')!;
        bgr.setOpacity(0);
        for (let i = 0; i < this.reels.length; i++) {
            let reel = this.reels[i];
            for (let j = 0; j < reel.numberOfRows; j++) {
                let slotSymbol = reel.slotSymbols[j];

                if (slotSymbol && slotSymbol.symbolCode == this.slotConfig.jackpotSymbolCode) {
                    let pos = utils.getPostionInOtherNode(this.layerShowResult, slotSymbol.node) as Vec3;
                    slotSymbol.node.setPosition(pos);
                    slotSymbol.node.parent = this.layerShowResult;
                    !this._scatterSymbols.includes(slotSymbol.node) && this._scatterSymbols.push(slotSymbol.node);
                    slotSymbol.playAction(slotSymbol.symbolWinAnimName, true);
                }
            }
        }
    }

    hideAllJackpots() {
        if (this._scatterSymbols.length == 0) return;

        log(`hideAllJackpots`);
        for (let scatterSymbol of this._scatterSymbols) {
            let slotCom = scatterSymbol.getComponent(ExtSlotSymbol);
            for (let reel of this.reels) {
                if (reel.slotSymbols.includes(slotCom) && scatterSymbol.parent != reel.contentView) {
                    let pos = utils.getPostionInOtherNode(reel.contentView, scatterSymbol) as Vec3;
                    scatterSymbol.setPosition(pos);
                    scatterSymbol.parent = reel.contentView;
                }
            }
        }
        this.fadeOutLayerShowResult();
    }

    showAllScatters() {
        log(`showAllScatters`);

        this.fadeInLayerShowResult();

        for (let i = 0; i < this.reels.length; i++) {
            let reel = this.reels[i];
            for (let j = 0; j < reel.numberOfRows; j++) {
                let slotSymbol = reel.slotSymbols[j];

                if (slotSymbol && slotSymbol.symbolCode == this.slotConfig.scatterSymbolCode) {
                    let pos = utils.getPostionInOtherNode(this.layerShowResult, slotSymbol.node) as Vec3;
                    slotSymbol.node.setPosition(pos);
                    slotSymbol.node.parent = this.layerShowResult;
                    !this._scatterSymbols.includes(slotSymbol.node) && this._scatterSymbols.push(slotSymbol.node);
                    slotSymbol.playAction(slotSymbol.symbolWinAnimName, true);
                }
            }
        }
    }

    hideAllScatters() {
        if (this._scatterSymbols.length == 0) return;

        // log(`hideAllScatters`);
        for (let scatterSymbol of this._scatterSymbols) {
            let slotCom = scatterSymbol.getComponent(ExtSlotSymbol);
            for (let reel of this.reels) {
                if (reel.slotSymbols.indexOf(slotCom) >= 0 && scatterSymbol.parent != reel.contentView) {
                    let pos = utils.getPostionInOtherNode(reel.contentView, scatterSymbol) as Vec3;
                    scatterSymbol.setPosition(pos);
                    scatterSymbol.parent = reel.contentView;
                    this._scatterSymbols.length < this.slotConfig.numberWinScatter && slotCom.playAction(slotCom.symbolIdleAnimName, true);
                    break;
                }
            }
        }
    }

    protected showPaylines() {
        this.scheduleOnce(() => {
            this._showPayline(0);
        });
    }

    protected _showPayline(index: number) {

    }

    protected _showTotalWin(firstTime: boolean = false) {
        if (this._paylines == null || this._paylines.length == 0) return;

        let hasWild = false;
        for (let index = 0; index < this._paylines.length; index++) {
            let combination = this._paylines[index % this._paylines.length];
            for (let i = 0; i < combination.winReelCount; i++) {
                let reel = this.reels[i];
                for (let slotSymbol of reel.slotSymbols) {
                    if (slotSymbol.symbolCode == combination.symbol || slotSymbol.symbolCode == this.slotConfig.wildSymbolCode) {
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
    }

    protected _finishedShowTotalWin() {
        log(`_finishedShowTotalWin`);
        let hasWild = false;
        for (let index = 0; index < this._paylines.length; index++) {
            let combination = this._paylines[index % this._paylines.length];
            for (let i = 0; i < combination.winReelCount; i++) {
                let reel = this.reels[i];
                for (let slotSymbol of reel.slotSymbols) {
                    if (slotSymbol.symbolCode == this.slotConfig.wildSymbolCode) {
                        hasWild = true;
                        break;
                    }
                }
                if (hasWild) break;
            }
            if (hasWild) break;
        }

        for (let i = 0; i < this._winSymbols.length; i++) {
            this._winSymbols[i].removeFromParent();
            this._winSymbols[i].destroy();
        }
        this._winSymbols.length = 0;
        this.layerShowResult.active = false;
        let info = {
            'hasWild': hasWild,
        };
        this.boardDelegate?.boardDidShowTotalWin && this.boardDelegate.boardDidShowTotalWin(this, this._winAmount, info);
    }

    public fadeInLayerShowResult(duration: number = 0.1, finishedCallback: VoidFunction | null = null) {
        let bgr = this.layerShowResult.getChildByName('bgr')!;
        if (this.layerShowResult.active && bgr.getOpacity() > 0) {
            finishedCallback && finishedCallback();
            return;
        }
        this.layerShowResult.active = true;
        bgr.setOpacity(0);
        utils.fadeTo(bgr, duration, 200, {
            onComplete: (target?: object) => {
                finishedCallback && finishedCallback();
            }
        });
    }

    public fadeOutLayerShowResult(duration: number = 0.1, finishedCallback: VoidFunction | null = null) {
        let bgr = this.layerShowResult.getChildByName('bgr')!;
        if (!this.layerShowResult.active) {
            return;
        }
        utils.fadeOut(bgr, duration, {
            onComplete: (target?: object) => {
                finishedCallback && finishedCallback();
            }
        });
    }

    protected _radomItemsForReel(index: number) {
        return null;
    }

    protected _randomItemID(): string {
        return '';
    }
}
