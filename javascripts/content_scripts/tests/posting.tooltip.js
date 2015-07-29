/*global describe, it, expect, beforeEach, afterEach, spyOn */
/*global Privly, SeamlessPosting */
describe('posting.tooltip', function () {

  it('implementes createDOM', function () {
    var resTooltip = new SeamlessPosting.Tooltip();
    expect(resTooltip.createDOM).toBeDefined();
    resTooltip.createDOM();
    expect(resTooltip.getNode() != undefined).toBe(true);
    resTooltip.destroy();
  });

  it('setText() updates text', function () {
    var resTooltip = new SeamlessPosting.Tooltip();
    resTooltip.createDOM();
    resTooltip.setText('hello');
    expect(resTooltip.getNode().innerText).toBe('hello');
  });

  it('show() calls setText', function () {
    var resTooltip = new SeamlessPosting.Tooltip();
    resTooltip.createDOM();
    resTooltip.show('123');
    expect(resTooltip.getNode().innerText).toBe('123');
  });

});
