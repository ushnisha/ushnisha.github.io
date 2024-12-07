/*
 *  Sudoku is html/javascript code that lets you solve a sudoku puzzle.
 *  Copyright (C) 2020 Arun Kunchithapatham
 *
 *  This file is part of Sudoku.
 *
 *  Sudoku is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  Sudoku is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with Sudoku.  If not, see <http://www.gnu.org/licenses/>.
*/

let sudoku_string = validSudokus[Math.floor(Math.random() * validSudokus.length)];
let sudoku_size = Math.floor(Math.sqrt(sudoku_string.length));
if (sudoku_size == 0) { sudoku_size = 9;}
let sudoku_base = Math.floor(Math.sqrt(sudoku_size));
let numSq = sudoku_size * sudoku_size;

let width = window.innerWidth;
let height = window.innerHeight;

let mindim = Math.min(width, height);
let maxpctg = 0.75;
let pad = Math.floor((1-maxpctg) * mindim/2.0);
let rest = Math.floor(maxpctg * mindim);
let frac = Math.floor(rest/sudoku_size);

let selected_sq = null;
let solved = false;
let solution = null;
let timer = new Timer();

setInterval(updateTimer, 1000);

oneTimeInitialize();
create_new_sudoku();

function oneTimeInitialize() {
    let sudoku = document.getElementById("sudoku");
    sudoku.style.top = pad + 'px';
    sudoku.style.left = pad + 'px';
    sudoku.style.height = frac*sudoku_size + 'px';
    sudoku.style.width = frac*sudoku_size + 'px';

    let sudoku_mask = document.getElementById("sudoku_mask");
    sudoku_mask.style.top = pad + 'px';
    sudoku_mask.style.left = pad + 'px';
    sudoku_mask.style.height = (frac*sudoku_size + pad) + 'px';
    sudoku_mask.style.width = (frac*sudoku_size + 5) + 'px';

    let sudokunumbers = document.getElementById("sudokunumbers");
    sudokunumbers.style.position = 'fixed';
    sudokunumbers.style.top = String(pad + frac*sudoku_size + 20) + 'px';
    sudokunumbers.style.left = String(pad) + 'px';
    sudokunumbers.style.height = String(frac) + 'px';
    sudokunumbers.style.width = String(frac*sudoku_size) + 'px';

    for (let i = 0; i <= sudoku_size; i++) {
        let choice = document.createElement('DIV');
        choice.setAttribute('id', "choice"+String(i));
        choice.className = 'sudokuchoice';
        choice.setAttribute('val', String(i));
        if (i == 0) {
            choice.textContent = "X";
        }
        else {
            choice.textContent = String(i);
        }
        choice.addEventListener('click', choiceClickEventListener);

        let choice_frac = Math.floor(sudoku_size*frac/(sudoku_size+1));

        choice.style.top = '0px';
        choice.style.left = String(i*(choice_frac+1)) + 'px';
        choice.style.height = String(choice_frac-5) + 'px';
        choice.style.width = String(choice_frac-5) + 'px';
        choice.style.lineHeight = String(choice_frac-5) + 'px';
        choice.style.borderRadius = String(choice_frac-5) + 'px';

        sudokunumbers.appendChild(choice);
    }

    let sudokucontroller = document.getElementById("controller");
    sudokucontroller.style.position = 'fixed';
    sudokucontroller.style.top = String(pad-frac) + 'px';
    sudokucontroller.style.left = String(pad) + 'px';
    sudokucontroller.style.height = '3em';
    sudokucontroller.style.width = String(frac*sudoku_size) + 'px';

    let showoptions = document.getElementById("showOptions");
    let importInput = document.getElementById("importInput");
    let importpuzzles = document.getElementById("importpuzzles");
    let newpuzzle = document.getElementById("newpuzzle");
    let resetpuzzle = document.getElementById("resetpuzzle");
    let clearall = document.getElementById("clearall");
    let fixall = document.getElementById("fixall");
    let closeoptions = document.getElementById("closeoptions");
    let clockdiv = document.getElementById("timer");
    let sudokumenu = document.getElementById("sudokumenu");
    sudokumenu.style.visibility = 'hidden';

    showoptions.setAttribute("title", 'Show Sudoku Options Menu');
    closeoptions.setAttribute("title", 'Close/Hide Sudoku Options Menu');
    importpuzzles.setAttribute("title", 'Import Sudoku Puzzles');
    newpuzzle.setAttribute("title", 'Load New Puzzle');
    resetpuzzle.setAttribute("title", 'Clear All Entered Values to Start Over');
    clearall.setAttribute("title", 'Clear All Cells');
    fixall.setAttribute("title", 'Fix Cells that are not empty');
    clockdiv.setAttribute("title", 'Click to Pause/Resume the Timer');

    showoptions.addEventListener('click', showSudokuOptionsClickEventListener);
    closeoptions.addEventListener('click', closeSudokuOptionsClickEventListener);
    importInput.addEventListener('change', importInputChangeEventListener);
    importpuzzles.addEventListener('click', importPuzzlesClickEventListener);
    newpuzzle.addEventListener("click", newPuzzleClickEventListener);
    resetpuzzle.addEventListener("click", resetPuzzleClickEventListener);
    clearall.addEventListener("click", clearAllClickEventListener);
    fixall.addEventListener("click", fixAllClickEventListener);
    clockdiv.addEventListener("click", clockdivClickEventListener);

    sudokumenu.style.top = pad + 'px';
    sudokumenu.style.left = pad + 'px';
    sudokumenu.style.height = frac*sudoku_size + 'px';
    sudokumenu.style.width = frac*sudoku_size + 'px';
}


