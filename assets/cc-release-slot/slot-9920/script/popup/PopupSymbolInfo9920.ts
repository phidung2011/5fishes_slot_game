import { _decorator, Component, Node, Sprite, Label, SpriteFrame, Vec3, SystemEvent } from 'cc';
import ExtScreenManager from '../../../../ext-framework/ui/ExtScreenManager';
import { PAY_LINES, SlotConfig9920 } from '../base_slot/SlotConfig9920';
const { ccclass, property } = _decorator;

@ccclass('PopupSymbolInfo9920')
export class PopupSymbolInfo9920 extends Component {

    @property(Label)
    listLabelMulti: Label[] = [];

    @property(Node)
    globalNode: Node = null!;

    @property(Node)
    nodeBorder: Node = null!;

    @property(Node)
    bgSymbol: Node = null!;

    @property(Node)
    nodeInfo: Node = null!;

    @property(Sprite)
    sprSymbol: Sprite = null!;

    // pos symbol: wild, scatter, normal
    posNodeBorder = [new Vec3(-135, 0, 0), new Vec3(-135, 0, 0), new Vec3(-70, 0, 0)];
    posNodeSymbol = [new Vec3(135, 0, 0), new Vec3(135, 0, 0), new Vec3(68, 0, 0)];
    posNodeInfoNo = [new Vec3(-75, 0, 0), new Vec3(-150, 0, 0), new Vec3(-70, 0, 0)];

    public hideCallback: VoidFunction | null = null;

    mapPosition(pos: Vec3) {
        this.globalNode.setPosition(pos);
    }

    setData(symbolCode: String, isShowLeft: boolean) {
        let spriteFrame = ExtScreenManager.instance.assetBundle.get(`${SlotConfig9920.normalItemPath}/symbol_${symbolCode}/spriteFrame`, SpriteFrame);
        if (spriteFrame) {
            this.sprSymbol.spriteFrame = spriteFrame;
        }

        if (isShowLeft) {
            if (symbolCode == SlotConfig9920.wildSymbolCode) {
                this.nodeBorder.position = this.posNodeBorder[0];
                this.bgSymbol.position = this.posNodeSymbol[0];
                this.nodeInfo.position = this.posNodeInfoNo[0];
            } else if (symbolCode == SlotConfig9920.scatterSymbolCode) {
                this.nodeBorder.position = this.posNodeBorder[1];
                this.bgSymbol.position = this.posNodeSymbol[1];
                this.nodeInfo.position = this.posNodeInfoNo[1];
            } else {
                this.nodeBorder.position = this.posNodeBorder[2];
                this.bgSymbol.position = this.posNodeSymbol[2];
                this.nodeInfo.position = this.posNodeInfoNo[2];
            }
        }

        if (symbolCode != SlotConfig9920.wildSymbolCode) {
            let payLine = PAY_LINES[symbolCode + ""];
            if (payLine != null) {
                for (let i = 0; i < this.listLabelMulti.length; i++) {
                    this.listLabelMulti[i].string = payLine[i] + "";
                }
            }
        }
    }

    onEnable() {
        this.hideCallback && this.nodeBorder.on(SystemEvent.EventType.TOUCH_END, this.hideCallback);
    }

    onDisable() {
        this.hideCallback && this.nodeBorder.off(SystemEvent.EventType.TOUCH_END, this.hideCallback);
        this.hideCallback = null;
    }

}

