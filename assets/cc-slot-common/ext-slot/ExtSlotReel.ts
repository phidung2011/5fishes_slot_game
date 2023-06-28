
import { NodePool, Tween, Mask, UITransform, size, v3, instantiate, log, tween, Size, Prefab, Vec3 } from 'cc';
import { _decorator, Component, Node } from 'cc';
import * as utils from '../../cc-common/cc-share/common/utils';
import { ExtSlotSymbol } from './ExtSlotSymbol';
import { ExtSlotConfig } from './ExtSlotConfig';

const { ccclass, property, integer } = _decorator;

export interface SlotReelDataSource {
    symbolSize: Size;
    slotConfig: ExtSlotConfig;
    indexOfReel(reel: ExtSlotReel): number;
    willStopAtReel(reel: ExtSlotReel): void;
    onStoppedAtReel(reel: ExtSlotReel): void;
    onClickSymbolAtReel?(reel: ExtSlotReel, symbol: ExtSlotSymbol): void;

    prefabSlotSymbol?: Prefab;
}

export enum SLOT_REEL_STATE {
    IDLE = 0,
    SPINING,
    STOPPING,
    STOPPED,
}

@ccclass('ExtSlotReel')
export class ExtSlotReel extends Component {
    @integer
    numberOfRows = 0;

    public dataSource: SlotReelDataSource = null!;
    public index: number = -1;
    public state: SLOT_REEL_STATE = SLOT_REEL_STATE.IDLE;
    public speed = 1.0;
    public hasResult: boolean = false;
    public shouldStop: boolean = false;
    public isF2R: boolean = false;

    protected _scrollView: Node = null!;
    protected _contentView: Node = null!;
    protected _reelHeight: number = 0;
    protected _freedItems: NodePool = null!;
    protected _showingSymbols: string[] = [];
    protected _velocity = 10;
    protected _spinNodes: Node[] = [];
    protected _results: string[] = [];
    public slotSymbols: ExtSlotSymbol[] = [];

    protected _bgrNode: Node | null = null;
    protected _forceNotBlur = false;
    protected _twNearWin: Tween<any> | null = null;

    protected maskReel: Mask = null!;
    protected _lastMovingDis = 0;

    get contentView(): Node {
        return this._contentView;
    }

    onLoad() {
        this._bgrNode = this.node.getChildByName('bgr_reel');
    }

    init() {
        this.maskReel = this.node.getComponent(Mask)!;
        // this._radomItems();
        this.index = this.dataSource.indexOfReel(this);
        this._freedItems = new NodePool(this.index + "<SlotItemCache>");

        let symbolSize = this.dataSource.symbolSize;
        this._reelHeight = symbolSize.height * this.numberOfRows;
        this._velocity = symbolSize.height * this.dataSource.slotConfig.spinRowsPerSecond;

        this._contentView = new Node();
        this._contentView.layer = this.node.layer;
        this.node.addChild(this._contentView);
        let uiTrans1 = this._contentView.getComponent(UITransform);
        if (!uiTrans1) {
            uiTrans1 = this._contentView.addComponent(UITransform);
        }
        uiTrans1.setAnchorPoint(0.5, 0.5);
        uiTrans1.setContentSize(size(symbolSize.width, this._reelHeight));

        this._scrollView = new Node();
        this._scrollView.layer = this.node.layer;
        this.node.addChild(this._scrollView);
        let uiTrans = this._scrollView.getComponent(UITransform);
        if (!uiTrans) {
            uiTrans = this._scrollView.addComponent(UITransform);
        }
        uiTrans.setAnchorPoint(0.5, 0.5);
        uiTrans.setContentSize(size(symbolSize.width, this._reelHeight));
        this._scrollView.setPosition(v3(0, 0));
        this.maskReel.enabled = false;
        this.setZindexAllSlotSymbol();
    }

    protected _createSymbol2(symbolCode: string, blur: boolean = false): Node {
        // log(`_createSymbol2 ${symbolCode}`);

        if (this.dataSource.prefabSlotSymbol) {
            let itemNode = instantiate(this.dataSource.prefabSlotSymbol);
            let slotSymbolComp = itemNode.getComponent(ExtSlotSymbol)!;
            slotSymbolComp.symbolCode = symbolCode;
            slotSymbolComp.isBlur = blur;
            itemNode.on('symbol-click', this._onSymbolClick, this);
            return itemNode;
        }
    }

