
export default class ExtGameLoop {
    public static TIME_LOOP = 0.1; // in second

    private _listFuncLoop: Map<string, any> = new Map();
    private _intervalId: number = -1;

    private static _instance: ExtGameLoop = new ExtGameLoop();
    public static get instance(): ExtGameLoop {
        return ExtGameLoop._instance;
    }

    update() {
        var _this = ExtGameLoop._instance;
        if (_this.isRunning()) {
            _this._listFuncLoop.forEach((value: any, key: string) => {
                if (value) {
                    value.funcName.apply(value.caller[ExtGameLoop.TIME_LOOP]);
                } else {
                    _this.removeFunc(key);
                }
            });
        }
    }

    addFunc(key: string, caller: any, funcName: any) {
        var data = {
            "key": key,
            "caller": caller,
            "funcName": funcName
        };
        this._listFuncLoop.set(key, data);
    }

    isRunning() {
        return this._intervalId > 0;
    }

    start() {
        if (this._intervalId < 0) {
            this.update();
            this._intervalId = setInterval(this.update, ExtGameLoop.TIME_LOOP * 1000);
        }
    }

    stop() {
        if (this._intervalId > 0) {
            clearInterval(this._intervalId);
            this._intervalId = -1;
        }
    }

    cleanUp() {
        for (var key in this._listFuncLoop) {
            this._listFuncLoop.set(key, null);
            this._listFuncLoop.delete(key);
        }
        this._listFuncLoop.clear();
    }

    removeFunc(key: string) {
        var func = this._listFuncLoop.get(key);
        if (func) {
            this._listFuncLoop.delete(key);
            return true;
        }
        return false;
    }

}