function solve() {
    let sudokuSolver = new Worker('./sudoku_solver.js');
    sudokuSolver.postMessage([sudoku_size, sudoku_string]);
    sudokuSolver.onmessage = function(e) {
        console.log("Received reply from sudoku solver...");
        solved = e.data[0];
        solution = e.data[1];
    }
    sudokuSolver.onerror = function(e) {
        console.log(e);
    }
}

function create_new_sudoku() {
    let sudoku = document.getElementById("sudoku");
    let squares = document.getElementsByClassName("sudokusquare"); 
    for (let i = squares.length-1; i >= 0; i--) {
        sudoku.removeChild(squares[i]);
    }

    for (let i = 0; i < numSq; i++) {
        let rowid = Math.floor(i/sudoku_size);
        let colid = i % sudoku_size;
        let blkid = Math.floor(rowid/sudoku_base) * sudoku_base +
                    Math.floor(colid/sudoku_base);
        let val = parseInt(sudoku_string[i]);
        let sqtype = "FIXED";
        if (isNaN(val) || val == 0) {
            val = 0;
            sqtype = "FREE";
        }
        let sq = document.createElement("DIV");
        sq.setAttribute('id', String(i));
        sq.setAttribute('tabindex', String(i));
        sq.setAttribute('type', sqtype);
        sq.setAttribute('row', rowid);
        sq.setAttribute('col', colid);
        sq.setAttribute('blk', blkid);
        sq.setAttribute('val', String(val));
        sq.className = 'sudokusquare';

        sq.addEventListener('click', squareclickEventListener);
        sq.addEventListener('keydown', squarekeyEventListener);
        if (sqtype == "FREE") {
            sq.textContent = "";
        }
        else {
            sq.classList.add('fixed');
            sq.textContent = val;
        }
        sq.style.top = String(rowid*frac) + 'px';
        sq.style.left = String(colid*frac) + 'px';
        sq.style.height = String(frac) + 'px';
        sq.style.width = String(frac) + 'px';
        sq.style.lineHeight = String(frac) + 'px';

        if (rowid == 0) {
            sq.style.borderTop = '3px solid black';
            sq.style.height = String(frac-3) + 'px';
        }
        if (colid == 0) {
            sq.style.borderLeft = '3px solid black';
            sq.style.width = String(frac-3) + 'px';
        }
        if ((rowid + 1) % sudoku_base == 0) {
            if (rowid == sudoku_size - 1) {
                sq.style.borderBottom = '5px solid black';
            }
            else {
                sq.style.borderBottom = '5px solid #696969';
            }
            sq.style.height = String(frac-5) + 'px';
        }
        if ((colid + 1) % sudoku_base == 0) {
            if (colid == sudoku_size - 1) {
                sq.style.borderRight = '5px solid black';
            }
            else {
                sq.style.borderRight = '5px solid #696969';
            }
            sq.style.width = String(frac-5) + 'px';
        }
        sudoku.appendChild(sq);
    }
    solve();
    document.getElementById('0').click();
    validate(document.getElementById('0'));

    timer.reset();
    timer.begin();
}

