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
                const boxWidthSymbol = new TcHmi.Symbol('%s%ADS.PLC1.GVL_HMI.Recipe_UnitWidth%/s%');
                const boxHeightSymbol = new TcHmi.Symbol('%s%ADS.PLC1.GVL_HMI.Recipe_UnitLength%/s%');

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
                if (!interactiveArea) return; // Safety check
                const areaRect = interactiveArea.getBoundingClientRect();

                // 1. Calculate the raw proposed style.left/top based on mouse movement
                let proposedX = event.clientX - areaRect.left - offsetX;
                let proposedY = event.clientY - areaRect.top - offsetY;

                // --- Corrected Snapping Logic ---
                const snapTolerance = 10;
                const otherBoxes = Array.from(document.querySelectorAll('.draggable-box')).filter(b => b !== draggedBox);
                let snappedInX = false; // Flag to allow only one snap adjustment per axis per event
                let snappedInY = false;

                // Create a ghost of the dragged box at its current proposed location
                // to get its visual bounds for snap calculations.
                const ghostSnap = draggedBox.cloneNode(true);
                ghostSnap.style.position = 'absolute';
                ghostSnap.style.left = `${proposedX}px`;
                ghostSnap.style.top = `${proposedY}px`;
                ghostSnap.style.visibility = 'hidden';
                interactiveArea.appendChild(ghostSnap);
                const ghostSnapRect = ghostSnap.getBoundingClientRect();
                interactiveArea.removeChild(ghostSnap);

                // Calculate the ghost's visual edges relative to the container
                const ghostSnapLeft = ghostSnapRect.left - areaRect.left;
                const ghostSnapTop = ghostSnapRect.top - areaRect.top;
                const ghostSnapRight = ghostSnapLeft + ghostSnapRect.width;
                const ghostSnapBottom = ghostSnapTop + ghostSnapRect.height;

                for (const otherBox of otherBoxes) {
                // Stop checking this box if we've already snapped in both X and Y
                    if (snappedInX && snappedInY) break;

                    const otherBoxRect = otherBox.getBoundingClientRect();
                // Calculate the other box's visual edges relative to the container
                    const otherLeft = otherBoxRect.left - areaRect.left;
                    const otherTop = otherBoxRect.top - areaRect.top;
                    const otherRight = otherLeft + otherBoxRect.width;
                    const otherBottom = otherTop + otherBoxRect.height;

                // Check for X-axis snaps if not already snapped in X
                    if (!snappedInX) {
                        // Check proximity of Ghost's Left edge to Other's Right edge
                        if (Math.abs(ghostSnapLeft - otherRight) < snapTolerance) {
                            const deltaX = otherRight - ghostSnapLeft; // Calculate required adjustment
                            proposedX += deltaX; // Apply adjustment to style.left target
                            snappedInX = true; // Set flag
                        }
                            // Check proximity of Ghost's Right edge to Other's Left edge
                        else if (Math.abs(ghostSnapRight - otherLeft) < snapTolerance) {
                            const deltaX = otherLeft - ghostSnapRight; // Calculate required adjustment
                            proposedX += deltaX; // Apply adjustment to style.left target
                            snappedInX = true; // Set flag
                        }
                    }

                // Check for Y-axis snaps if not already snapped in Y
                    if (!snappedInY) {
                        // Check proximity of Ghost's Top edge to Other's Bottom edge
                        if (Math.abs(ghostSnapTop - otherBottom) < snapTolerance) {
                            const deltaY = otherBottom - ghostSnapTop; // Calculate required adjustment
                            proposedY += deltaY; // Apply adjustment to style.top target
                            snappedInY = true; // Set flag
                        }
                            // Check proximity of Ghost's Bottom edge to Other's Top edge
                        else if (Math.abs(ghostSnapBottom - otherTop) < snapTolerance) {
                            const deltaY = otherTop - ghostSnapBottom; // Calculate required adjustment
                            proposedY += deltaY; // Apply adjustment to style.top target
                            snappedInY = true; // Set flag
                        }
                    }
                }
                // --- End Snapping Logic ---


                // --- Boundary Clamping Logic (uses the potentially snapped proposedX/Y) ---
                // 2. Create ghost (final check) to determine visual bounds at the potentially snapped location
                const ghostFinal = draggedBox.cloneNode(true);
                ghostFinal.style.position = 'absolute';
                ghostFinal.style.left = `${proposedX}px`; // Use potentially snapped position
                ghostFinal.style.top = `${proposedY}px`;
                ghostFinal.style.visibility = 'hidden';
                interactiveArea.appendChild(ghostFinal);
                const ghostFinalRect = ghostFinal.getBoundingClientRect();
                interactiveArea.removeChild(ghostFinal);

                // 3. Calculate final ghost's visual bounds RELATIVE TO THE CONTAINER
                const ghostFinalLeft = ghostFinalRect.left - areaRect.left;
                const ghostFinalTop = ghostFinalRect.top - areaRect.top;
                const ghostFinalRight = ghostFinalLeft + ghostFinalRect.width;
                const ghostFinalBottom = ghostFinalTop + ghostFinalRect.height;
                const containerWidth = areaRect.width;
                const containerHeight = areaRect.height;

                // 4. Calculate necessary adjustment (delta) for boundary clamping
                let deltaX_boundary = 0;
                let deltaY_boundary = 0;

                if (ghostFinalLeft < 0) {
                    deltaX_boundary = -ghostFinalLeft;
                } else if (ghostFinalRight > containerWidth) {
                    deltaX_boundary = containerWidth - ghostFinalRight;
                }

                if (ghostFinalTop < 0) {
                    deltaY_boundary = -ghostFinalTop;
                } else if (ghostFinalBottom > containerHeight) {
                    deltaY_boundary = containerHeight - ghostFinalBottom;
                }

                // 5. Apply boundary delta to the potentially snapped position
                const finalX = proposedX + deltaX_boundary;
                const finalY = proposedY + deltaY_boundary;

                // 6. Set the final position
                draggedBox.style.left = `${finalX}px`;
                draggedBox.style.top = `${finalY}px`;

                // Re-run overlap check after setting final position
                checkOverlaps();
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

                // --- Shift-click removal logic ---
                if (event.shiftKey) {
                    box.remove();
                    updateYYArrayFromBoxes();
                    checkOverlaps();
                    return;
                }

                // --- Rotation logic ---
                let rotation = parseInt(box.getAttribute('data-rotation')) || 0;
                rotation = rotation === 0 ? 90 : 0;
                box.setAttribute('data-rotation', rotation.toString());
                box.style.transform = `rotate(${rotation}deg)`; // Apply rotation FIRST

                // --- Repositioning logic (using the new method) ---
                const interactiveArea = document.getElementById('TcHmiContainer_1');
                if (!interactiveArea) return; // Safety check
                const areaRect = interactiveArea.getBoundingClientRect();

                // Get current style.left/top as the starting point
                let currentX = parseInt(box.style.left, 10) || 0;
                let currentY = parseInt(box.style.top, 10) || 0;

                // 2. Create ghost to determine visual bounds AFTER rotation at current position
                const ghost = box.cloneNode(true); // Clone includes the new transform
                ghost.style.position = 'absolute';
                ghost.style.left = `${currentX}px`; // Use current position
                ghost.style.top = `${currentY}px`;
                ghost.style.visibility = 'hidden';
                interactiveArea.appendChild(ghost);
                const ghostRect = ghost.getBoundingClientRect();
                interactiveArea.removeChild(ghost); // Clean up ghost

                // 3. Calculate ghost's visual bounds RELATIVE TO THE CONTAINER
                const ghostLeftInContainer = ghostRect.left - areaRect.left;
                const ghostTopInContainer = ghostRect.top - areaRect.top;
                const ghostRightInContainer = ghostLeftInContainer + ghostRect.width;
                const ghostBottomInContainer = ghostTopInContainer + ghostRect.height;
                const containerWidth = areaRect.width;
                const containerHeight = areaRect.height;

                // 4. Calculate necessary adjustment (delta)
                let deltaX = 0;
                let deltaY = 0;

                if (ghostLeftInContainer < 0) {
                    deltaX = -ghostLeftInContainer;
                } else if (ghostRightInContainer > containerWidth) {
                    deltaX = containerWidth - ghostRightInContainer;
                }

                if (ghostTopInContainer < 0) {
                    deltaY = -ghostTopInContainer;
                } else if (ghostBottomInContainer > containerHeight) {
                    deltaY = containerHeight - ghostBottomInContainer;
                }

                // 5. Apply the delta to the current style.left/top
                const finalX = currentX + deltaX;
                const finalY = currentY + deltaY;

                // 6. Set the final position
                box.style.left = `${finalX}px`;
                box.style.top = `${finalY}px`;

                // --- Update PLC and check overlaps ---
                updateYYArrayFromBoxes();
                checkOverlaps();
            }

            function updateYYArrayFromBoxes() {
                const interactiveArea = document.getElementById('TcHmiContainer_1');
                if (!interactiveArea) {
                    console.error("Container 'TcHmiContainer_1' not found for YY update.");
                    return; // Exit if container not found
                }
                const areaRect = interactiveArea.getBoundingClientRect(); // Get container position/dimensions

                const boxes = document.querySelectorAll('.draggable-box');
                const resultArray = [];
                const activeBoxesData = []; // For clearer console logging

                boxes.forEach(box => {
                    const boxRect = box.getBoundingClientRect(); // Get box visual position & size relative to viewport

                    // Calculate the box's visual top-left corner relative to the container's top-left
                    const boxLeftInContainer = boxRect.left - areaRect.left;
                    const boxTopInContainer = boxRect.top - areaRect.top;

                    // Use the visual dimensions directly from getBoundingClientRect
                    const visualWidth = boxRect.width;
                    const visualHeight = boxRect.height;

                    // Calculate the visual center point relative to the container's top-left
                    let centerX = boxLeftInContainer + visualWidth / 2; // Use let instead of const
                    let centerY = boxTopInContainer + visualHeight / 2; // Use let instead of const

                    // *** Add rounding here ***
                    centerX = Math.round(centerX * 100) / 100;
                    centerY = Math.round(centerY * 100) / 100;
                    // *** End of rounding ***

                    // Get the rotation state from the attribute
                    const rotation = parseInt(box.getAttribute('data-rotation')) || 0;

                    // Store the rounded data
                    const boxData = { X: centerX, Y: centerY, Rotation: rotation };
                    resultArray.push(boxData);
                    activeBoxesData.push(boxData); // Add to log array
                });

                // --- Padding the array for the PLC ---
                const maxLength = 101; // Make sure this matches your PLC array GVL_HMI.YY dimension (e.g., ARRAY [0..100])
                while (resultArray.length < maxLength) {
                    resultArray.push({ X: 0, Y: 0, Rotation: 0 }); // Use appropriate default values
                }

                // Log only the data for boxes actually present for easier debugging
                console.log('Updating YY with (first', activeBoxesData.length, 'are active):', activeBoxesData);

                // --- Writing to the PLC symbol ---
                const symbol = new TcHmi.Symbol('%s%ADS.PLC1.GVL_HMI.YY%/s%');
                symbol.writeEx(resultArray, function (data) {
                    if (data.error !== TcHmi.Errors.NONE) {
                        // Log the error code and its name if available
                        console.error("Failed to write to YY array:", data.error, TcHmi.Errors[data.error] || 'Unknown Error');
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
                const epsilon = 0.01; // A small tolerance in pixels for floating point checks

                // Check if they are separated (allowing for the tolerance)
                const separated = (
                    (rect1.right - epsilon) <= rect2.left ||  // rect1 is essentially left of rect2
                    (rect1.left + epsilon) >= rect2.right || // rect1 is essentially right of rect2
                    (rect1.bottom - epsilon) <= rect2.top || // rect1 is essentially above rect2
                    (rect1.top + epsilon) >= rect2.bottom    // rect1 is essentially below rect2
                );

                // If they are not separated, they are overlapping
                return !separated;
            }

            DragAndDrop.CreateBox = CreateBox;

        })(DragAndDrop = Functions.DragAndDrop || (Functions.DragAndDrop = {}));
    })(Functions = TcHmi.Functions || (TcHmi.Functions = {}));
})(TcHmi);

TcHmi.Functions.registerFunctionEx('CreateBox', 'TcHmi.Functions.DragAndDrop', TcHmi.Functions.DragAndDrop.CreateBox);