    protected _onSymbolClick(symbol: ExtSlotSymbol) {
        this.dataSource.onClickSymbolAtReel && this.dataSource.onClickSymbolAtReel(this, symbol);
    }

    protected _randomItemID(): string {
        return '';
    }

    protected _startInertiaStop() {
        let duration = 0.1;
        let delayTime = this._bgrNode?.active ? 0.3 : 0.05;

        tween(this._contentView)
            .to(duration, { position: v3(0, 0, 0) }, { easing: 'smooth' })
            .call(() => {
                this.setZindexAllSlotSymbol();

            })
            .delay(delayTime)
            .call(() => {
                for (let child of this._spinNodes) {
                    child.removeFromParent();
                    this._freedItems.put(child);
                }
                this._spinNodes.length && this._spinNodes.splice(0, this._spinNodes.length);
                this._scrollView.setPosition(0, 0);
                this.maskReel.enabled = false;
                this.dataSource.onStoppedAtReel(this);
            })
            .start();
    }

    update(dt: number) {
        if (this.state == SLOT_REEL_STATE.IDLE || this.state == SLOT_REEL_STATE.STOPPED) {
            return;
        }

        let scrollViewPos = this._scrollView.getPosition();
        let movingDistance = this._velocity * dt * this.speed;
        if (Math.abs(this._lastMovingDis - movingDistance) > 5) {
            if (movingDistance > this._lastMovingDis) {
                this._lastMovingDis += 5;
            }
            else {
                this._lastMovingDis -= 5;
            }
        }
        else {
            this._lastMovingDis = movingDistance;
        }
        scrollViewPos.y -= this._velocity * dt * this.speed;
        let delta = -scrollViewPos.y;

        this._scrollView.setPosition(scrollViewPos);

        if (this.state == SLOT_REEL_STATE.STOPPING) {
            let pos = utils.getPostionInOtherNode(this.node, this._contentView) as Vec3;
            // let selfHeight = this._contentView.getComponent(UITransform)!.contentSize.height;
            let disMove = this._reelHeight - pos.y;

            let symbolSize = this.dataSource.symbolSize;
            let idx = Math.floor((disMove - 1) / symbolSize.height) + 1;
            // log(`distance ${this.index}: ${pos.y} - ${disMove} - ${idx}`);

            if (idx >= this.slotSymbols.length && idx < this.numberOfRows) {
                let s = this.slotSymbols.length;
                for (let i = s; i <= idx; i++)
                    this._pushSymbolAtIndex(i);
            }
            if (pos.y < 0) {
                if (this.slotSymbols.length < this.numberOfRows) {
                    let s = this.slotSymbols.length;
                    for (let i = s; i < this.numberOfRows; i++)
                        this._pushSymbolAtIndex(i);
                }
                this._contentView.parent = this.node;
                this._contentView.setPosition(pos);
                this.state = SLOT_REEL_STATE.STOPPED;
                this._startInertiaStop();
            }
            return;
        }

        if (this.state == SLOT_REEL_STATE.SPINING) {

        }

        let firstSpiningNode = this._spinNodes[0];
        let height = firstSpiningNode.getComponent(UITransform)?.contentSize.height!;
        while (firstSpiningNode.position.y + height / 2 + this._reelHeight / 2 < delta) {
            // out of viewing space
            if (firstSpiningNode !== this._contentView) {
                this._freedItems.put(firstSpiningNode);
                firstSpiningNode.removeFromParent();
            }
            else {
                this._contentView.active = false;
            }
            this._spinNodes.splice(0, 1);
            if (this._spinNodes.length)
                firstSpiningNode = this._spinNodes[0];
            else
                break;
        }

        let lastSpiningNode: any = null;
        if (this._spinNodes.length)
            lastSpiningNode = this._spinNodes[this._spinNodes.length - 1];
        else
            lastSpiningNode = firstSpiningNode;

        height = lastSpiningNode.getComponent(UITransform)?.contentSize.height!;
        while (lastSpiningNode.position.y + height / 2 < delta + this._reelHeight / 2) {
            let itemID = this._randomItemID();

            // add new symbol node
            let itemNode: Node;
            if (this._freedItems.size()) {
                itemNode = this._freedItems.get()!;
                let slotSymbolComp = itemNode.getComponent(ExtSlotSymbol)!;
                slotSymbolComp.symbolCode = itemID;
                slotSymbolComp.isBlur = !this._forceNotBlur;
            }
            else {
                itemNode = this._createSymbol2(itemID, !this._forceNotBlur);
            }
            let selfHeight = itemNode.getComponent(UITransform)!.contentSize.height;
            itemNode.setPosition(v3(0, lastSpiningNode.position.y + height / 2 + selfHeight / 2));
            this._scrollView.addChild(itemNode);
            this._spinNodes.push(itemNode);
            lastSpiningNode = itemNode;
        }

        if (this.state == SLOT_REEL_STATE.SPINING && this.shouldStop) {
            this.state = SLOT_REEL_STATE.STOPPING;

            let lastSpiningNode = this._spinNodes[this._spinNodes.length - 1];
            height = lastSpiningNode.getComponent(UITransform)?.contentSize.height!;
            let selfHeight = this._contentView.getComponent(UITransform)!.contentSize.height;

            this._contentView.setPosition(v3(0, lastSpiningNode.position.y + height / 2 + selfHeight / 2));
            this._contentView.active = true;

            this.setShowingSymbols(this._results);
            this.slotSymbols.length = 0;
            this._pushSymbolAtIndex(0);

            this.dataSource.willStopAtReel(this);
        }
    }

