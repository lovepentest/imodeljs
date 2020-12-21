/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { BeDuration, using } from "@bentley/bentleyjs-core";
import {
  ChangeFlag, ChangeFlags, Viewport,
} from "@bentley/imodeljs-frontend";

/** Accumulates changed events emitted by a Viewport. */
export class ViewportChangedHandler {
  protected readonly _vp: Viewport;
  protected readonly _removals: Array<() => void> = [];
  // Flags set by individual event callbacks
  protected readonly _eventFlags = new ChangeFlags(ChangeFlag.None);
  // Flags received by onViewportChanged callback
  protected _changeFlags?: ChangeFlags;
  protected _featureOverridesDirty = false;
  protected readonly _undoDelay: BeDuration;

  public constructor(vp: Viewport) {
    // NB: Viewport.saveViewUndo() does nothing if called in rapid succession. That can make tests of undo/redo unpredictable.
    // Reset the delay to 0. Will set it back in dispose()
    this._undoDelay = Viewport.undoDelay;
    Viewport.undoDelay = BeDuration.fromSeconds(0);

    this._vp = vp;
    this._removals.push(vp.onViewportChanged.addListener((_: Viewport, cf) => {
      expect(this._changeFlags).to.be.undefined;
      this._changeFlags = cf;
    }));
    this._removals.push(vp.onAlwaysDrawnChanged.addListener(() => {
      expect(this._eventFlags.alwaysDrawn).to.be.false;
      this._eventFlags.setAlwaysDrawn();
    }));
    this._removals.push(vp.onNeverDrawnChanged.addListener(() => {
      expect(this._eventFlags.neverDrawn).to.be.false;
      this._eventFlags.setNeverDrawn();
    }));
    this._removals.push(vp.onDisplayStyleChanged.addListener(() => {
      expect(this._eventFlags.displayStyle).to.be.false;
      this._eventFlags.setDisplayStyle();
    }));
    this._removals.push(vp.onViewedCategoriesChanged.addListener(() => {
      expect(this._eventFlags.viewedCategories).to.be.false;
      this._eventFlags.setViewedCategories();
    }));
    this._removals.push(vp.onViewedCategoriesPerModelChanged.addListener(() => {
      expect(this._eventFlags.viewedCategoriesPerModel).to.be.false;
      this._eventFlags.setViewedCategoriesPerModel();
    }));
    this._removals.push(vp.onViewedModelsChanged.addListener(() => {
      expect(this._eventFlags.viewedModels).to.be.false;
      this._eventFlags.setViewedModels();
    }));
    this._removals.push(vp.onFeatureOverrideProviderChanged.addListener(() => {
      expect(this._eventFlags.featureOverrideProvider).to.be.false;
      this._eventFlags.setFeatureOverrideProvider();
    }));
    this._removals.push(vp.onFeatureOverridesChanged.addListener(() => {
      expect(this._featureOverridesDirty).to.be.false;
      this._featureOverridesDirty = true;
    }));

    // Initial change events are sent the first time the new ViewState is rendered.
    this.expect(ChangeFlag.Initial, () => undefined);
  }

  public dispose() {
    Viewport.undoDelay = this._undoDelay;

    for (const removal of this._removals)
      removal();

    this._removals.length = 0;
  }

  /** Install a ViewportChangedHandler, execute the specified function, and uninstall the handler. */
  public static test(vp: Viewport, func: (mon: ViewportChangedHandler) => void): void {
    using(new ViewportChangedHandler(vp), (mon) => func(mon));
  }

  /** Assert that executing the supplied function causes events to be omitted resulting in the specified flags. */
  public expect(flags: ChangeFlag, func: () => void): void {
    func();
    this._vp.renderFrame();

    // Expect exactly the same ChangeFlags to be received by onViewportChanged handler.
    if (undefined === this._changeFlags)
      expect(flags).to.equal(ChangeFlag.None);
    else
      expect(this._changeFlags.value).to.equal(flags);

    // Confirm onFeatureOverridesChanged invoked or not invoked based on expected flags.
    const expectFeatureOverridesChanged = 0 !== (flags & ChangeFlag.Overrides);
    expect(this._featureOverridesDirty).to.equal(expectFeatureOverridesChanged);
    if (undefined !== this._changeFlags)
      expect(this._changeFlags.areFeatureOverridesDirty).to.equal(expectFeatureOverridesChanged);

    // No dedicated deferred event for ViewState changed...just the immediate one.
    expect(this._eventFlags.value).to.equal(flags & ~ChangeFlag.ViewState);

    // Reset for next frame.
    this._eventFlags.clear();
    this._changeFlags = undefined;
    this._featureOverridesDirty = false;
  }
}