function squareclickEventListener(event) {
    let this_sq = event.target;
    selected_sq = this_sq;
    this_sq.classList.add('selected');
    let squares = document.getElementsByClassName('sudokusquare');
    for (let i = 0; i < squares.length; i++) {
        if (squares[i].getAttribute('id') == this_sq.getAttribute('id')) {
            continue;
        }
        if (squares[i].getAttribute('type') == "FREE") {
            squares[i].classList.remove('selected');
        }
        else {
            squares[i].classList.remove('selected');
        }
    }
}

function squarekeyEventListener(event) {
    let key = String(event.key);
    let this_sq = event.target;
    let orig_value = this_sq.getAttribute('val');
    let sqtype = this_sq.getAttribute('type');

    let current_val = this_sq.getAttribute('val');
    let deleteKeys = ['0', 'Delete', 'Backspace', 'Clear'];
    let navKeys = ['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    let allowedKeys = [];

    if (navKeys.includes(key)) { 
        let inc = 1;
        if (key == 'ArrowLeft') { inc = numSq - 1; }
        if (key == 'ArrowDown') { inc = numSq + 9; }
        if (key == 'ArrowUp') { inc = numSq - 9; }

        let this_id = parseInt(this_sq.getAttribute('id'));
        let next_id = (this_id + inc) % numSq;
        let next_sq = document.getElementById(String(next_id));
        if (key != 'Tab') {next_sq.focus();}
        next_sq.click();
        return;
    }

    if (sqtype == "FIXED") { return; }

    for (let i = 1; i <= sudoku_size; i++) {
        allowedKeys.push(String(i));
    }
    if (allowedKeys.includes(key)) {
        this_sq.textContent = key;
        this_sq.setAttribute('val', key);
        validate(this_sq);
        check();
    }
    else if (deleteKeys.includes(key)) {
        this_sq.textContent = "";
        this_sq.setAttribute('val', String(0));
        this_sq.classList.remove('error');
        validate(this_sq);
    }
    else {
        if (orig_value == '0') {
            this_sq.textContent = "";
        }
        else {
            this_sq.textContent = orig_value;
        }
        this_sq.setAttribute('val', orig_value);
        validate(this_sq);
    }
}

function validate(this_sq) {

    this_sq.classList.remove('error');

    let counts = [];
    for (let i = 0; i <= sudoku_size; i++) {
        counts[i] = 0;
    }

    let squares = document.getElementsByClassName('sudokusquare');

    for (let i = 0; i < numSq; i++) {
        let sq = squares[i];
        let sqval = parseInt(sq.getAttribute('val'));
        counts[sqval] += 1;
    }
    let choices = document.getElementsByClassName('sudokuchoice');
    for (let i = 0; i < choices.length; i++) {
        let choice = choices[i];
        let choiceval = parseInt(choice.getAttribute('val'));
        if (choiceval == 0) { continue; }
        if (counts[choiceval] >= sudoku_size) {
            choice.classList.add('disabled');
        }
        else {
            choice.classList.remove('disabled');
        }
    }

    let val = parseInt(this_sq.getAttribute('val'));
    if (val == 0) {
        this_sq.classList.remove('error');
        this_sq.click();
        return;
    }

    for (let i = 0; i < numSq; i++) {
        let sq = squares[i];
        if (sq.getAttribute('id') == this_sq.getAttribute('id')) {
            continue;
        }
        if (this_sq.getAttribute('row') == sq.getAttribute('row') ||
            this_sq.getAttribute('col') == sq.getAttribute('col') ||
            this_sq.getAttribute('blk') == sq.getAttribute('blk')) {
            if (this_sq.getAttribute('val') == sq.getAttribute('val')) {
                this_sq.classList.add('error');
                return;
            }
        }
    }
}

function check() {
    if (!solved) {
        return;
    }

    let squares = document.getElementsByClassName('sudokusquare');
    let solString = "";
    for (let i = 0; i < numSq; i++) {
        solString += squares[i].getAttribute('val');
    }
    if (solString == solution) {
        timer.stop();
        alert("Congratulations! Solved!");
    }
}

function choiceClickEventListener(event) {
    let choice = event.target;
    let val = choice.getAttribute('val');
    
    if (selected_sq.getAttribute('type') == "FREE") {
        selected_sq.setAttribute('val', val);
        if (val == '0') {
            selected_sq.textContent = "";
        }
        else {
            selected_sq.textContent = val;
        }
        validate(selected_sq);
        check();
    }
}

function showSudokuOptionsClickEventListener(event) {
    let sudokumenu = document.getElementById('sudokumenu');

    if (sudokumenu.style.getPropertyValue('visibility') == 'hidden') {
        sudokumenu.style.setProperty('visibility', 'visible');
    }
    else {
        sudokumenu.style.setProperty('visibility', 'hidden');
    }
}

function closeSudokuOptionsClickEventListener(event) {
    let sudokumenu = document.getElementById('sudokumenu');
    sudokumenu.style.setProperty('visibility', 'hidden');
}

function importInputChangeEventListener(event) {
    let input_file = event.target.files[0];
    let reader = new FileReader();
    reader.onload = function(e) {
        let inputStr = e.target.result;
        try {
            validSudokus = JSON.parse(inputStr);
            let sudokumenu = document.getElementById('sudokumenu');
            sudokumenu.style.setProperty('visibility', 'hidden');
        }
        catch (e) {
            console.log(e);
        }
    }
    reader.readAsText(input_file);
}

function importPuzzlesClickEventListener(event) {
    importInput.click();
}

function newPuzzleClickEventListener(event) {
    sudoku_string = validSudokus[Math.floor(Math.random() * validSudokus.length)];
    sudoku_size = Math.floor(Math.sqrt(sudoku_string.length));
    create_new_sudoku();

    let sudokumenu = document.getElementById('sudokumenu');
    sudokumenu.style.setProperty('visibility', 'hidden');
}


function resetPuzzleClickEventListener(event) {
    let squares = document.getElementsByClassName("sudokusquare");
    for (let i = 0; i < numSq; i++) {
        let sq = squares[i];
        if (sq.getAttribute('type') == 'FREE') {
            sq.setAttribute('val', '0');
            sq.textContent = "";
            sq.classList.remove('error', 'selected');
        }
    }
    let choices = document.getElementsByClassName('sudokuchoice');
    for (let i = 0; i < choices.length; i++) {
        choices[i].classList.remove('disabled');
    }

    timer.reset();
    timer.begin();

    let sudokumenu = document.getElementById('sudokumenu');
    sudokumenu.style.setProperty('visibility', 'hidden');
}


function clearAllClickEventListener(event) {
    let squares = document.getElementsByClassName("sudokusquare");
    for (let i = 0; i < numSq; i++) {
        let sq = squares[i];
        sq.setAttribute('val', '0');
        sq.textContent = "";
        sq.setAttribute('type', 'FREE');
        sq.className = 'sudokusquare';
        sq.removeEventListener('click', squareclickEventListener);
        sq.removeEventListener('keydown', squarekeyEventListener);
        sq.addEventListener('click', squareclickEventListener);
        sq.addEventListener('keydown', squarekeyEventListener);
    }
    let choices = document.getElementsByClassName('sudokuchoice');
    for (let i = 0; i < choices.length; i++) {
        choices[i].classList.remove('disabled');
    }

    squares[0].click();

    let sudokumenu = document.getElementById('sudokumenu');
    sudokumenu.style.setProperty('visibility', 'hidden');
}


function fixAllClickEventListener(event) {
    let squares = document.getElementsByClassName("sudokusquare");
    sudoku_string = "";
    for (let i = 0; i < numSq; i++) {
        let sq = squares[i];
        sudoku_string += sq.getAttribute('val');
    }
    create_new_sudoku();

    let sudokumenu = document.getElementById('sudokumenu');
    sudokumenu.style.setProperty('visibility', 'hidden');
}

function clockdivClickEventListener(event) {
    if (timer.stopped) return;
    timer.pause_resume();
    let sudoku_mask = document.getElementById('sudoku_mask');
    if (timer.paused) {
        sudoku_mask.style.setProperty('visibility', 'visible');
    }
    else {
        sudoku_mask.style.setProperty('visibility', 'hidden');
    }

}

function updateTimer() {
    document.getElementById("timer").textContent = timer.getString();
}
