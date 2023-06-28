import * as cc from 'cc';

import type ExtScrollView from "./ExtScrollView";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ExtScrollContent extends cc.Component {

	public get scrollView(): ExtScrollView {
		return this._scrollView;
	}

	public set scrollView(value: ExtScrollView) {
		this._scrollView = value;
	}
	private _scrollView: ExtScrollView = null!;
}
