
import { _decorator, Node, sp, Label, tween, v3, Button, Tween, UITransform, size, ParticleSystem, log } from 'cc';
import * as utils from '../../../../cc-common/cc-share/common/utils';
import { ExtAudioManager } from '../../../../ext-framework/ExtAudioManager';
import ExtBasePopup from '../../../../ext-framework/ui/ExtBasePopup';
import ExtControlEvent from '../../../../ext-framework/ui/ExtControlEvent';
import ExtScreenManager from '../../../../ext-framework/ui/ExtScreenManager';
import SlotUtils9920 from '../base_slot/SlotUtils9920';

const { ccclass, property } = _decorator;

enum WIN_TYPE {
    NONE = -1,
    BIG_WIN = 0,
    MEGA_WIN = 1,
    SUPER_MEGA_WIN = 2
};

@ccclass('PopupMegaWin9920')
export class PopupMegaWin9920 extends ExtBasePopup {
    @property(Node)
    layerFxWin: Node = null!;

    @property(Node)
    layerAnimWin: Node = null!;

    @property(Label)
    lbBigWinAmount: Label = null!;
    @property(Label)
    lbMegaWinAmount: Label = null!;
    @property(Label)
    lbSuperWinAmount: Label = null!;

    // @property(Node)
    // lightNode: Node = null!;

    public winAmount: number = 0;
    public betAmount: number = 0;
    public hideCallback: VoidFunction | null = null;
    public autoHide: boolean = false;

    private _winType: WIN_TYPE = WIN_TYPE.BIG_WIN;
    private _curWinType: WIN_TYPE = WIN_TYPE.BIG_WIN;
    private _curWinAmount = 0;

    private _tweenWA: Tween<{ value: number }> | null = null;

    _onPopupDidAppear() {
    }

    _onPopupWillDisappear() {

    }

    _onPopupDidDisappear() {
        this.unscheduleAllCallbacks();

        ExtAudioManager.instance.stopClip();
        this.hideCallback && this.hideCallback();
    }

    onLoad() {
        // log(`onLoad: ${this.betAmount} - ${this.winAmount}`);
        this.lbBigWinAmount.node.active = false;
        this.lbMegaWinAmount.node.active = false;
        this.lbSuperWinAmount.node.active = false;

        this.node.addComponent(Button);
    }

    onEnable() {
        super.onEnable();
        this.node.on(ExtControlEvent.PopupDidAppear, this._onPopupDidAppear, this);
        this.node.on(ExtControlEvent.PopupDidDisappear, this._onPopupDidDisappear, this);
        this.node.on(ExtControlEvent.PopupWillDisappear, this._onPopupWillDisappear, this);

        this.node.on(Button.EventType.CLICK, this.forceStop, this);
    }

    onDisable() {
        super.onDisable();
        this.node.off(ExtControlEvent.PopupDidAppear, this._onPopupDidAppear, this);
        this.node.off(ExtControlEvent.PopupDidDisappear, this._onPopupDidDisappear, this);
        this.node.off(ExtControlEvent.PopupWillDisappear, this._onPopupWillDisappear, this);

        this.node.off(Button.EventType.CLICK, this.forceStop, this);
        this.hideCallback = null;
    }

    start() {
        // tween(this.lightNode)
        //     .by(1, { angle: -90 })
        //     .repeatForever()
        //     .start();
        // tween(this.layerText)
        //     .repeatForever(
        //         tween()
        //             .to(0.5, { scale: v3(1.1, 1.1, 1.0) })
        //             .delay(0.1)
        //             .to(0.5, { scale: v3(0.9, 0.9, 1.0) })
        //     )
        //     .start();
        // log(`start: ${this.betAmount} - ${this.winAmount}`);
        if (this.betAmount <= 0 || this.winAmount <= 0) return;

        let ratio = this.winAmount / this.betAmount;
        ratio >= SlotUtils9920.moneyShowEffectConfig[2] ? (this._winType = WIN_TYPE.SUPER_MEGA_WIN) :
            (ratio >= SlotUtils9920.moneyShowEffectConfig[1]) ? (this._winType = WIN_TYPE.MEGA_WIN) :
                (ratio >= SlotUtils9920.moneyShowEffectConfig[0]) ? (this._winType = WIN_TYPE.BIG_WIN) : (this._winType = WIN_TYPE.NONE);

        if (this._winType == WIN_TYPE.NONE) return;

        log('@@@ playClip bgm_bigwin');
        ExtAudioManager.instance.playClip("bgm_bigwin", true);
        ExtAudioManager.instance.playEffect("sfx_coin_count", true);
        this._tweenWinAmount();
    }

