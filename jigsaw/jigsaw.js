/*
/*
 *  JigSaw is html/javascript code that creates a jigsaw from a link.
 *  It assumes that the user has provided a valid link to an image file.
 *  Copyright (C) 2015 Arun Kunchithapatham
 *
 *  This file is part of JigSaw.
 *
 *   JigSaw is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  JigSaw is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with JigSaw.  If not, see <http://www.gnu.org/licenses/>.
*/

var JigSaw = {

    selectedPiece: null,
    pieces: new Array(),
    maxWidth: 1024,
    maxHeight: 768,
    width: null,
    height: null,
    numGrids: 5,
    offset: 50,
    frameDiv: null,
    previewWidth: 100,
    maxZIndex: 100,
    numBlink: 8,
    loading: false,
    
    init: function() {

        if (!JigSaw.loading) {
            JigSaw.loading = true;
            JigSaw.clearPuzzle();
            
            // Alert the user to wait...
            var message = document.createElement('div');
            message.setAttribute('id', 'wait_message');
            message.setAttribute('top', window.innerHeight/2.0 + "px");
            message.setAttribute('left', window.innerWidth/2.0 + "px");
            message.innerText = "Please wait while image is loading...";
            document.body.appendChild(message);
            message.style.zIndex = 99999999;
            
            
            // Set the number of grids per row/column
            JigSaw.numGrids = parseInt(document.getElementById('numGrids').value);
                    
            // Check for image value; use default if not provided
            // No error checking to see if image url is correct and point to a valid image
            var default_src = "https://stallman.org/graphics/painting.jpg";        
            var img = new Image();
            var img_url = document.getElementById('image_url');
        
            img.addEventListener("load", function() {
                                            // Remove and recreate the jigsaw placement frame; 
                                            // this is in case the screen size changed between two different runs
                                            JigSaw.createPuzzleFrame(this);        
                                            // Now create the pieces
                                            JigSaw.createPieces(this);
                                            JigSaw.calculateNeighbors();
                                            JigSaw.loading = false;
                                            message.parentNode.removeChild(message);
                                        }, false);
                
            if (img_url.value == "") {
                img.src = default_src;
            }
            else {
                img.src = img_url.value;
            }
        }
    },

    
    // Delete any pieces, preview images, and associated canvas elements from an earlier run, if any
    clearPuzzle: function() {
    
        for (var i = 0; i < JigSaw.pieces.length; i++) {
            var canvas = JigSaw.pieces[i].canvas;
            canvas.parentNode.removeChild(canvas);
        }
        if (document.getElementById('previewImage') != undefined) {
            previewImage = document.getElementById('previewImage');
            previewImage.parentNode.removeChild(previewImage);
        }
        JigSaw.pieces = new Array();
    },
    
    createPuzzleFrame: function(img) {

        // Draw the puzzle frame to the right of the space reserved for a preview image
        //
        if (JigSaw.frameDiv !== null) {
            JigSaw.frameDiv.parentNode.removeChild(this.frameDiv);
            JigSaw.frameDiv = null;
        }

        // Logic to determine the size of the frameDiv:
        // (1) If image is smaller than frameDiv max limits; let the image be
        // (2) If the image size exceeds the max of either width or height, resize to max
        // Currently assume that the max of the frameDiv is less than the window size (else you will see scroll bars)

        var imgH = img.height;
        var imgW = img.width;
        var ratio = imgH/imgW;

        JigSaw.height = imgH;
        JigSaw.width = imgW;
        
        if (imgH >= imgW) {
            if (imgH > JigSaw.maxHeight) {
                JigSaw.height = JigSaw.maxHeight;
                JigSaw.width = Math.round(JigSaw.height / ratio);
            }
        }
        else {
            if (imgW > JigSaw.maxWidth) {
                JigSaw.width = JigSaw.maxWidth;
                JigSaw.height = Math.round(JigSaw.width * ratio);
            }
        }
        
        JigSaw.frameDiv = document.createElement('div');
        JigSaw.frameDiv.setAttribute("style", "position:absolute;border:blue 2px solid;");
        JigSaw.frameDiv.style.setProperty("width", JigSaw.width + "px");
        JigSaw.frameDiv.style.setProperty("height", JigSaw.height + "px");
        JigSaw.frameDiv.style.setProperty("top", JigSaw.offset + "px");
        JigSaw.frameDiv.style.setProperty("left", JigSaw.offset * 2 + JigSaw.previewWidth + "px");
        document.body.appendChild(JigSaw.frameDiv);

        // Next, draw a preview/reference image in the space reserved for it
        var previewImage = new Image();
        previewImage.src = img.src;
        previewImage.setAttribute('id', 'previewImage');
        previewImage.setAttribute('title', 'Preview Image');
        previewImage.setAttribute("style", "position:absolute;border:red 4px solid;");
        previewImage.style.setProperty("width", JigSaw.previewWidth + "px");
        previewImage.style.setProperty("height", Math.round(JigSaw.previewWidth * JigSaw.height/JigSaw.width) + "px");
        previewImage.style.setProperty("top", JigSaw.offset + "px");
        previewImage.style.setProperty("left", JigSaw.offset + "px");
        document.body.appendChild(previewImage);
        
    },
    
    // Create a piece; scale it to fit the frameDiv if it is larger than the frameDiv
    createPieces: function(img) {

        // Now that image is loaded into the canvas context
        // create as many canvas elements as jigsaw pieces in the puzzle
        var pieceHeight = Math.round(JigSaw.height/JigSaw.numGrids);
        var pieceWidth = Math.round(JigSaw.width/JigSaw.numGrids);
        
        var imageHeight = Math.round(img.height/JigSaw.numGrids);
        var imageWidth = Math.round(img.width/JigSaw.numGrids);
                
        var count = 0;
        for (var i = 0; i < JigSaw.numGrids; i++) {
            for (var j = 0; j < JigSaw.numGrids; j++) {
                var piece = new Piece(count, i, j, pieceHeight, pieceWidth, img, 
                                      JigSaw.offset + i * pieceHeight, 
                                      JigSaw.previewWidth + JigSaw.offset * 2 + j * pieceWidth,
                                      imageHeight, imageWidth);
                JigSaw.pieces.push(piece);
                piece.attachCanvas();
                count++;
            }
        }       
    },
    
    // Identify the neighboring pieces
    calculateNeighbors: function() {
        for (var i = 0; i < JigSaw.pieces.length; i++) {
            piece = JigSaw.pieces[i];
            var row = piece.row;
            var col = piece.col;
            var id = piece.id;
            
            //pieces up and down
            var row_up = row - 1;
            var row_down = row + 1;
            if (row_up >= 0) {
                var up_id = row_up * JigSaw.numGrids + col;
                piece.neighborPieces.push(JigSaw.pieces[up_id]);
            }
            if (row_down < JigSaw.numGrids) {
                var down_id = row_down * JigSaw.numGrids + col;
                piece.neighborPieces.push(JigSaw.pieces[down_id]);
            }
            
            //pieces left and right
            var col_left = col - 1;
            var col_right = col + 1;
            if (col_left >= 0) {
                var left_id = row * JigSaw.numGrids + col_left;
                piece.neighborPieces.push(JigSaw.pieces[left_id]);
            }
            if (col_right < JigSaw.numGrids) {
                var right_id = row * JigSaw.numGrids + col_right;
                piece.neighborPieces.push(JigSaw.pieces[right_id]);
            }
        }
    },
    
    updateConnections: function(piece, xpos, ypos) {
    
        // Check if up/down/left/right neighbors are close to this piece
        var found = false;
        var pcx = piece.currentLeft + piece.width/2.0;
        var pcy = piece.currentTop + piece.height/2.0;        
        piece.neighborPieces.forEach ( function(thisNeighbor, index, ary) {
            var alreadyAttached = false;
            piece.attachedPieces.forEach (function(p, idx, array) {
                if (thisNeighbor === p) {
                    alreadyAttached = true;
                }
            });
            
            if (!found && !alreadyAttached) {
                if (JigSaw.nearEnough(piece, thisNeighbor)) {
                    found = true;                    
                    piece.attachedPieces.forEach( function (p, i, a) {
                        p.snapTo(thisNeighbor);
                        if (thisNeighbor.inPosition) {
                            setTimeout(function () { 
                                p.canvas.style.zIndex = 1;
                                p.canvas.style.setProperty('border', 'none');
                            }, 500);
                            p.inPosition = true;
                        }
                    });

                    
                    var mergedConnections = Array.from(new Set(piece.attachedPieces.concat(thisNeighbor.attachedPieces)));
                    piece.attachedPieces.forEach ( function(p, index, ary) {
                        if (piece !== p) {
                            p.attachedPieces = mergedConnections;
                        }
                    });
                    piece.attachedPieces = mergedConnections;
                    thisNeighbor.attachedPieces.forEach ( function(p, index, ary) {
                        p.attachedPieces = mergedConnections;
                    });                    
                }
            }
        });
    },

    nearEnough: function(p, n) {
        var dx = (p.currentLeft - n.currentLeft) - (p.correctLeft - n.correctLeft);
        var dy = (p.currentTop - n.currentTop) - (p.correctTop - n.correctTop);
        if ((Math.abs(dx) < p.width * 0.2) && (Math.abs(dy) < p.height * 0.2)) {
            return true;
        }
        else {
            return false;
        }
    },
    
    // Utility function to check if the puzzle is solved
    checkSolved: function() {
        var solved = true;
        for (var i = 0; i < JigSaw.pieces.length; i++) {
            if (!JigSaw.pieces[i].inPosition) {
                solved = false;
                break;
            }
            else {
                JigSaw.pieces[i].canvas.style.setProperty('border', 'none');
            }
        }
        return solved;
    }
    
};

