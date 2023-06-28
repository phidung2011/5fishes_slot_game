import * as cc from 'cc';

export default class ExtLocalDataManager {

    public static getString(key: string | number, defaultValue: string): string {
        var val = cc.sys.localStorage.getItem(key);
        if (val === null || val === NaN)
            return defaultValue;
        else {
            return val;
        }
    }

    public static setString(key: string | number, value: string): void {
        cc.sys.localStorage.setItem(key, value);
    }

    public static getNumber(key: string | number, defaultValue: number): number {
        var val = cc.sys.localStorage.getItem(key);
        if (val === null || val === NaN)
            return defaultValue;
        else
            return Number(val).valueOf();
    }

    public static setNumber(key: string | number, value: number) {
        cc.sys.localStorage.setItem(key, value);
    }

    public static getBoolean(key: string | number, defaultValue: boolean): boolean {
        var val = cc.sys.localStorage.getItem(key);
        if (val === null || val === NaN || val === undefined || val === '')
            return defaultValue;
        else {
            return val == 1;
        }

    }

    public static setBoolean(key: string | number, value: boolean) {
        var numVal = value ? 1 : 0;
        cc.sys.localStorage.setItem(key, numVal);
    }
}