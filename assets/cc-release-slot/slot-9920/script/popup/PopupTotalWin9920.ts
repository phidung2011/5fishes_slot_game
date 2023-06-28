import { _decorator, Node, Vec3, tween, Label, log, sp } from 'cc';
import * as utils from '../../../../cc-common/cc-share/common/utils';
import ExtAsyncTaskMgr from '../../../../ext-framework/async_task/ExtAsyncTaskMgr';
import ExtBaseTask from '../../../../ext-framework/async_task/ExtBaseTask';
import ExtSequenceTask from '../../../../ext-framework/async_task/ExtSequenceTask';
import { ExtAudioManager } from '../../../../ext-framework/ExtAudioManager';
import ExtBasePopup from '../../../../ext-framework/ui/ExtBasePopup';
import ExtScreenManager from '../../../../ext-framework/ui/ExtScreenManager';

const { ccclass, property } = _decorator;

@ccclass('PopupTotalWin9920')
export class PopupTotalWin9920 extends ExtBasePopup {
    @property(Node)
    globalNode: Node = null!;

    @property(Node)
    animAction: Node = null;

    @property(Label)
    labelTotalWin: Label = null!;

    callback: any = null;

    moneyWin: number = 0;

    clickEnd: boolean = false;

    showAnimWin(moneyWin: number, callback: any) {
        log("showAnimWin")
        this.clickEnd = true;
        this.callback = callback;
        this.moneyWin = moneyWin;
        this.globalNode.active = true;
        this.globalNode.scale = new Vec3(0.4, 0.4, 0.4);
        tween(this.globalNode).to(0.2, { scale: new Vec3(1, 1, 1) }).start();
        ExtAudioManager.instance.playClip("bgm_total_win", true);
        this.labelTotalWin.node.active = false;
        let timeRunMoney = 4;
        this.scheduleOnce(() => {
            this.clickEnd = false;
            this.labelTotalWin.node.active = true;
            ExtAudioManager.instance.playEffect("sfx_coin_count", true);
            let skeleton = this.animAction.getComponent(sp.Skeleton);
            skeleton.setAnimation(0, "start_tong_thang", false);
            skeleton.addAnimation(0, "idle_tong_thang", true);
            utils.tweenMoney(this.labelTotalWin, timeRunMoney, this.moneyWin, {
                onComplete: () => {
                    ExtAudioManager.instance.stopEffectByName("sfx_coin_count", true);
                    ExtAudioManager.instance.playEffect("sfx_coin_count_end");
                }
            });
        }, 0.1);
        this.scheduleOnce(() => {
            log("scheduleOnce")
            this.clickEnd = true;
            this.endAction(false);
        }, timeRunMoney + 1.5);
    }

    endAction(needTweenMoney: boolean = true) {
        log("endAction")
        let sequenceTasks = new ExtSequenceTask();
        sequenceTasks.setKey('total_win');
        // let task = new BaseTask();
        if (needTweenMoney) {
            let task = new ExtBaseTask(this, () => {
                utils.tweenMoney(this.labelTotalWin, 0.2, this.moneyWin, {
                    onComplete: () => {
                        ExtAudioManager.instance.stopEffectByName("sfx_coin_count", true);
                        ExtAudioManager.instance.playEffect("sfx_coin_count_end");
                    }
                });
            }
                , [], 0);
            sequenceTasks.pushTask(task);

            task = new ExtBaseTask(this, () => {
                ExtAudioManager.instance.playClip("bgm_bigwin_end");
            }
                , [], 0.3);
            sequenceTasks.pushTask(task);

        }
        else {
            let task = new ExtBaseTask(this, () => {
                ExtAudioManager.instance.playClip("bgm_bigwin_end");
            }
                , [], 0.1);
            sequenceTasks.pushTask(task);
        }

        let task = new ExtBaseTask(this, () => {
            // AudioManager.instance.stopClip();
            if (this.callback) {
                this.callback();
            }
        }
            , [], 3.4);
        sequenceTasks.pushTask(task);

        task = new ExtBaseTask(this, () => {
            // ExtScreenManager.instance.removeAllEffects();
            ExtScreenManager.instance.hidePopup(true);
        }
            , [], 0.0);
        sequenceTasks.pushTask(task);

        ExtAsyncTaskMgr.instance.executeTask(sequenceTasks);
    }

    onClickBtnEnd() {
        log("onClickBtnEnd  " + this.clickEnd)
        if (this.clickEnd) return;
        this.clickEnd = true;
        this.unscheduleAllCallbacks();
        this.endAction();

    }
}