    protected _pushSymbolAtIndex(idx: number) {
        // log(`_pushSymbolAtIndex ${this.index} : idx` + "   " + this._showingSymbols[idx]);
        let symbolSize = this.dataSource.symbolSize;
        let itemNode = this._createSymbol2(this._showingSymbols[idx]);
        itemNode.setPosition(v3(0, symbolSize.height * (idx + 0.5) - this._reelHeight / 2));
        this._contentView.addChild(itemNode);
        let slotSymbolComp = itemNode.getComponent(ExtSlotSymbol)!;
        this.slotSymbols.push(slotSymbolComp);
        this.setZindexAllSlotSymbol();
    }

    resetState() {
        this.state = SLOT_REEL_STATE.IDLE;
        this.hasResult = false;
        this.shouldStop = false;
        this.isF2R = false;
    }

    spin() {
        let symbolSize = this.dataSource.symbolSize;
        this._velocity = symbolSize.height * this.dataSource.slotConfig.spinRowsPerSecond;
        this._lastMovingDis = this._velocity * (1 / 60.0) * this.speed;

        this.dataSource.slotConfig.isTurboMode ? (this.speed = 2.0) : (this.speed = 1.0);
        for (let i = 0; i < this.numberOfRows; i++) {
            let slotSymbolComp = this.slotSymbols[i].getComponent(ExtSlotSymbol);
            if (slotSymbolComp) {
                let pos = utils.getPostionInOtherNode(this._scrollView, slotSymbolComp.node) as Vec3;
                slotSymbolComp.node.parent = this._scrollView;
                slotSymbolComp.node.setPosition(pos);
                this._spinNodes.push(slotSymbolComp.node);
            }
        }

        let pos = utils.getPostionInOtherNode(this._scrollView, this._contentView) as Vec3;
        this._contentView.parent = this._scrollView;
        this._contentView.position = pos;
        this._contentView.active = false;
        this.slotSymbols.length = 0;
        this.maskReel.enabled = true;
        this.state = SLOT_REEL_STATE.SPINING;
    }

