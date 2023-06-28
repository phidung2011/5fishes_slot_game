declare class EventEmitter {
    on(event: string, listener : Function);
    emit(event: string, data?: any);
}

declare global {
    var _;
}

const lodash = _;

import StateMachine from "../../plugins/state-machine.min.js";
import { CommandManager } from "../../cc-common/cc-network/command-manager/command-manager";
import EventManager from "../../cc-common/cc-network/event-manager/event-manager";
import messageManager from '../../cc-common/cc-network/message-manager/message-manager';
import logger from "../../cc-common/cc-network/logger/logger";
import playerInfoStateManager from '../../cc-common/cc-network/game-state-manager/player-info-state-manager';
import { SlotGameStateUtil } from "./SlotGameStateUtil";
import { JoinGameModel } from "../model/JoinGameModel";
import { BetInfo, FreeOptionInfo } from "../model/BetInfo";
import { JoinGameType, SlotGameState } from "./SlotGameState.js";
import { JackpotAwardInfo, JackpotInfo } from "../model/JackpotInfo.js";

const DEFAULT_WALLET_INFO: WalletInfo = {
    MAIN: 500000,
    MAIN_VERSION: 0,
    PROMOTION: 0,
    PROMOTION_VERSION: 0,
};

const WALLET_TYPE = {
    MAIN : 'MAIN',
    PROMOTION: 'PROMOTION',
}

const NetworkEvent = {
    TIMEOUT_REQUEST_WAIT : 1
};

const SERVER_EVENT_NAME = {
    'JOIN_GAME_RESULT' : 'jgr',
    'NORMAL_GAME_RESULT' : 'n',
    'FREE_GAME_RESULT' : 'f',
    'FREE_OPTION_GAME_RESULT' : 'o',
    'RESPIN_GAME_RESULT' : 'r',
    'JACKPOT_UPDATE' : 'jud',
    'JACKPOT_AWARD' : 'JPA',
    'STATE_PUSHED' : 'spu',
    'ERROR' : 'erp',
}

const GAME_STATE_POSITION = {
    INIT : 'init',
    PLAYING_GAME : 'game',
    PANIC : 'panic',
    END : 'end',

}

export const GAME_STATE_EVENT = {
    'JOIN_GAME_SUCCESS' : 'join-game-success',
    'NORMAL_GAME_RESULT' : 'normal-game-result',
    'FREE_GAME_RESULT' : 'free-game-result',
    'FREE_OPTION_GAME_RESULT' : 'free-option-game-result',
    'RESPIN_RESULT' : 'respin-result',

    'WALLET_UPDATE' : 'wallet-update',
    'JACKPOT_UPDATE' : 'jackpot-update',
    'JACKPOT_AWARD' : 'jackpot-award',
    'ERROR' : 'error',

    'TRIAL_NORMAL_GAME_RESULT': 'trial-normal-game-result',
    'TRIAL_FREE_GAME_RESULT' : 'trial-free-game-result',
    'TRIAL_FREE_OPTION_GAME_RESULT' : 'trial-free-option-game-result',
    'TRIAL_RESPIN_RESULT': 'trial-respin-result',
    'CHANGE_MODE': 'change-mode',
    'UPDATE_TRIAL_WALLET': 'update-trial-wallet',
    'UPDATE_PROMOTION': 'update-promotion'
}

export const AVAILABLE_COMMAND_NAME = {
    NORMAL : {
        name: 'NORMAL',
        code : 1,
        commandName : 'ng',
        eventName: SERVER_EVENT_NAME.NORMAL_GAME_RESULT,
    },
    FREE : {
        name: 'FREE',
        code : 2,
        commandName : 'fg',
        eventName: SERVER_EVENT_NAME.FREE_GAME_RESULT,
    },

    FREE_OPTION : {
        name: 'FREE_OPTION',
        code : 3,
        commandName : 'fo',
        eventName: SERVER_EVENT_NAME.FREE_OPTION_GAME_RESULT,
    },

    RESPIN : {
        name: 'RESPIN',
        code : 8,
        commandName : 'rg',
        eventName: SERVER_EVENT_NAME.RESPIN_GAME_RESULT,
    },

    TRIAL_RESPIN : {
        name: 'TRIAL_RESPIN',
        code : 18,
        commandName : 'rgt',
        eventName: SERVER_EVENT_NAME.RESPIN_GAME_RESULT,
    },

    TRIAL_FREE : {
        name: 'TRIAL_FREE',
        code : 12,
        commandName : 'fgt',
        eventName: SERVER_EVENT_NAME.FREE_GAME_RESULT,
    },

    GLT : {
        name: 'GLT',
        code : 99,
        commandName : 'glt',
        eventName: SERVER_EVENT_NAME.STATE_PUSHED,
    },

    TRIAL_NORMAL: {
        name: 'TRIAL_NORMAL',
        code : 11,
        commandName : 'ngt',
        eventName: SERVER_EVENT_NAME.NORMAL_GAME_RESULT,
    }
}

export const AVAILABLE_COMMAND_CODE = {
    '1' : AVAILABLE_COMMAND_NAME.NORMAL,
    '11' : AVAILABLE_COMMAND_NAME.TRIAL_NORMAL,
    '2' : AVAILABLE_COMMAND_NAME.FREE,
    '3' : AVAILABLE_COMMAND_NAME.FREE_OPTION,
    '8' : AVAILABLE_COMMAND_NAME.RESPIN,
    '18' : AVAILABLE_COMMAND_NAME.TRIAL_RESPIN,
    '12' : AVAILABLE_COMMAND_NAME.TRIAL_FREE,
    '99' : AVAILABLE_COMMAND_NAME.GLT,
}

