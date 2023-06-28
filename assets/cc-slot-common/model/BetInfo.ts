import { JackpotInfo } from "./JackpotInfo";

export interface BetInfo {
    betId: string;
    betAmount: number;
    jackpotInfos: JackpotInfo[];
}

export interface ExtraBetInfo {
    betId: string;
    betAmount: number;
}

export interface FreeOptionInfo {
    optionId: string;
    numberSpin: number;
    multipleList: number[];
}