<!--//

function Player() {
  var z; // Territory ID

  var scalingFactor;
  var p;
  var _c; // coordination of the player

  this.init = function(userID, scale, shipType, bulletType, Z) {
    z = Z;
    scalingFactor = scale;
    // use 'this' to access this variable globally
    p = {
      userID: userID,
      v_x: 0,
      v_y: 0,
      a: 0, //actual angle
      da: 0, // delta angle
      s: 0,
      st: shipType,
      bt: bulletType
    };
    _c = {
      x: 0,
      y: 0
    };
  }

  // Get Events to send server in JSON
  this._getEventToJSON = function() {
    var s = p.s;
    p.s = 0; // Reset shoot
    return {
      type: 1,
      userID: p.userID,
      v_x: p.v_x,
      v_y: p.v_y,
      a: p.a,
      da: p.da,
      s: s
    };
  }

  // Get create a player (JSON) : only for testing
  this._getCreatePlayerToJSON = function() {
    return {
      type: 30,
      userID: p.userID,
      v_x: p.v_x,
      v_y: p.v_y,
      a: p.a,
      da: p.da,
      s: p.s,
      x: _c.x,
      y: _c.y,
      w: aoihandler[z]._getAOI().aoi_w,
      h: aoihandler[z]._getAOI().aoi_h,
      x_vp: aoihandler[z]._getVirtualPoint().x_vp,
      y_vp: aoihandler[z]._getVirtualPoint().y_vp,
      v_x: p.v_x,
      v_y: p.v_y,
      a: p.a,
      s: 0,
      st: p.st,
      bt: p.bt
    };
  }

  // Get create a dummy player (JSON) : only for testing
  this._getDummyPlayerToJSON = function() {
    return {
      type: 31,
      userID: p.userID,
      w: aoihandler[z]._getAOI().aoi_w,
      h: aoihandler[z]._getAOI().aoi_h,
      x_vp: aoihandler[z]._getVirtualPoint().x_vp,
      y_vp: aoihandler[z]._getVirtualPoint().y_vp
    };
  }

  this.getUserID = function() {
    return p.userID;
  }
  this.setAngle = function(angle) {
    p.a = angle;
  }
  // Set Velocity Event x direction
  // +1 for go right ; -1 for go left
  this.setV_x = function(v_x) {
    if (p.v_y != 0) {
      p.v_x = (v_x > 0) ? .7 : -.7;
      p.v_y = (p.v_y > 0) ? .7 : -.7;
      if (p.da == 0) {
        p.a = calAngle.apply(this);
      }
    } else {
      p.v_x = (v_x > 0) ? .9 : -.9;
      p.a = (v_x > 0) ? 0 : 180;
    }
  }
  // Set Velocity Event y direction
  this.setV_y = function(v_y) {
    if (p.v_x != 0) {
      p.v_y = (v_y > 0) ? .7 : -.7;
      p.v_x = (p.v_x > 0) ? .7 : -.7;
      if (p.da == 0) {
        p.a = calAngle.apply(this);
      }
    } else {
      p.v_y = (v_y > 0) ? .9 : -.9;
      p.a = (v_y > 0) ? 90 : 270;
    }
  }

  function calAngle() {
    /*Return angle (only diagonal directions) according to velocity direction*/
    return (p.v_x > 0) ? ((p.v_y > 0) ? 45 : 315) : ((p.v_y > 0) ? 135 : 225);
  }
  // Reset Velocity x direction
  this.resetV_x = function() {
    if (p.v_y != 0) {
      p.v_y = (p.v_y > 0) ? .9 : -.9;
      if (p.da == 0) {
        p.a = (p.v_y > 0) ? 90 : 270;
      }
    }
    p.v_x = 0;
  }
  // Reset Velocity y direction
  this.resetV_y = function() {
    if (p.v_x != 0) {
      p.v_x = (p.v_x > 0) ? .9 : -.9;
      if (p.da == 0) {
        p.a = (p.v_x > 0) ? 0 : 180;
      }
    }
    p.v_y = 0;
  }

  // Rotate left
  this.rotateR = function() {
    p.da = 1;
  }
  // Rotate right
  this.rotateL = function() {
    p.da = -1;
  }
  // Reset rotate left
  this.resetRotate = function() {
    p.da = 0;
  }

  // Shoot
  this.shoot = function() {
    p.s = 1;
  }
  // Set player coordination
  this._setCoordination = function(x, y) {
    _c.x = x;
    _c.y = y;
  }
  // Only for test
  this.setCoordination = function(x, y) {
    _c.x = x / scalingFactor;
    _c.y = y / scalingFactor;
  }
  this._getX = function() {
    return _c.x;
  }
  this._getY = function() {
    return _c.y;
  }
  this.getX = function() {
    return _c.x * scalingFactor;
  }
  this.getY = function() {
    return _c.y * scalingFactor;
  }
}
//-->