export const PLAYER_STATE_TYPE = {
    INIT: 'INIT',
    NORMAL: 'NORMAL',
    FREE: 'FREE',
    FREE_OPTION: 'FREE_OPTION',
    RESPIN: 'RESPIN',
    BONUS: 'BONUS',
}

export const PLAYER_STATE_CODE = {
    '1': PLAYER_STATE_TYPE.NORMAL,
    '2': PLAYER_STATE_TYPE.FREE,
    '3': PLAYER_STATE_TYPE.FREE_OPTION,
    '4': PLAYER_STATE_TYPE.BONUS,
    '8': PLAYER_STATE_TYPE.RESPIN,
}

export const PLAYER_SUB_STATE_CODE = {
    '81': PLAYER_STATE_TYPE.NORMAL,
    '82': PLAYER_STATE_TYPE.FREE,
}

export const ERROR_CODE = {
    NOT_ENOUGH_MONEY :                  '0001',
    INVALID_TOTAL_BET :                 '0011',
    SPIN_REQUEST_STILL_PROCESSING :     '0030',
    CAN_NOT_AUTHEN :                    '0401',
    CAN_NOT_CONNECT_TO_GAME :           '0500',
    MISS_MATCH_PLAY_SESSION :           '0501',
    MISS_MATCH_PLAY_SESSION_VERSION :   '0502',
    MISS_MATCH_PLAY_SESSION_ID :        '0503',
    MISS_MATCH_PLAY_SESSION_USER_ID :   '0504',
    LOGIN_IN_OTHER_DEVICE: 'user-logged-out',
    FAIL_CONNECT_SERVER: 'FAIL_CONNECT_SERVER',
}

export const NETWORK_STATUS = {
    WARNING :           'NETWORK_STATUS-WARNING',
    DISCONNECTED :      'NETWORK_STATUS-DISCONNECTED',
    CONNECTED :         'NETWORK_STATUS-CONNECTED',
}

const MAX_REQUEST_GET_LATEST_STATE = 10;

const DELAY_GET_LATEST_STATE = 2000;

export abstract class SlotGameStateImpl implements SlotGameState{
    protected serviceId: string;
    protected version: number;
    private _eventManager: EventManager;
    private _commandManager: CommandManager;
    private _emitter: EventEmitter;

    protected playerState : SlotPlayerState;
    protected betInfos: {[key:string]: BetInfo};
    protected freeOptionInfos: FreeOptionInfo[];
    private allJackpotInfos : {[key:string]: JackpotInfo};
    private positionFMS : any;

    private countRequestGetGLT = 0;
    private lastSpinCommandId: string;
    private channelNameSubscribed: Set<string>;

    private isTrialMode: boolean = false;
    private playerStateTrial : SlotPlayerState;
    private trialWallet: WalletInfo;

    private promotion: PromotionInfo;

    protected joinGameData: any;

    constructor(serviceId: string, version: number) {
        this.serviceId = serviceId;
        this.version = version;

        this._commandManager = new CommandManager(serviceId, 1);
        this._eventManager = new EventManager(true);
        this._emitter = new EventEmitter();

        this.channelNameSubscribed = new Set();

        this.setupCommonEventListener();

        messageManager.registerGame(serviceId, {
            onAck: this._commandManager.onAck.bind(this._commandManager),
            onCannotSendMessage: this._commandManager.onCannotSendMessage.bind(this._commandManager)
        }, {
            onCannotConnect: () => {
                this.positionFMS.exitGame(ERROR_CODE.FAIL_CONNECT_SERVER);
            },
            onCannotAuthen: () => {
                logger.debug('onCannotAuthen');
                this.positionFMS.exitGame(ERROR_CODE.CAN_NOT_AUTHEN);
            },
            onNetworkWarning: () => {
                logger.debug('onNetworkWarning');
                this._emitter.emit(NETWORK_STATUS.WARNING);
            },
            onShowPopupDisconnected: () => {
                logger.debug('onShowPopupDisconnected');
                this._emitter.emit(NETWORK_STATUS.DISCONNECTED);
            },
            onConnected: () => {
                logger.debug('onConnected');
                this._emitter.emit(NETWORK_STATUS.CONNECTED);
            },
            onEvent: this._eventManager.onEvent.bind(this._eventManager)
        });

        this.positionFMS = new StateMachine({
            init: GAME_STATE_POSITION.INIT,
            transitions: [
                {
                    name: 'playGame',
                    from: GAME_STATE_POSITION.INIT,
                    to: GAME_STATE_POSITION.PLAYING_GAME
                },
                {
                    name: 'panic',
                    from: GAME_STATE_POSITION.PLAYING_GAME,
                    to: GAME_STATE_POSITION.PANIC
                },
                {
                    name: 'resume',
                    from: GAME_STATE_POSITION.PANIC,
                    to: GAME_STATE_POSITION.PLAYING_GAME
                },
                {
                    name: 'exitGame',
                    from: '*',
                    to: GAME_STATE_POSITION.END
                }
            ],
            methods: {
                onTransition: (lifecycle) => {
                    console.log(`%c run ${lifecycle.transition} =>%c ${lifecycle.to}`, 'color:blue;','color:red;');
                },
                onEnterGame: (lifecycle) => {
                    this.countRequestGetGLT = 0;
                },
                onEnterPanic: (lifecycle) => {
                    this.getLatestState();
                },
                onEnterEnd: (lifecycle, errorCode) => {
                    console.log(`%c run ${lifecycle.transition} =>%c ${lifecycle.to}: ${errorCode}`, 'color:blue;','color:red;');
                    this.cleanUp();
                    if (errorCode) {
                        this._emitter.emit(GAME_STATE_EVENT.ERROR, errorCode);
                    }
                }
            },
        })

        playerInfoStateManager.registerEventOnce(ERROR_CODE.LOGIN_IN_OTHER_DEVICE, () => {
            this.handleNetworkErrror(ERROR_CODE.LOGIN_IN_OTHER_DEVICE);
        });

        playerInfoStateManager.registerEvent('wallet-updated', () => {
            this._emitter.emit(GAME_STATE_EVENT.WALLET_UPDATE);
        });
    }
    
