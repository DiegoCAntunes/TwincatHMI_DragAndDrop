/// <reference path="./../../Packages/Beckhoff.TwinCAT.HMI.Framework.14.2.110/runtimes/native1.12-tchmi/TcHmi.d.ts" />

(function (/** @type {globalThis.TcHmi} */ TcHmi) {
    var Functions;
    (function (/** @type {globalThis.TcHmi.Functions} */ Functions) {
        var _2_HMIPROJECT;
        (function (_2_HMIPROJECT) {
            function FunctionJS1() {
                var palletWidth = 48;
                var palletLength = 40;
                var boxWidth = 8;
                var boxLength = 6;
                var boxHeight = 6;
                var layerCount = 3; // Set to 1 for now

                function calculateFit(max, boxSize) {
                    return Math.floor(max / boxSize);
                }

                function calculateLayer(palletWidth, palletLength, boxWidth, boxLength) {
                    var nHorizontal1 = calculateFit(palletWidth, boxWidth);
                    var nVertical1 = calculateFit(palletLength, boxLength);
                    var totalBoxes1 = nHorizontal1 * nVertical1;

                    var nHorizontal2 = calculateFit(palletWidth, boxLength);
                    var nVertical2 = calculateFit(palletLength, boxWidth);
                    var totalBoxes2 = nHorizontal2 * nVertical2;

                    if (totalBoxes1 > totalBoxes2) {
                        return [totalBoxes1, nHorizontal1 * boxWidth, nVertical1 * boxLength, 0, false];
                    } else {
                        return [totalBoxes2, nHorizontal2 * boxLength, nVertical2 * boxWidth, 90, false];
                    }
                }

                function calculateBoxCenters(width, length, rotation, layer, boxWidth, boxLength, boxHeight) {
                    var centers = [];
                    var z = layer * boxHeight;
                    var nHorizontal = calculateFit(width, rotation === 0 ? boxWidth : boxLength);
                    var nVertical = calculateFit(length, rotation === 0 ? boxLength : boxWidth);

                    for (var i = 0; i < nHorizontal; i++) {
                        for (var j = 0; j < nVertical; j++) {
                            var center_x = (i + 0.5) * (rotation === 0 ? boxWidth : boxLength);
                            var center_y = (j + 0.5) * (rotation === 0 ? boxLength : boxWidth);
                            centers.push({ x: center_x, y: center_y, z: z, w: rotation });
                        }
                    }
                    return centers;
                }

                var layerData = calculateLayer(palletWidth, palletLength, boxWidth, boxLength);
                var maxBoxesFirst = layerData[0];
                var filledWidthFirst = layerData[1];
                var filledLengthFirst = layerData[2];
                var rotationFirst = layerData[3];

                var centers = calculateBoxCenters(
                    filledWidthFirst,
                    filledLengthFirst,
                    rotationFirst,
                    0,
                    boxWidth,
                    boxLength,
                    boxHeight
                );

                console.log(centers);

                return centers;
            }
            _2_HMIPROJECT.FunctionJS1 = FunctionJS1;
        })(_2_HMIPROJECT = Functions._2_HMIPROJECT || (Functions._2_HMIPROJECT = {}));
    })(Functions = TcHmi.Functions || (TcHmi.Functions = {}));
})(TcHmi);

TcHmi.Functions.registerFunctionEx('FunctionJS1', 'TcHmi.Functions._2_HMIPROJECT', TcHmi.Functions._2_HMIPROJECT.FunctionJS1);
