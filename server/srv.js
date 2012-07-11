var io = require('socket.io').listen(8080);

/**
 *  our users db
 *  
 *  @var array
 */
var users = [];


/**
 *  Error codes
 */
const ERR_DUPLICATE_CLIENT_NAME = 1;


/**
 *  Arrow keys
 *
 */
const ARROW_UP      = 1;
const ARROW_DOWN    = 2;
const ARROW_LEFT    = 3;
const ARROW_RIGHT   = 4;
    

io.sockets.on('connection', function (socket) {

    socket.on("setName", function(data){
        
        var isMatched = getSingleClient("clientName", data.name);
        
        if(isMatched){
        
            //send an error to client
            socket.emit("error", ERR_DUPLICATE_CLIENT_NAME);
        
        } else {
            
            //add user info to list
            var usrObj = new Object();
            usrObj.sessionId = socket.id;
            usrObj.clientName = data.name;
            usrObj.xPos = Math.random() * 100;
            usrObj.yPos = Math.random() * 100;
            usrObj.shouts = [];
            users.push(usrObj);

            //send user information
            socket.emit("userInfo", usrObj);

            //broadcast message to all users
            io.sockets.emit("users", populateUsers(["sessionId"]));
        }        
        
    });

    socket.on("changePos", function(posObj) {
        
        var user = getSingleClient("sessionId", socket.id);
        var userObj = user[0];
        
        switch(posObj.dir){
            case ARROW_UP:
                userObj.xPos += -posObj.val;
                break;
            case ARROW_DOWN:
                userObj.xPos += posObj.val;
                break;
            case ARROW_RIGHT:
                userObj.yPos += posObj.val;
                break;
            case ARROW_LEFT:
                userObj.yPos += -posObj.val;
                break;
        }
        
        users[user[1]] = userObj;
        userObj.arrowDir = posObj.dir;
        
        //broadcast message to all users
        io.sockets.emit("userChangePos", userObj);
        
    });

    socket.on("shout", function(shoutText) {
        var user = getSingleClient("sessionId", socket.id);
        var index = user[1];

        users[index].shouts.push(shoutText);

        io.sockets.emit("userShout", { text: shoutText, clientName: user[0].clientName });
    });

    socket.on('disconnect', function () {
        for( var i = 0, ulen = users.length; i < ulen; i++ ){
            var c = users[i];
            if(c.sessionId == socket.id){
                users.splice(i,1);
                break;
            }
        }
        
        //broadcast message to all users
        io.sockets.emit("users", populateUsers(["sessionId"]));
    });
    
    
});


/**
 * populate users list
 * 
 * @param exceptProp string
 * @return array  
 */

function populateUsers(exceptProp){
    var popList = [];
    for(var i = 0;i < users.length;i++){
        
        var uObj = new Object();
        
        for(var p in users[i]){
            if(exceptProp.indexOf(p) != -1){
                continue;
            }
            uObj[p] = users[i][p];
        }
        
        popList.push(uObj);
    }
    return popList;
}

/** 
 * check if aleady exists a client name
 * 
 * @param paramName string
 * @param paramValue string
 * @return object 
 */

function getSingleClient(paramName, paramValue){
    for(var i = 0;i < users.length;i++){
        if(users[i][paramName] == paramValue){
            return [users[i], i];
        }
    }
    
    return null;
}