    public setIsTrialMode(b:boolean): void {
        this.isTrialMode = b;
        if (!this.isTrialMode) {
            this._emitter.emit(GAME_STATE_EVENT.JACKPOT_UPDATE, this.allJackpotInfos);
        } else {
            this.playerStateTrial = {
                ...this.playerState,
                availableCommands: [AVAILABLE_COMMAND_NAME.TRIAL_NORMAL.name, AVAILABLE_COMMAND_NAME.GLT.name],
                totalWinAmount: 0,
                state: PLAYER_STATE_TYPE.INIT,
                winList: [],
                winType: undefined,
                jackpotWin: [],
                subState: "",
                isFinish: true,
                isTrial: true
            }
            this.trialWallet = lodash.clone(DEFAULT_WALLET_INFO);
            this._emitter.emit(GAME_STATE_EVENT.UPDATE_TRIAL_WALLET, this.trialWallet);
            const _DEFAULT_TRIAL_JACKPOT = this.getConfigTrialJackpot();
            this.updateTrialJackpot(_DEFAULT_TRIAL_JACKPOT);
        }
 
        this._emitter.emit(GAME_STATE_EVENT.CHANGE_MODE, {
            playerStateTrial: this.playerStateTrial,
            playerState: this.playerState
        });
    }

    private handleTrialNormalGame(eventData: any) {
        this.handleTrialNewPlayerState(eventData, GAME_STATE_EVENT.TRIAL_NORMAL_GAME_RESULT);
    }

    private handleTrialReSpin(eventData: any) {
        this.handleTrialNewPlayerState(eventData, GAME_STATE_EVENT.TRIAL_RESPIN_RESULT);
    }

    private handleTrialFreeGame(eventData: any) {
        this.handleTrialNewPlayerState(eventData, GAME_STATE_EVENT.TRIAL_FREE_GAME_RESULT);
    }

    private updateTrialJackpot(tJ: string[]) {
        const allJackpotInfosTrial = {}
        tJ.forEach(strInfo => {
            const [key, value] = strInfo.split(';');
            allJackpotInfosTrial[key] = {
                jackpotAmount: parseFloat(value),
                jackpotId: key,
                level: 1
            }
        });
        this._emitter.emit(GAME_STATE_EVENT.JACKPOT_UPDATE, allJackpotInfosTrial);    
    }

    protected handleTrialNewPlayerState(eventData: any, event: string) {
        const data = eventData.data;
        const newPlayerState = this.transformPlayerState(data, this.betInfos);

        this.updateTrialJackpot(data.tJ);
        if (newPlayerState.isFinish) {
            this.trialWallet.MAIN += data.wat || 0; // update winAmt
        }
        this._emitter.emit(GAME_STATE_EVENT.UPDATE_TRIAL_WALLET, this.trialWallet);    

        const validateNewPlayerState = SlotGameStateUtil.checkSlotPlayerStateData(this.playerStateTrial, newPlayerState);
        if (validateNewPlayerState.isValid) {
            this.playerStateTrial = newPlayerState;
            if (this.playerStateTrial.state === PLAYER_STATE_TYPE.NORMAL) {
                this.minusTrialWallet(WALLET_TYPE.MAIN, this.betInfos[this.playerStateTrial.betId].betAmount);
                this._emitter.emit(GAME_STATE_EVENT.UPDATE_TRIAL_WALLET, this.trialWallet);
            }
            if (this.playerStateTrial.isFinish) {
                this.addTrialWallet(WALLET_TYPE.MAIN, data.wa || 0); // update winAmt
                this._emitter.emit(GAME_STATE_EVENT.UPDATE_TRIAL_WALLET, this.trialWallet);
            }
            this._emitter.emit(event, lodash.cloneDeep(this.playerStateTrial));
        } else {
            if (validateNewPlayerState.isForceClose) {
                logger.error(validateNewPlayerState.message);
                this.positionFMS.exitGame(validateNewPlayerState.error);
            } else {
                this._emitter.emit(GAME_STATE_EVENT.ERROR, validateNewPlayerState.error);
            }
        }
    }

    protected subscribeChannel(channelName: string) {
        if (channelName) {
            messageManager.subscribe(channelName);
            this.channelNameSubscribed.add(channelName);
        }
    }

    private unsubscribeAllChannel() {
        this.channelNameSubscribed.forEach((channelName) => {
            messageManager.unSubscribe(channelName);
        })
    }

    private cleanUp() {
        this.clearAllNetworkMessage();
        this.unsubscribeAllChannel();
        messageManager.unregisterGame(this.serviceId);
    }

    private setupCommonEventListener() {
        this._eventManager.registerEvent(SERVER_EVENT_NAME.ERROR, this.handleError.bind(this));
        this._eventManager.registerEvent(SERVER_EVENT_NAME.JACKPOT_UPDATE, this.handleJackpotUpdate.bind(this));
        this._eventManager.registerEvent(SERVER_EVENT_NAME.JACKPOT_AWARD, this.handleJackpotAward.bind(this));
    }

