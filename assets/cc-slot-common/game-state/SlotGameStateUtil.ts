import { BetInfo, ExtraBetInfo, FreeOptionInfo } from "../model/BetInfo";
import { JackpotInfo } from "../model/JackpotInfo";
import { JoinGameModel } from "../model/JoinGameModel";
import { AVAILABLE_COMMAND_CODE, ERROR_CODE, PLAYER_STATE_CODE, PLAYER_STATE_TYPE, PLAYER_SUB_STATE_CODE,
    PayLineAllwaysToWinBase, PlayerStateBase,  SlotPlayerState, PromotionInfo, BigWinLevel } from "./SlotGameStateImpl";


export class SlotGameStateUtil {
    static buildJoinGameModel (betInfos : BetInfo[], allJackpotInfos : {[key:string] : JackpotInfo}, promotion: any, playerState: SlotPlayerState): JoinGameModel {
        let currentBetInfo = betInfos[0];

        if (playerState && playerState.betId) {
            currentBetInfo = betInfos.find((betInfo) => {
                return betInfo.betId === playerState.betId;
            });
        }

        let promotionInfo: PromotionInfo= null;
        if (promotion?.pRe) {
            promotionInfo = {
                betId: promotion.bId,
                promotionCode: promotion.pCd,
                promotionRemain: promotion.pRe,
                promotionTotal: promotion.pTal,
            }
        }
        const joinGameModel : JoinGameModel = {
            betInfos,
            allJackpotInfos,
            playerState,
            currentBetInfo, 
            promotion: promotionInfo,
            bigWinLevels: [],
        };
        return joinGameModel;
    }

    static buildBetInfo(serviceId: string, mbet: string, allJackpotInfos : {[key:string] : JackpotInfo}): BetInfo[] {
        const betInfos : BetInfo[] = [];
        if (mbet) {
            const mbetArr = mbet.split(',');
            mbetArr.forEach(mbetItem => {
                const aMBetArr = mbetItem.split(';');
                const betId = aMBetArr[0];
                const betAmount = parseFloat(aMBetArr[1]);
                const jackpotInfos: JackpotInfo[] = [];

                const betkey = betId.substring(0, betId.length - 1);
                const jackpotPrefix = `${serviceId}_${betkey}`;

                if (allJackpotInfos) {
                    Object.keys(allJackpotInfos).forEach(jackpotId => {
                        if (jackpotId.startsWith(jackpotPrefix)) {
                            const jackpotInfo: JackpotInfo = allJackpotInfos[jackpotId];
                            jackpotInfos.push(jackpotInfo)
                        }
                    })
                }

                betInfos.push({
                    betId,
                    betAmount,
                    jackpotInfos
                })
            })
        }

        return betInfos;
    }

    static buildBetInfoExtraBet(serviceId: string, mbet: string, extraBet: string, allJackpotInfos : {[key:string] : JackpotInfo}, betkeyIdx: number): BetInfo[] {
        const betInfos = [];
        if (extraBet) {
            const extraBetInfos : ExtraBetInfo[] = [];
            const extraBetArr = extraBet.split(',');
            extraBetArr.forEach(abetItem => {
                const aBetArr = abetItem.split(';');
                extraBetInfos.push({
                    betId: aBetArr[0],
                    betAmount: parseFloat(aBetArr[1]),
                })
            });

            const baseBetInfos = this.buildBetInfo(serviceId, mbet, allJackpotInfos);
            baseBetInfos.forEach((baseBetInfo) => {
                extraBetInfos.forEach((extraBetInfo) => {
                    const betId = baseBetInfo.betId.slice(0, -1) + extraBetInfo.betId;
                    const betAmount = baseBetInfo.betAmount * extraBetInfo.betAmount;
                    const jackpotInfos: JackpotInfo[] = [];

                    const betkey = betId.substring(betkeyIdx, betkeyIdx + 1);
                    const jackpotPrefix = `${serviceId}_${betkey}`;

                    if (allJackpotInfos) {
                        Object.keys(allJackpotInfos).forEach(jackpotId => {
                            if (jackpotId.startsWith(jackpotPrefix)) {
                                const jackpotInfo: JackpotInfo = allJackpotInfos[jackpotId];
                                jackpotInfos.push(jackpotInfo)
                            }
                        })
                    }

                    betInfos.push({
                        betId,
                        betAmount,
                        jackpotInfos,
                    });
                })
            })
        }

        return betInfos;
    }

    static buildAllJackpotInfos(jp: object) : {[key:string] : JackpotInfo} {
        const allJackpotInfos : {[key:string] : JackpotInfo} = {};
        if (jp) {
            Object.keys(jp).forEach(jackpotId => {
                const jackpotInfo: JackpotInfo = {
                    jackpotId,
                    jackpotAmount: parseFloat(jp[jackpotId]),
                    level: 1
                };
                allJackpotInfos[jackpotId] = jackpotInfo;
            })
        }
        return allJackpotInfos;
    }

    // "20,50,80"
    static buildBigWinLevels(bigWinLevelsStr: string) : BigWinLevel[] {
        let bigWinLevels: BigWinLevel[] = []
        if (bigWinLevelsStr) {
            bigWinLevels = bigWinLevelsStr.split(',').map(n => parseInt(n))
        }
        return bigWinLevels;
    }