// Define a jigsaw puzzle piece
function Piece(id, row, col, height, width, img, correctTop, correctLeft, imgH, imgW)  {
    this.overlapRatio = 0.2;
    this.id = id;
    this.row = row;
    this.col = col;
    this.height = height;
    this.width = width;
    this.origHeight = height;
    this.origWidth = width;
    this.imageHeight = imgH;
    this.imageWidth = imgW;
    this.origImageHeight = imgH;
    this.origImageWidth = imgW;
    this.image = img;
    this.correctTop = correctTop;
    this.correctLeft = correctLeft;
    this.currentTop = 0;
    this.currentLeft = 0;
    this.inPosition = false;
    this.neighborPieces = new Array();
    this.attachedPieces = new Array();
        
    this.x1 = 0; this.y1 = 0;
    this.x2 = this.x1 + this.origWidth; this.y2 = 0;
    this.x3 = this.x1 + this.origWidth; this.y3 = this.y1 + this.origHeight;
    this.x4 = 0; this.y4 = this.y1 + this.origHeight;

    this.attachedPieces.push(this);    // Initially, the piece is attached only to itself
    
    // Calculate the random deformations we might apply to the piece
    //  0: the side is flat
    //  1: the side bezier curves outwards
    // -1: the side bezier curves inwards
    
    this.topOffset = 0;
    this.bottomOffset = 0;
    this.leftOffset = 0;
    this.rightOffset = 0;
    
    this.imageSX = 0;
    this.imageSY = 0;
    this.canvasDX = 0;
    this.canvasDY = 0;

    // Top edge
    if (this.row > 0) {
        var topIdx = (this.row - 1) * JigSaw.numGrids + this.col;
        this.topOffset = JigSaw.pieces[topIdx].bottomOffset * -1;
        this.height += this.origHeight * this.overlapRatio;
        this.correctTop -= this.origHeight * this.overlapRatio;
        this.imageHeight += this.origImageHeight * this.overlapRatio;
        this.imageSY = this.row * this.origImageHeight - this.origImageHeight * this.overlapRatio;
        this.canvasDY = this.origHeight * this.overlapRatio;
        this.y1 += this.origHeight * this.overlapRatio;
        this.y2 += this.y1;
        this.y3 += this.y1;
        this.y4 += this.y1;
    }
    // Bottom edge
    if (this.row < JigSaw.numGrids - 1) {
        if(Math.random() < 0.5) {
            this.bottomOffset = 1;
        }
        else {
            this.bottomOffset = -1;
        }
        this.height += this.origHeight * this.overlapRatio;
        this.imageHeight += this.origImageHeight * this.overlapRatio;
    }
    // Left edge
    if (this.col > 0) {
        var leftIdx = this.id - 1;
        this.leftOffset = JigSaw.pieces[leftIdx].rightOffset * -1;
        this.width += this.origWidth * this.overlapRatio;
        this.correctLeft -= this.origWidth * this.overlapRatio;
        this.imageWidth += this.origImageWidth * this.overlapRatio;
        this.imageSX = this.col * this.origImageWidth - this.origImageWidth * this.overlapRatio;
        this.canvasDX = this.origWidth * this.overlapRatio;
        this.x1 += this.origWidth * this.overlapRatio;
        this.x2 += this.x1;
        this.x3 += this.x1;
        this.x4 += this.x1;
    }
    // Right edge
    if (this.col < JigSaw.numGrids - 1) {
        if(Math.random() < 0.5) {
            this.rightOffset = 1;
        }
        else {
            this.rightOffset = -1;
        }
        this.width += this.origWidth * this.overlapRatio;
        this.imageWidth += this.origImageWidth * this.overlapRatio;
    }
    
    return this;
}