    private buildCommandStrategy(event: string) {
        return {
            resendCount : 100,
            shouldWaitForACK : true,
            canBeDuplicated : false
        };
    }

    private buildEventSratergy(event: string) {
        return {
            timeWaitForEvent : 5000
        };
    }

    private checkResultExecuteCommand(commandResult: string) {
        if (commandResult === CommandManager.COMMAND_FAILED_CONC_OVER_LIMIT) {
            logger.error('onEnterInit -> CommandManager.COMMAND_FAILED_CONC_OVER_LIMIT');
            return false;
        } else if (commandResult === CommandManager.COMMAND_FAILED_DUPLICATE) {
            logger.error('onEnterInit -> CommandManager.COMMAND_FAILED_DUPLICATE');
            return false;
        } else {
            return true;
        }
    }

    protected executeCommand(commandPayload: any) : {isSuccess: boolean, commandId: string } {
        const result = {
            isSuccess : false,
            commandId: ''
        }

        if (commandPayload && commandPayload.data) {
            commandPayload.data.serviceId = this.serviceId;
            commandPayload.data.token = playerInfoStateManager.getToken();
        }

        commandPayload.version = this.version;

        const commandStrategy = this.buildCommandStrategy(commandPayload.event);
        const executeCommandResult = this._commandManager.executeCommand(commandPayload, commandStrategy);

        if (this.checkResultExecuteCommand(executeCommandResult)) {
            result.isSuccess = true;
            result.commandId = executeCommandResult;
        } else {
            logger.error("executeCommand fail: %s", executeCommandResult);
        }

        return result;
    }

    protected waitForNetwork(event: string, verifyEvent: (eventData: any) => boolean, timeoutExpectedEventHandler?: () => void) {
        const eventStrategy = this.buildEventSratergy(event);
        this._eventManager.waitForEvent(
            eventStrategy.timeWaitForEvent,
            verifyEvent,
            () => {
                if (timeoutExpectedEventHandler) {
                    timeoutExpectedEventHandler();
                } else {
                    this.updateNetworkState(NetworkEvent.TIMEOUT_REQUEST_WAIT);
                }
            }
        );
    }

    private updateNetworkState(state: number) {
        logger.error("updateNetworkState: %s", state);

        if (state === NetworkEvent.TIMEOUT_REQUEST_WAIT) {
            if (this.positionFMS.state === GAME_STATE_POSITION.PANIC) {
                this.getLatestState();
            } else {
                this.positionFMS.panic();
            }
        }
    }

    protected handleJoinGame(eventData: any) {
        const joinGameData = <JoinGameData> eventData.data;
        this.positionFMS.playGame();
        if (joinGameData) {
            this.joinGameData = joinGameData;
            // join game
            this.freeOptionInfos = this.getFreeOptionInfos(joinGameData);
            this.playerState = this.transformPlayerStateResume(joinGameData[playerInfoStateManager.getUserId()]);
            const joinGameModel: JoinGameModel = this.transformJoinGameData(joinGameData);
            joinGameModel.freeOptionInfos = this.freeOptionInfos;
            
            this.subscribeChannel(joinGameData.gCN);
            this.allJackpotInfos = joinGameModel.allJackpotInfos;

            if (joinGameModel.promotion) {
                this.promotion = joinGameModel.promotion
            }

            if (joinGameModel.betInfos) {
                this.betInfos = {};
                joinGameModel.betInfos.forEach((betInfo) => {
                    this.betInfos[betInfo.betId] = betInfo;
                })
            }

            this._emitter.emit(GAME_STATE_EVENT.JOIN_GAME_SUCCESS, joinGameModel);
        }
    }

    private handleNormalGame(eventData: any) {
        this.handleNewPlayerState(eventData, GAME_STATE_EVENT.NORMAL_GAME_RESULT);
    }

    private handleFreeGame(eventData: any) {
        this.handleNewPlayerState(eventData, GAME_STATE_EVENT.FREE_GAME_RESULT);
    }

    private handleReSpin(eventData: any) {
        this.handleNewPlayerState(eventData, GAME_STATE_EVENT.RESPIN_RESULT);
    }

    private handleFreeOption(eventData: any) {
        this.handleNewPlayerState(eventData, GAME_STATE_EVENT.FREE_OPTION_GAME_RESULT);
    }

    protected handleNewPlayerState(eventData: any, event: string) {
        const data = eventData.data;
        const newPlayerState = this.transformPlayerState(data, this.betInfos);

        // Process promotion data
        if (data.pro) {
            try {
                const promotionInfoArr = data.pro.split(';');
                if (promotionInfoArr.length < 3) {
                    this.promotion = null;
                } else {
                    const [betId, remain, total] = promotionInfoArr;
                    if (remain > 0) {
                        this.promotion = {
                            ...this.promotion,
                            promotionRemain: parseInt(remain, 10),
                            betId,
                            promotionTotal: parseInt(total, 10),
                        }
                    } else {
                        this.promotion = null;
                    }
                }
            } catch (error) {
                this.promotion = null;
                logger.error("[handleNewPlayerState] error process promotion data: ", error, data.pro);
            } finally {
                this._emitter.emit(GAME_STATE_EVENT.UPDATE_PROMOTION, this.promotion);
            }
        }


        const validateNewPlayerState = SlotGameStateUtil.checkSlotPlayerStateData(this.playerState, newPlayerState);
        if (validateNewPlayerState.isValid) {
            this.validateDataTransform(this.playerState, newPlayerState);
            this.playerState = newPlayerState;
            this._emitter.emit(event, lodash.cloneDeep(this.playerState));
        } else {
            if (validateNewPlayerState.isForceClose) {
                logger.error(validateNewPlayerState.message);
                this.positionFMS.exitGame(validateNewPlayerState.error);
            } else {
                this._emitter.emit(GAME_STATE_EVENT.ERROR, validateNewPlayerState.error);
            }
        }
    }