    spinWithAnim() {
        this.state = SLOT_REEL_STATE.IDLE;
        this.hasResult = false;
        this.shouldStop = false;

        let symbolSize = this.dataSource.symbolSize;
        this._velocity = symbolSize.height * this.dataSource.slotConfig.spinRowsPerSecond;
        this.dataSource.slotConfig.isTurboMode ? (this.speed = 2.0) : (this.speed = 1.0);

        let duration = 0.1;
        tween(this.node)
            .by(duration, { position: v3(0, 40, 0) }, { easing: 'fade' })
            .call(() => {

                for (let i = 0; i < this._contentView.children.length; i++) {
                    let slotSymbolComp = this._contentView.children[i].getComponent(ExtSlotSymbol);
                    if (slotSymbolComp) {
                        slotSymbolComp.isBlur = true;
                    }
                }

                let pos = utils.getPostionInOtherNode(this._scrollView, this._contentView) as Vec3;
                this._contentView.parent = this._scrollView;
                this._contentView.position = pos;
                this.maskReel.enabled = true;
                this._spinNodes.push(this._contentView);
            })
            .by(duration, { position: v3(0, -40, 0) }, { easing: 'fade' })
            .call(() => {
                this.state = SLOT_REEL_STATE.SPINING;
            })
            .start();
    }

    replaceAllSymbols(symbols: string[], animated: boolean = false) {
        log("replaceAllSymbols    " + this.index + "  " + symbols);
        this.setShowingSymbols(symbols);
        if (!animated) {
            for (let i = 0; i < this.slotSymbols.length; i++) {
                this.slotSymbols[i].symbolCode = symbols[i];
            }
            this.setZindexAllSlotSymbol();
        }
        else {
            let symbolSize = this.dataSource.symbolSize;
            let oldSymbols: ExtSlotSymbol[] = [].concat(this.slotSymbols);
            this.slotSymbols.length = 0;
            for (let i = 0; i < this.numberOfRows; i++) {
                let itemNode = this._createSymbol2(this._showingSymbols[i]);
                itemNode.setPosition(v3(0, symbolSize.height * (i + 0.5) - this._reelHeight / 2));
                this._contentView.addChild(itemNode);
                let slotSymbolComp = itemNode.getComponent(ExtSlotSymbol)!;
                this.slotSymbols.push(slotSymbolComp);

                utils.setOpacity(itemNode, 0);
                let oldSymbol = oldSymbols[i];
                utils.fadeOut(oldSymbol.node, 0.1, {
                    onComplete: (target?: object) => {
                        // log(`remove old symbol`);
                        oldSymbol.node.removeFromParent();
                        oldSymbol.node.destroy();
                    }
                });
                utils.fadeIn(itemNode, 0.1);
            }
            this.setZindexAllSlotSymbol();
        }
    }

    getShowingSymbol() {
        return this._showingSymbols;
    }

    setShowingSymbols(symbols: string[]) {
        this._showingSymbols.splice(0, this._showingSymbols.length);
        this._showingSymbols = this._showingSymbols.concat(symbols);
    }

    getResult() {
        return this._results;
    }

    setResult(symbols: string[]) {
        // log(`ExtSlotReel setResult: ${symbols}`);
        this.hasResult = true;
        this._results.splice(0, this._results.length);
        this._results = this._results.concat(symbols);
    }

    startNearWin(callback: VoidFunction | null = null) {
        this._bgrNode && (this._bgrNode.active = true);
        let _target = { value: this.speed };
        this._twNearWin = tween(_target)
            .delay(0.3)
            .to(0.2, { value: 1.0 }, {
                onUpdate: (target?: object, ratio?: number) => {
                    this.speed = _target.value;
                    // log(`speed = ${this.speed}`);
                }
            })
            .delay(0.3)
            .to(0.2, { value: 0.75 }, {
                onUpdate: (target?: object, ratio?: number) => {
                    this.speed = _target.value;
                    // !this._forceNotBlur && (this.speed < 0.5) && (this._forceNotBlur = true);
                    // log(`speed = ${this.speed}`);
                }
            })
            .call(() => {
                this._forceNotBlur = true;
            })
            .delay(0.1)
            .to(0.1, { value: 0.2 }, {
                onUpdate: (target?: object, ratio?: number) => {
                    this.speed = _target.value;
                    // log(`speed = ${this.speed}`);
                }
            })
            // .delay(0.1)
            .call(() => {
                callback && callback();
                this.shouldStop = true;
                this._twNearWin = null;
            })
            .start();
    }