// Attach a canvas to the piece and position the image on it
// and place the piece in a random position in the document 
Piece.prototype.attachCanvas = function() {
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute("style", "position:absolute;border:none;");
    this.canvas.setAttribute('id', this.id);
    this.canvas.owner = this;
    var ctx = this.canvas.getContext('2d');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.zIndex = 100;
    
    // Begin drawing the path of the inner tile
    //this.createPath('SIMPLE', ctx); 
    this.createPath('SIMPLE_JIGSAW', ctx); 
    
    var tmpTop = JigSaw.offset + Math.round(Math.random() * (window.innerHeight - this.height - JigSaw.offset));
    var tmpLeft = JigSaw.offset + JigSaw.previewWidth + 
                  Math.round(Math.random() * (window.innerWidth - this.width - JigSaw.previewWidth - JigSaw.offset * 2));
    this.currentTop = tmpTop;
    this.currentLeft = tmpLeft;
    this.canvas.style.setProperty("top", tmpTop + "px");
    this.canvas.style.setProperty("left", tmpLeft + "px");
    document.body.appendChild(this.canvas);
    
    // Set up and event listener to react to mouse clicks and move events on the canvas/document
    this.canvas.addEventListener('mousedown', onMouseDown, false);
    document.addEventListener('mouseup', onMouseUp, false);
    document.addEventListener('mousemove', onMouseMove, false);
}