    private handleResume(eventData: any) {
        this.positionFMS.resume();
        const data = eventData.data;
        
        const stateType = PLAYER_STATE_CODE[data.s];

        if (stateType === PLAYER_STATE_TYPE.NORMAL) {
            this.handleNormalGame(eventData);
        } else if (stateType === PLAYER_STATE_TYPE.FREE) {
            this.handleFreeGame(eventData);
        } else if (stateType === PLAYER_STATE_TYPE.RESPIN) {
            this.handleReSpin(eventData);
        } else {
            logger.error("handleResume cannot cover %j", data);
        }
    }

    private handleError(eventData: any) {
        const data = <ErrorPushData> eventData.data;

        //  ===> check glt when spin is still processing
        const isProcessingSpinRequest = data.find((errorData) => {
            return errorData.cd === ERROR_CODE.SPIN_REQUEST_STILL_PROCESSING;
        });

        if (isProcessingSpinRequest) {
            setTimeout(() => {
                // retry glt without count;
                this.countRequestGetGLT = 0;
                this.getLatestState();
            }, DELAY_GET_LATEST_STATE);
            return;
        }
        // check glt when spin is still processing <<===

        this._emitter.emit(GAME_STATE_EVENT.ERROR, data.map((errorData) => {
            return errorData.cd;
        }));
    }

    private handleNetworkErrror(errorCode) {
        if (ERROR_CODE.LOGIN_IN_OTHER_DEVICE === errorCode) {
            this.positionFMS.exitGame(ERROR_CODE.LOGIN_IN_OTHER_DEVICE);
        } else { // can be handle other network isse.
            this.positionFMS.exitGame(errorCode);
        }
    }

    protected handleJackpotUpdate(eventData: any) {
        const data = eventData.data;
        if (data) {
            Object.keys(data).forEach((jackpotId) => {
                if (this.allJackpotInfos[jackpotId]) {
                    this.allJackpotInfos[jackpotId].jackpotAmount = data[jackpotId];
                }
            })
            if (!this.isTrialMode) {
                this._emitter.emit(GAME_STATE_EVENT.JACKPOT_UPDATE, this.allJackpotInfos);
            }
        }
    }

    protected handleJackpotAward(eventData: any) {
        const data : {"jpInfo":[{"jpId":"9999_1_MAJOR","amt":55642,"dn":"User 1","bId":"10","lv":1,"cId":"e4a39d2a0a484623957ad57bd7639ed6"}]} = eventData.data;
        if (data) {
            const jackpotAwardList : JackpotAwardInfo[] = data.jpInfo.map((jpInfo) => {
                return {
                    jackpotId: jpInfo.jpId,
                    jackpotAmount: jpInfo.amt,
                    level:  jpInfo.lv,
                    commandId: jpInfo.cId,
                    betId: jpInfo.bId,
                    displayName: jpInfo.dn,
                }
            });
            this._emitter.emit(GAME_STATE_EVENT.JACKPOT_AWARD, jackpotAwardList);
        }
    }

    private getLatestState() {
        this.clearAllNetworkMessage();
        this.countRequestGetGLT += 1;

        if (this.countRequestGetGLT < MAX_REQUEST_GET_LATEST_STATE) {
            const event = 'glt';
            const executeCommandResult = this.executeCommand({
                event,
                data : {}
            });
    
            if (executeCommandResult.isSuccess) {
                this._commandManager.registerOnce(CommandManager.COMMAND_SEND_SUCCESSFULLY, (commandPayload) => {
                    const successfullyCommandId = commandPayload.data.commandId || commandPayload.data.cId;
                    if (successfullyCommandId === executeCommandResult.commandId) {
                        this._eventManager.registerOnce(SERVER_EVENT_NAME.STATE_PUSHED, (eventData: any) => {
                            const data = <StatePushedData> eventData.data;
                            if (data.cId === executeCommandResult.commandId && data.cIdt === this.lastSpinCommandId) {
                                this.handleResume(eventData);
                            } else {
                                setTimeout(() => {
                                    this.getLatestState();
                                }, DELAY_GET_LATEST_STATE)
                            }
                        });
        
                        this.waitForNetwork(
                            event,
                            (eventData: any) => {
                                return this.isMatchExpectedEvent(SERVER_EVENT_NAME.STATE_PUSHED, executeCommandResult.commandId, eventData);
                            },
                            () => { // timeoutExpectedEventHandler
                                setTimeout(() => {
                                    this.getLatestState();
                                }, DELAY_GET_LATEST_STATE)
                            }
                        );
                    }
                })
            }
        } else {
            this.positionFMS.exitGame(ERROR_CODE.CAN_NOT_CONNECT_TO_GAME);
        }
    }

    private clearAllNetworkMessage() {
        this._eventManager.removeWaitingQueue();
        this._eventManager.removeAllEventListeners();
        this._commandManager.clearRemainingCommand();
        this._commandManager.removeAllEventListeners();

        this.setupCommonEventListener();
    }

    protected isAvailableToSpin() {
        return this.positionFMS.state === GAME_STATE_POSITION.PLAYING_GAME;
    }

