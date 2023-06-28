import { _decorator, Component, UITransform, tween, v3 } from 'cc';
import { ExtAudioManager } from '../../../../ext-framework/ExtAudioManager';
import { OPTION_FREE_SELECT_KOI, SlotConfig9920 } from '../base_slot/SlotConfig9920';
import { ItemRandomMultiFree9920 } from './ItemRandomMultiFree9920';
const { ccclass, property } = _decorator;

export enum SPIN_STATE {
    IDLE = 0,
    SPINING,
    STOPPING,
    STOPPED,
}

@ccclass('RandomMultiFreeController9920')
export class RandomMultiFreeController9920 extends Component {
    @property(ItemRandomMultiFree9920)
    listItemRandom: ItemRandomMultiFree9920[] = [];

    _spiningTime: number = 2.5;
    _velocity: number = 600;

    _h_item: number = 0;
    _height: number = 0;

    _lowestPosY: number = 0;

    shouldStop: boolean = false;

    hideTxtRandom: boolean = false;

    public state: SPIN_STATE = SPIN_STATE.IDLE;

    onLoad() {
        this.state = SPIN_STATE.IDLE;
        this._updateData();

        if (this.listItemRandom.length > 0) {
            this._h_item = this.listItemRandom[0].getComponent(UITransform).contentSize.height;
            this._height = this.listItemRandom.length * this._h_item;
        }
    }

    private _updateData() {
        for (let i = 0; i < this.listItemRandom.length; i++) {
            const item = this.listItemRandom[i];

            let multi = OPTION_FREE_SELECT_KOI['K' + (i + 1)];
            item.setMultiFree(multi[1], multi[2], multi[3]);
        }
    }

    startSpin() {
        ExtAudioManager.instance.playEffect("sfx_rolling", true);
        this.state = SPIN_STATE.SPINING;
        this.schedule(this._waitToStop, 1.0 / 60, NaN, 0);
    }

    private _waitToStop(dt: number) {
        this._spiningTime -= dt;
        if (this._spiningTime <= 0) {
            this.shouldStop = true;
            this.unschedule(this._waitToStop);
        }
    }

    update(dt: number) {
        if (this.state == SPIN_STATE.IDLE || this.state == SPIN_STATE.STOPPED) {
            return;
        }

        if (this.state == SPIN_STATE.STOPPING) {
            this.state = SPIN_STATE.STOPPED;
            for (let i = 0; i < this.listItemRandom.length; i++) {
                const item = this.listItemRandom[i];
                tween(item.node)
                    .by(0.1, { position: v3(0, -this._lowestPosY, 0) }, { easing: 'bounceOut' })
                    .call(() => {
                    })
                    .start();
            }
            return;
        }

        let delMove = this._velocity * dt;
        for (let i = 0; i < this.listItemRandom.length; i++) {
            const item = this.listItemRandom[i];
            const pos = item.node.getPosition();
            pos.y -= delMove;
            if (pos.y <= 0) {
                pos.y += this._height;
                if (!this.hideTxtRandom) {
                    this.hideTxtRandom = true;
                    item.switchContent();
                }
            } else if (pos.y < this._h_item) {
                this._lowestPosY = pos.y;
            }
            item.node.setPosition(pos);

            // log('@@@ this._lowestPosY = ' + this._lowestPosY);
        }

        if (this.shouldStop) {
            ExtAudioManager.instance.stopEffectByName("sfx_rolling", true);
            this.shouldStop = false;
            this.state = SPIN_STATE.STOPPING;
            this.setData4MainItem();
        }
    }

    setData4MainItem() {
        for (let i = 0; i < this.listItemRandom.length; i++) {
            const item = this.listItemRandom[i];
            const pos = item.node.getPosition();
            if (pos.y > this._h_item && pos.y < this._h_item * 2) {
                let option = SlotConfig9920.currentOptionFree;
                item.setMultiFree(option[1], option[2], option[3]);
            }
        }
    }
}