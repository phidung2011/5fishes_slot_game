
import { _decorator, Button, Node, Vec3, Vec2, toDegree, sp, tween, Label, log, Prefab } from 'cc';
import * as utils from '../../../../cc-common/cc-share/common/utils';
import { RippleController } from '../ripple_transition/RippleController';
import ExtBaseScreen from '../../../../ext-framework/ui/ExtBaseScreen';
import { SlotConfig9920 } from '../base_slot/SlotConfig9920';
import ExtScreenManager from '../../../../ext-framework/ui/ExtScreenManager';
import { Director9920 } from '../core/Director9920';
import { FreeGameScreen9920 } from '../play_table/FreeGameScreen9920';
import { RandomNumFreeController9920 } from './RandomNumFreeController9920';
import { RandomMultiFreeController9920 } from './RandomMultiFreeController9920';
import { ItemFishSelect9920 } from './ItemFishSelect9920';
import { ExtAudioManager } from '../../../../ext-framework/ExtAudioManager';
const { ccclass, property } = _decorator;

@ccclass('ChooseWildScreen9920')
export class ChooseWildScreen9920 extends ExtBaseScreen {
    @property(RandomNumFreeController9920)
    randomNumFree: RandomNumFreeController9920 = null!;

    @property(RandomMultiFreeController9920)
    randomMultiFree: RandomMultiFreeController9920 = null!;

    @property(Node)
    nodeTarget: Node = null!;

    @property(Node)
    nodeFishMoving: Node = null!;

    @property(Node)
    nodeVfxSelectKoi: Node = null!;

    @property(RippleController)
    rippleTransition: RippleController = null!;

    @property(Node)
    nodeGuideSelect: Node = null!;

    @property(Node)
    nodeGuideAuto: Node = null!;

    @property(Node)
    nodeGuideResult: Node = null!;

    @property(Label)
    lbNumFreeResult: Label = null!;

    @property(Label)
    lbMultipleFreeResult: Label = null!;

    @property(Label)
    lbTimeCountDown: Label = null!;

    @property(ItemFishSelect9920)
    listItemFish: ItemFishSelect9920[] = [];

    @property(Node)
    nodeBlockInput: Node = null!;


    private timeCountDown: number = 30;
    private zFishOrder: number = 0;
    private maxDistance: number = 790;
    private firstScale: Vec3 = new Vec3(0.86, 0.86, 1);
    nodeSource: Node = null!;

    onLoad() {
        Director9920.instance.chooseWildScreen = this;
        if (this.nodeFishMoving) {
            this.nodeFishMoving.active = false;
            this.zFishOrder = this.nodeFishMoving.position.z;
            this.nodeFishMoving && this.nodeFishMoving.setScale(this.firstScale);
        }
        this.nodeBlockInput && (this.nodeBlockInput.active = false);
    }

    start() {
        if (SlotConfig9920.isUnitTest) {
            // this.scheduleOnce(this._go2FreeGame, 1);
            return;
        }

        if (Director9920.instance.isNeedChooseWild()) {
            this.nodeGuideAuto.active = true;
            this.nodeGuideAuto.setOpacity(255);

            this.lbTimeCountDown.string = '' + this.timeCountDown;
            this.schedule(this.updateTimeCountDown, 1, NaN, 2);
        } else {
            this.nodeBlockInput && (this.nodeBlockInput.active = true);
            this.nodeGuideSelect.active = false;
            this.nodeGuideResult.active = true;
            this._updateResult();
            this._showBigFish();

            this.scheduleOnce(this._go2FreeGame, 3);
        }
    }

    updateTimeCountDown() {
        this.timeCountDown--;
        this.lbTimeCountDown.string = '' + this.timeCountDown;
        if (this.timeCountDown <= 0) {
            // log('@@@ TIME OUT');
            this.unschedule(this.updateTimeCountDown);

            this.listItemFish.length > 4 && this.listItemFish[4] && this.onClickFish(this.listItemFish[4].node.getComponent(Button), SlotConfig9920.wildRandomCode);
            return;
        }
    }

    onClickFish(event: Button, eventData: any) {
        log('@@@ onClickFish event = ' + event + ', eventData = ' + eventData);
        this.unschedule(this.updateTimeCountDown);
        utils.fadeOut(this.nodeGuideAuto, 0.25);

        ExtAudioManager.instance.playEffect("sfx_click_btn");
        this.nodeBlockInput && (this.nodeBlockInput.active = true);
        this.nodeSource = event.target;

        this._setCurrentWild(parseInt(eventData));
        if (SlotConfig9920.isUnitTest) {
            if (SlotConfig9920.currentWild == SlotConfig9920.wildRandomCode) {
                this._startSpinRandomFish();
            } else {
                this._startFishJump();
            }
        } else {
            this._spinFreeOption();
        }

        let data = 'K' + eventData;
        this._fadeOutOtherFishes(data);
    }

    startAction() {
        if (SlotConfig9920.currentWild == SlotConfig9920.wildRandomCode) {
            this._startSpinRandomFish();
        } else {
            this._startFishJump();
        }
    }

    private _startFishJump() {
        let fishWildAnim = this.nodeSource?.getComponent(sp.Skeleton);
        if (fishWildAnim) {
            fishWildAnim.clearTracks();
            let entry = fishWildAnim.setAnimation(0, 'start', false);
            fishWildAnim.setTrackEventListener(entry, (x: any, ev: any) => {
                if (ev && ev.data && ev.data.name && ev.data.name == 'event') {
                    this.nodeFishMoving && this._fishJump(
                        new Vec2(this.nodeSource.position.x, this.nodeSource.position.y),
                        new Vec2(this.nodeTarget.position.x, this.nodeTarget.position.y)
                    );
                }
            });
        }
    }