Piece.prototype.createPath = function(pathType, ctx) {

    ctx.lineWidth = 1;
    ctx.strokeStyle="#000000";
    
    if (pathType === 'SIMPLE') {
        ctx.beginPath();
        ctx.moveTo(this.canvasDX, this.canvasDY);
        ctx.lineTo((1.0 + this.overlapRatio) * this.origWidth, this.overlapRatio * this.origHeight); 
        ctx.lineTo((1.0 + this.overlapRatio) * this.origWidth, (1.0 + this.overlapRatio) * this.origHeight); 
        ctx.lineTo(this.overlapRatio * this.origWidth, (1.0 + this.overlapRatio) * this.origHeight); 
        ctx.lineTo(this.overlapRatio * this.origWidth, this.overlapRatio * this.origHeight); 
        ctx.closePath();
        ctx.clip();
    }
    else if (pathType === 'SIMPLE_JIGSAW') {
        //alert ("Got here!");
        ctx.beginPath();
        
        ctx.moveTo(this.x1, this.y1);

        if (this.topOffset == 0) {
            ctx.lineTo(this.x2, this.y2);
        }
        else {
            var mid1_x = this.x1 + this.origWidth * (0.5 - this.overlapRatio);
            var mid2_x = mid1_x + this.origWidth * this.overlapRatio * 2;
            ctx.lineTo(mid1_x, this.y1);
            ctx.bezierCurveTo(mid1_x, this.y1 - this.topOffset * this.y1, 
                              mid2_x, this.y1 - this.topOffset * this.y1, 
                              mid2_x, this.y1);
            ctx.lineTo(this.x2, this.y2);
        }

        if (this.rightOffset == 0) {
            ctx.lineTo(this.x3, this.y3);
        }
        else {
            var mid1_y = this.y2 + this.origHeight * (0.5 - this.overlapRatio);
            var mid2_y = mid1_y + this.origHeight * this.overlapRatio * 2;
            ctx.lineTo(this.x2, mid1_y);
            ctx.bezierCurveTo(this.x2 + this.rightOffset * (this.origWidth * this.overlapRatio), mid1_y, 
                              this.x2 + this.rightOffset * (this.origWidth * this.overlapRatio), mid2_y, 
                              this.x2, mid2_y);
            ctx.lineTo(this.x3, this.y3);
        }
        
        if (this.bottomOffset == 0) {
            ctx.lineTo(this.x4, this.y4);
        }
        else {
            var mid1_x = this.x3 - this.origWidth * (0.5 - this.overlapRatio);
            var mid2_x = mid1_x - this.origWidth * this.overlapRatio * 2;
            ctx.lineTo(mid1_x, this.y3);
            ctx.bezierCurveTo(mid1_x, this.y3 + this.bottomOffset * (this.origHeight * this.overlapRatio), 
                              mid2_x, this.y3 + this.bottomOffset * (this.origHeight * this.overlapRatio), 
                              mid2_x, this.y3);
            ctx.lineTo(this.x4, this.y4);
        }

        if (this.leftOffset == 0) {
            ctx.lineTo(this.x1, this.y1);
        }
        else {
            var mid1_y = this.y4 - this.origHeight * (0.5 - this.overlapRatio);
            var mid2_y = mid1_y - this.origHeight * this.overlapRatio * 2;
            ctx.lineTo(this.x4, mid1_y);
            ctx.bezierCurveTo(this.x4 - this.leftOffset * (this.origWidth * this.overlapRatio), mid1_y, 
                              this.x4 - this.leftOffset * (this.origWidth * this.overlapRatio), mid2_y, 
                              this.x4, mid2_y);
            ctx.lineTo(this.x1, this.y1);
        }
        ctx.stroke();
        ctx.closePath();
        ctx.clip();
    }
    ctx.drawImage(this.image, this.imageSX, this.imageSY,                              // sx, sy
                              this.imageWidth, this.imageHeight,                       // sWidth, sHeight
                              0, 0,                                                    // dx, dy
                              this.width, this.height);                                // dWidth, dHeight

}

