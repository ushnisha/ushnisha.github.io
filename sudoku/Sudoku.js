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

class Sudoku {

    constructor(size, initialValues) {
        this.size = size;
        this.base = Math.floor(Math.sqrt(this.size));
        this.initialValues = initialValues;
        this.squares = [];
        this.rows = [];
        this.cols = [];
        this.blks = [];
        this.dfsCounter = 0;
        this.numSolutions = 0;

        for (let i = 0; i < this.size; i++) {
            this.rows[i] = [];
            this.cols[i] = [];
            this.blks[i] = [];
        }

        for(let idx = 0; idx < this.size * this.size; idx++) {
            let rowidx = Math.floor(idx/this.size);
            let colidx = idx%this.size;
            let blkidx = Math.floor(rowidx/this.base)*this.base + 
                            Math.floor(colidx/this.base);
            let val = parseInt(this.initialValues[idx]);
            let sqtype = "FIXED";
            if (isNaN(val)) { 
                val = 0; 
                sqtype = "FREE";
            }
            let sq = new SudokuSqr(idx, rowidx, colidx, blkidx, sqtype,
                                   this.rows[rowidx], this.cols[colidx], this.blks[blkidx], val);
            this.squares[idx] = sq;
            this.rows[rowidx].push(sq);
            this.cols[colidx].push(sq);
            this.blks[blkidx].push(sq);
        }

        for (let idx = 0; idx < this.size * this.size; idx++) {
            this.squares[idx].calcChoices();
        }
    }


    isValid() {

        for(let i = 0; i < this.size; i++) {
            let rowVals = {};
            for (let j = 0; j < this.size; j++) {
                let val = this.rows[i][j].val;
                if (val != 0 && val in rowVals) {
                    return false;
                }
                rowVals[val] = 1;
            }
        }

        for(let i = 0; i < this.size; i++) {
            let colVals = {};
            for (let j = 0; j < this.size; j++) {
                let val = this.cols[i][j].val;
                if (val != 0 && val in colVals) {
                    return false;
                }
                colVals[val] = 1;
            }
        }

        for(let i = 0; i < this.size; i++) {
            let blkVals = {};
            for (let j = 0; j < this.size; j++) {
                let val = this.blks[i][j].val;
                if (val != 0 && val in blkVals) {
                    return false;
                }
                blkVals[val] = 1;
            }
        }
        return true;
    }


    getString() {
        let str = "";
        for(let idx = 0; idx < this.size * this.size; idx++) {
            let val = this.squares[idx].val;
            if (val == 0) {
                val = ".";
            }
            str += val;
        }
        return str;
    }


    solve() {

        this.dfsCounter = 0;
        this.numSolutions = 0;

        this.tryDFS(0, this.getNextSquare(0));
        if (this.numSolutions == 0) {
            console.log("Unsolvable!");
            return false;
        }
        else if (this.numSolutions == 1) {
            return true;
        }
        else {
            console.log("Invalid Sudoku! Multiple solutions found!");
            return false;
        }
    }

    tryDFS(i, sq) {

        this.dfsCounter += 1;

        if (i == this.size * this.size) {
            this.numSolutions += 1;
            return true;
        }

        if (null == sq || sq.val != 0) {
            return this.tryDFS(i+1, this.getNextSquare(i+1));
        }
        else {
            if (Object.keys(sq.choices).length == 0) {
                return false;
            }
            else {
                let solved = false;
                let choices = Object.keys(sq.choices);
                choices = choices
                    .map((a) => ({sort: Math.random(), value: a}))
                    .sort((a, b) => a.sort - b.sort)
                    .map((a) => a.value);
                for (let c = 0; c < choices.length; c++) {
                    sq.setValue(choices[c]);
                    if (this.tryDFS(i+1, this.getNextSquare(i+1))) {
                        return true;
                    }
                    else {
                        sq.unsetValue();
                    }
                }
                return solved;
            }
        }
    }

    getNextSquare(i) {
        let candidates = this.squares.filter((sq) => sq.val == 0)
                                     .sort((a,b) => (Object.keys(a.choices).length -
                                                     Object.keys(b.choices).length));
        return candidates[0];
    }


    getFilledCount() {
        let filledCount = 0;
        for (let i = 0; i < this.size * this.size; i++) {
            if (this.squares[i].type == "FIXED") filledCount += 1;
        }
        return filledCount;
    }


    reset() {
        for (let i = 0; i < this.size * this.size; i++) {
            if (this.squares[i].type == "FREE") {
                this.squares[i].setValue(0);
                this.squares[i].calcChoices();
            }
        }
    }


    print() {
        for(let i = 0; i < this.size; i++) {
            let rowStr = "";
            for(let j = 0; j < this.size; j++) {
                let idx = i * this.size + j;
                let val = this.squares[idx].val;
                if (val == 0) {
                    val = ".";
                }
                rowStr += val + " ";
            }
            console.log(rowStr);
        }
    }

}
