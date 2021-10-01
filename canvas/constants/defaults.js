const groupBoundedOption = {
  async: true,
  superType: "husblizer",
  cornerColor: "#18a0fb",
  borderColor: "#18a0fb",
  borderScaleFactor: 2,
  lockScalingFlip: true,
  originX: "center",
  originY: "center",
  objectCaching: false,
  padding: -1,
  globalCompositeOperation: 'source-atop',
  dirty: true
};

const rectOption = {
  strokeDashArray: [10, 12],
  originX: "center",
  originY: "center",
  stroke: "#808080",
  strokeWidth: 1,
  // width: 300,
  // height: 300,
  fill: "rgba(0, 0, 0, 0)",
  strokeUniform: true,
  globalCompositeOperation: 'source-atop'
};

module.exports = {
  groupBoundedOption,
  rectOption
}