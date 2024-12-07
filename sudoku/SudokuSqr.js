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

class SudokuSqr {

    constructor(id, rowid, colid, blkid, sqtype, row, col, blk, val) {
        this.id = id;
        this.rowid = rowid;
        this.colid = colid;
        this.blkid = blkid;
        this.row = row;
        this.col = col;
        this.blk = blk;
        this.sqtype = sqtype;
        this.val = val;
        this.choices = {};
    }

    setValue(val) {
        this.val = val;
        for (let i = 0; i < this.row.length; i++) {
            this.row[i].calcChoices();
            this.col[i].calcChoices();
            this.blk[i].calcChoices();
        }
    }

    unsetValue() {
        this.val = 0;
        for (let i = 0; i < this.row.length; i++) {
            this.row[i].calcChoices();
            this.col[i].calcChoices();
            this.blk[i].calcChoices();
        }
    }

    calcChoices() {

        if (this.val != 0) {
            return {};
        }

        let invalid = {}; 
        for (let i = 0; i < this.row.length; i++) { 
            invalid[this.row[i].val] = 1;
            invalid[this.col[i].val] = 1;
            invalid[this.blk[i].val] = 1;
        }

        let choices = {};
        for (let i = 1; i <=this.row.length; i++) {
            if (i in invalid) {continue;}
            choices[i] = 1;
        }
        this.choices = choices;
    }


    print() {
        console.log(this.id, this.rowid, this.colid, this.blkid, 
                    this.sqtype, this.val, this.choices);
    }
}
