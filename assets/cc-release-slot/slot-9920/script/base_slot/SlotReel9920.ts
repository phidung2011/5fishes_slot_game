import { _decorator } from 'cc';
import * as utils from '../../../../cc-common/cc-share/common/utils';
import { SlotConfig9920 } from './SlotConfig9920';
import SlotUtils9920 from './SlotUtils9920';
import { ExtSlotReel } from '../../../../cc-slot-common/ext-slot/ExtSlotReel';
import { ExtAudioManager } from '../../../../ext-framework/ExtAudioManager';
// import { Director9920 } from '../core/Director9920';

const { ccclass, property, integer } = _decorator;

@ccclass('SlotReel9920')
export class SlotReel9920 extends ExtSlotReel {

    protected _randomItemID(): string {
        let itemList = SlotConfig9920.symbolCodes;
        // if (Director9920.instance.isFreeSpinState() && Director9920.instance.freeGameScreen != null) {
        //     itemList = SlotConfig9920.symbolCodesFree;
        // }
        let idx = utils.randRange(0, itemList.length - 1);
        return itemList[idx];
    }

    needPlayEffectScatterReel(reel: SlotReel9920) {
        let results = reel.getResult();
        for (let i = 0; i < results.length; i++) {
            if (results[i] == SlotConfig9920.scatterSymbolCode) {
                return true;
            }
        }
        return false;
    }

    needPlayEffectJackpotReel(reel: SlotReel9920) {
        let results = reel.getResult();
        for (let i = 0; i < results.length; i++) {
            if (results[i] == SlotConfig9920.jackpotSymbolCode) {
                return true;
            }
        }
        return false;
    }

    protected _startInertiaStop() {
        let needPlaySoundScatter = this.needPlayEffectScatterReel(this);
        let needPlaySoundJackpot = this.needPlayEffectJackpotReel(this);

        if (!this.isF2R) {
            if (needPlaySoundScatter && !SlotConfig9920.isTurboMode &&
                (5 - SlotUtils9920.scatterSound.length + 4 - this.index + 1) > 2) {
                // ExtAudioManager.instance.playEffect(SlotUtils9920.scatterSound.shift());
            } else {
                if (needPlaySoundJackpot && !SlotConfig9920.isTurboMode &&
                    (5 - SlotUtils9920.jackpotSound.length + 4 - this.index + 1) > 2) {

                    ExtAudioManager.instance.playEffect(SlotUtils9920.jackpotSound.shift());

                } else {
                    ExtAudioManager.instance.playEffect("sfx_reel_stop");
                }
            }
        }
        else {
            if (this.index == 4) {
                ExtAudioManager.instance.playEffect("sfx_reel_stop");
            }
        }

        super._startInertiaStop();
    }

    startNearWin() {
        super.startNearWin();
        ExtAudioManager.instance.playEffect('sfx_nearwin', true);
    }

    stopNearWin() {
        super.stopNearWin();
        ExtAudioManager.instance.stopEffectByName('sfx_nearwin');
    }

}

