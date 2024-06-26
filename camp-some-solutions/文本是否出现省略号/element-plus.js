// https://github.com/element-plus/element-plus/blob/dev/packages/components/table/src/table-body/events-helper.ts#L11

const isGreaterThan = (a, b, epsilon = 0.01) => a - b > epsilon;

const getPaddingAndBorder = (el) => {
  const style = window.getComputedStyle(el, null);
  const {
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    borderLeftWidth,
    borderRightWidth,
    borderTopWidth,
    borderBottomWidth,
  } = style;

  return {
    pLeft: Number.parseInt(paddingLeft, 10) || 0,
    pRight: Number.parseInt(paddingRight, 10) || 0,
    pTop: Number.parseInt(paddingTop, 10) || 0,
    pBottom: Number.parseInt(paddingBottom, 10) || 0,
    bLeft: borderLeftWidth,
    bRight: borderRightWidth,
    bTop: borderTopWidth,
    bBottom: borderBottomWidth,
  };
};
const checkEllipsis = (el) => {
  const range = document.createRange();
  range.setStart(el, 0);
  range.setEnd(el, el.childNodes.length);
  let { width: rangeWidth, height: rangeHeight } =
    range.getBoundingClientRect();
  if (rangeWidth - Math.floor(rangeWidth) < 0.001) {
    rangeWidth = Math.floor(rangeWidth);
  }
  if (rangeHeight - Math.floor(rangeHeight) < 0.001) {
    rangeHeight = Math.floor(rangeHeight);
  }
  const { width: elWidth, height: elHeight } = el.getBoundingClientRect();
  const { pLeft, pRight, pTop, pBottom, bLeft, bRight, bTop, bBottom } =
    getPaddingAndBorder(el);

  const horizontalWidth = rangeWidth + pLeft + pRight + bLeft + bRight;
  const verticalHeight = rangeHeight + pTop + pBottom + bTop + bBottom;

  return (
    isGreaterThan(horizontalWidth, elWidth) ||
    isGreaterThan(verticalHeight, elHeight) ||
    // When using a high-resolution screen, it is possible that a returns cellChild.scrollWidth value of 1921 and
    // cellChildWidth returns a value of 1920.994140625. #16856 #16673
    isGreaterThan(el.scrollWidth, elWidth)
  );
};

export default checkEllipsis;
