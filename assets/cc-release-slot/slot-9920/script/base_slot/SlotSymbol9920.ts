import { _decorator, Node, SpriteFrame, instantiate, Prefab, Vec3, log, sp } from 'cc';
import { SlotConfig9920 } from './SlotConfig9920';
import * as utils from '../../../../cc-common/cc-share/common/utils';
import { ExtSlotSymbol } from '../../../../cc-slot-common/ext-slot/ExtSlotSymbol';
import ExtScreenManager from '../../../../ext-framework/ui/ExtScreenManager';
import ExtUtils from '../../../../ext-framework/ExtUtils';
import { Director9920 } from '../core/Director9920';

const { ccclass, property } = _decorator;

@ccclass('SlotSymbol9920')
export class SlotSymbol9920 extends ExtSlotSymbol {

    //Must overide the belowing properties
    public normalItemPath: string = SlotConfig9920.normalItemPath;
    public blurItemPath: string = SlotConfig9920.blurItemPath;

    public symbolIdleAnimName = 'idle';
    public symbolWinAnimName = 'animation';
    public symbolNamePrefix = 'symbol_';
    public symbolAnimPathPrefix = 'res/vfx/prefabs/symbol_';
    // overide properties - END

    // overide method
    playAction(action: string, loop: boolean = false) {
        // log(`playAction: ${this.symbolCode} - ${action}`);
        super.playAction(action, loop);
        this.effectSymbol && this.effectSymbol.setZIndex(-2);
    }

    set symbolCode(value: string) {
        if (this._symbolCode == value) return;
        if (this.animSymbol) {
            this.animSymbol.removeFromParent();
            this.animSymbol.destroy();
            this.animSymbol = null;
        }

        this._symbolCode = value;
        if (this._symbolCode == SlotConfig9920.wildSymbolCode && Director9920.instance.isInFreeGame()) {
            this.normalSpriteFrame = ExtScreenManager.instance.assetBundle.get(`${this.normalItemPath}/${this.symbolNamePrefix}${this.symbolCode}${SlotConfig9920.currentWild}/spriteFrame`, SpriteFrame);
            this.blurSpriteFrame = ExtScreenManager.instance.assetBundle.get(`${this.blurItemPath}/${this.symbolNamePrefix}${this.symbolCode}${SlotConfig9920.currentWild}/spriteFrame`, SpriteFrame);
        } else {
            this.normalSpriteFrame = ExtScreenManager.instance.assetBundle.get(`${this.normalItemPath}/${this.symbolNamePrefix}${this.symbolCode}/spriteFrame`, SpriteFrame);
            this.blurSpriteFrame = ExtScreenManager.instance.assetBundle.get(`${this.blurItemPath}/${this.symbolNamePrefix}${this.symbolCode}/spriteFrame`, SpriteFrame);

        }
        this._updateSymbolSprite();
    }

    get symbolCode(): string {
        return this._symbolCode;
    }

    protected _playAnim(action: string, loop: boolean = false) {
        super._playAnim(action, loop);
        if (this._symbolCode == SlotConfig9920.wildSymbolCode && Director9920.instance.isInFreeGame()) {
            this.setSkinAnim('K' + SlotConfig9920.currentWild);
        }
    }
    // end overide

    setSkinAnim(skinName: string) {
        let anim = this.animSymbol?.getComponent(sp.Skeleton);
        skinName && anim?.setSkin(skinName);
    }

    playWinAnimation() {
        log(`playWinAnimation`);
        if (this.effectSymbol == null) {
            let pfbVfxItem = ExtScreenManager.instance.assetBundle.get(`res/vfx/prefabs/vfx_eat_symbol`, Prefab)!;
            this.effectSymbol = instantiate(pfbVfxItem) as Node;
            this.effectSymbol.setPosition(Vec3.ZERO);
            this.node.addChild(this.effectSymbol);
            // log("@@@ eat_symbol playAnimation: action");
        }

        this.effectSymbol.active = true;
        ExtUtils.playAnimation(this.effectSymbol, 'action', true);
        this.playAction('animation', true);
    }

    disableEffSymbol() {
        this.effectSymbol.active = false;
    }

    changeJackpotSymbolWin() {
        this.stopAction();
        // this.normalSpriteFrame = ExtScreenManager.instance.assetBundle.get("res/images/symbols/symbol_JP_off/spriteFrame", SpriteFrame);
        // this._updateSymbolSprite();
    }

}