    private minusTrialWallet(walletType: string, amount: number) {
        if (this.trialWallet) {
            this.trialWallet[walletType] -= amount;
        }
    }

    private addTrialWallet(walletType: string, amount: number) {
        if (this.trialWallet) {
            this.trialWallet[walletType] += amount;
        }
    }

    protected isMatchExpectedEvent(expectedEventName: string, expectedCommandId: string, eventData: any) {
        const {event, data} = eventData;
        return (expectedEventName === event && data.cId === expectedCommandId) || (
            SERVER_EVENT_NAME.ERROR === event && Array.isArray(data) && data[0].cId === expectedCommandId
        )
    }

    protected getConfigTrialJackpot(): string[] {
        return [];
    }
    
    // abstract method: transform data
    protected abstract transformPlayerState(playerState: any, betInfos: {[key:string]: BetInfo}): SlotPlayerState;

    protected validateDataTransform(oldPlayerState: SlotPlayerState, newPlayerState: SlotPlayerState) {
        // do nothing in abstract class.
    }
    
    protected abstract transformPlayerStateResume(playerStateResume: any): SlotPlayerState;

    protected getFreeOptionInfos(joinGameData: JoinGameData): FreeOptionInfo[] {
        return [];
    }

    protected getBetInfo(joinGameData: JoinGameData, allJackpotInfos : {[key:string] : JackpotInfo}): BetInfo[] {
        return SlotGameStateUtil.buildBetInfo(this.serviceId, joinGameData.exD.mb, allJackpotInfos);
    }

    protected transformJoinGameData(joinGameData: JoinGameData) : JoinGameModel {
        const allJackpotInfos : {[key:string] : JackpotInfo} = SlotGameStateUtil.buildAllJackpotInfos(joinGameData.jp);
        const betInfos: BetInfo[] = this.getBetInfo(joinGameData, allJackpotInfos);
        
        const joinGameModel: JoinGameModel = SlotGameStateUtil.buildJoinGameModel(
            betInfos, 
            allJackpotInfos,
            joinGameData?.exD?.mDP,
            this.playerState
        );

        this.transformJoinGameExtraData(joinGameData?.exD?.ed, joinGameModel);
        return joinGameModel;
    }

    protected transformJoinGameExtraData(extraData: string, joinGameModel: JoinGameModel) {
        joinGameModel.bigWinLevels = SlotGameStateUtil.buildBigWinLevels(extraData);
    }

    // public method
    registerEvent(event: string, listener : Function) {
        this._emitter.on(event, listener);
    }

    joinGame({ codePromotion, env }: JoinGameType) {
        const event = 'jg';
        const executeCommandResult = this.executeCommand({
            event,
            data: {
                c: codePromotion,
                env
            }
        })

        if (executeCommandResult.isSuccess) {
            this._eventManager.registerOnce(SERVER_EVENT_NAME.JOIN_GAME_RESULT, this.handleJoinGame.bind(this));
            this.waitForNetwork(
                event,
                (eventData: any) => {
                    return this.isMatchExpectedEvent(SERVER_EVENT_NAME.JOIN_GAME_RESULT, executeCommandResult.commandId, eventData);
                },
                () => { //timeoutExpectedEventHandler
                    this.positionFMS.exitGame(ERROR_CODE.CAN_NOT_CONNECT_TO_GAME);
                }
            );
        }
    }

    exitGame() {
        this.positionFMS.exitGame();
    }

    spinNormal(betInfo: BetInfo) {
        if (!this.isAvailableToSpin()) {
            logger.error("Stop spinNormal due to not available to spin when at state: %s", this.positionFMS.state);
            return;
        }

        const commandInfo = AVAILABLE_COMMAND_NAME.NORMAL;

        if (this.playerState && !this.playerState.availableCommands.includes(commandInfo.name)) {
            logger.error("Wrong action spinNormal: %j", this.playerState);
            return;
        }
        
        if (!this.promotion && betInfo.betAmount > playerInfoStateManager.getWalletBalance()) {
            this._emitter.emit(GAME_STATE_EVENT.ERROR, [ERROR_CODE.NOT_ENOUGH_MONEY]);
            return;
        }

        if (this.promotion && this.promotion.promotionRemain > 0 && this.promotion.betId !== betInfo.betId) {
            this._emitter.emit(GAME_STATE_EVENT.ERROR, [ERROR_CODE.INVALID_TOTAL_BET]);
            return;
        }

        const executeCommandResult = this.executeCommand({
            event: commandInfo.commandName,
            data : {bId: betInfo.betId}
        })

        if (executeCommandResult.isSuccess) {
            this._commandManager.registerOnce(CommandManager.COMMAND_SEND_SUCCESSFULLY, (commandPayload) => {
                const successfullyCommandId = commandPayload.data.commandId || commandPayload.data.cId;
                if (successfullyCommandId === executeCommandResult.commandId) {
                    this.lastSpinCommandId = executeCommandResult.commandId;
                    this._eventManager.registerOnce(commandInfo.eventName, this.handleNormalGame.bind(this));
        
                    this.waitForNetwork(
                        commandInfo.commandName,
                        (eventData: any) => {
                            return this.isMatchExpectedEvent(commandInfo.eventName, executeCommandResult.commandId, eventData);
                        }
                    );
                }
            })
        }
    }

