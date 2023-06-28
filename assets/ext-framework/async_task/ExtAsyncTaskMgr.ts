
import ExtTaskContainer from "./ExtTaskContainer"
import * as cc from 'cc';

export default class ExtAsyncTaskMgr extends cc.Component {

    private _pool: ExtTaskContainer[] = [];
    private _isRunning = true;
    private _lastestTimeStamp: number = 0;

    private static _instance: ExtAsyncTaskMgr = null;
    public static get instance(): ExtAsyncTaskMgr {
        if (ExtAsyncTaskMgr._instance == null) {
            ExtAsyncTaskMgr._instance = new ExtAsyncTaskMgr();
        }
        return ExtAsyncTaskMgr._instance;
    }

    constructor() {
        super();
        this.schedule(this.update, 0, cc.macro.REPEAT_FOREVER, 0);
        cc.game.on(cc.Game.EVENT_HIDE, this._onHideGame, this);
        cc.game.on(cc.Game.EVENT_SHOW, this._onShowGame, this);
    }

    stop() {
        this.cleanUp();
        this.unscheduleAllCallbacks();
        cc.game.off(cc.Game.EVENT_HIDE, this._onHideGame, this);
        cc.game.off(cc.Game.EVENT_SHOW, this._onShowGame, this);
        ExtAsyncTaskMgr._instance = null;
        // return super.destroy();
    }

    private _onShowGame() {
        // cc.log(`_onShowGame`);
        this._isRunning = true;
        let delta = performance.now() - this._lastestTimeStamp;
        this.update(delta);
        this._lastestTimeStamp = 0;

    }

    private _onHideGame() {
        // cc.log(`_onHideGame`);
        this._isRunning = false;
        this._lastestTimeStamp = performance.now();
    }

    /**
     * update all task inside
     * @param dt
     */
    update(dt: number) {
        // cc.log(`ExtAsyncTaskMgr: ${dt}`);
        if (!this._isRunning) return;
        // cc.log(`ExtAsyncTaskMgr: update ${this._pool.length} - ${dt}`);

        let pool = [].concat(this._pool);
        for (let task of pool) {
            if (task.isDone()) {
                task.cleanUp();
                let index = this._pool.indexOf(task);
                (index >= 0) && this._pool.splice(index, 1);
            }
            else {
                task.update(dt);
            }
        }
    }

    removeTaskByKey(key: string) {
        for (let i = 0; i < this._pool.length; ++i) {
            if (this._pool[i].getKey && this._pool[i].getKey() === key) {
                this._pool[i].cleanUp();
                this._pool.splice(i, 1);
                return true;
            }
            else {
            }
        }

        return false;
    }

    getTaskByKey(key: string) {
        for (let i = 0; i < this._pool.length; ++i) {
            if (this._pool[i].getKey && this._pool[i].getKey() === key) {
                return this._pool[i];
            }
        }

        return null;
    }

    /**
     * schedule async task manager if need,
     * and push new task to pool
     * @param taskContainer
     */
    executeTask(taskContainer: ExtTaskContainer) {
        // this.schedule(); // start schedule if need 
        this._pool.push(taskContainer);
    }

    /**
     * clean up all
     */
    cleanUp() {
        for (let i = 0; i < this._pool.length; ++i) {
            if (this._pool[i]) {
                this._pool[i].cleanUp();
            }
        }
        this._pool.splice(0, this._pool.length);
    }
};