    stopNearWin() {
        this._bgrNode && (this._bgrNode.active = false);
        this._forceNotBlur = false;
        if (this._twNearWin) {
            this._twNearWin.stop();
            this._twNearWin = null;
        }
    }

    showSymbols(symbols: string[], blur: boolean) {
        log(`ExtSlotReel showSymbols: ${symbols}`);

        this.setShowingSymbols(symbols);

        if (this._contentView) {
            let symbolSize = this.dataSource.symbolSize;
            this.slotSymbols.length = 0;

            for (let i = 0; i < this.numberOfRows; i++) {
                let itemNode = this._createSymbol2(this._showingSymbols[i]);
                itemNode.setPosition(v3(0, symbolSize.height * (i + 0.5) - this._reelHeight / 2));
                this._contentView.addChild(itemNode);
                let slotSymbolComp = itemNode.getComponent(ExtSlotSymbol)!;
                this.slotSymbols.push(slotSymbolComp);
            }
        }
        this.setZindexAllSlotSymbol();
    }

    dropResult(symbols: string[]) {
        log(`dropResult: ${symbols}`);

        this.setShowingSymbols(symbols);

        this._results.splice(0, this._results.length);
        this._results = this._results.concat(symbols);

        let baseTime = 0.6;
        let brokenSymbols: ExtSlotSymbol[] = [];
        let symbolSize = this.dataSource.symbolSize;
        this.maskReel.enabled = true;
        for (let i = 0; i < this.numberOfRows; i++) {
            if (!this.slotSymbols[i].isValid || this.slotSymbols[i].node.parent != this._contentView) {
                brokenSymbols.push(this.slotSymbols[i]);
            }
        }
        for (let i = 0; i < brokenSymbols.length; i++) {
            this.slotSymbols.splice(this.slotSymbols.indexOf(brokenSymbols[i]), 1);
            baseTime -= 0.1;
        }
        baseTime /= 2;

        let startIndex = this.slotSymbols.length;
        let addedSymbolCnt = 0;
        for (let i = startIndex; i < this.numberOfRows; i++) {
            let itemNode = this._createSymbol2(this._showingSymbols[i]);
            itemNode.setPosition(v3(0, symbolSize.height * (addedSymbolCnt + 0.5) - this._reelHeight / 2 + this._reelHeight));
            this._contentView.addChild(itemNode);
            let slotSymbolComp = itemNode.getComponent(ExtSlotSymbol)!;
            this.slotSymbols.push(slotSymbolComp);
            addedSymbolCnt++;
        }

        this.setZindexAllSlotSymbol();

        let maxTime = 0;
        for (let i = 0; i < this.slotSymbols.length; i++) {
            let distance = Math.abs(this.slotSymbols[i].node.position.y - (symbolSize.height * (i + 0.5) - this._reelHeight / 2));
            let time = baseTime * distance / this.dataSource.slotConfig.symbolSize.y
            if (time > maxTime) {
                maxTime = time;
            }

            if (this.slotSymbols[i].node.position.y == (symbolSize.height * (i + 0.5) - this._reelHeight / 2)) continue;
            tween(this.slotSymbols[i].node)
                .to(time, { position: v3(0, symbolSize.height * (i + 0.5) - this._reelHeight / 2) }, { easing: "bounceOut" })
                .start();
        }
        this.scheduleOnce(() => {
            this.maskReel.enabled = false;
        }, maxTime)
        this.scheduleOnce(() => {
            this.dataSource.onStoppedAtReel(this);
        }, maxTime + 0.1)
    }

    setZindexAllSlotSymbol() {
        for (let i = this.slotSymbols.length - 1; i >= 0; i--) {
            if (this.slotSymbols[i].symbolCode == this.dataSource.slotConfig.scatterSymbolCode ||
                this.slotSymbols[i].symbolCode == this.dataSource.slotConfig.wildSymbolCode) {
                this.slotSymbols[i].node.setZIndex(1000);
            }
            else {
                this.slotSymbols[i].node.setZIndex(0);
            }
        }
    }
}
