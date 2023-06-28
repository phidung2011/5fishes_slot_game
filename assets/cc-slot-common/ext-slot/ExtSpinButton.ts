

import { SpriteFrame, Sprite, tween, SystemEvent, UIOpacity, EventTouch, EventMouse, Component, Node, sp, EventKeyboard, KeyCode, systemEvent, log } from 'cc';
import ExtUtils from '../../ext-framework/ExtUtils';
import ExtControlEvent from '../../ext-framework/ui/ExtControlEvent';
import { _decorator } from 'cc';

const { ccclass, property } = _decorator;

export enum SPIN_STATE {
    IDLE = 0,
    SPINING,
    STOP
}

@ccclass('ExtSpinButton')
export class ExtSpinButton extends Component {
    @property(SpriteFrame)
    normalSprite: SpriteFrame = null!;

    @property(SpriteFrame)
    pressedSprite: SpriteFrame = null!;

    @property(SpriteFrame)
    spiningSprite: SpriteFrame = null!;

    @property(SpriteFrame)
    disableSprite: SpriteFrame = null!;

    @property(Sprite)
    arrow: Sprite = null!;

    @property(SpriteFrame)
    arrowNormal: SpriteFrame = null!;

    @property(SpriteFrame)
    arrowDisable: SpriteFrame = null!;

    @property(Node)
    background: Node = null!;

    @property(Node)
    vfxSpine: Node = null!;

    @property
    allowTapAndHold = true;

    public animIdleName = null;
    public animClickName = null;
    public animHoverName = null;
    public animHoldName = null;

    protected _spinState: SPIN_STATE = SPIN_STATE.IDLE;
    get spinState() {
        return this._spinState;
    }
    set spinState(value) {
        if (this._spinState != value) {
            this._spinState = value;
            this._updateState();
        }
    }

    public arrowRotateSpeed = 120;
    protected _currentSpeed = 120;
    protected _spireNode: Sprite | null = null;

    protected _holdingTime = 0;
    protected _pressed = false;
    protected _hovered = false;
    protected _interactable = true;
    set interactable(value: boolean) {
        if (this._interactable == value) return;
        this._interactable = value;
    }
    get interactable() {
        return this._interactable;
    }

    protected _isAutoSpin: boolean = false;
    set isAutoSpin(value: boolean) {
        if (this._isAutoSpin == value) return;
        this._isAutoSpin = value;
    }
    get isAutoSpin() {
        return this._isAutoSpin;
    }

    protected _disable = false;
    get disable() {
        return this._disable;
    }
    set disable(value: boolean) {
        // if (this._disable == value) return;
        this._disable = value;
        if (this._disable) {
            this._interactable = false;
        }
        else {
            this._interactable = true;
        }
        this._updateState();
    }

    onLoad() {
        this._spireNode = this.background.getComponent(Sprite);
        this.vfxSpine && (this.vfxSpine.active = false);
        this._playFxIdle();
    }

    public onEnable() {
        this._registerNodeEvent();
    }

    public onDisable() {
        this._resetState();
        this._unregisterNodeEvent();
    }

    protected _resetState() {
        this._pressed = false;
        this.arrowRotateSpeed = 120;
    }