// Utility function to set the position of the piece
// Only pieces not in their correct position can be moved
Piece.prototype.placeAt = function(top, left) {
    if (!this.inPosition) {
        if (piece.checkCorrectPosition(top, left)) {
            piece.attachedPieces.forEach( function (p, index, a) {
                p.setPosition(p.correctTop, p.correctLeft);
                p.flash('green 5px solid');

                setTimeout(function () { 
                    p.canvas.style.zIndex = 1;
                    p.canvas.style.setProperty('border', 'none');
                }, 500);
                p.inPosition = true;
            });
        }
        else {
            piece.setPosition(top, left);
        }
    }
}

Piece.prototype.setPosition = function(top, left) {
    this.currentTop = top;
    this.currentLeft = left;
    this.canvas.style.setProperty('top', top + 'px');
    this.canvas.style.setProperty('left', left + 'px');        
}    

Piece.prototype.moveDelta = function(dx, dy) {
    if (!this.inPosition) {
        this.setPosition(this.currentTop + dy, this.currentLeft + dx);
    }
}

Piece.prototype.snapTo = function(otherPiece) {
    var dy = this.correctTop - otherPiece.correctTop + otherPiece.currentTop;
    var dx = this.correctLeft - otherPiece.correctLeft + otherPiece.currentLeft;
    this.setPosition(dy, dx);
}

Piece.prototype.checkCorrectPosition = function(y, x) {
    canvas = this.canvas;
    if ((Math.abs(x - this.correctLeft) < this.width/2.0) &&
        (Math.abs(y - this.correctTop) < this.height/2.0)) {
        return true;
    }
    else {
        return false;
    }
}

Piece.prototype.flash = function(borderStyle) {
    var canvas = this.canvas;
    var up = false;
    for (var i = 0; i < JigSaw.numBlink; i++) {
        setTimeout(function () { 
            if (up) {
                canvas.style.zIndex = 1;
                canvas.style.setProperty('border', 'none');
                up = false;
            }
            else {
                canvas.style.zIndex = 9999999;
                canvas.style.setProperty('border', borderStyle);
                up = true; 
            }
        }, i * 50);
    }            
}

// Mark the selected piece and bring it to the top (zIndex setting)
function onMouseDown(e) {

    var solved = JigSaw.checkSolved();
    if (solved) {
        "Congratulations!  You have solved the puzzle!";
        return;
    }
    
    canvas = e.target;
    piece = canvas.owner;
    if (!piece.inPosition) {
        JigSaw.selectedPiece = piece;
        canvas.style.setProperty('border', "red 1px dashed");
        JigSaw.maxZIndex += 1;
        canvas.style.zIndex = JigSaw.maxZIndex;
    }
    else {
        canvas.style.zIndex = 1;
        canvas.style.setProperty('border', 'none');
        //alert("Piece is fixed in its correct position!");
    }

    
}

// On placing a piece, check for correct position and fix; else move to position
// If in correct position, send to back by setting zIndex = 1
// Also, check to see if the puzzle is solved
//
function onMouseUp(e) {
    piece = JigSaw.selectedPiece;
    if (piece !== null) {
        canvas = piece.canvas;
        JigSaw.selectedPiece = null;
        canvas.style.setProperty('border', 'none');
        var xpos = e.pageY - piece.height/2.0;
        var ypos = e.pageX - piece.width/2.0;
        piece.placeAt(xpos, ypos);
        JigSaw.updateConnections(piece, xpos, ypos);
        var solved = JigSaw.checkSolved();
        if (solved) {
            alert("Congratulations!  You have solved the puzzle.");
        }
    }
}

// Real-time move of piece as it is moved around the board.
function onMouseMove(e) {
    if (JigSaw.selectedPiece !== null) {
        piece = JigSaw.selectedPiece;
        var dy = e.pageY - piece.currentTop - piece.height/2.0;
        var dx = e.pageX - piece.currentLeft - piece.width/2.0;
        piece.attachedPieces.forEach( function (p, idx, array) {
            p.moveDelta(dx, dy);
        });
    }
}
