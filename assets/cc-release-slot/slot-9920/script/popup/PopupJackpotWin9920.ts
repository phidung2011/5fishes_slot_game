import { _decorator, Node, Label, log, sp } from 'cc';
import * as utils from '../../../../cc-common/cc-share/common/utils';
import ExtAsyncTaskMgr from '../../../../ext-framework/async_task/ExtAsyncTaskMgr';
import ExtBaseTask from '../../../../ext-framework/async_task/ExtBaseTask';
import ExtSequenceTask from '../../../../ext-framework/async_task/ExtSequenceTask';
import { ExtAudioManager } from '../../../../ext-framework/ExtAudioManager';
import ExtUtils from '../../../../ext-framework/ExtUtils';
import ExtBasePopup from '../../../../ext-framework/ui/ExtBasePopup';
import ExtScreenManager from '../../../../ext-framework/ui/ExtScreenManager';

const { ccclass, property } = _decorator;

@ccclass('PopupJackpotWin9920')
export class PopupJackpotWin9920 extends ExtBasePopup {
    @property(Node)
    globalNodeJackpot: Node = null!;

    @property(Node)
    animJackpot: Node = null;

    @property(Node)
    animTextJackpot: Node = null!;

    @property(Node)
    vfxCoin: Node = null!;

    @property(Label)
    labelMoneyWin: Label = null!;

    callback: any = null;

    moneyWin: number = 0;

    clickEnd: boolean = false;

    showAnimWin(moneyWin: number, callback: any) {
        log("showAnimWin");
        let timeRunMoney = 3;
        this.clickEnd = true;
        this.labelMoneyWin.node.active = false;
        this.callback = callback;
        this.moneyWin = moneyWin;
        this.globalNodeJackpot.active = true;

        ExtAudioManager.instance.playClip("bgm_jackpot", true);
        this.scheduleOnce(() => {
            this.clickEnd = false;
            let animJackpot = this.animJackpot?.getComponent(sp.Skeleton);
            if (animJackpot) {
                animJackpot.clearTracks();
                let entry = animJackpot.setAnimation(0, 'animation', false);

                // track complete
                animJackpot.setTrackCompleteListener(entry, (x: any, ev: any) => {
                    log('@@@ CompleteListener');
                    animJackpot.clearTracks();
                    animJackpot.setAnimation(0, 'idle', true);
                });

                //  // track event
                // animJackpot.setTrackEventListener(entry, (x: any, ev: any) => {
                //     if (ev && ev.data && ev.data.name && ev.data.name == 'jackpot') {
                //         log('@@@ show money');
                //     }
                // });
            }

            // ExtUtils.playAnimation(this.animJackpot, "idle", true);
            // ExtUtils.playAnimation(this.animAction, "idle")

        }, 0);
        this.scheduleOnce(() => {
            this.showPopupMoney(timeRunMoney);
        }, 0.75);
        this.scheduleOnce(() => {
            log("scheduleOnce")
            this.clickEnd = true;
            this.endAction(false);
        }, timeRunMoney + 2.0);
    }

    showPopupMoney(timeRunMoney: number) {
        this.vfxCoin.active = true;
        this.animTextJackpot.active = true;
        ExtUtils.playAnimation(this.animTextJackpot, "action", false, () => {
            ExtUtils.playAnimation(this.animTextJackpot, "idle", true);
            this.labelMoneyWin.node.active = true;
            ExtAudioManager.instance.playEffect("sfx_coin_count", true);
            utils.tweenMoney(this.labelMoneyWin, timeRunMoney, this.moneyWin, {
                onComplete: () => {
                    ExtAudioManager.instance.stopEffectByName("sfx_coin_count", true);
                    ExtAudioManager.instance.playEffect("sfx_coin_count_end");
                }
            });
        });
    }

    endAction(needTweenMoney: boolean = true) {
        log("endAction")
        let sequenceTasks = new ExtSequenceTask();
        sequenceTasks.setKey('total_win');
        // let task = new BaseTask();
        if (needTweenMoney) {
            let task = new ExtBaseTask(this, () => {
                utils.tweenMoney(this.labelMoneyWin, 0.2, this.moneyWin, {
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
        }, [], 3.4);
        sequenceTasks.pushTask(task);

        task = new ExtBaseTask(this, () => {
            // ExtScreenManager.instance.removeAllEffects();
            log('@@@ hide JP');
            ExtScreenManager.instance.hidePopup(true);
        }
            , [], 0.0);
        sequenceTasks.pushTask(task);

        ExtAsyncTaskMgr.instance.executeTask(sequenceTasks);
    }

    onClickBtnEnd() {
        log("onClickBtnEnd  " + this.clickEnd);
        if (this.clickEnd) return;
        this.clickEnd = true;
        this.unscheduleAllCallbacks();
        this.endAction();

    }
}
