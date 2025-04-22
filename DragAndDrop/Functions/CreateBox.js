/// <reference path="./../../Packages/Beckhoff.TwinCAT.HMI.Framework.14.2.110/runtimes/native1.12-tchmi/TcHmi.d.ts" />

(function (/** @type {globalThis.TcHmi} */ TcHmi) {
    var Functions;
    (function (Functions) {
        var DragAndDrop;
        (function (DragAndDrop) {

            let isDragging = false;
            let offsetX = 0;
            let offsetY = 0;
            let draggedBox = null;

            function CreateBox() {
                const boxWidthSymbol = new TcHmi.Symbol('%i%BoxW%/i%');
                const boxHeightSymbol = new TcHmi.Symbol('%i%BoxL%/i%');

                boxWidthSymbol.readEx(function (wData) {
                    if (wData.error === TcHmi.Errors.NONE) {
                        const width = 20 / 3 * wData.value;

                        boxHeightSymbol.readEx(function (hData) {
                            if (hData.error === TcHmi.Errors.NONE) {
                                const height = 20 / 3 * hData.value;

                                const box = document.createElement('div');
                                box.setAttribute('data-tchmi-type', 'TcHmi.Controls.System.TcHmiContainer');
                                box.classList.add('draggable-box');
                                box.style.position = 'absolute';
                                box.style.width = `${width}px`;
                                box.style.height = `${height}px`;
                                box.style.backgroundColor = 'transparent';
                                box.style.border = '2px solid #8B4513';
                                box.style.cursor = 'pointer';
                                box.style.boxSizing = 'border-box';
                                box.style.backgroundImage = 'linear-gradient(135deg, #d2b48c 25%, #c0a16b 25%, #c0a16b 50%, #d2b48c 50%, #d2b48c 75%, #c0a16b 75%, #c0a16b 100%)';
                                box.style.boxShadow = '2px 2px 5px rgba(0,0,0,0.3)';
                                box.style.transform = 'rotate(0deg)';
                                box.setAttribute('data-rotation', '0');

                                box.addEventListener('mousedown', startDrag);
                                box.addEventListener('mousemove', drag);
                                box.addEventListener('mouseup', stopDrag);
                                box.addEventListener('contextmenu', rotateBox);

                                const interactiveArea = document.getElementById('TcHmiContainer_1');
                                interactiveArea.appendChild(box);

                                updateYYArrayFromBoxes();
                                checkOverlaps();
                            } else {
                                console.error("Failed to read BoxL symbol:", hData.error);
                            }
                        });

                    } else {
                        console.error("Failed to read BoxW symbol:", wData.error);
                    }
                });
            }

            function startDrag(event) {
                if (event.button !== 0) return;
                isDragging = true;
                draggedBox = event.target;
                offsetX = event.offsetX;
                offsetY = event.offsetY;
            }

            function drag(event) {
                if (!isDragging || !draggedBox) return;

                const interactiveArea = document.getElementById('TcHmiContainer_1');
                const rect = interactiveArea.getBoundingClientRect();

                let x = event.clientX - rect.left - offsetX;
                let y = event.clientY - rect.top - offsetY;

                const snapTolerance = 10;
                const draggedRect = {
                    left: x,
                    top: y,
                    right: x + draggedBox.offsetWidth,
                    bottom: y + draggedBox.offsetHeight
                };

                const boxes = Array.from(document.querySelectorAll('.draggable-box')).filter(b => b !== draggedBox);
                for (const box of boxes) {
                    const r = box.getBoundingClientRect();
                    const areaRect = interactiveArea.getBoundingClientRect();
                    const otherRect = {
                        left: r.left - areaRect.left,
                        top: r.top - areaRect.top,
                        right: r.right - areaRect.left,
                        bottom: r.bottom - areaRect.top
                    };

                    if (Math.abs(draggedRect.left - otherRect.right) < snapTolerance) {
                        x = otherRect.right;
                    } else if (Math.abs(draggedRect.right - otherRect.left) < snapTolerance) {
                        x = otherRect.left - draggedBox.offsetWidth;
                    }

                    if (Math.abs(draggedRect.top - otherRect.bottom) < snapTolerance) {
                        y = otherRect.bottom;
                    } else if (Math.abs(draggedRect.bottom - otherRect.top) < snapTolerance) {
                        y = otherRect.top - draggedBox.offsetHeight;
                    }
                }

                x = Math.max(0, Math.min(x, rect.width - draggedBox.offsetWidth));
                y = Math.max(0, Math.min(y, rect.height - draggedBox.offsetHeight));

                draggedBox.style.left = `${x}px`;
                draggedBox.style.top = `${y}px`;
            }

            function stopDrag(event) {
                if (!isDragging || !draggedBox) return;
                isDragging = false;
                updateYYArrayFromBoxes();
                checkOverlaps();
                draggedBox = null;
            }

            function rotateBox(event) {
                event.preventDefault();
                const box = event.target;
                let rotation = parseInt(box.getAttribute('data-rotation')) || 0;
                rotation = (rotation + 90) % 360;
                box.setAttribute('data-rotation', rotation.toString());
                box.style.transform = `rotate(${rotation}deg)`;

                updateYYArrayFromBoxes();
                checkOverlaps();
            }

            function updateYYArrayFromBoxes() {
                const boxes = document.querySelectorAll('.draggable-box');
                const resultArray = [];

                boxes.forEach(box => {
                    const x = parseInt(box.style.left, 10) || 0;
                    const y = parseInt(box.style.top, 10) || 0;
                    const width = box.offsetWidth;
                    const height = box.offsetHeight;
                    const rotation = parseInt(box.getAttribute('data-rotation')) || 0;

                    const centerX = x + width / 2;
                    const centerY = y + height / 2;

                    resultArray.push({ X: centerX, Y: centerY, Rotation: rotation });
                });

                console.log('YY =', resultArray);

                const symbol = new TcHmi.Symbol('%s%YY%/s%');
                symbol.writeEx(resultArray, function (data) {
                    if (data.error !== TcHmi.Errors.NONE) {
                        console.error("Failed to write to YY array:", data.error);
                    }
                });
            }

            function checkOverlaps() {
                const boxes = Array.from(document.querySelectorAll('.draggable-box'));

                boxes.forEach(b => b.style.borderColor = '#8B4513');

                for (let i = 0; i < boxes.length; i++) {
                    const a = boxes[i].getBoundingClientRect();

                    for (let j = i + 1; j < boxes.length; j++) {
                        const b = boxes[j].getBoundingClientRect();

                        if (isOverlapping(a, b)) {
                            boxes[i].style.borderColor = 'red';
                            boxes[j].style.borderColor = 'red';
                        }
                    }
                }
            }

            function isOverlapping(rect1, rect2) {
                return !(
                    rect1.right <= rect2.left ||
                    rect1.left >= rect2.right ||
                    rect1.bottom <= rect2.top ||
                    rect1.top >= rect2.bottom
                );
            }

            DragAndDrop.CreateBox = CreateBox;

        })(DragAndDrop = Functions.DragAndDrop || (Functions.DragAndDrop = {}));
    })(Functions = TcHmi.Functions || (TcHmi.Functions = {}));
})(TcHmi);

TcHmi.Functions.registerFunctionEx('CreateBox', 'TcHmi.Functions.DragAndDrop', TcHmi.Functions.DragAndDrop.CreateBox);
