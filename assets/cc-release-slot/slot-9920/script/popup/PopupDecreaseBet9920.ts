import { _decorator, Component, Node, Vec3, tween, log, Button, Sprite, SpriteFrame } from 'cc';
import { ExtAudioManager } from '../../../../ext-framework/ExtAudioManager';
import ExtScreenManager from '../../../../ext-framework/ui/ExtScreenManager';
const { ccclass, property } = _decorator;

@ccclass('PopupDecreaseBet9920')
export class PopupDecreaseBet9920 extends Component {
    @property(Node)
    bgrDecreaseBet: Node = null!;

    @property(Sprite)
    sprSelected: Sprite = null!;

    curBetIndex: number = 0;
    curSelectedIndex: number = 0;
    isShowed: boolean = false;
    isActing: boolean = false;

    finishedCallback: any = null;

    setCurBetIndex(curBetIndex: number,) {
        this.resetChosen(curBetIndex);
    }

    show() {
        if (this.isShowed || this.isActing) return;

        this.isActing = true;
        this.node.active = true;
        let curScale = this.node.getScale();
        this.bgrDecreaseBet.setScale(new Vec3(curScale.x, 0, curScale.z));
        tween(this.bgrDecreaseBet)
            .to(0.25, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .call(() => {
                this.isActing = false;
                this.isShowed = true;
            })
            .start();
    }

    hide() {
        if (!this.isShowed || this.isActing) return;

        this.isActing = true;
        let curScale = this.node.getScale();
        this.bgrDecreaseBet.setScale(new Vec3(curScale.x, 1, curScale.z));
        tween(this.bgrDecreaseBet)
            .to(0.25, { scale: new Vec3(curScale.x, 0, curScale.x) }, { easing: 'backIn' })
            .call(() => {
                this.isActing = false;
                this.isShowed = false;
                this.node.active = false;
            })
            .start();
    }

    onClickClose(event: Button, eventData: any) {
        this.hide();
        this.finishedCallback && this.finishedCallback(-1);
    }

    onClickBtn(event: Button, eventData: any) {
        ExtAudioManager.instance.playEffect("sfx_click_btn");
        let numRellOpen = parseInt(eventData);
        this.curBetIndex = 5 * (numRellOpen - 1) + this.curSelectedIndex;
        log('@@@ changeTab  id = ' + numRellOpen + ' ==> curBetIndex = ' + this.curBetIndex);
        this.resetChosen(this.curBetIndex);
        this.setCurSprContent(5 - numRellOpen);
        this.hide();
        this.finishedCallback && this.finishedCallback(this.curBetIndex);
    }

    setCurSprContent(numReelLock: number) {
        this.sprSelected.spriteFrame = ExtScreenManager.instance.assetBundle.get(
            'res/images/vi/tex_decrease_bet/tex_giam_' + numReelLock + '/spriteFrame', SpriteFrame);
    }

    resetChosen(betlevel: number) {
        this.curBetIndex = betlevel;
        this.curSelectedIndex = this.curBetIndex % 5;
        log('@@@ this.curBetIndex = ' + this.curBetIndex + ', curSelectedIndex = ' + this.curSelectedIndex);
    }
}