function aoihandler() {
  var TAG = 'AOIHandler : '
  var tiles = new Array();
  var aoiCallTimeout = 30;
  var cntDown = aoiCallTimeout;

  var aoi = {
    aoi_w: 1000,
    aoi_h: 600
  };
  var tile = {
    //tileId: '',
    wsIndex: 0, // websocket index that holds this sub-tile
    host: '', // host address
    h: 0, // height of the sub-tile
    w: 0, // width of the sub-tiles
    x: 0, // origin x coordination
    y: 0 // origin y coordination
  };

  this.init = function() {
    this.aoi = {
      aoi_w: 0,
      aoi_h: 0
    };
    this.v_point = {
      x_v: 0,
      y_v: 0
    };
    // this.setVBoxSize(this.aoi.aoi_w, this.aoi.aoi_h);
  }
  // Check whether it is inside a subtile
  this.isSubTile = function(x, y) {
    var tile = _.find(tiles, function(val) {
      return (val.x <= x && x <= val.x + val.w && val.y <= y && y <= val.y + val.h) ? true : false;
    });
    if (tile != undefined) {
      return tile.wsIndex;
    } else {
      return -1;
    }
  }
  // Check whether current AIO is fulfill by server, otherwise send details about missing locations
  this.isFulfillAOI = function(x, y) {
    var unFil = new Array();
    // if already requested, send null output
    if (isAlreadyReq.apply(this)) {
      return unFil;
    } // else continue ...

    // check left down corner
    if (this.isSubTile(x - aoi.aoi_w / 2, y - aoi.aoi_h / 2) < 0) {
      unFil = _.union(unFil, (function() {
        return _.toArray(arguments);
      })({
        x: x - aoi.aoi_w / 2,
        y: y - aoi.aoi_h / 2
      }));
    }
    // check left upper corner
    if (this.isSubTile(x - aoi.aoi_w / 2, y + aoi.aoi_h / 2) < 0) {
      unFil = _.union(unFil, (function() {
        return _.toArray(arguments);
      })({
        x: x - aoi.aoi_w / 2,
        y: y + aoi.aoi_h / 2
      }));
    }
    // check right lower corner
    if (this.isSubTile(x + aoi.aoi_w / 2, y - aoi.aoi_h / 2) < 0) {
      unFil = _.union(unFil, (function() {
        return _.toArray(arguments);
      })({
        x: x + aoi.aoi_w / 2,
        y: y - aoi.aoi_h / 2
      }));
    }
    // check right upper corner
    if (this.isSubTile(x + aoi.aoi_w / 2, y + aoi.aoi_h / 2) < 0) {
      unFil = _.union(unFil, (function() {
        return _.toArray(arguments);
      })({
        x: x + aoi.aoi_w / 2,
        y: y + aoi.aoi_h / 2
      }));
    }
    // if array is empty, reset the timer
    if (_.isEmpty(unFil)) {
      cntDown = aoiCallTimeout
    }
    return unFil;
  }
  // Add set of new tiles
  this.addTiles = function(wsIndex, host, ts) {
    var newTiles = _.map(ts, function(num, key) {
      num.host = host;
      num.wsIndex = wsIndex;
      return num;
    });
    tiles = _.union(tiles, newTiles);
  }
  // Get tile details
  this.getTiles = function() {
    return tiles;
  }

  // Get AOI details
  this.getAOI = function() {
    return this.aoi;
  }
  // Get the AOI which can send to server
  this.getAOIToJSON = function(userID) {
    return {
      type: 3,
      userID: userID,
      w: this.aoi.aoi_w,
      h: this.aoi.aoi_h
    }
  }
  // Set AOI details
  this.setAOI = function(w, h) {
    this.aoi.aoi_w = w;
    this.aoi.aoi_h = h;
    console.log(TAG + ' set AOI w:' + aoi.aoi_w + ' h:' + aoi.aoi_h + ' call setVBoxSize ...');
    this.setVBoxSize(w, h);
  }

  // Remove set of tiles from the web socket
  this.removeTiles = function(wsIndex) {
    tiles = _.reject(tiles, function(val) {
      return val.wsIndex == wsIndex;
    });
  }
  // Set Timeout, if client already send request wait until process it

  function isAlreadyReq() {
    if (aoiCallTimeout == cntDown) {
      cntDown--;
      return false;
    } else if (cntDown == 0) {
      cntDown = aoiCallTimeout;
    } else {
      cntDown--;
    }
    return true;
  }

  /***********************************************************************************
    === Virtual point handling operation ===
    The concept of set the player view in client side such that player can move
    inside a virtual box of the screen without changing the background envirnment.
    When player want to move out of that virtual box, whole background slides
    towards moving direction. This is method is using instead of center view. #gihan
   ***********************************************************************************/
  var v_point = {
    x_v: 0, // x location of virtual point
    y_v: 0 // y location of virtual point
  };

  /* The gap fraction between left side of screen edge
  and virtual box edge vise versa */
  var fraction_x = 0.2;
  /* The gap fraction between left side of screen edge
  and virtual box edge vise versa */
  var fraction_y = 0.2;

  /*width of vertual box*/
  var vbox_hw = 0; // virtual box half width
  var vbox_hh = 0; // virtual box half height

  // set virtual box size
  // parameters w : width of screen
  // h : height of screen
  this.setVBoxSize = function(w, h) {
    vbox_hw = w / 2 - w * 0.2;
    vbox_hh = h / 2 - h * 0.2;
    console.log(TAG + ' vbox w:' + vbox_hw + ' h:' + vbox_hh);
  }
  // Get virtual box size
  this.getVBoxSize = function() {
    return {
      vhw: vbox_hw,
      vhh: vbox_hh
    }
  }
  // check whether player is inside vbox
  // parameter x : player current x coordinate
  // y : player current y coordicate
  this.isInVBox = function(x, y) {
    if ((this.v_point.x_v - vbox_hw) <= x && x <= (this.v_point.x_v + vbox_hw) &&
      (this.v_point.y_v - vbox_hh) <= y && y <= (this.v_point.y_v + vbox_hh)) {
      return true;
    } else {
      return false;
    }
  }

  // Set Virtual point location
  this.setVirtualPoint = function(x_v, y_v) {
    this.v_point.x_v = x_v;
    this.v_point.y_v = y_v;
    console.log(TAG + 'set virtual point x_v:' + x_v + ' y_v:' + y_v);
  }
  // Get Virtual point location
  this.getVirtualPoint = function() {
    return this.v_point;
  }
  // Get Virtual point which can send to server
  this.getVirtualPointToJSON = function(userID) {
    return {
      type: 5,
      userID: userID,
      x_v: this.v_point.x_v,
      y_v: this.v_point.y_v
    }
  }

};
// -->