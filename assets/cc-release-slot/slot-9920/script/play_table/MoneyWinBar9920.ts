import { _decorator, Component, Node, Label, tween, v3, Tween, SpriteFrame, Sprite, UITransform, CCBoolean, sp, log } from 'cc';
import * as utils from '../../../../cc-common/cc-share/common/utils';
import { ExtAudioManager } from '../../../../ext-framework/ExtAudioManager';
import ExtUtils from '../../../../ext-framework/ExtUtils';
import SlotUtils9920 from '../base_slot/SlotUtils9920';
import { Director9920 } from '../core/Director9920';

const { ccclass, property } = _decorator;

@ccclass('MoneyWinBar9920')
export class MoneyWinBar9920 extends Component {
    @property(Node)
    bgrBar: Node = null!;

    @property(Node)
    vfxWinNode: Node = null!;

    @property(Label)
    lbTotalWin: Label = null!;

    @property(CCBoolean)
    allowShowTips: Boolean = true;

    @property(Node)
    marqueeText: Node = null!;

    @property(Sprite)
    sprite: Sprite = null!;

    @property([SpriteFrame])
    textTipSpriteFrames: SpriteFrame[] = [];

    public winAmount = 0;
    private _tmpTextTipSF: SpriteFrame[] = [];
    private _isShowOneTip = false;

    onLoad() {
        this.lbTotalWin.node.active = false;
    }

    start() {
        this.showTipTexts();
    }

    showSpinWinAmount(winAmount: number) {
        this.hideTipTexts();
        this.winAmount = winAmount;
        this.lbTotalWin.node.active = true;
        utils.tweenMoney(this.lbTotalWin, 1.0, this.winAmount);
        this.playWinEffect();
        this.unschedule(this.hideTotalWinLabel);
        this.scheduleOnce(this.hideTotalWinLabel, 3.0);
    }

    showTotalWinAmount(totalWinAmount: number) {
        this.unschedule(this.hideTotalWinLabel);
        this.hideTipTexts();
        this.winAmount = totalWinAmount;
        ExtAudioManager.instance.playEffect("sfx_panel_total_win");
        this.lbTotalWin.node.active = true;
        utils.tweenMoney(this.lbTotalWin, 0.75, this.winAmount);
        this.playWinEffect();
        if (this.allowShowTips) {
            this.scheduleOnce(this.hideTotalWinLabel, 3.0);
            this.showTipTexts();
        }
    }

    quickFinishShowingWinAmount(winAmount: number) {
        log(`quickFinishShowingWinAmount`);
        this.unschedule(this.hideTotalWinLabel);
        this.hideTipTexts();

        if (this.lbTotalWin["_tweenMoney"]) {
            let tweenMoney = this.lbTotalWin["_tweenMoney"] as Tween<{ value: number }>;
            tweenMoney.stop();
            this.lbTotalWin["_tweenMoney"] = null;
        }

        this.winAmount = winAmount;
        this.lbTotalWin.string = utils.formatMoney(this.winAmount);
        this.lbTotalWin.node.active = true;
        if (!this.vfxWinNode.active) {
            this.playWinEffect();
        }

        let spine = this.vfxWinNode.getComponent(sp.Skeleton)!;
        let entry = spine.getCurrent(0);
        if (entry) {
            spine.timeScale = 2.0;
            spine.setTrackCompleteListener(entry, () => {
                spine.timeScale = 1.0;
                this.vfxWinNode.active = false;
            });
        }


        if (this.allowShowTips) {
            this.scheduleOnce(this.hideTotalWinLabel, 3.0);
            this.showTipTexts();
        }
    }

    showSpecialXWinAmount(winAmount: number) {
        this.unschedule(this.hideTotalWinLabel);
        this.hideTipTexts();
        this.winAmount = winAmount;
        ExtAudioManager.instance.playEffect("sfx_panel_total_win");
        this.lbTotalWin.node.active = true;
        utils.tweenMoney(this.lbTotalWin, 0.75, this.winAmount);

        // playWinEffect
        this.vfxWinNode.active = true;
        let lvWin = this._getLevelWin() + 1;
        ExtUtils.playAnimation(this.vfxWinNode, `lv${lvWin}`, false, () => {
            this.vfxWinNode.active = false;
        });

        tween(this.lbTotalWin.node)
            .to(0.25, { scale: v3(1.5, 1.5, 1.0) }, { easing: 'sineIn' })
            .to(0.25, { scale: v3(1.0, 1.0, 1.0) }, { easing: 'sineOut' })
            .start();
    }

