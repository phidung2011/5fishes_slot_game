import * as cc from 'cc';

const { ccclass, property } = cc._decorator;

@ccclass
export default class ExtViewGroup extends cc.ViewGroup {
    isNestedViewGroup(event: cc.EventTouch | cc.EventMouse): boolean {
        return true;
    }
}