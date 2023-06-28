import { Node, EventTouch, UITransform, UIOpacity, VERSION } from "cc";

declare module 'cc' {
    interface EventTouch {
        stopPropagation(): void;
    }

    interface Node {
        getZIndex(): number;
        setZIndex(zIndex: number): void;

        getOpacity(): number;
        setOpacity(opacity: number): void;
    }
}

EventTouch.prototype.stopPropagation = function () {
    this.propagationStopped = true;
    this.propagationImmediateStopped = true;
}

Node.prototype.setZIndex = function (zIndex: number) {
    if (VERSION < "3.1.0") {
        let uiTrans = this.getComponent(UITransform) as UITransform;
        if (uiTrans) {
            uiTrans.priority = zIndex;
        }
        else {
            uiTrans = this.addComponent(UITransform);
            uiTrans.priority = zIndex;
        }
    }
    else {
        this.setSiblingIndex(zIndex);
    }
}

Node.prototype.getZIndex = function () {
    if (VERSION < "3.1.0") {
        let uiTrans = this.getComponent(UITransform) as UITransform;
        if (uiTrans) {
            return uiTrans.priority;
        }
    }
    else {
        this.getSiblingIndex();
    }
    return 0;
}

Node.prototype.setOpacity = function (opacity: number) {
    let uiOpacity = this.getComponent(UIOpacity) as UIOpacity;
    if (uiOpacity) {
        uiOpacity.opacity = opacity;
    }
    else {
        uiOpacity = this.addComponent(UIOpacity);
        uiOpacity.opacity = opacity;
    }

}

Node.prototype.getOpacity = function () {
    let uiOpacity = this.getComponent(UIOpacity) as UIOpacity;
    if (uiOpacity) {
        return uiOpacity.opacity;
    }
    return 0;
}
