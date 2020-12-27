
function BuildableCell(buildible, roomobj){
    this.build = buildible;
    this.room = roomobj;
    this.reserved = false;
    this.pos = function() {return this.room;};
    this.canBuild = function() {return this.build};
    this.isReserved = function() {return this.reserved};

};

function getSquare(roomTer, x, y) {
    if (roomTer.get(x-1,y-1) === 1 ||
        roomTer.get(x-1, y) === 1 ||
        roomTer.get(x-1, y+1) === 1 ||
        roomTer.get(x,y-1) === 1 ||
        roomTer.get(x, y) === 1 ||
        roomTer.get(x, y+1) === 1 ||
        roomTer.get(x+1,y-1) === 1 ||
        roomTer.get(x+1, y) === 1 ||
        roomTer.get(x+1, y+1) === 1){

        return false;
    }
    else {
        return true;
    }

};


function getLower(first, second){
    let work = first;
    if (work < second) {
        return work;
    }
    return second;
}

function getHigher(first, second){
    let work = first;
    if (work > second) {
        return work;
    }
    return second;
}


Room.prototype.planner = function(){

    var visualOverlay = []


    // Make sure there is a Spawn to work off of.
    if (baseSpawn == undefined){
        if (this.find(FIND_MY_SPAWNS).length == 0){
            console.log("I shouldn't be here yet!");
            // Function call for the find my spawn function
        } else {
            this.memory.primeSpawn = this.find(FIND_MY_SPAWNS)[0].id;
        }
    }
    // Grab Spawn Object.
    var baseSpawn = Game.getObjectById(this.memory.primeSpawn);



    // Based on spawn location what is the lowest X and Y value for building 3x3 squares
    var lowX = baseSpawn.pos.x % 3;
    var lowY = baseSpawn.pos.y % 3;

    // Init empty array to use for finding buildable locations
    var buildMatrix = [];

    //  Error Check if low is too low, move over or up a bit
    if (lowX === 0) {
        lowX = 3;
    }
    if (lowY === 0) {
        lowY = 3;
    }

    // Pull Static Terrain Map
    const baseRoom = this.getTerrain();

    // Run though map tiles, build matrix based on 3x3 grid, any wall prevents building in that segement
    for (y = lowY; y < 49; y = y +3){
        let buildRow = [];
        for (x = lowX; x < 49; x = x +3) {

            buildRow.push(new BuildableCell(getSquare(baseRoom,x,y),new RoomPosition(x,y,this.name)));

        }
        buildMatrix.push(buildRow);
    }

    // Start Reserving BuildRoom / Plan room layout.

    // ************************ //
    // Start of Storage Reservation
    // ************************ //

    // Init vars for Storage
    var numOfSources = this.memory.roomSources;
    var storageCords = undefined;
    var terminalCords = undefined;
    var towerCords = [undefined, undefined];
    var labCords = [undefined, undefined];
    var factoryCords = undefined;
    var nukeCords = undefined;
    var spawnsCords = [undefined, undefined];
    var lowestX = 50;
    var lowestY = 50;
    var highX = 0;
    var highY = 0;


    // block out the spawns Location
    buildMatrix[_.floor(baseSpawn.pos.y/3)][_.floor(baseSpawn.pos.x/3)].reserved = true;

    // Next Up Place Storage.
    // Placing next to spawn... (current method next to spawn Ideally cloest to spawn points.)
    // Find Averaged location of sources to determine storage direction off base (currently set to 1 tile space between)
    var sAvgX = 0;
    var sAvgY = 0;
    for (let source of numOfSources){
        sAvgX = source.pos.x + sAvgX;
        sAvgY = source.pos.y + sAvgY;
    }
    sAvgX = sAvgX / numOfSources.length;
    sAvgY = sAvgY / numOfSources.length;

    var storageTestX = baseSpawn.pos.x;
    if (baseSpawn.pos.x < sAvgX){
        storageTestX = storageTestX + 6;
    } else if (baseSpawn.pos.x > sAvgX){
        storageTestX = storageTestX - 6;
    }

    var storageTestY = baseSpawn.pos.y;
    if (baseSpawn.pos.y < sAvgY){
        storageTestY = storageTestY + 6;
    } else if (baseSpawn.pos.y > sAvgY){
        storageTestY = storageTestY - 6;
    }

    var tgtX = _.floor(storageTestX / 3);
    var tgtY = _.floor(storageTestY / 3);



    // Test the Location to see if we can build there.  If not start looking in next closest area
    if (buildMatrix[tgtY][tgtX].canBuild() == true && buildMatrix[tgtY][tgtX].isReserved() == false){
        storageCords = new RoomPosition(buildMatrix[tgtY][tgtX].pos().x,buildMatrix[tgtY][tgtX].pos().y, this.name);
        buildMatrix[tgtY][tgtX].reserved = true;
        visualOverlay.push({txt: 'S', pos: buildMatrix[tgtY][tgtX].pos(), color: 'blue'});

    } else {
        let passCount = 1;
        while (storageCords == undefined){
            for (c = tgtX - passCount; c <= tgtX + passCount ; c ++){
                for (r = tgtY - passCount ; r <= tgtY + passCount ; r ++){
                    if (buildMatrix[r][c].canBuild() == true && buildMatrix[r][c].isReserved() == false) {
                        storageCords = new RoomPosition(buildMatrix[r][c].pos().x,buildMatrix[r][c].pos().y, this.name);
                        buildMatrix[r][c].reserved = true;
                        visualOverlay.push({txt: 'S', pos: buildMatrix[r][c].pos(), color: 'blue'});
                        break;
                    }
                }
                if(storageCords != undefined){
                    break;
                }
            }
            passCount++;
        }
    }

    // Get bounds
    lowestX = getLower(lowestX, storageCords.x);
    lowestY = getLower(lowestY, storageCords.y);
    highX = getHigher(highX, storageCords.x);
    highY = getHigher(highY, storageCords.y);

    // Pass storage build location to memory.
    // this.memory.bldStorage = storageCords;


    // Paths to Spawn
    for (let source of numOfSources){

       let path = this.findPath(baseSpawn.pos, source.pos, {ignoreCreeps: true});
       for (let road of path){
           new RoomVisual(this.name).text('R', road.x, road.y, {color: 'green', font: 0.8});

           let convertX = _.floor(((road.x) / 3));
           let convertY= _.floor(((road.y) / 3));
           // convert to BuildMatrix


           if (buildMatrix[convertY][convertX].isReserved){
               if ((buildMatrix[convertY][convertX].room.x == road.x || buildMatrix[convertY][convertX].room.x +1 == road.x
                   || buildMatrix[convertY][convertX].room.x -1 == road.x ) && (buildMatrix[convertY][convertX].room.y == road.y
                   || buildMatrix[convertY][convertX].room.y +1 == road.y
                   || buildMatrix[convertY][convertX].room.y -1 == road.y )){

                   buildMatrix[convertY][convertX].reserved = true;
                   visualOverlay.push({txt: 'Z', pos: buildMatrix[convertY][convertX].pos(),color: 'red'});
               }
           }

       }
    }


    // Road from Spawn to Controller
    let path = this.findPath(baseSpawn.pos, this.controller.pos, {ignoreCreeps: true});
    for (let road of path){
       new RoomVisual(this.name).text('R', road.x, road.y, {color: 'green', font: 0.8});

       let convertX = _.floor(((road.x) / 3));
       let convertY= _.floor(((road.y) / 3));
       // convert to BuildMatrix

       if (buildMatrix[convertY][convertX].isReserved){
           if ((buildMatrix[convertY][convertX].room.x == road.x || buildMatrix[convertY][convertX].room.x +1 == road.x
               || buildMatrix[convertY][convertX].room.x -1 == road.x ) && (buildMatrix[convertY][convertX].room.y == road.y
               || buildMatrix[convertY][convertX].room.y +1 == road.y
               || buildMatrix[convertY][convertX].room.y -1 == road.y )){

               buildMatrix[convertY][convertX].reserved = true;
               visualOverlay.push({txt: 'Z', pos: buildMatrix[convertY][convertX].pos(), color: 'red'});
           }
       }

    }

    // Terminal next to storage, Away from sources / avoiding bottleneck. with logi trucks.
    var terminalTestX = storageCords.x;


    if (storageCords.x < sAvgX){
        terminalTestX = terminalTestX - 3;
    } else if (storageCords.x > sAvgX){
        terminalTestX = terminalTestX + 3;
    }

    var terminalTestY = storageCords.y;
    if (storageCords.y < sAvgY){
        terminalTestY = terminalTestY - 3;
    } else if (storageCords.y > sAvgY){
        terminalTestY = terminalTestY + 3;
    }

    tgtX = _.floor(terminalTestX / 3);
    tgtY = _.floor(terminalTestY / 3);


    // Test the Location to see if we can build there.  If not start looking in next closest area


    if (buildMatrix[tgtY][tgtX].canBuild() == true && buildMatrix[tgtY][tgtX].isReserved() == false){
        terminalCords = new RoomPosition(buildMatrix[tgtY][tgtX].pos().x,buildMatrix[tgtY][tgtX].pos().y, this.name);
        buildMatrix[tgtY][tgtX].reserved = true;
        visualOverlay.push({txt: 'T', pos: buildMatrix[tgtY][tgtX].pos(), color: 'white'});

    } else {
        // If desired spot is not possible, search around Storage center point.
        tgtX = _.floor(storageTestX / 3);
        tgtY = _.floor(storageTestY / 3);
        let passCount = 0;
        while (terminalCords == undefined){
            for (c = tgtX - passCount; c <= tgtX + passCount ; c ++){
                for (r = tgtY - passCount ; r <= tgtY + passCount ; r ++){
                    if (buildMatrix[r][c].canBuild() == true && buildMatrix[r][c].isReserved() == false) {
                        terminalCords = new RoomPosition(buildMatrix[r][c].pos().x,buildMatrix[r][c].pos().y, this.name);
                        buildMatrix[r][c].reserved = true;
                        visualOverlay.push({txt: 'T', pos: buildMatrix[r][c].pos(), color: 'white'});
                        break;
                    }
                }
                if(terminalCords != undefined){
                    break;
                }
            }
            passCount++;
        }
    }

    // Get bounds
    lowestX = getLower(lowestX, terminalCords.x);
    lowestY = getLower(lowestY, terminalCords.y);
    highX = getHigher(highX, terminalCords.x);
    highY = getHigher(highY, terminalCords.y);


    // Pass terminalCords to Memory.
    // this.memory.bldTerminal = terminalCords;

    // Tower Rooms (currently setting them up around Terminal
    // Defining Variables for future tweaking for position.
    var towerTestX = terminalCords.x;
    var towerTestY = terminalCords.y;

    tgtX = _.floor(towerTestX / 3);
    tgtY = _.floor(towerTestY / 3);

    for (x = 0; x < 2; x++) {
        if (buildMatrix[tgtY][tgtX].canBuild() == true && buildMatrix[tgtY][tgtX].isReserved() == false) {
            towerCords[x] = new RoomPosition(buildMatrix[tgtY][tgtX].pos().x, buildMatrix[tgtY][tgtX].pos().y, this.name);
            buildMatrix[tgtY][tgtX].reserved = true;
            visualOverlay.push({txt: x, pos: buildMatrix[tgtY][tgtX].pos(), color: 'orange'});

            // Get bounds
            lowestX = getLower(lowestX, towerCords[x].x);
            lowestY = getLower(lowestY, towerCords[x].y);
            highX = getHigher(highX, towerCords[x].x);
            highY = getHigher(highY, towerCords[x].y);

        } else {
            // Required if we modify the targeting to keep centered around desired target (May not really need)
            //tgtX = _.floor(terminalTestX / 3);
            //tgtY = _.floor(terminalTestY / 3);
            let passCount = 1;
            while (towerCords[x] == undefined) {
                for (c = tgtX - passCount; c <= tgtX + passCount; c++) {
                    for (r = tgtY - passCount; r <= tgtY + passCount; r++) {
                        if (buildMatrix[r][c].canBuild() == true && buildMatrix[r][c].isReserved() == false) {
                            towerCords[x] = new RoomPosition(buildMatrix[r][c].pos().x, buildMatrix[r][c].pos().y, this.name);
                            buildMatrix[r][c].reserved = true;
                            visualOverlay.push({txt: x, pos: buildMatrix[r][c].pos(), color: 'orange'});

                            // Get bounds
                            lowestX = getLower(lowestX, towerCords[x].x);
                            lowestY = getLower(lowestY, towerCords[x].y);
                            highX = getHigher(highX, towerCords[x].x);
                            highY = getHigher(highY, towerCords[x].y);

                            break;
                        }
                    }
                    if (towerCords[x] != undefined) {
                        break;
                    }
                }
                passCount++;
            }
        }
    }

    // Pass towerCords to Memory.
    // this.memory.bldTower = towerCords;

    // Lab Rooms
    // Placement alongside spawn (due to boosting.)  Right now just fit in the space
    // Needs smarter placement after working with them more..
    var labTestX = baseSpawn.pos.x;
    var labTestY = baseSpawn.pos.y;

    // No adjustments ( left incase of desired change in future
    /*
    if (storageCords.x > labTestX){
        labTestX = labTestX - 3;
    } else if (storageCords.x < labTestX){
        labTestX = labTestX + 3;
    }
    if (storageCords.y > labTestY){
        labTestY = labTestY - 3;
    } else if (storageCords.y < labTestY){
        labTestX = labTestY + 3;
    }
     */

    tgtX = _.floor(labTestX / 3);
    tgtY = _.floor(labTestY / 3);

    for (x = 0; x < 2; x++) {
        if (buildMatrix[tgtY][tgtX].canBuild() == true && buildMatrix[tgtY][tgtX].isReserved() == false) {
            labCords[x] = new RoomPosition(buildMatrix[tgtY][tgtX].pos().x, buildMatrix[tgtY][tgtX].pos().y, this.name);
            buildMatrix[tgtY][tgtX].reserved = true;
            visualOverlay.push({txt: 'L', pos: buildMatrix[tgtY][tgtX].pos(), color: 'yellow'});

            // Get bounds
            lowestX = getLower(lowestX, labCords[x].x);
            lowestY = getLower(lowestY, labCords[x].y);
            highX = getHigher(highX, labCords[x].x);
            highY = getHigher(highY, labCords[x].y);

        } else {
            // Required if we modify the targeting to keep centered around desired target (May not really need)
            //tgtX = _.floor(terminalTestX / 3);
            //tgtY = _.floor(terminalTestY / 3);
            let passCount = 1;
            while (labCords[x] == undefined) {
                for (c = tgtX - passCount; c <= tgtX + passCount; c++) {
                    for (r = tgtY - passCount; r <= tgtY + passCount; r++) {
                        if (buildMatrix[r][c].canBuild() == true && buildMatrix[r][c].isReserved() == false) {
                            labCords[x] = new RoomPosition(buildMatrix[r][c].pos().x, buildMatrix[r][c].pos().y, this.name);
                            buildMatrix[r][c].reserved = true;
                            visualOverlay.push({txt: 'L', pos: buildMatrix[r][c].pos(), color: 'yellow'});

                            // Get bounds
                            lowestX = getLower(lowestX, labCords[x].x);
                            lowestY = getLower(lowestY, labCords[x].y);
                            highX = getHigher(highX, labCords[x].x);
                            highY = getHigher(highY, labCords[x].y);

                            break;
                        }
                    }
                    if (labCords[x] != undefined) {
                        break;
                    }
                }
                passCount++;
            }
        }
    }

    // Aassign to memory
    // this.memory.bldLab = labCords;


    // Factory -  Center on terminal
    var factoryTestX = terminalCords.x;
    var factoryTestY = terminalCords.y;

    tgtX = _.floor(factoryTestX / 3);
    tgtY = _.floor(factoryTestY / 3);


    // Test the Location to see if we can build there.  If not start looking in next closest area


    if (buildMatrix[tgtY][tgtX].canBuild() == true && buildMatrix[tgtY][tgtX].isReserved() == false){
        factoryCords = new RoomPosition(buildMatrix[tgtY][tgtX].pos().x,buildMatrix[tgtY][tgtX].pos().y, this.name);
        buildMatrix[tgtY][tgtX].reserved = true;
        visualOverlay.push({txt: 'F', pos: buildMatrix[tgtY][tgtX].pos(), color: 'white'});

    } else {
        // If desired spot is not possible, search around Storage center point.
        tgtX = _.floor(storageCords.x / 3);
        tgtY = _.floor(storageCords.y / 3);
        let passCount = 0;
        while (factoryCords == undefined){
            for (c = tgtX - passCount; c <= tgtX + passCount ; c ++){
                for (r = tgtY - passCount ; r <= tgtY + passCount ; r ++){
                    if (buildMatrix[r][c].canBuild() == true && buildMatrix[r][c].isReserved() == false) {
                        factoryCords = new RoomPosition(buildMatrix[r][c].pos().x,buildMatrix[r][c].pos().y, this.name);
                        buildMatrix[r][c].reserved = true;
                        visualOverlay.push({txt: 'F', pos: buildMatrix[r][c].pos(), color: 'white'});
                        break;
                    }
                }
                if(factoryCords != undefined){
                    break;
                }
            }
            passCount++;
        }
    }

    // Get bounds
    lowestX = getLower(lowestX, factoryCords.x);
    lowestY = getLower(lowestY, factoryCords.y);
    highX = getHigher(highX, factoryCords.x);
    highY = getHigher(highY, factoryCords.y);

    // Aassign to memory
    // this.memory.bldFactory = factoryCords;


    // Observer + Nuke
    var nukeTestX = storageCords.x;
    var nukeTestY = storageCords.y;

    tgtX = _.floor(nukeTestX / 3);
    tgtY = _.floor(nukeTestY / 3);

    if (buildMatrix[tgtY][tgtX].canBuild() == true && buildMatrix[tgtY][tgtX].isReserved() == false){
        nukeCords = new RoomPosition(buildMatrix[tgtY][tgtX].pos().x,buildMatrix[tgtY][tgtX].pos().y, this.name);
        buildMatrix[tgtY][tgtX].reserved = true;
        visualOverlay.push({txt: 'N', pos: buildMatrix[tgtY][tgtX].pos(), color: 'black'});

    } else {
        // If desired spot is not possible, search around Storage center point.
        let passCount = 1;
        while (nukeCords == undefined){
            for (c = tgtX - passCount; c <= tgtX + passCount ; c ++){
                for (r = tgtY - passCount ; r <= tgtY + passCount ; r ++){
                    if (buildMatrix[r][c].canBuild() == true && buildMatrix[r][c].isReserved() == false) {
                        nukeCords = new RoomPosition(buildMatrix[r][c].pos().x,buildMatrix[r][c].pos().y, this.name);
                        buildMatrix[r][c].reserved = true;
                        visualOverlay.push({txt: 'N', pos: buildMatrix[r][c].pos(), color: 'black'});
                        break;
                    }
                }
                if(nukeCords != undefined){
                    break;
                }
            }
            passCount++;
        }
    }

    // Get bounds
    lowestX = getLower(lowestX, nukeCords.x);
    lowestY = getLower(lowestY, nukeCords.y);
    highX = getHigher(highX, nukeCords.x);
    highY = getHigher(highY, nukeCords.y);


    // Assign to memory
    // this.memory.bldNuke = nukeCords;





    // Extensions.
    // Claming room for extensions.
    var bldExtenCords = [];
    let numOfExtensions = 12;
    let offsetValue = 1;
    while (numOfExtensions >= 1) {
        for (c = (_.floor(baseSpawn.pos.y / 3)) - offsetValue; c <= (_.floor(baseSpawn.pos.y / 3)) + offsetValue ; c++){
            for (r = (_.floor(baseSpawn.pos.x / 3)) - offsetValue ; r <= (_.floor(baseSpawn.pos.x / 3)) + offsetValue ; r++){
                if (c < 0){
                    c= 0;
                }
                if (r < 0){
                    r = 0;
                }



                if (buildMatrix[c][r].canBuild() == true && buildMatrix[c][r].isReserved() == false) {
                    visualOverlay.push({txt: 'E', pos: buildMatrix[c][r].pos(), color: 'blue'});
                    bldExtenCords.push(new RoomPosition(buildMatrix[c][r].pos().x,buildMatrix[c][r].pos().y, this.name));
                    buildMatrix[c][r].reserved = true;
                    numOfExtensions--;

                    // Get bounds
                    lowestX = getLower(lowestX, buildMatrix[c][r].pos().x);
                    lowestY = getLower(lowestY, buildMatrix[c][r].pos().y);
                    highX = getHigher(highX, buildMatrix[c][r].pos().x);
                    highY = getHigher(highY, buildMatrix[c][r].pos().y);

                    if (numOfExtensions == 0) {
                        break;
                    }
                }

            }
            if (numOfExtensions == 0) {
                break;
            }
        }
        offsetValue++;
    }
    //console.log(bldExtenCords.length);
    //this.memory.extensionCords = bldExtenCords;

    // Additional Spawn Rooms
    // currently just center off of storage...
    var spawnsTestX = storageCords.x;
    var spawnsTestY = storageCords.y;

    tgtX = _.floor(spawnsTestX / 3);
    tgtY = _.floor(spawnsTestY / 3);

    for (x = 0; x < 2; x++) {
        let passCount = 1;
        while (spawnsCords[x] == undefined) {
            for (c = tgtX - passCount; c <= tgtX + passCount; c++) {
                for (r = tgtY - passCount; r <= tgtY + passCount; r++) {
                    if (buildMatrix[r][c].canBuild() == true && buildMatrix[r][c].isReserved() == false) {
                        spawnsCords[x] = new RoomPosition(buildMatrix[r][c].pos().x, buildMatrix[r][c].pos().y, this.name);
                        buildMatrix[r][c].reserved = true;
                        visualOverlay.push({txt: 'W', pos: buildMatrix[r][c].pos(), color: 'purple'});

                        // Get bounds
                        lowestX = getLower(lowestX, spawnsCords[x].x);
                        lowestY = getLower(lowestY, spawnsCords[x].y);
                        highX = getHigher(highX, spawnsCords[x].x);
                        highY = getHigher(highY, spawnsCords[x].y);

                        break;
                    }
                }
                if (spawnsCords[x] != undefined) {
                    break;
                }
            }
            passCount++;
        }
    }

    lowestX = lowestX - 3;
    lowestY = lowestY - 3;
    highX = highX + 3;
    highY = highY + 3;



    visualOverlay.push({txt: 'C', pos: {x:lowestX, y: lowestY}, color: 'white'});
    visualOverlay.push({txt: 'C', pos: {x:lowestX , y: highY}, color: 'white'});
    visualOverlay.push({txt: 'C', pos: {x:highX , y: lowestY}, color: 'white'});
    visualOverlay.push({txt: 'C', pos: {x:highX , y: highY}, color: 'white'});




    //Set memory
    // this.memory.bldSpawns = spawnsCords;


    var wallCords = [];

    for (let x = lowestX; x <= highX; x++){
        if (baseRoom.get(x, lowestY) != TERRAIN_MASK_WALL){
            visualOverlay.push({txt: 'W', pos: {x: x  , y: lowestY }, color: 'red'});
            wallCords.push({x: x, y: lowestY});
        }

        if (baseRoom.get(x, highY) != TERRAIN_MASK_WALL){
            visualOverlay.push({txt: 'W', pos: {x: x  , y: highY }, color: 'red'});
            wallCords.push({x: x, y: highY});
        }
    }

    for (let x = lowestY; x <= highY; x++){
        if (baseRoom.get(lowestX, x) != TERRAIN_MASK_WALL){
            visualOverlay.push({txt: 'W', pos: {x: lowestX  , y: x }, color: 'red'});
            wallCords.push({x: lowestX  , y: x});
        }

        if (baseRoom.get(highX, x) != TERRAIN_MASK_WALL){
            visualOverlay.push({txt: 'W', pos: {x: highX  , y: x }, color: 'red'});
            wallCords.push({x: highX  , y: x});
        }
    }






    for (let vis of visualOverlay) {

        new RoomVisual(this.name).text(vis.txt, vis.pos.x, vis.pos.y , {color: vis.color, font: 0.8});
    }


    // }

     //let path = this.findPath(baseSpawn.pos,)

    //new RoomVisual(this.name).text('S', storageCords, {color: 'green', font: 0.8});




    /*
    // Test the Location to see if we can build there.  If not start looking in next closest area
    if (buildMatrix[tgtY][tgtX].canBuild() == true && buildMatrix[tgtY][tgtX].isReserved() == false){
        storageCords = new RoomPosition(buildMatrix[tgtY][tgtX].pos().x,buildMatrix[tgtY][tgtX].pos().y, this.name);
        buildMatrix[tgtY][tgtX].reserved = true;

    } else {
        let passCount = 1;
        while (storageCords == undefined){
            for (c = tgtY - passCount; c <= tgtY + passCount ; c ++){
                for (r = tgtX - passCount ; r <= tgtX - passCount ; r ++){
                    if (buildMatrix[r][c].canBuild() == true && buildMatrix[r][c].isReserved() == false) {
                        storageCords = new RoomPosition(buildMatrix[r][c].pos().x,buildMatrix[r][c].pos().y, this.name);
                        buildMatrix[r][c].reserved = true;
                        break;
                    }
                }
            }
            passCount++;
        }
    }
    // Pass storage build location to memory.
    this.memory.bldStorage = storageCords;

    //Tower Rooms ( Right now 2 rooms ) Starting 1/2 way between Spawn & Storage
    var towerCords = []
    let towerX = _.floor(((storageCords.x + baseSpawn.pos.x) / 2)/ 3);
    let towerY = _.floor(((storageCords.y + baseSpawn.pos.y) / 2) /3);


    while (towerCords.length < 2){

        if (buildMatrix[towerY][towerX].canBuild() == true && buildMatrix[towerY][towerX].isReserved() == false){

            towerCords.push(this.getPositionAt(buildMatrix[towerY][towerX].pos().x,buildMatrix[towerY][towerX].pos().y));
            buildMatrix[towerY][towerX].reserved = true;

        } else {
            let passCount = 1;
            while (towerCords.length < 2){
                for (c = towerY - passCount; c <= towerY + passCount ; c ++){
                    for (r = towerX - passCount ; r <= towerX - passCount ; r ++){
                        if (buildMatrix[r][c].canBuild() == true && buildMatrix[r][c].isReserved() == false) {
                            towerCords.push(this.getPositionAt(buildMatrix[r][c].pos().x,buildMatrix[r][c].pos().y));
                            buildMatrix[r][c].reserved = true;
                            break;
                        }
                    }
                }
                passCount++;
            }
        }
    }

    this.memory.bldTower = towerCords;



    // ************************ //
    // Mark Container Locations //
    //    and save locations    //
    // ************************ //

    // Future to do,  remove lookForAt and utilize the build room, cut down on CPU usage.
    var bldContain = [];
    for (let source of numOfSources){
        let path = this.findPath(baseSpawn.pos, new RoomPosition( source.pos.x, source.pos.y, this.name), {ignoreCreeps: true});
        bldContain.push(new RoomPosition(path[path.length -2].x, path[path.length -2].y, this.name));
    }

    // array containing cords for container builds.
    this.memory.bldContain = bldContain;

    // Reserve locations for  containers
    for (container of bldContain) {
        buildMatrix[_.floor(container.y / 3)][_.floor(container.x / 3)].reserved = true;
    }



    /*for (let source of numOfSources){
        let path = this.findPath(this.getPositionAt(storageCords.x,storageCords.y), this.getPositionAt(source.pos.x, source.pos.y), {ignoreCreeps:true});
        for (let tile of path){
            buildMatrix[_.floor(tile.y / 3)][_.floor(tile.x / 3)].reserved = true;
            new RoomVisual(this.name).text('D', _.floor(tile.x / 3),_.floor(tile.y / 3) );
        }

    }/*

    // Make Reservations for pathing from Storage to Spawn, Storage to Controler, Storage to sources.


    // Make Reservations for rooms directly around spawns (may considering using this space for higher level stuff...
    // Removing this coded for now..
    /*
    var surroundRooms = [];
    for (c = (_.floor(this.pos.y / 3) - 1); c <= (_.floor(this.pos.y / 3) +1) ; c ++){
        for (r = (_.floor(this.pos.x / 3) - 1); r <= (_.floor(this.pos.x / 3) +1) ; r ++){
                buildMatrix[c][r].reserved = true;
                surroundRooms.push(buildMatrix[c][r]);
        }
    }
    this.room.memory.surRooms = surroundRooms; */
    /*

    // Claming room for extensions.
    var bldExtenCords = [];
    let numOfExtensions = 12;
    let offsetValue = 2;
    while (numOfExtensions >= 1) {
        for (c = (_.floor(baseSpawn.pos.y / 3)) - offsetValue; c <= (_.floor(baseSpawn.pos.y / 3)) + offsetValue ; c++){
            for (r = (_.floor(baseSpawn.pos.x / 3)) - offsetValue ; r <= (_.floor(baseSpawn.pos.x / 3)) + offsetValue ; r++){
                if (c < 0){
                    c= 0;
                }
                if (r < 0){
                    r = 0;
                }

                if (buildMatrix[c][r].canBuild() == true && buildMatrix[c][r].isReserved() == false) {
                    bldExtenCords.push(new RoomPosition(buildMatrix[c][r].pos().x,buildMatrix[c][r].pos().y, this.name));
                    buildMatrix[c][r].reserved = true;
                    numOfExtensions--;
                    if (numOfExtensions == 0) {
                        break;
                    }
                }

            }
            if (numOfExtensions == 0) {
                break;
            }
        }
        offsetValue++;
    }
    console.log(bldExtenCords.length);
    this.memory.extensionCords = bldExtenCords;


    var visualOverlay = []

    // Utilize Visual for testing
    for (c = 0 ; c < buildMatrix.length; c++){
        for (r = 0 ; r < buildMatrix[c].length; r++){
            if (buildMatrix[c][r].canBuild() == true && buildMatrix[c][r].isReserved() == false) {
                new RoomVisual(this.name).text("T", buildMatrix[c][r].pos(), {color: 'green', font: 0.8});
            } else if (buildMatrix[c][r].isReserved() == true) {
                new RoomVisual(this.name).text("R", buildMatrix[c][r].pos(), {color: 'blue', font: 0.8});
                visualOverlay.push(buildMatrix[c][r].pos());
            } else {
                new RoomVisual(this.name).text("F", buildMatrix[c][r].pos(), {color: 'red', font: 0.8});
            }
        }
    }

    new RoomVisual(this.name).text('S', storageCords, {color: 'green', font: 0.8});
    visualOverlay.push(storageCords);
    this.memory.overlay = visualOverlay;
    */
};