var mapArray = new Array();
mapMinX = 0;
mapMinY = 0;
var mapMaxX = 0;
var mapMaxY = 0;
var pix32 = 32;
mapWidth = 0;
mapHeight = 0;
var xAbs = -1;
var yAbs = -1;
var xDir = -1;
loadMap = function() {
    $.get('assert/map/worldMap.tmx', {}, function(xml) {
        $('layer', xml).each(function(h) {
            if ($(this).attr('name') == 'TileLayer') {
                mapWidth = parseInt($(this).attr('width'), 10);
                mapHeight = parseInt($(this).attr('height'), 10);
                mapMaxX = mapWidth * pix32;
                mapMaxY = mapHeight * pix32;
                console.log('mytest' + mapMaxX);
            }
        });

        var imageWidth = 80;
        var imageHeight = 50;
        var xCoordinate = 0;
        var yCoordinate = 0;
        var tileCount = 0;
        var imgX = 0;
        var imgRow = 0;
        var imgColumn = 0;
        var imgY = 0;
        var canvasX = 0;
        var canvasY = 0;

        console.log('start' + new Date().getTime());
        $('data', xml).each(function(i) {
            $('tile', this).each(function(j) {
                var imgId = $(this).attr('gid');
                mapArray[tileCount] = imgId;
                tileCount++;
            });
        });
    });

}
drawMap = function(x, y) {
    var screenHeight = canvas.getAttribute('height');
    var screenWidth = canvas.getAttribute('width');
    var width = screenWidth / 2;
    var height = screenHeight / 2;
    var xOffset = 0;
    var yOffset = 0;
    var currentTile = 0;
    var xLastOffset = 0;
    var yLastOffset = 0;
    var lastTile = 0;
    var xTilePosition = 0;
    var noOfXTiles = parseInt(screenWidth / pix32, 10);
    var noOfYTiles = parseInt(screenHeight / pix32, 10);
    var xCoordinate = 0;
    var yCoordinate = 0;
    var canvasX = 0;
    var canvasY = 0;
    var tileCount = 1;
    if ((parseInt(x / screenWidth, 10) != xAbs) || (parseInt(y / screenHeight, 10) != yAbs)) {
        xAbs = parseInt(x / screenWidth, 10);
        yAbs = parseInt(y / screenHeight, 10);
        var widthOffset = parseInt(x % screenWidth, 10);
        var heightOffset = parseInt(y % screenHeight, 10);
        xOffset = parseInt(((x - widthOffset) / pix32), 10);
        yOffset = parseInt(((y - heightOffset) / pix32), 10);
        currentTile = yOffset * mapWidth + xOffset;
        xLastOffset = xOffset + noOfXTiles;
        yLastOffset = yOffset + noOfYTiles;
        lastTile = yLastOffset * mapWidth + xLastOffset;
        console.log('xOffset' + xOffset + 'yOffset' + yOffset + 'currentTile' + currentTile + 'xLastOffset' + xLastOffset + 'yLastOffset' + yLastOffset + 'lastTile' + lastTile);
        while (currentTile <= lastTile) {
            canvasX = pix32 * xCoordinate;
            canvasY = pix32 * yCoordinate;
            if ((tileCount % (noOfXTiles + 1)) == 0) {
                xCoordinate = 0;
                yCoordinate++;
            } else {
                xCoordinate++;
            }

            tileCount++;
            if (xTilePosition == (noOfXTiles + 1)) {
                xTilePosition = 0;
                yOffset++;
                currentTile = yOffset * mapWidth + xOffset;
            }
            drawTile(currentTile, canvasX, canvasY);
            xTilePosition++;
            currentTile++;
        }
    }
}


drawTile = function(currentTile, canvasX, canvasY) {

    var imageWidth = 80;
    var imgId = mapArray[currentTile];
    var imgRow = 0;
    var imgColumn = 0;
    imgRow = parseInt(imgId / imageWidth, 10);

    if ((imgId % imageWidth) == 0) {
        imgColumn = imageWidth;
    } else {
        imgColumn = imgId % imageWidth;
    }
    imgX = (imgColumn - 1) * pix32;
    imgY = imgRow * pix32;
    ctx2.drawImage(mapImage, imgX, imgY, pix32, pix32, canvasX, canvasY, pix32, pix32);
}