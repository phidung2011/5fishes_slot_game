import { BetInfo } from "../model/BetInfo";
 
export interface SlotGameState {
    registerEvent(event: string, listener : Function);
    joinGame(data: JoinGameType);
    exitGame();
    spinNormal(betInfo: BetInfo);
    spinFree();
    spinReSpin();
}


export type JoinGameType = {
    codePromotion?: string;
    env: number
}