
export interface JackpotInfo {
    jackpotId: string;
    jackpotAmount: number;
    level: number;
}

export interface JackpotAwardInfo {
    jackpotId: string;
    jackpotAmount: number;
    level: number;
    betId: string;
    displayName: string;
    commandId: string;
}