    protected _registerNodeEvent() {
        this.node.on(SystemEvent.EventType.TOUCH_START, this._onTouchBegan, this);
        this.node.on(SystemEvent.EventType.TOUCH_END, this._onTouchEnded, this);
        this.node.on(SystemEvent.EventType.TOUCH_CANCEL, this._onTouchCancel, this);

        this.node.on(Node.EventType.MOUSE_ENTER, this._onMouseMoveIn, this);
        this.node.on(Node.EventType.MOUSE_LEAVE, this._onMouseMoveOut, this);

        systemEvent.on(SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    protected _unregisterNodeEvent() {
        this.node.off(SystemEvent.EventType.TOUCH_START, this._onTouchBegan, this);
        this.node.off(SystemEvent.EventType.TOUCH_END, this._onTouchEnded, this);
        this.node.off(SystemEvent.EventType.TOUCH_CANCEL, this._onTouchCancel, this);

        this.node.off(Node.EventType.MOUSE_ENTER, this._onMouseMoveIn, this);
        this.node.off(Node.EventType.MOUSE_LEAVE, this._onMouseMoveOut, this);

        systemEvent.off(SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onKeyDown(event: EventKeyboard) {
        if (!this._interactable || !this.enabledInHierarchy) {
            return;
        }
        // log(`onKeyDown ${event.keyCode}`);
        switch (event.keyCode) {
            case KeyCode.SPACE:
                this._pressed = true;
                if (this.spinState == SPIN_STATE.IDLE) {
                    this._playFxClick();
                }
                this.scheduleOnce(() => {
                    this._pressed = false;
                    this._updateState();
                }, 1);
                this.node.emit(ExtControlEvent.SpinButtonClick, this);
                break;
        }
    }

    // touch event handler
    protected _onTouchBegan(event?: EventTouch) {
        // log(`_onTouchBegan`);
        if (!this._interactable || !this.enabledInHierarchy) { return; }

        this._pressed = true;
        this._holdingTime = 0;

        this._updateState();
        if (event) {
            event.propagationStopped = true;
        }
        this.allowTapAndHold && this.schedule(this._checkPressedAndHold, 0.1, NaN, 0.5);
    }

    private _checkPressedAndHold(dt: number) {
        // log(`_checkPressedAndHold 0`);
        const _maxHoldingTime = 2.0;
        if (this._pressed) {
            // log(`_checkPressedAndHold 1`);
            this._holdingTime += dt;

            if (this._holdingTime > _maxHoldingTime) {
                this._pressed = false;
                this._updateState();
                this.unschedule(this._checkPressedAndHold);

                this.node.emit(ExtControlEvent.SpinButtonTapAndHold, this);
            }
        }
        else {
            // log(`_checkPressedAndHold 2`);
            this._updateState();

            this.unschedule(this._checkPressedAndHold);
        }
    }

    protected _onTouchEnded(event?: EventTouch) {
        if (!this._interactable || !this.enabledInHierarchy) {
            return;
        }

        if (this._pressed) {
            if (this.allowTapAndHold) {
                this.unschedule(this._checkPressedAndHold);
            }

            if (this.spinState == SPIN_STATE.IDLE) {
                this._playFxClick();
            }
            this.scheduleOnce(() => {
                this._pressed = false;
                this._updateState();
            }, 1);

            this.node.emit(ExtControlEvent.SpinButtonClick, this);
        }

        if (event) {
            event.propagationStopped = true;
        }
    }

    protected _onTouchCancel(event?: EventTouch) {
        if (!this._interactable || !this.enabledInHierarchy) { return; }

        this._pressed = false;
        this._updateState();
    }

    protected _onMouseMoveIn(event?: EventMouse) {
        if (!this.enabledInHierarchy) { return; }
        // log(`_onMouseMoveIn`);
        if (!this._pressed && !this._hovered) {
            this._hovered = true;
            this._updateState();
        }
    }

    protected _onMouseMoveOut(event?: EventMouse) {
        // log(`_onMouseMoveOut`);
        if (!this._pressed && this._hovered) {
            this._hovered = false;
            this._stopFx();
            this._updateState();
        }
        else {
            this._hovered = false;
        }
    }

    protected _updateState() {
        // log(`_updateState ${this.spinState}`);
        switch (this.spinState) {
            case SPIN_STATE.IDLE:
                if (this._hovered) {
                    this.arrowRotateSpeed = 240;
                    // !this._disable && this._playFxHover();
                }
                else {
                    this.arrowRotateSpeed = 120;
                }
                break;

            case SPIN_STATE.SPINING:
                this.arrowRotateSpeed = 600;
                break;

            case SPIN_STATE.STOP:
                this.arrowRotateSpeed = 0;
                break;
        }

        if (this._disable) {
            this._spireNode && (this._spireNode.spriteFrame = this.disableSprite);
            this.arrow && this.arrowDisable && (this.arrow.spriteFrame = this.arrowDisable);
            let animName = ExtUtils.getAnimationName(this.vfxSpine.getComponent(sp.Skeleton));
            if (animName == this.animHoverName) {
                this._stopFx();
            }
        }
        else {
            this.arrow && this.arrowNormal && (this.arrow.spriteFrame = this.arrowNormal);
            // this._hovered && this._playFxHover();
            if (this._pressed) {
                this._spireNode && (this._spireNode.spriteFrame = this.pressedSprite);
            }
            else {
                this._spireNode && (this._spireNode.spriteFrame = this.normalSprite);
                this._hovered ? this._playFxHover() : this._playFxIdle();
            }
        }
    }

    changeBackgroundSpin(sprite: SpriteFrame) {
        if (this._spireNode) {
            let uiOpacity = this._spireNode.getComponent(UIOpacity)!;

            tween(uiOpacity)
                .to(0.01, { opacity: 0 }, { easing: 'fade' })
                .call(() => {
                    this._spireNode && (this._spireNode.spriteFrame = sprite);
                })
                .to(0.01, { opacity: 255 }, { easing: 'fade' })
                .start();
        }
    }

    update(deltaTime: number) {
        if (this.arrow.node.active) {
            // if (this._currentSpeed < this.arrowRotateSpeed - 5) {
            //     this._currentSpeed += 5;
            //     if (this._currentSpeed > this.arrowRotateSpeed) this._currentSpeed = this.arrowRotateSpeed;
            // }
            // else if (this._currentSpeed > this.arrowRotateSpeed + 5) {
            //     this._currentSpeed -= 5;
            //     if (this._currentSpeed < this.arrowRotateSpeed) this._currentSpeed = this.arrowRotateSpeed;
            // }
            this._currentSpeed = this.arrowRotateSpeed;
            this.arrow.node.angle -= (deltaTime * this._currentSpeed);
        }
    }

    protected _playFxIdle() {
        if (this.vfxSpine == null || this.animIdleName == null) return;
        let spine = this.vfxSpine.getComponent(sp.Skeleton);
        if (spine) {
            // log(`_playFxIdle`);
            this.vfxSpine.active = true;
            spine.clearTracks();
            spine.setAnimation(0, this.animIdleName, true);
        }
    }

    protected _playFxHold() {
        if (this.vfxSpine == null || this.animHoldName == null) return;
        let spine = this.vfxSpine.getComponent(sp.Skeleton);
        if (spine) {
            // log(`_playFxHold`);
            this.vfxSpine.active = true;
            spine.clearTracks();
            spine.setAnimation(0, this.animHoldName, true);
        }
    }

    protected _playFxHover() {
        if (this.vfxSpine == null || this.animHoverName == null) return;
        let spine = this.vfxSpine.getComponent(sp.Skeleton);
        if (spine) {
            // log(`_playFxHover`);
            this.vfxSpine.active = true;
            spine.clearTracks();
            spine.setAnimation(0, this.animHoverName, true);
        }
    }

    protected _playFxClick() {
        if (this.vfxSpine == null || this.animClickName == null) return;
        let spine = this.vfxSpine.getComponent(sp.Skeleton);
        if (spine) {
            // log(`_playFxClick`);
            this.vfxSpine.active = true;
            spine.clearTracks();
            let entry = spine.setAnimation(0, this.animClickName, false);
            entry && spine.setTrackCompleteListener(entry, () => {
                this.vfxSpine.active = false;
            });
        }
    }

    protected _stopFx() {
        if (this.vfxSpine == null) return;
        // log(`_stopFx`);
        let spine = this.vfxSpine.getComponent(sp.Skeleton);
        if (spine) {
            spine.clearTracks();
        }
        this.vfxSpine.active = false;
    }
}