    // "1;20;[3.0, 5.0, 8.0],2;15;[8.0, 10.0, 15.0],4;13;[10.0, 15.0, 30.0],5;10;[15.0, 30.0, 40.0]"
    static buildFreeOptionInfos(freeOptionStr: string) : FreeOptionInfo[] {
        const freeOptionInfos : FreeOptionInfo[] = [];
        if (freeOptionStr) {
            const freeOptionStrArr = freeOptionStr.split('!');
            freeOptionStrArr.forEach((afreeOptionStr) => {
                const [optionId, numberSpinStr, multipleStr] = afreeOptionStr.split(';');
                const numberSpin = parseInt(numberSpinStr);
                const multipleList = JSON.parse(multipleStr);
                freeOptionInfos.push({
                    optionId,
                    numberSpin,
                    multipleList,
                })
            })
        }

        return freeOptionInfos;
    }
    
    static findFreeOptionById(id: string, freeOptionInfos: FreeOptionInfo[]): FreeOptionInfo {
        return freeOptionInfos.find((freeOptionInfo) => {
            return freeOptionInfo.optionId === id;
        })
    }

    /**
     * Checking:
     * - userId
     * - playsession id
     * - playsession version
     */
    static checkSlotPlayerStateData(currentPlayerState: SlotPlayerState, newPlayerState: SlotPlayerState) : {isValid: boolean, isForceClose: boolean, error: string, message: string } {
        if (currentPlayerState && newPlayerState) {
            if (currentPlayerState.userId !== newPlayerState.userId) {
                return {
                    isValid: false,
                    isForceClose: true,
                    error: ERROR_CODE.MISS_MATCH_PLAY_SESSION,
                    message: ERROR_CODE.MISS_MATCH_PLAY_SESSION_USER_ID,
                }
            }
            if (currentPlayerState.isFinish) {
                if (newPlayerState.version !== 1 && currentPlayerState.id !== newPlayerState.id) {
                    return {
                        isValid: false,
                        isForceClose: true,
                        error: ERROR_CODE.MISS_MATCH_PLAY_SESSION,
                        message: ERROR_CODE.MISS_MATCH_PLAY_SESSION_VERSION,
                    }
                }
            } else { // ps is not finish
                if (currentPlayerState.id === newPlayerState.id) {
                    if (currentPlayerState.version >= newPlayerState.version) {
                        return {
                            isValid: false,
                            isForceClose: true,
                            error: ERROR_CODE.MISS_MATCH_PLAY_SESSION,
                            message: ERROR_CODE.MISS_MATCH_PLAY_SESSION_VERSION,
                        }
                    }
                } else {
                    return {
                        isValid: false,
                        isForceClose: true,
                        error: ERROR_CODE.MISS_MATCH_PLAY_SESSION,
                        message: ERROR_CODE.MISS_MATCH_PLAY_SESSION_ID,
                    }
                }
            }
        }

        return {
            isValid: true,
            isForceClose: false,
            error: '',
            message: '',
        };
    } 

    static transformPayLineAllwaysToWin(paylineStringList: string[]): PayLineAllwaysToWin[] {
        if (paylineStringList) {
            const payLineAllwaysToWinList: PayLineAllwaysToWin[] = paylineStringList.map((paylineString) => {
                const paylineSolitString = paylineString.split(';');
                return {
                    symbol: paylineSolitString[0],
                    winAmount: parseFloat(paylineSolitString[1]),
                    winReelCount: parseInt(paylineSolitString[2], 10),
                    combinationCount: parseInt(paylineSolitString[3], 10),
                    payTable: parseInt(paylineSolitString[4], 10),
                }
            })

            return payLineAllwaysToWinList;
        }
        return [];
    }

    static transformPlayerStateBase(playerNormalBase: PlayerStateBase, betInfos: {[key:string]: BetInfo} ): SlotPlayerState {
        const slotPlayerStateBase: SlotPlayerState = {
            id: playerNormalBase.id,
            userId: playerNormalBase.uId,
            serviceId: playerNormalBase.sId,
            commandId: playerNormalBase.cId,
            version: playerNormalBase.v,
            state: PLAYER_STATE_CODE[playerNormalBase.s] || PLAYER_STATE_TYPE.INIT,
            subState: PLAYER_SUB_STATE_CODE[playerNormalBase.ss] || '',
            totalWinAmount: playerNormalBase.wat || 0,
            betId: playerNormalBase.bId,
            isFinish: <string> playerNormalBase.isF === 'T',
            isTrial:  <string> playerNormalBase.isT === 'T',
            jackpotWin: [],
            availableCommands: playerNormalBase.ac ? playerNormalBase.ac.split(',').map((ac) => {
                return AVAILABLE_COMMAND_CODE[ac].name;
            }): [],
            winType: playerNormalBase.wt,
            winList: !playerNormalBase.wl ? [] : playerNormalBase.wl.map((aWl) => {
                const betInfo : BetInfo = betInfos[playerNormalBase.bId];
                return aWl * betInfo.betAmount;
            }),
        }
        return slotPlayerStateBase;
    }
}

type PayLineAllwaysToWin = PayLineAllwaysToWinBase