(function () {
    "use strict";

    
    let fullSolutionGrid = new Array(81);
    let playablePuzzleGrid = new Array(81);
    let activePointerIndex = null;
    let timingCounter = 0;
    let stopwatchIntervalRef = null;

    
    const gridMeshDOM = document.getElementById("interactive-grid-mesh");
    const diffSelectorDOM = document.getElementById("difficulty-setting-node");
    const clockLabelDOM = document.getElementById("clock-display");
    const modeLabelDOM = document.getElementById("game-mode-display");

    function executeCoreSetup() {
    
        for (let positionIndex = 0; positionIndex < 81; positionIndex++) {
            const squareNode = document.createElement("div");
            squareNode.className = "matrix-node";
            squareNode.dataset.linearIndex = positionIndex;
            squareNode.addEventListener("click", function () {
                triggerNodeFocus(positionIndex);
            });
            gridMeshDOM.appendChild(squareNode);
        }

        
        document.getElementById("instantiate-game-trigger").addEventListener("click", initializeFreshSession);
        document.getElementById("audit-matrix-trigger").addEventListener("click", validateCurrentMatrixState);
        document.getElementById("purge-digit-action").addEventListener("click", function () {
            processNumericalInput(0);
        });

        
        const controlKeys = document.querySelectorAll(".numeric-key");
        controlKeys.forEach(function (element) {
            element.addEventListener("click", function (event) {
                const numericValue = parseInt(event.target.dataset.digit, 10);
                processNumericalInput(numericValue);
            });
        });

        
        window.addEventListener("keydown", function (hardwareEvent) {
            if (activePointerIndex === null) return;
            const parsedCharacter = hardwareEvent.key;
            if (parsedCharacter >= "1" && parsedCharacter <= "9") {
                processNumericalInput(parseInt(parsedCharacter, 10));
            } else if (parsedCharacter === "Backspace" || parsedCharacter === "Delete") {
                processNumericalInput(0);
            }
        });

        initializeFreshSession();
    }

    function initializeFreshSession() {
        clearInterval(stopwatchIntervalRef);
        timingCounter = 0;
        activePointerIndex = null;
        clockLabelDOM.textContent = "Elapsed: 00:00";

        const selectedClueVolume = parseInt(diffSelectorDOM.value, 10);
        const dropdownText = diffSelectorDOM.options[diffSelectorDOM.selectedIndex].text;
        modeLabelDOM.textContent = dropdownText.split(" (")[0];

        generateAbsoluteSolution();
        carvePlayablePuzzle(selectedClueVolume);
        synchronizeUserInterface();

        stopwatchIntervalRef = setInterval(function () {
            timingCounter++;
            const totalMinutes = String(Math.floor(timingCounter / 60)).padStart(2, "0");
            const totalSeconds = String(timingCounter % 60).padStart(2, "0");
            clockLabelDOM.textContent = `Elapsed: ${totalMinutes}:${totalSeconds}`;
        }, 1000);
    }

    
    function generateAbsoluteSolution() {
        fullSolutionGrid.fill(0);
        runBacktrackingSolver(fullSolutionGrid);
    }

    function runBacktrackingSolver(targetGrid) {
        for (let blockIndex = 0; blockIndex < 81; blockIndex++) {
            if (targetGrid[blockIndex] === 0) {
                
                const dynamicShuffledSet = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(function () {
                    return Math.random() - 0.5;
                });

                for (let chosenNum of dynamicShuffledSet) {
                    if (verifyPlacementValidity(targetGrid, blockIndex, chosenNum)) {
                        targetGrid[blockIndex] = chosenNum;
                        if (runBacktrackingSolver(targetGrid)) return true;
                        targetGrid[blockIndex] = 0;
                    }
                }
                return false;
            }
        }
        return true;
    }

    function verifyPlacementValidity(targetGrid, targetIdx, prospectiveNum) {
        const rowOffset = Math.floor(targetIdx / 9);
        const colOffset = targetIdx % 9;
        const boxRowBoundary = Math.floor(rowOffset / 3) * 3;
        const boxColBoundary = Math.floor(colOffset / 3) * 3;

        for (let iterationCounter = 0; iterationCounter < 9; iterationCounter++) {
            
            if (targetGrid[rowOffset * 9 + iterationCounter] === prospectiveNum) return false;
            
            if (targetGrid[iterationCounter * 9 + colOffset] === prospectiveNum) return false;
            
            const quadrantLinearIndex = (boxRowBoundary + Math.floor(iterationCounter / 3)) * 9 + (boxColBoundary + (iterationCounter % 3));
            if (targetGrid[quadrantLinearIndex] === prospectiveNum) return false;
        }
        return true;
    }

    function carvePlayablePuzzle(cluesToRetain) {
        playablePuzzleGrid = [...fullSolutionGrid];
        let itemsToWipe = 81 - cluesToRetain;

        while (itemsToWipe > 0) {
            let structuralRNGIndex = Math.floor(Math.random() * 81);
            if (playablePuzzleGrid[structuralRNGIndex] !== 0) {
                playablePuzzleGrid[structuralRNGIndex] = 0;
                itemsToWipe--;
            }
        }
    }

    function synchronizeUserInterface() {
        const structuralDOMCells = gridMeshDOM.children;
        for (let cellIndex = 0; cellIndex < 81; cellIndex++) {
            const singleDOMCell = structuralDOMCells[cellIndex];
            singleDOMCell.className = "matrix-node";
            
            if (playablePuzzleGrid[cellIndex] !== 0) {
                singleDOMCell.textContent = playablePuzzleGrid[cellIndex];
                singleDOMCell.classList.add("static-clue");
            } else {
                singleDOMCell.textContent = "";
            }
        }
    }

    function triggerNodeFocus(selectedIndex) {
        const structuralDOMCells = gridMeshDOM.children;
        if (structuralDOMCells[selectedIndex].classList.contains("static-clue")) return;

        if (activePointerIndex !== null) {
            structuralDOMCells[activePointerIndex].classList.remove("focus-active");
        }
        activePointerIndex = selectedIndex;
        structuralDOMCells[selectedIndex].classList.add("focus-active");
    }

    function processNumericalInput(inboundDigit) {
        if (activePointerIndex === null) return;
        const structuralDOMCells = gridMeshDOM.children;
        const matchingTargetDOMCell = structuralDOMCells[activePointerIndex];

        playablePuzzleGrid[activePointerIndex] = inboundDigit;
        matchingTargetDOMCell.textContent = inboundDigit !== 0 ? inboundDigit : "";
        matchingTargetDOMCell.className = "matrix-node focus-active user-assigned";
    }

    function validateCurrentMatrixState() {
        const structuralDOMCells = gridMeshDOM.children;
        let universalValidCounter = 0;

        for (let trackingIndex = 0; trackingIndex < 81; trackingIndex++) {
            structuralDOMCells[trackingIndex].classList.remove("fault-detected");
            
            const internalVal = playablePuzzleGrid[trackingIndex];
            if (internalVal !== 0 && internalVal !== fullSolutionGrid[trackingIndex]) {
                structuralDOMCells[trackingIndex].classList.add("fault-detected");
            } else if (internalVal === fullSolutionGrid[trackingIndex]) {
                universalValidCounter++;
            }
        }

        if (universalValidCounter === 81) {
            clearInterval(stopwatchIntervalRef);
            alert(`🎉 Success! You solved the Sudoku Game by Adi cleanly in ${clockLabelDOM.textContent.replace('Elapsed: ', '')}!`);
        }
    }

    document.addEventListener("DOMContentLoaded", executeCoreSetup);
})();