    spinFree() {
        if (!this.isAvailableToSpin()) {
            logger.error("Stop spinFree due to not available to spin when at state: %s", this.positionFMS.state);
            return;
        }

        const commandInfo = AVAILABLE_COMMAND_NAME.FREE;

        if (this.playerState && !this.playerState.availableCommands.includes(commandInfo.name)) {
            logger.error("Wrong action spinFree: %j", this.playerState);
            return;
        }
        
        const executeCommandResult = this.executeCommand({
            event: commandInfo.commandName,
            data : {}
        })

        if (executeCommandResult.isSuccess) {
            this._commandManager.registerOnce(CommandManager.COMMAND_SEND_SUCCESSFULLY, (commandPayload) => {
                const successfullyCommandId = commandPayload.data.commandId || commandPayload.data.cId;
                if (successfullyCommandId === executeCommandResult.commandId) {
                    this.lastSpinCommandId = executeCommandResult.commandId;
                    this._eventManager.registerOnce(commandInfo.eventName, this.handleFreeGame.bind(this));

                    this.waitForNetwork(
                        commandInfo.commandName,
                        (eventData: any) => {
                            return this.isMatchExpectedEvent(commandInfo.eventName, executeCommandResult.commandId, eventData);
                        }
                    );
                }
            });
        }
    }

    spinReSpin() {
        if (!this.isAvailableToSpin()) {
            logger.error("Stop spinReSpin due to not available to spin when at state: %s", this.positionFMS.state);
            return;
        }
        const commandInfo = AVAILABLE_COMMAND_NAME.RESPIN;

        if (this.playerState && !this.playerState.availableCommands.includes(commandInfo.name)) {
            logger.error("Wrong action spinReSpin: %j", this.playerState);
            return;
        }
        
        const executeCommandResult = this.executeCommand({
            event: commandInfo.commandName,
            data : {}
        })

        if (executeCommandResult.isSuccess) {
            this._commandManager.registerOnce(CommandManager.COMMAND_SEND_SUCCESSFULLY, (commandPayload) => {
                const successfullyCommandId = commandPayload.data.commandId || commandPayload.data.cId;
                if (successfullyCommandId === executeCommandResult.commandId) {
                    this.lastSpinCommandId = executeCommandResult.commandId;
                    this._eventManager.registerOnce(commandInfo.eventName, this.handleReSpin.bind(this));

                    this.waitForNetwork(
                        commandInfo.commandName,
                        (eventData: any) => {
                            return this.isMatchExpectedEvent(commandInfo.eventName, executeCommandResult.commandId, eventData);
                        }
                    );
                }
            })
        }
    }

    spinFreeOption(option: any) {
        if (!this.isAvailableToSpin()) {
            logger.error("Stop spinFreeOption due to not available to spin when at state: %s", this.positionFMS.state);
            return;
        }
        const commandInfo = AVAILABLE_COMMAND_NAME.FREE_OPTION;

        if (this.playerState && !this.playerState.availableCommands.includes(commandInfo.name) && this.playerState['freeOptionRemain'] === 0) {
            logger.error("Wrong action spinFreeOption: %j", this.playerState);
            return;
        }
        
        const executeCommandResult = this.executeCommand({
            event: commandInfo.commandName,
            data : {
                opt: option
            }
        })

        if (executeCommandResult.isSuccess) {
            this._commandManager.registerOnce(CommandManager.COMMAND_SEND_SUCCESSFULLY, (commandPayload) => {
                const successfullyCommandId = commandPayload.data.commandId || commandPayload.data.cId;
                if (successfullyCommandId === executeCommandResult.commandId) {
                    this.lastSpinCommandId = executeCommandResult.commandId;
                    this._eventManager.registerOnce(commandInfo.eventName, this.handleFreeOption.bind(this));

                    this.waitForNetwork(
                        commandInfo.commandName,
                        (eventData: any) => {
                            return this.isMatchExpectedEvent(commandInfo.eventName, executeCommandResult.commandId, eventData);
                        }
                    );
                }
            })
        }
    }

    spinTrialNormal(betInfo: BetInfo) {
        if (!this.isAvailableToSpin()) {
            logger.error("Stop spinTrialNormal due to not available to spin when at state: %s", this.positionFMS.state);
            return;
        }

        const commandInfo = AVAILABLE_COMMAND_NAME.TRIAL_NORMAL;
        if (this.playerStateTrial && !this.playerStateTrial.availableCommands.includes(commandInfo.name)) {
            logger.error("Wrong action spinTrialNormal: %j", this.playerStateTrial);
            return;
        }
        
        if (betInfo.betAmount > this.trialWallet.MAIN) {
            this._emitter.emit(GAME_STATE_EVENT.ERROR, [ERROR_CODE.NOT_ENOUGH_MONEY]);
            return;
        }

        const executeCommandResult = this.executeCommand({
            event: commandInfo.commandName,
            data : { bId: betInfo.betId }
        })

        if (executeCommandResult.isSuccess) {
            this._commandManager.registerOnce(CommandManager.COMMAND_SEND_SUCCESSFULLY, (commandPayload) => {
                const successfullyCommandId = commandPayload.data.commandId || commandPayload.data.cId;
                if (successfullyCommandId === executeCommandResult.commandId) {
                    this.lastSpinCommandId = executeCommandResult.commandId;
                    this._eventManager.registerOnce(commandInfo.eventName, this.handleTrialNormalGame.bind(this));
                    this.waitForNetwork(
                        commandInfo.commandName,
                        (eventData: any) => {
                            return this.isMatchExpectedEvent(commandInfo.eventName, executeCommandResult.commandId, eventData);
                        }
                    );
                }
            });
        }
    }

