// Keep these lines for a best effort IntelliSense of Visual Studio 2017 and higher.
/// <reference path="./../../Packages/Beckhoff.TwinCAT.HMI.Framework.14.2.110/runtimes/native1.12-tchmi/TcHmi.d.ts" />

(function (/** @type {globalThis.TcHmi} */ TcHmi) {
    var Functions;
    (function (/** @type {globalThis.TcHmi.Functions} */ Functions) {
        var DragAndDrop;
        (function (DragAndDrop) {
            // Function to create a new box
            function CreateBox() {
                var boxWidthSymbol = new TcHmi.Symbol('%i%BoxW%/i%');

                boxWidthSymbol.readEx(function (data) {
                    if (data.error === TcHmi.Errors.NONE) {
                        const width = data.value;

                        const box = document.createElement('div');
                        box.setAttribute('data-tchmi-type', 'TcHmi.Controls.System.TcHmiContainer');
                        box.style.position = 'absolute';
                        box.style.width = width + 'px';
                        box.style.height = '50px';
                        box.style.backgroundColor = 'transparent';
                        box.style.border = '2px solid #8B4513';
                        box.style.cursor = 'pointer';
                        box.style.boxSizing = 'border-box';
                        box.style.backgroundImage = 'linear-gradient(135deg, #d2b48c 25%, #c0a16b 25%, #c0a16b 50%, #d2b48c 50%, #d2b48c 75%, #c0a16b 75%, #c0a16b 100%)';
                        box.style.boxShadow = "2px 2px 5px rgba(0,0,0,0.3)";

                        // Enable dragging for the box
                        box.addEventListener('mousedown', startDrag);
                        box.addEventListener('mousemove', drag);
                        box.addEventListener('mouseup', stopDrag);

                        const interactiveArea = document.getElementById('TcHmiContainer_1');
                        interactiveArea.appendChild(box);
                    } else {
                        console.error("Failed to read BoxW symbol:", data.error);
                    }
                });
            }

            // Variables for drag-and-drop functionality
            let isDragging = false;
            let offsetX, offsetY;
            let draggedBox = null;

            // Function to start dragging
            function startDrag(event) {
                isDragging = true;
                draggedBox = event.target;
                offsetX = event.offsetX;
                offsetY = event.offsetY;
            }

            // Function to handle dragging
            function drag(event) {
                if (isDragging && draggedBox) {
                    const interactiveArea = document.getElementById('TcHmiContainer_1');
                    const rect = interactiveArea.getBoundingClientRect();

                    // Calculate new position
                    let x = event.clientX - rect.left - offsetX;
                    let y = event.clientY - rect.top - offsetY;

                    // Ensure the box stays within the interactive area
                    x = Math.max(0, Math.min(x, rect.width - draggedBox.offsetWidth));
                    y = Math.max(0, Math.min(y, rect.height - draggedBox.offsetHeight));

                    // Update the box position
                    draggedBox.style.left = `${x}px`;
                    draggedBox.style.top = `${y}px`;
                }
            }

            // Function to stop dragging
            function stopDrag() {
                if (isDragging && draggedBox) {
                    isDragging = false;
                    draggedBox = null;

                    // Log the box position
                    const box = event.target;
                    const x = parseInt(box.style.left, 10);
                    const y = parseInt(box.style.top, 10);
                    console.log(`Box Position: X = ${x}, Y = ${y}`);
                }
            }

            DragAndDrop.CreateBox = CreateBox;
        })(DragAndDrop = Functions.DragAndDrop || (Functions.DragAndDrop = {}));
    })(Functions = TcHmi.Functions || (TcHmi.Functions = {}));
})(TcHmi);
TcHmi.Functions.registerFunctionEx('CreateBox', 'TcHmi.Functions.DragAndDrop', TcHmi.Functions.DragAndDrop.CreateBox);
