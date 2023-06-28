
import { _decorator, Node, Prefab, Label, instantiate, UITransform, Sprite, Button, SpriteFrame, Color, log } from 'cc';
import ExtBasePopup from '../../../../ext-framework/ui/ExtBasePopup';
import ExtScreenManager from '../../../../ext-framework/ui/ExtScreenManager';
import { ItemBetlevel9920 } from './ItemBetlevel9920';
import { ExtAudioManager } from '../../../../ext-framework/ExtAudioManager';
const { ccclass, property } = _decorator;

@ccclass('PopupChosenBetLevel9920')
export class PopupChosenBetLevel9920 extends ExtBasePopup {

    @property(Prefab)
    itemBetlevel: Prefab = null!;

    @property(Node)
    contentTableView: Node = null!;

    // @property(ScrollView)
    // scrollView: ScrollView = null!;

    @property(Button)
    listBtnDecrease: Button[] = [];

    listItemBetLevel: ItemBetlevel9920[] = [];
    nodeSize: number = 0;

    curTabId: number = 0;
    curBetIndex: number = 0;
    numItemBet: number = 5;
    curSelectedIndex: number = 0;

    finishedCallback: any = null;

    onLoad() {
        for (let i = 0; i < this.numItemBet; i++) {
            let node = instantiate(this.itemBetlevel);
            this.nodeSize = node.getComponent(UITransform).height;
            this.contentTableView.addChild(node);
            this.listItemBetLevel.push(node.getComponent(ItemBetlevel9920));
            this.listItemBetLevel[i].setData(i, (betlevel: number) => {
                this.resetChosen(betlevel);
            });
        }
    }

    setCurBetInfo(curBetIndex: number, numReelOpenFull: number) {
        this.curBetIndex = curBetIndex;
        this.resetChosen(this.curBetIndex);
        this.changeTab(numReelOpenFull);
        this.setSelectedBtnDecrease(this.listBtnDecrease[5 - numReelOpenFull].getComponent(Sprite), true);
    }

    changeTab(id: number) {
        this.curTabId = id;
        this.listBtnDecrease.forEach(node => {
            this.setSelectedBtnDecrease(node.getComponent(Sprite), false);
        });

        for (let i = 0; i < this.numItemBet; i++) {
            let item: ItemBetlevel9920 = this.listItemBetLevel[i];
            let betIndex = this.numItemBet * (id - 1) + i;
            item.setData(betIndex, (betlevel: number) => {
                this.resetChosen(betlevel);
            });
        }
        this.curBetIndex = 5 * (id - 1) + this.curSelectedIndex;
        log('@@@ changeTab  id = ' + id + ' ==> curBetIndex = ' + this.curBetIndex);
        this.resetChosen(this.curBetIndex);
    }

    onClickBtnMaxBet() {
        ExtAudioManager.instance.playEffect("sfx_click_btn");
        this.curBetIndex = 5 * this.curTabId - 1;
        log('@@@ onClickBtnMaxBet id = ' + this.curBetIndex);
        this.resetChosen(this.curBetIndex);
        // this.scrollView.scrollToOffset(new Vec2(0, this.listItemBetLevel.length * this.nodeSize), 0.1);
    }

    onClickBtnDecreaseBet(event: Button, eventData: any) {
        ExtAudioManager.instance.playEffect("sfx_click_btn");
        this.changeTab(parseInt(eventData));
        this.setSelectedBtnDecrease(event.target.getComponent(Sprite), true);
    }

    setSelectedBtnDecrease(spr: Sprite, enable: boolean) {
        if (enable) {
            spr.spriteFrame = ExtScreenManager.instance.assetBundle.get('res/images/pop_up/common/bg_cell_press/spriteFrame', SpriteFrame);
            let lbContent = spr.node.getChildByName('lb_content').getComponent(Label);
            lbContent.color = new Color(225, 179, 99, 255);
        } else {
            spr.spriteFrame = ExtScreenManager.instance.assetBundle.get('res/images/pop_up/common/bg_cell_normal/spriteFrame', SpriteFrame);
            let lbContent = spr.node.getChildByName('lb_content').getComponent(Label);
            lbContent.color = Color.WHITE;
        }
    }

    resetChosen(betlevel: number) {
        this.curBetIndex = betlevel;
        this.curSelectedIndex = this.curBetIndex % 5;
        log('@@@ this.curBetIndex = ' + this.curBetIndex + ', curSelectedIndex = ' + this.curSelectedIndex);
        for (let i = 0; i < this.listItemBetLevel.length; i++) {
            this.listItemBetLevel[i].setChosen(this.curBetIndex);
        }
    }

    onClickBtnConfirm() {
        log('@@@ onClickBtnConfirm');
        ExtAudioManager.instance.playEffect("sfx_accept");
        ExtScreenManager.instance.hidePopup(true);
        this.finishedCallback && this.finishedCallback(this.curBetIndex);
    }

    onClickBtnClose() {
        ExtAudioManager.instance.playEffect("sfx_click_btn");
        ExtScreenManager.instance.hidePopup(true);
        this.finishedCallback && this.finishedCallback(-1);
    }

}
