var D = true; // debug
var TAG = 'WSHandler : '

var wsList = new Array(10);
/* this structure was built using 1.1 method in tutorial
http://www.phpied.com/3-ways-to-define-a-javascript-class/ */

function WebSocketHandler(hostAddress, wsIndex) {
  var ws = null;
  // The assigned index in the ws array
  var wsIndex = wsIndex;
  var hostAddress = hostAddress;

  // Get the websocket
  this.getWS = function() {
    return ws;
  };
  // Get host address | Data Encapsulation
  this.getHostAddress = function() {
    console.log('Get host address ' + hostAddress);
    return hostAddress;
  }
  // Get the ws Index | Data encapsulation
  this.getWSIndex = function() {
    return wsIndex;
  }
  /*
   * Get the state of websocket CONNECTING 0 The connection is not yet open.
   * OPEN 1 The connection is open and ready to communicate. CLOSING 2 The
   * connection is in the process of closing. CLOSED 3 The connection is
   * closed or couldn't be opened.
   */
  // Get the state of websocket
  this.isReady = function() {
    return ws.readyState;
  };
  // close the websocket
  this.close = function(index) {
    if (index == wsIndex && ws.readyState <= ws.OPEN && primaryCon != index) { // if ws is connecting or opened
      ws.close();
      return true;
    } else {
      return false;
    }
  };
  // send data to server [should only allow to primary connection]
  this.send = function(data) {
    if (ws.readyState == ws.OPEN) {
      ws.send(data);
    } else {
      console.log("ws isn't ready or open");
    }
  }
  // Connecting to server and functions for handle server messages
  this.connect = function() {
    console.log('call connect ... ' + wsIndex + ' ' + hostAddress);
    var hostProtocol;

    // if (window.location.protocol == 'http:') {
    hostProtocol = 'ws://';
    // } else {
    // hostProtocol = 'wss://';
    // }
    var hostURL = hostProtocol + hostAddress;
    console.log(hostAddress);
    /* Open a websocket which will depend on browser */
    if ('MozWebSocket' in window) {
      ws = new MozWebSocket(hostURL);
    } else if ('WebSocket' in window) {
      ws = new WebSocket(hostURL);
    } else {
      alert('Your browser does not support WebSockets');
    }

    ws.onopen = function() {
      console.log(TAG + 'Connection opened ' + hostURL);
      aoihandler.setConnectedHost(hostURL); // added to already connected queue

      // set the primaryconnection after ws setup
      if (nextPrimaryCon >= 0) {
        if (wsList[nextPrimaryCon].isReady() == 1) {
          // Reset player's events on current server
          // Change previous player to Dummy player
          wsList[primaryCon].send(JSON.stringify({
            type: 4,
            userID: player.userID,
            x: player.x,
            y: player.y,
            x_v: aoihandler.getVirtualPoint().x_v,
            x_y: aoihandler.getVirtualPoint().y_v,
            a: 0,
            v_x: 0,
            v_y: 0,
            v_a: 0,
            s: 0
          }));
          // swap connections
          prevPrimarycon = primaryCon;
          primaryCon = nextPrimaryCon;
          nextPrimaryCon = -1;
          console.log('Open & Set primary as ' + prevPrimarycon + ' << primary:' + primaryCon + ' << ' + nextPrimaryCon);
        }
        wsList[primaryCon].send(JSON.stringify(player));
      }
      /* if this is not the primary connection then 
       * this will create a dummy player for get update
       */

      wsList[wsIndex].send(JSON.stringify(player));
      /*
       * if(secondryCon != null){
       * wsList[secondryCon].getWS().send(JSON.stringify(passPlayer));
       * swapConnecations(); }
       */
      console.log("Connection opened");
      // Set AOI in server
      //playeraoi.userID = player.userID;
      wsList[wsIndex].send(JSON.stringify(aoihandler.getAOIToJSON()));
      wsList[wsIndex].send(JSON.stringify(aoihandler.getVirtualPointToJSON()));
    };
    ws.onmessage = function(event) {
      var data = JSON.parse(event.data);
      // Can be replace by map
      gEngine.clear();
      for (var index in data) {
        var inPlayer = data[index];

        switch (inPlayer.type) {
          case 1: // update client graphichs
            //if(D) console.log('Case 1');
            //console.log(TAG + 'case1: '); 
            if (player.userID == inPlayer.userID) {
              player.x = inPlayer.dx;
              player.y = inPlayer.dy;
              player.a = inPlayer.da;
              var life = inPlayer.health + '%';
              var score = inPlayer.score;
              $("#life_progress").css({
                "width": life
              })
              $("#score").text(score);

              if (wsIndex == primaryCon) { // if it's the primary connection
                // check whether play is inside the virual box. If not, set virtual point as user current location
                if (!aoihandler.isInVBox(inPlayer.dx, inPlayer.dy)) {
                  console.log(TAG + 'player is outside of the virtual box');
                  //console.log(TAG + 'case1: '); console.log(inPlayer);
                  aoihandler.setVirtualPoint(inPlayer.dx, inPlayer.dy);
                  wsList[wsIndex].send(JSON.stringify(aoihandler.getVirtualPointToJSON(player.userID)));
                  mapLoader.drawMap(inPlayer.x, inPlayer.y);
                }

                // Idea : control the AOI in client side. By uncommenting this, enable the "filfill the AOI" in client-side
                var want = aoihandler.isFulfillAOI(inPlayer.dx, inPlayer.dy);
                // console.log('want data ' + want);
                _.map(want, function(val, k) {
                  console.log(TAG + 'want area ' + val.x + ' : ' + val.y);
                  // Ask for AOI
                  wsList[wsIndex].send(JSON.stringify({
                    type: 2,
                    userID: player.userID,
                    x: val.x,
                    y: val.y
                  }));
                });
              } else {
                /* Other web sockets, set their virtual point as primary connection */
              }

            }
            drawRotatedImage(ship, inPlayer);
            // addPlayerToGraphicEngine(inPlayer);

            // gEngine.clear();
            // gEngine.processObjects();
            break;

          case 2:
            /* connect to another server (make it as primary connection)
             */
            statusUpdate = false; // Y?
            var info = JSON.parse(inPlayer.info);
            console.log('Type 2 msg. ' + info.url);
            player.x = info.positionX;
            player.y = info.positionY;
            passPlayer.type = inPlayer.type;
            passPlayer.userID = inPlayer.userID;
            passPlayer.info = inPlayer.info;
            passPlayer.signedInfo = inPlayer.signedInfo;
            // alert(JSON.stringify(passPlayer));
            var i = 0;
            do { // search from begining of list is there any available slot
              console.log(i, wsList);
              if (wsList[i] == undefined) { // if ws isn't initialized
                passConnect(info.url, i);
                break;
              } else if (wsList[i].hostAddress == info.url && wsList[i].isReady() == 1) {
                /*
                 * if a websocket is opening for this address ignore connecting again
                 */
                wsList[primaryCon].send(JSON.stringify({
                  type: 4,
                  userID: player.userID,
                  x: player.x,
                  y: player.y,
                  x_v: aoihandler.getVirtualPoint().x_v,
                  y_v: aoihandler.getVirtualPoint().y_v,
                  a: 0,
                  v_x: 0,
                  v_y: 0,
                  v_a: 0,
                  s: 0
                }));
                // swap primary Connection
                prevPrimarycon = primaryCon;
                primaryCon = i;
                console.log('Set primary connections as ' + prevPrimarycon + ' << primary:' + primaryCon + ' <<' + nextPrimaryCon);

                wsList[primaryCon].send(JSON.stringify(player));
                wsList[primaryCon].send(JSON.stringify(aoihandler.getAOIToJSON()));
                break;
              } else if (wsList[i].isReady() == 3) { // if previous ws is
                // closed
                passConnect(info.url, i);
                break;
              }
              i++;
            } while (i < 10);
            break;

          case 3:
            /* connecting to another server and get updates in order to fulfill AOI */
            var info = JSON.parse(inPlayer.info);
            console.log('Type 3 msg. ' + info.url + ' details of the server which need to get updates to fulfill AOI');

            if (!aoihandler.isAlreadyConnect(info.url)) { // If there is not connected
              var i = 0;
              do { // search from begining of list is there any available slot
                // console.log('Times ' + i + wsList[i].hostAddress);
                if (wsList[i] == undefined) { // if ws isn't initialized
                  reconnect(info.url, i);
                  break;
                } else if (wsList[i].getHostAddress() == info.url && wsList[i].isReady() == 1) {
                  /* 
                    if a websocket is opening for this address ignore connecting again
                 */
                  break;
                } else if (wsList[i].isReady() == 3) { // if previous ws is
                  // closed
                  reconnect(info.url, i);
                  break;
                }
                i++;
              } while (i < 10);
              break;
            }

          case 4:
            /* close a existing connection */
            break;

          case 5:
            console.log("Bullet event");
            drawRotatedImage(bullet, inPlayer);
            break;

          case 10:
            /* set virtual point absolute location of client on the map (sync data) */
            console.log(TAG + 'case 10: ');
            console.log(inPlayer);
            // aoihandler.setVirtualPoint(inPlayer.x, inPlayer.y); // Set new virtual point
            // mapLoader.drawMap(inPlayer.x, inPlayer.y);

            player.x = inPlayer.x;
            player.y = inPlayer.y;
            break;

          case 11:
            /* set size of the tiles */
            console.log(TAG + 'Type:' + inPlayer.type + ' Set tile size of server');
            aoihandler.addTiles(wsIndex, hostAddress, JSON.parse(inPlayer.tiles));
            break;

          default:
            console.log("Warning. Unsupported message type " + inPlayer.type);
        }
      }
    };
    ws.onclose = function() {
      console.log('Connection closed ' + hostURL);
    };
    ws.onerror = function(event) {
      console.log('Connection error ' + hostURL);
    };
  };
}

// Make connection to new server as primary, send event requests

function passConnect(host, num) {
  console.log('Create new primary connection to ' + host + ' with ' + num);
  wsList[num] = new WebSocketHandler(host, num);
  wsList[num].connect();
  if (wsList[num].isReady == 1) { // if connection was created
    /*
     * Closing privious primary connection mayn't a good idea, coz player
     * doesn't quite from that location immediately
     */
    primaryCon = num; // make this primary connection
    console.log(num + ' is already & make primaryCon');
  } else {
    nextPrimaryCon = num;
    console.log('Make ' + num + 'as  next primaryCon');
  }
}
// Connecting to another server

function reconnect(host, num) {
  console.log('Reconnect to ' + host + ' with ' + num);
  wsList[num] = new WebSocketHandler(host, num);
  wsList[num].connect();
}

// -->