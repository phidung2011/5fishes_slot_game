import { Director9920 } from '../core/Director9920';
import { LIST_START_TABLE, SlotConfig9920 } from './SlotConfig9920';

export default class SlotUtils9920 {

    public static hasExpandWild(mx: any[]): boolean {
        // 3, 4, 5, 4, 3
        for (let i = 7; i < mx.length && i < 12; i++) { // check reel[2]: symbol 7 -> 11
            if (mx[i] == SlotConfig9920.wildSymbolCode) return true;
        }
        return false;
    }

    public static scatterSound = ["sfx_scatter1", "sfx_scatter2", "sfx_scatter3", "sfx_scatter3", "sfx_scatter3"];
    public static resetScatterSound() {
        this.scatterSound = ["sfx_scatter1", "sfx_scatter2", "sfx_scatter3", "sfx_scatter3", "sfx_scatter3"];
    }

    public static jackpotSound = ["sfx_scatter1", "sfx_scatter2", "sfx_scatter3", "sfx_scatter3", "sfx_scatter3"];
    public static resetJackpotSound() {
        this.jackpotSound = ["sfx_scatter1", "sfx_scatter2", "sfx_scatter3", "sfx_scatter3", "sfx_scatter3"];
    }

    public static moneyShowEffectConfig = [8, 15, 35];

    public static isBigWin(winAmount: number) {
        let ratio = winAmount / Director9920.instance.getCurrentBetAmount();
        return ratio >= this.moneyShowEffectConfig[0];
    }

    public static getIndexWithValue(value: Number) {
        for (let i = 0; i < this.moneyShowEffectConfig.length; i++) {
            if (value < this.moneyShowEffectConfig[i]) {
                return i;
            }
        }
        return this.moneyShowEffectConfig.length - 1;
    }

    public static startPlayTable = [
        ["2", "3", "4"],
        ["5", "6", "7"],
        ["8", "9", "B"],
        ["A", "K", "2"],
        ["3", "4", "5"]
    ];

    public static randomStartPlayTable() {
        this.startPlayTable = LIST_START_TABLE[Math.floor(Math.random() * LIST_START_TABLE.length)];
    }

    public static showVfxFireConfig = [3, 7];

    public static getIndexShowVfxFire(value: number) {
        for (let i = this.showVfxFireConfig.length - 1; i > -1; i--) {
            if (value > this.showVfxFireConfig[i]) return i + 1;
        }
        return 0;
    }
}