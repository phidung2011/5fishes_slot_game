
import { _decorator, Component, Node, Sprite, SpriteFrame, instantiate, sp, Prefab, v3, SystemEvent } from 'cc';
import ExtScreenManager from '../../ext-framework/ui/ExtScreenManager';
import ExtControlEvent from '../../ext-framework/ui/ExtControlEvent';
import * as utils from '../../cc-common/cc-share/common/utils';

const { ccclass, property } = _decorator;

@ccclass('ExtSlotSymbol')
export class ExtSlotSymbol extends Component {
    @property(Sprite)
    spSymbol: Sprite = null!;

    public animSymbol: Node | null = null;
    public effectSymbol: Node | null = null;
    protected _currentAction = "";

    // overide properties - BEGIN
    public normalItemPath: string;
    public blurItemPath: string;
    public symbolIdleAnimName = 'idle';
    public symbolWinAnimName = 'win';
    public symbolNamePrefix = 'symbol_';
    public symbolAnimPathPrefix = 'res/vfx/prefabs/Anim_Symbol_';
    // overide properties - END

    public normalSpriteFrame: SpriteFrame | null = null;
    public blurSpriteFrame: SpriteFrame | null = null;

    protected _symbolCode: string = "";
    set symbolCode(value: string) {
        if (this._symbolCode == value) return;
        if (this.animSymbol) {
            this.animSymbol.removeFromParent();
            this.animSymbol.destroy();
            this.animSymbol = null;
        }

        this._symbolCode = value;
        this.normalSpriteFrame = ExtScreenManager.instance.assetBundle.get(`${this.normalItemPath}/${this.symbolNamePrefix}${this.symbolCode}/spriteFrame`, SpriteFrame);
        this.blurSpriteFrame = ExtScreenManager.instance.assetBundle.get(`${this.blurItemPath}/${this.symbolNamePrefix}${this.symbolCode}/spriteFrame`, SpriteFrame);

        this._updateSymbolSprite();
    }
    get symbolCode(): string {
        return this._symbolCode;
    }

    protected _isBlur: boolean = true;
    set isBlur(value: boolean) {
        if (this._isBlur == value) return;
        this._isBlur = value;
        this._updateSymbolSprite();
    }
    get isBlur(): boolean {
        return this._isBlur;
    }

    protected _interactable: boolean = false;
    set interactable(value: boolean) {
        if (this._interactable == value) return;
        this._interactable = value;
        this._updateInteractionState();
    }
    get interactable() {
        return this._interactable;
    }

    protected _updateInteractionState() {
        if (this._interactable) {
            this.node.on(SystemEvent.EventType.TOUCH_END, this._onClick, this);
        }
        else {
            this.node.off(SystemEvent.EventType.TOUCH_END, this._onClick, this);
        }
    }
    private _onClick() {
        this.node.emit(ExtControlEvent.SymbolClick, this);
    }

    onLoad() {
        // this.interactable = true;
    }

    onDestroy() {
        this.node.off(SystemEvent.EventType.TOUCH_END, this._onClick, this);
    }

    protected _getPostionForSymbol() {
        return v3(0, 0, 0);
    }

    protected _updateSymbolSprite() {
        // log("_updateSymbolSprite")
        if (!this._isBlur) {
            // log(`_updateSymbolSprite: 1`);
            this.spSymbol.spriteFrame = this.normalSpriteFrame;
            this.spSymbol.node.active = true;
            this.spSymbol.node.setPosition(this._getPostionForSymbol());
            this._currentAction = "";
        }
        else {
            // log(`_updateSymbolSprite: 2`);
            !this.spSymbol.node.active && (this.spSymbol.node.active = true);
            this.spSymbol.node.setPosition(this._getPostionForSymbol());
            this.spSymbol.spriteFrame = this.blurSpriteFrame;
            this.stopAction();
        }
    }

    playAction(action: string, loop: boolean = false) {
        // log(`playAction: ${this.symbolCode} - ${action}`);
        if (this._currentAction == action) {
            return;
        }
        this._currentAction = action;

        this._playAnim(action, loop);
        this.effectSymbol && this.effectSymbol.setZIndex(2);
        this.spSymbol.node.active && (this.spSymbol.node.active = false);
    }

    protected _playAnim(action: string, loop: boolean = false) {
        if (this.animSymbol == null) {
            let pfbAnimItem = ExtScreenManager.instance.assetBundle.get(`${this.symbolAnimPathPrefix}${this.symbolCode}`, Prefab);
            if (pfbAnimItem) {
                let anim = pfbAnimItem.data.getComponent(sp.Skeleton);
                if (anim) {
                    let itemAnim = instantiate(pfbAnimItem) as Node;
                    this.node.addChild(itemAnim);
                    itemAnim.layer = this.node.layer;
                    itemAnim.setPosition(0, 0);
                    this.animSymbol = itemAnim;
                    this.animSymbol.setZIndex(1);
                }
            }
        }

        let anim = this.animSymbol?.getComponent(sp.Skeleton);
        anim?.clearTracks();
        anim?.setAnimation(0, action, loop);
    }

    stopAction() {
        if (this.animSymbol) {
            let anim = this.animSymbol.getComponentInChildren(sp.Skeleton);
            anim?.clearTracks();

            this.animSymbol.removeFromParent();
            this.animSymbol.destroy();
            this.animSymbol = null;
        }
        this._currentAction = "";
        !this.spSymbol.node.active && (this.spSymbol.node.active = true);
    }

    stopEffect(fade: boolean = true, destroy: boolean = false) {
        if (!this.effectSymbol) return;
        if (fade) {
            utils.fadeOut(this.effectSymbol, 0.2, {
                onComplete: (target?: object) => {
                    if (destroy) {
                        this.effectSymbol.removeFromParent();
                        this.effectSymbol.destroy();
                        this.effectSymbol = null;
                    }
                    else {
                        this.effectSymbol.setOpacity(255);
                        this.effectSymbol.active = false;
                    }
                }
            });
        }
        else {
            if (destroy) {
                this.effectSymbol.removeFromParent();
                this.effectSymbol.destroy();
                this.effectSymbol = null;
            }
            else {
                this.effectSymbol.setOpacity(255);
                this.effectSymbol.active = false;
            }
        }
    }

    // override to show win animations and effects
    playWinAnimation() {
    }
}