    private _playWinVfx() {
        // log(`_playWinVfx: ${this._curWinType} - ${this._winType}`);
        // this._curWinType = 0;

        switch (this._curWinType) {
            case WIN_TYPE.BIG_WIN: // bigwin
                this._changeAnimation('thang_lon', 0);
                this._turnOnVFX(this._curWinType, 0);
                this._tweenLabel();
                // ExtAudioManager.instance.playClip('bgm_bigwin_1');
                break;

            case WIN_TYPE.MEGA_WIN: // thang cuc lon / mega win
                this._changeAnimation('thang_cuc_lon', 0);
                this._turnOffVFX(this._curWinType - 1, 0.0);
                this._turnOnVFX(this._curWinType, 0.0);
                this._tweenLabel();
                // ExtAudioManager.instance.playClip('bgm_bigwin_2');
                break;

            case WIN_TYPE.SUPER_MEGA_WIN: // thang sieu lon/ super mega win 
                this._changeAnimation('thang_sieu_lon', 0);
                this._turnOffVFX(this._curWinType - 1, 0.0);
                this._turnOnVFX(this._curWinType, 0.0);
                this._tweenLabel();
                // ExtAudioManager.instance.playClip('bgm_bigwin_3');
                break;
        }
    }

    private _tweenWinAmount() {
        ExtAudioManager.instance.playEffect("sfx_win_" + (this._curWinType + 1));
        let obj = { value: this._curWinAmount };
        let nextValue = this.winAmount;
        if (this._curWinType < this._winType) {
            if (this._curWinType == WIN_TYPE.BIG_WIN)
                nextValue = SlotUtils9920.moneyShowEffectConfig[1] * this.betAmount;
            else if (this._curWinType == WIN_TYPE.MEGA_WIN)
                nextValue = SlotUtils9920.moneyShowEffectConfig[2] * this.betAmount;
        }
        let duration = 3.0;
        (this._curWinType == WIN_TYPE.MEGA_WIN) && (duration = 3.0);
        (this._curWinType == WIN_TYPE.SUPER_MEGA_WIN) && (duration = 3.0);

        // log(`_tweenWinAmount:${this.winAmount}  - ${this._winType} - ${this._curWinType} - ${duration}`);
        this._tweenWA = tween(obj)
            .to(duration, { value: nextValue }, {
                onUpdate: () => {
                    // log(`onUpdate: ${obj.value}`);
                    this._curWinAmount = obj.value;
                    let amount = utils.formatMoney(Math.round(obj.value));
                    this.lbBigWinAmount.node.active && (this.lbBigWinAmount.string = amount);
                    this.lbMegaWinAmount.node.active && (this.lbMegaWinAmount.string = amount);
                    this.lbSuperWinAmount.node.active && (this.lbSuperWinAmount.string = amount);
                },
                onComplete: () => {
                    // log(`onComplete: ${nextValue}`);

                    this._tweenWA = null;
                    this._curWinAmount = nextValue;
                    if (this._curWinType == this._winType) {
                        ExtAudioManager.instance.stopEffectByName("sfx_coin_count");
                        ExtAudioManager.instance.playEffect("sfx_coin_count_end");
                        // this.hideWhenTouchOnBackground = true;
                        this.node.getComponent(UITransform)!.setContentSize(size(0, 0));
                        this.node.getComponent(Button)?.destroy();

                        this._checkAutoHide();
                    }
                    else {
                        this._curWinType++;
                        this._tweenWinAmount();
                    }
                }
            })
            .start();

        this._playWinVfx();
    }

    private _tweenLabel() {
        switch (this._curWinType) {
            case WIN_TYPE.BIG_WIN: // bigwin
                this.lbBigWinAmount.node.active = true;
                tween(this.lbBigWinAmount.node)
                    .set({ scale: v3(0, 0, 0) })
                    .to(0.2, { scale: v3(1, 1, 0) })
                    .start();
                break;

            case WIN_TYPE.MEGA_WIN: // thang sieu lon / mega win      
                tween(this.lbBigWinAmount.node)
                    .to(0.15, { scale: v3(0, 0, 0) })
                    .call(() => {
                        this.lbBigWinAmount.node.active = false;

                        this.lbMegaWinAmount.node.active = true;
                        tween(this.lbMegaWinAmount.node)
                            .set({ scale: v3(0, 0, 0) })
                            .to(0.15, { scale: v3(1, 1, 0) })
                            .start();
                    })
                    .start();
                break;

            case WIN_TYPE.SUPER_MEGA_WIN: // epic win /thang cuc lon
                tween(this.lbMegaWinAmount.node)
                    .to(0.15, { scale: v3(0, 0, 0) })
                    .call(() => {
                        this.lbMegaWinAmount.node.active = false;

                        this.lbSuperWinAmount.node.active = true;
                        tween(this.lbSuperWinAmount.node)
                            .set({ scale: v3(0, 0, 0) })
                            .to(0.15, { scale: v3(1, 1, 0) })
                            .start();
                    })
                    .start();
                break;
        }

    }