    private _startSpinRandomFish() {
        this.randomNumFree && this.randomNumFree.startSpin();
        this.randomMultiFree && this.randomMultiFree.startSpin();
        this.scheduleOnce(this._startFishJump, 3);
    }

    _spinFreeOption() {
        log('@@@ _spinFreeOption : id = ' + SlotConfig9920.currentWild);
        Director9920.instance.spin();
    }

    _fadeOutOtherFishes(selectedFishCode: string) {
        for (let i = 0; i < this.listItemFish.length; i++) {
            const element = this.listItemFish[i] as ItemFishSelect9920;
            if (element.fishCode != selectedFishCode) {
                utils.fadeOut(element.node, 1);
            }
        }
    }

    _setCurrentWild(id: number) {
        SlotConfig9920.currentWild = id;
    }

    private _fishJump(posSrc: Vec2, posTar: Vec2) {
        this.nodeFishMoving.active = true;
        this.nodeFishMoving.setPosition(new Vec3(posSrc.x, posSrc.y, this.zFishOrder));
        this._setRotation4Fish(posSrc, posTar);

        let fishMovingAnim = this.nodeFishMoving?.getComponent(sp.Skeleton);
        if (fishMovingAnim) {
            fishMovingAnim.clearTracks();
            // fishMovingAnim.timeScale = 1.25;
            fishMovingAnim.setAnimation(0, 'move', true);
        }

        utils.setOpacity(this.nodeFishMoving, 0);
        utils.fadeIn(this.nodeFishMoving, 0.25);

        let posTarClone = posTar.clone();
        let distance = posTarClone.subtract(posSrc).length();
        let rate = parseFloat((distance / this.maxDistance).toFixed(2));

        let timeEff = 1.5 * rate;

        let scaleUp = tween().to(timeEff / 2, { scale: new Vec3(1, 1, 1) });
        let scaleDown = tween().to(timeEff / 2, { scale: this.firstScale });
        let tweenScale = tween(this.nodeFishMoving)
            .then(scaleUp)
            .then(scaleDown);
        let tweenParallel = tween(this.nodeFishMoving)
            .parallel(
                tweenScale,
                tween().to(timeEff, { position: new Vec3(posTar.x, posTar.y, this.zFishOrder) })
            )
            .call(() => {
                // console.log('All tweens finished.');
                ExtAudioManager.instance.playEffect("sfx_wild_hit");
                this._showVfxSelectKoi();
                this._showBigFish();
                utils.fadeOut(this.nodeFishMoving, 0.25);

                this.scheduleOnce(this._showGuideResult, 0.25);
                this.scheduleOnce(this._go2FreeGame, 3);
            });
        tweenParallel.start();
    }

    private _showBigFish() {
        this.nodeTarget.active = true;
        utils.setOpacity(this.nodeTarget, 0);
        utils.fadeIn(this.nodeTarget, 0.25);

        let bigFishTarget = this.nodeTarget?.getComponent(sp.Skeleton);
        if (bigFishTarget) {
            bigFishTarget.clearTracks();
            bigFishTarget.setSkin('K' + SlotConfig9920.currentWild);
            bigFishTarget.setAnimation(0, 'end', false);
        }
    }

    private _go2FreeGame() {
        // show shader ripple
        let posEff = new Vec2(SlotConfig9920.maxResolution.width / 2, SlotConfig9920.maxResolution.height / 2 + this.nodeTarget.position.y);
        ExtScreenManager.instance.showEffect(this.rippleTransition.node);
        this.rippleTransition && this.rippleTransition.startEffectFullScreen(posEff);

        this.scheduleOnce(() => {
            let free_game_screen = ExtScreenManager.instance.assetBundle.get('res/prefabs/free_game_screen', Prefab)!;
            ExtScreenManager.instance.pushScreen(free_game_screen, (screen: ExtBaseScreen) => {
                log("_go2FreeGame");
                ExtAudioManager.instance.playBGM("bgm_free");
                Director9920.instance.freeGameScreen = screen as FreeGameScreen9920;
            });
        }, 0.0);

    }

    private _setRotation4Fish(posSrc: Vec2, posTar: Vec2) {
        let deltaX = posTar.x - posSrc.x;
        let deltaY = posTar.y - posSrc.y;
        let angleRadian = Math.atan(-deltaX / deltaY);
        let angleDegree = toDegree(angleRadian);
        this.nodeFishMoving.setRotationFromEuler(0, 0, angleDegree);
    }

    private _showVfxSelectKoi() {
        if (this.nodeVfxSelectKoi) {
            this.nodeVfxSelectKoi.active = true;
            let nodeSkeleton = this.nodeVfxSelectKoi?.getComponent(sp.Skeleton);
            if (nodeSkeleton) {
                nodeSkeleton.clearTracks();
                nodeSkeleton.setAnimation(0, 'action', true);
            }
        }
    }

    private _showGuideResult() {
        utils.fadeOut(this.nodeGuideSelect, 0.25);
        this._updateResult();

        utils.setOpacity(this.nodeGuideResult, 0);
        this.nodeGuideResult.active = true;
        utils.fadeIn(this.nodeGuideResult, 0.25);
    }

    private _updateResult() {
        this.lbNumFreeResult.string = SlotConfig9920.currentOptionFree[0] + '';
        this.lbMultipleFreeResult.string = 'x' + SlotConfig9920.currentOptionFree[1] + ',' + SlotConfig9920.currentOptionFree[2]
            + ',' + SlotConfig9920.currentOptionFree[3];
    }
}