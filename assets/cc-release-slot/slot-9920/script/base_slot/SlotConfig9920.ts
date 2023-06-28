import { v2, size, Size } from "cc";
import { ExtSlotConfig } from "../../../../cc-slot-common/ext-slot/ExtSlotConfig";

export type SlotConfig9920Type = ExtSlotConfig & {
    redirectURL: string | null,
    smallItemPath: string,
    freeGameWinConfig: number[],
    wildRandomCode: number
    currentWild: number,    // 0: in normal, 1->5: wild in free , 3: random
    currentOptionFree: number[],
    freeOptionRemain: number,
    defaultBetIndex: number,
    numReelOpenFull: number,
    extraFreeGame: number,
    maxResolution: Size
};

export const SlotConfig9920: SlotConfig9920Type = {
    GAME_ID: '9920',
    normalItemPath: 'res/images/symbols',
    blurItemPath: 'res/images/symbols_blur',
    smallItemPath: 'res/images/symbols_small',
    bgItemPath: 'res/images/items_bg',
    symbolSize: size(140, 140),
    symbolCodes: ["2", "3", "4", "5", "6", "7", "8", "9", "B", "A", "K"],
    symbolCodesFree: ["2", "3", "4", "5", "6", "7", "8", "9", "B", "A", "JP", "K"],
    wildSymbolCode: 'K',
    scatterSymbolCode: 'A',
    jackpotSymbolCode: 'JP',
    reelSpinningTime: 1.2, //seconds
    reelSpinningTimeNearWin: 2.5, //seconds
    spinRowsPerSecond: 15,
    numberWinScatter: 3,
    isTurboMode: false,
    curBetAmount: 500,
    totalCredit: 50,
    redirectURL: null,
    freeGameWinConfig: [0, 0, 0, 0, 0, 0],
    wildRandomCode: 3,
    currentWild: 0,
    currentOptionFree: [1, 1, 1, 1],
    freeOptionRemain: 0,
    defaultBetIndex: 20,
    numReelOpenFull: 5,
    extraFreeGame: 0,
    maxResolution: size(720, 1560),
    isUnitTest: false
};

export const PAY_LINES: { [key: string]: number[] } = {
    '2': [1000, 100, 50],
    '3': [800, 100, 35],
    '4': [800, 100, 30],
    '5': [300, 50, 20],
    '6': [300, 35, 15],
    '7': [200, 30, 10],
    '8': [200, 20, 10],
    '9': [100, 15, 10],
    'B': [100, 15, 5],
    'A': [50, 10, 5]
};

export const OPTION_FREE_SELECT_KOI: { [key: string]: number[] } = {
    'K1': [1, 1, 1, 1],  // [20, 3, 5, 8],    
    'K2': [1, 1, 1, 1], // [15, 8, 10, 15]
    'K3': [1, 1, 1, 1],    // random
    'K4': [1, 1, 1, 1], // [13, 10, 15, 30]
    'K5': [1, 1, 1, 1] // [10, 15, 30, 40]
};

export const LIST_START_TABLE = [
    [
        ["2", "3", "4"],
        ["5", "6", "K"],
        ["7", "8", "9"],
        ["B", "A", "2"],
        ["3", "4", "5"]
    ]
];

export const ConfigApi9920 = {
    getHistoryUserSpins: "history/getHistoryUserSpins",
    getHistoryUserSpinSummary: "history/getHistoryUserSpinSummary",
    getHistoryUserSpinDetails: "history/getHistoryUserSpinDetails",
    jackpotHistory: "jackpothistory/slot"
}


