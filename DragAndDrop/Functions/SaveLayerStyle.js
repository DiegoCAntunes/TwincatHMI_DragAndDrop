// Keep these lines for a best effort IntelliSense of Visual Studio 2017 and higher.
/// <reference path="./../../Packages/Beckhoff.TwinCAT.HMI.Framework.14.3.133/runtimes/native1.12-tchmi/TcHmi.d.ts" />

(function (/** @type {globalThis.TcHmi} */ TcHmi) {
    var Functions;
    (function (/** @type {globalThis.TcHmi.Functions} */ Functions) {
        var DragAndDrop;
        (function (DragAndDrop) {
            function SaveLayerStyle(par1) {
                // Read CurrentLayout to determine target LL*
                const iCurrentLayout = new TcHmi.Symbol('%i%CurrentLayout%/i%');
                iCurrentLayout.readEx(function (layoutIndexData) {
                    if (layoutIndexData.error) {
                        console.error('Failed to read CurrentLayout:', layoutIndexData.error);
                        return;
                    }
                    console.log(layoutIndexData.value)
                    let currentLayoutIndex = layoutIndexData.value;

                    const internalLL = new TcHmi.Symbol('%i%CurrentLL%/i%');
                    // Read the current YY array (box layout)
                    internalLL.readEx(function (llData) {
                        if (llData.error) {
                            console.error('Failed to read YY:', llData.error);
                            return;
                        }

                        let currentLL = llData.value || [];

                       
                        // Determine target layout symbol
                        let targetSymbol;
                     
                        targetSymbol = new TcHmi.Symbol(`%i%L${currentLayoutIndex}%/i%`)

                        // Write the fixed-size array to the target LL*
                        targetSymbol.writeEx(currentLL, function (writeResult) {
                            if (writeResult.error) {
                                console.error('Failed to write to', targetSymbol, writeResult.error);
                                return;
                            }

                            console.log(`Layer ${currentLayoutIndex} saved to ${targetSymbol} with 100 entries`);

                            // Clear YY by writing 100 empty entries
                            let emptyYY = Array(100).fill({ x: 0, y: 0, rot: 0 });
                            TcHmi.Server.writeSymbol('%i%YY%/i%', emptyYY, function (res) {
                                if (res.error) console.error('Failed to clear YY:', res.error);
                            });

                            // Clear on-screen boxes
                            let container = document.getElementById('TcHmiContainer_1');
                            if (container) {
                                while (container.firstChild) {
                                    container.removeChild(container.firstChild);
                                }
                            }

                            // Reset global boxes array if defined
                            if (typeof boxes !== 'undefined') {
                                boxes = [];
                            }

                            console.log('Layout cleared. Ready for new layer.');
                        });

                        const interactiveArea = document.getElementById('TcHmiContainer_1');
                        if (interactiveArea) {
                            while (interactiveArea.firstChild) {
                                interactiveArea.removeChild(interactiveArea.firstChild);
                            }
                        }
                        currentLayoutIndex = currentLayoutIndex +1;
                        iCurrentLayout.writeEx(currentLayoutIndex, function (data) {
                            if (data.error !== TcHmi.Errors.NONE) {
                                // Log the error code and its name if available
                                console.error("Failed to increment index:", data.error, TcHmi.Errors[data.error] || 'Unknown Error');
                            }
                        });
                    });
                });
            }

            DragAndDrop.SaveLayerStyle = SaveLayerStyle;
        })(DragAndDrop = Functions.DragAndDrop || (Functions.DragAndDrop = {}));
    })(Functions = TcHmi.Functions || (TcHmi.Functions = {}));
})(TcHmi);
TcHmi.Functions.registerFunctionEx('SaveLayerStyle', 'TcHmi.Functions.DragAndDrop', TcHmi.Functions.DragAndDrop.SaveLayerStyle);
