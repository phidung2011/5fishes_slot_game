import * as cc from 'cc';
import ExtViewGroup from './ExtViewGroup';
import ExtGameLoop from '../ExtGameLoop';
import ExtAsyncTaskMgr from '../async_task/ExtAsyncTaskMgr';

const { ccclass, property } = cc._decorator;

@ccclass
export default class ExtBaseScreen extends ExtViewGroup {
    @property
    hideCurScreenOnShow: boolean = true;

    protected needLooping: boolean = false;

    start() {
        if (this.needLooping) {
            this._createGameLoop();
        }
        // ExtAsyncTaskMgr.instance.schedule();
    }

    onDisable() {
        if (this.needLooping) {
            ExtGameLoop.instance.stop();
        }
    }

    _createGameLoop() {
        ExtGameLoop.instance.start();
        ExtGameLoop.instance.addFunc("update_screen", this, this.updateScreen.bind(this));
    }

    public updateScreen() { }
}