    private _changeAnimation(spineName: string, timedelay: number) {
        let spines = this.layerAnimWin.getComponentsInChildren(sp.Skeleton);

        for (let sp of spines) {
            sp.clearTracks();
            sp.setAnimation(0, "start_" + spineName, false);
            sp.addAnimation(0, "idle_" + spineName, true);
        }
        // if (mega) {
        //     mega.clearTracks();
        //     mega.setAnimation(0, "Idle_" + spineName, true);
        //     // mega.addAnimation(0, spineName, true);
        // }
    }

    //turn on vfx lighting 
    private _turnOnVFX(idx: number, timer: number) {
        if (idx < 0) return console.error(`index must >= 0 vfx index`);
        if (this.layerFxWin) {
            let fx = this.layerFxWin.children[idx];
            if (fx) {
                this.scheduleOnce(() => {
                    if (!fx.active) fx.active = true;
                    // for (let i = 0; i < fx.children.length; i++) {
                    //     let vfx = fx.children[i].getComponent(ParticleSystem);
                    //     vfx?.play();
                    // }
                }, timer);
            }
        }
    }

    //turn off vfx index parameter
    private _turnOffVFX(idx: number, timing: number) {
        if (this.layerFxWin) {
            let fx = this.layerFxWin.children[idx];
            if (fx) {
                this.scheduleOnce(() => {
                    fx.active = false;
                    for (let i = 0; i < fx.children.length; i++) {
                        if (fx.children[i].active)
                            fx.children[i].active = false;
                    }
                }, timing);
            }
        }
    }

    private forceStop() {
        log(`forceStop`);

        this.node.getComponent(Button)?.destroy();
        // this.node.off(Button.EventType.CLICK, this.forceStop, this);
        if (this._tweenWA) {
            this._tweenWA.stop();

            let nextValue = this.winAmount
            let duration = 1;
            let obj = { value: this._curWinAmount };

            this._tweenWA = tween(obj)
                .to(duration, { value: nextValue }, {
                    onUpdate: () => {
                        // log(`onUpdate: ${obj.value}`);
                        this._curWinAmount = obj.value;
                        let amount = utils.formatMoney(Math.round(obj.value));
                        this.lbBigWinAmount.node.active && (this.lbBigWinAmount.string = amount);
                        this.lbMegaWinAmount.node.active && (this.lbMegaWinAmount.string = amount);
                        this.lbSuperWinAmount.node.active && (this.lbSuperWinAmount.string = amount);
                    },
                    onComplete: () => {

                        this._tweenWA = null;
                        this._curWinAmount = nextValue;
                        if (this._curWinType == this._winType) {
                            ExtAudioManager.instance.stopEffectByName("sfx_coin_count");
                            ExtAudioManager.instance.playEffect("sfx_coin_count_end");
                            // this.hideWhenTouchOnBackground = true;
                            this.node.getComponent(UITransform)!.setContentSize(size(0, 0));
                            this._checkAutoHide();
                        }
                        else {
                            this._curWinType++;
                            this._tweenWinAmount();
                        }
                    }
                })
                .start();
            if (this._curWinType < this._winType) {
                this._curWinType = this._winType;
                this._playWinVfx();
            }
        }
    }

    private _checkAutoHide() {
        ExtScreenManager.instance.removeAllEffects();
        ExtAudioManager.instance.stopClip();
        ExtAudioManager.instance.playClip("bgm_bigwin_end");

        if (this.autoHide) {
            this.scheduleOnce(() => {
                this.hideAllParticle();
                this.hide();
            }, 4);
        }
    }

    hideAllParticle() {
        this.node.walk(child => {
            let particle: ParticleSystem = child.getComponent(ParticleSystem);
            if (particle) {
                child.active = false;
            }
        });
    }
}