    spinTrialReSpin() { 
        if (!this.isAvailableToSpin()) {
            logger.error("Stop spinTrialReSpin due to not available to spin when at state: %s", this.positionFMS.state);
            return;
        }
        const commandInfo = AVAILABLE_COMMAND_NAME.TRIAL_RESPIN;
        if (this.playerStateTrial && !this.playerStateTrial.availableCommands.includes(commandInfo.name)) {
            logger.error("Wrong action spinTrialReSpin: %j", this.playerStateTrial);
            return;
        }
        
        const executeCommandResult = this.executeCommand({
            event: commandInfo.commandName,
            data : {}
        })

        if (executeCommandResult.isSuccess) {
            this._commandManager.registerOnce(CommandManager.COMMAND_SEND_SUCCESSFULLY, (commandPayload) => {
                const successfullyCommandId = commandPayload.data.commandId || commandPayload.data.cId;
                if (successfullyCommandId === executeCommandResult.commandId) {
                    this.lastSpinCommandId = executeCommandResult.commandId;
                    this._eventManager.registerOnce(commandInfo.eventName, this.handleTrialReSpin.bind(this));

                    this.waitForNetwork(
                        commandInfo.commandName,
                        (eventData: any) => {
                            return this.isMatchExpectedEvent(commandInfo.eventName, executeCommandResult.commandId, eventData);
                        }
                    );
                }
            })
        }
    }

    spinTrialFree() {
        if (!this.isAvailableToSpin()) {
            logger.error("Stop spinTrialFree due to not available to spin when at state: %s", this.positionFMS.state);
            return;
        }

        const commandInfo = AVAILABLE_COMMAND_NAME.TRIAL_FREE;

        if (this.playerStateTrial && !this.playerStateTrial.availableCommands.includes(commandInfo.name)) {
            logger.error("Wrong action spinTrialFree: %j", this.playerStateTrial);
            return;
        }
        
        const executeCommandResult = this.executeCommand({
            event: commandInfo.commandName,
            data : {}
        })

        if (executeCommandResult.isSuccess) {
            this._commandManager.registerOnce(CommandManager.COMMAND_SEND_SUCCESSFULLY, (commandPayload) => {
                const successfullyCommandId = commandPayload.data.commandId || commandPayload.data.cId;
                if (successfullyCommandId === executeCommandResult.commandId) {
                    this.lastSpinCommandId = executeCommandResult.commandId;
                    this._eventManager.registerOnce(commandInfo.eventName, this.handleTrialFreeGame.bind(this));

                    this.waitForNetwork(
                        commandInfo.commandName,
                        (eventData: any) => {
                            return this.isMatchExpectedEvent(commandInfo.eventName, executeCommandResult.commandId, eventData);
                        }
                    );
                }
            })
        }
    } 
}

export type JoinGameData = {"sId":"0000","gCN":"presence-9943","cId":"b0817e29-0d12-4757-ab60-12a49e513b5f","exD":{"ed":"8,15,35","mDP":{"pCd":"9952-tothemoon-hl-test-1","pRe":5,"pTal":5,"bId":"30"},"mb":"10;1000,20;2000,30;5000,40;10000,50;20000,60;50000,70;100000,80;500000","eb":"1;50,2;100,3;200,4;300,5;500"},"jp":{"9953_1_GRAND":1250000,"9953_5_GRAND":125000000,"9953_3_GRAND":12500000,"9953_2_GRAND":2500000,"9953_4_GRAND":25000000},"user1":{"mul":0,"ss":1,"id":"ce24977c-466d-44b2-b257-762480100068","uId":"user1","sId":"0000","cId":"d343a7eb-fd44-404a-b514-9c96f5ea5c02","cIdt":"d343a7eb-fd44-404a-b514-9c96f5ea5c02","v":1,"s":1,"bId":"10","wat":120,"nMx":["9","5","J","K","8","5","7","J","2","J","7","6","7","5","4","8","2","9","7"],"nLn":["J;120.00;3;2;3"],"na":120,"fRe":1,"fta":1,"isF":"F","isT":"F","bt":1630584942793,"wa":120}};
type StatePushedData = {"cId":"c65b713d-c34f-4dc2-93a8-3f12430a2bfc","cIdt":"3db8dece-d6a0-4dd1-85d0-00a589d0bd56"};
type ErrorPushData = [{"cId":"0","cd":"0011"}];

export interface SlotPlayerState {
    id: string;
    userId: string;
    serviceId: string;
    commandId: string;
    version: number;
    state: string;
    subState?: string;
    totalWinAmount: number;
    betId: string;
    isFinish: boolean;
    isTrial: boolean
    jackpotWin: JackpotInfo[];
    availableCommands: string[];
    winType: string;
    winList: number[]; // use to play animation big win -> mega win -> super 
}

export interface PayLineAllwaysToWinBase {
    symbol: string;
    winAmount: number;
    winReelCount: number;
    combinationCount: number;
    payTable: number;
}


export type MetaDataPromotion = {
    pCd: string, 
    pRe: number, 
    pTal: number,
    bId: string
};


export type PlayerStateBase = {
    id: string;
    uId: string;
    sId: string;
    cId: string;
    v: number;
    bId: string;
    wat: number;
    s: number;
    ss?: number;
    isF: string;
    isT: string;
    ac: string;

    wt: string;
    wl: number[];
    
    pro?: string; // promotionRemain;promotionTotal
    exD?: {
        mb: string
        mDP?: MetaDataPromotion
    } 
};

export type WalletInfo = {
    MAIN: number,
    MAIN_VERSION: number,
    PROMOTION: number,
    PROMOTION_VERSION: number,
}

export type PromotionInfo = {
    promotionCode: string;
    betId: string;
    promotionRemain: number;
    promotionTotal: number;
}


export type BigWinLevel = number
