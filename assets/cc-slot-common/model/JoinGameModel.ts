import { BigWinLevel, PromotionInfo, SlotPlayerState } from "../game-state/SlotGameStateImpl";
import { BetInfo, FreeOptionInfo } from "./BetInfo";
import { JackpotInfo } from "./JackpotInfo";

export interface JoinGameModel {
    betInfos: BetInfo[];
    currentBetInfo: BetInfo;
    allJackpotInfos : {[key:string]: JackpotInfo};
    playerState: SlotPlayerState;
    promotion: PromotionInfo;
    bigWinLevels: BigWinLevel[];
    freeOptionInfos? : FreeOptionInfo[];
}