    hideTotalWinLabel() {
        // log(`hideTotalWinLabel`);
        this.unschedule(this.hideTotalWinLabel);
        this.lbTotalWin.string = '0';
        this.lbTotalWin.node.active = false;
        Tween.stopAllByTarget(this.lbTotalWin.node);
        this.lbTotalWin.node.scale = v3(1, 1, 1);
    }

    showTipTexts() {
        // log(`showTipTexts`);
        if (!this.allowShowTips || this.textTipSpriteFrames.length == 0) return;

        this.marqueeText.active = true;
        this.schedule(this._showNextTipsText, 0.5, NaN, 3);
    }

    hideTipTexts() {
        if (!this.allowShowTips || this.textTipSpriteFrames.length == 0) return;
        // log(`hideTipTexts`);

        this.unschedule(this._showNextTipsText);
        this.marqueeText.active = false;
        Tween.stopAllByTarget(this.sprite.node);
        this.sprite.spriteFrame = null;
        this.sprite.node.setPosition(0, this.sprite.node.position.y);
        this._isShowOneTip = false;
    }

    protected _showNextTipsText() {
        if (!this.allowShowTips || !this.marqueeText.active || this._isShowOneTip) return;
        // log(`_showNextTipsText`);

        if (this._tmpTextTipSF.length == 0) {
            this._tmpTextTipSF = this._tmpTextTipSF.concat(this.textTipSpriteFrames);
            utils.shuffleArray(this._tmpTextTipSF);
        }
        let textSpriteFrame = this._tmpTextTipSF.shift();
        if (!textSpriteFrame) return;

        this.sprite.spriteFrame = textSpriteFrame;
        let spUITransform = this.sprite.node.getComponent(UITransform);
        // spUITransform.width = textSpriteFrame.width;
        // spUITransform.height = textSpriteFrame.height;

        let parentUITransform = this.marqueeText.getComponent(UITransform);
        if (spUITransform.width < parentUITransform.width) {
            this.sprite.node.setPosition(0, this.sprite.node.position.y);
            this._isShowOneTip = true;
            tween(this.sprite.node)
                .delay(5)
                .call(() => { this._isShowOneTip = false; })
                .start();
            // this.marqueeText.active && this.scheduleOnce(this._showNextTipsText.bind(this), 5);
        }
        else {
            let marginLeft = (spUITransform.width - parentUITransform.width) / 2 + 10;
            let movingTime = spUITransform.width / 200.0; // speed = 40px/s
            this.sprite.node.setPosition(marginLeft, this.sprite.node.position.y);
            this._isShowOneTip = true;
            tween(this.sprite.node)
                .delay(2)
                .by(movingTime, { position: v3(-(spUITransform.width + 20), 0, 0) })
                .delay(1)
                .call(() => { this._isShowOneTip = false; })
                .start();
            // this.marqueeText.active && this.scheduleOnce(this._showNextTipsText.bind(this), 2 + movingTime + 0.5);
        }
    }

    playWinEffect() {
        this.vfxWinNode.active = true;
        let lvWin = this._getLevelWin() + 1;
        ExtUtils.playAnimation(this.vfxWinNode, `lv${lvWin}`, false, () => {
            this.vfxWinNode.active = false;
        });
        if (this.bgrBar) {
            tween(this.bgrBar)
                .to(0.15, { scale: v3(1.2, 1.1, 1.0) }, { easing: 'sineIn' })
                .to(0.15, { scale: v3(1.0, 1.0, 1.0) }, { easing: 'sineOut' })
                .union()
                .start();
        }
        tween(this.lbTotalWin.node)
            .set({ scale: v3(0, 0, 1.0) })
            .to(0.25, { scale: v3(1.5, 1.3, 1.0) })
            .to(0.1, { scale: v3(1.0, 1.0, 1.0) })
            .union()
            .start();
    }

    protected _getLevelWin() {
        let betAmount = Director9920.instance.getCurrentBetAmount();
        return SlotUtils9920.getIndexWithValue(this.winAmount / betAmount);
    }

}

