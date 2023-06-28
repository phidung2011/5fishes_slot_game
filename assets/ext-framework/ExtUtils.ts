import * as cc from 'cc';

export default class ExtUtils {

    public static playAllVfx(rootNode: cc.Node, animName: string, loop: boolean = false) {
        let anim = rootNode.getComponentInChildren(cc.sp.Skeleton);
        anim?.setAnimation(0, animName, loop);
    }

    public static getAnimationName(spine: cc.sp.Skeleton, trackIndex: number = 0): string | null {
        let curAnimation = spine.getCurrent(trackIndex);
        if (!curAnimation) return null;
        return curAnimation.animation.name;
    }

    public static playAnimation(spineNode: cc.Node, name: string, loop: boolean = false, completedCallback: VoidFunction | null = null): boolean {
        if (!spineNode) return false;
        let spine = spineNode.getComponent(cc.sp.Skeleton);
        if (!spine) return false;
        let entry = spine.setAnimation(0, name, loop);
        if (!entry) return false;
        spine.setTrackCompleteListener(entry, () => {
            completedCallback && completedCallback();
        });
        return true;
    }

    public static transitionBackgroundWeb(fromBgrName: string, toBrgName: string) {
        if (cc.sys.isBrowser) {
            const fromBg = document.getElementById(fromBgrName);
            fromBg && (fromBg.className = fromBg.className.replace('visible', 'hidden'));

            const toBg = document.getElementById(toBrgName);
            toBg && (toBg.className = fromBg.className.replace('hidden', 'visible'));
        }
    }

    public static formatTimestamp(ts: number | string, hasYear?: boolean) {
        const d = new Date(ts);
        const h = ExtUtils.addZero(d.getHours());
        const m = ExtUtils.addZero(d.getMinutes());
        const s = ExtUtils.addZero(d.getSeconds());
        const t = ExtUtils.addZero(d.getDate()) + '/' + ExtUtils.addZero(d.getMonth() + 1) + (hasYear ? ('/' + d.getFullYear()) : '') + ' ' + h + ':' + m + ':' + s;
        return t;
    }

    public static addZero(i: any) {
        if (i < 10) {
            i = '0' + i;
        }
        return i;
    }
}