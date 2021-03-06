require ('roomPlanner');
var roleTypes = ['miner', 'upgrade', 'build', 'repair', 'logi', 'harvest', 'tank', 'lrecv', 'gather', 'recover'];

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

Room.prototype.initMemory = function(){
    // initilize rooms memory
    // Need to have numbers adjusted to match Inital phase 0 build plans.
    // Possible phase for unclaimed rooms... 0 and up the rest +1
    if (this.memory.phase == undefined) {
        var sources = this.find(FIND_SOURCES);
        this.memory.phase = 0;
        this.memory.roomSources = sources;
        this.memory.bldArray = []
        this.memory.mstBldArray = [];
        this.memory.abadWork = [];
        this.memory.swnArray = [];
        this.memory.primeSpawn = undefined;
        this.memory.bldTower = [];
        this.memory.bldLab = [];
    }

};

Room.prototype.initRoad = function () {
    const sources = this.memory.roomSources;
    let buildArray = this.memory.bldArray;
    let pSpawn = Game.getObjectById(this.memory.primeSpawn);


    for (source of sources) {
        let path = this.findPath(pSpawn.pos, source.pos, {ignoreCreeps: true});
        for (part of path) {
            let buildRoad = new RoomPosition(part.x, part.y, (this.name));
            if ((buildRoad.x == source.pos.x && buildRoad.y == source.pos.y) == false) {
                // buildRoad.createConstructionSite(STRUCTURE_ROAD);  // Removing while testing build array
                buildArray.push({type:STRUCTURE_ROAD, pos:{x: part.x, y: part.y}});
            }

        }
    }

    let path = this.findPath(pSpawn.pos, this.controller.pos, {ignoreCreeps: true});
    for (part of path) {
        let buildRoad = new RoomPosition(part.x, part.y, (this.name));
        if ((buildRoad.x == this.controller.pos.x && buildRoad.y == this.controller.pos.y) == false) {
            // buildRoad.createConstructionSite(STRUCTURE_ROAD); // Removing while testing build Array
            buildArray.push({type:STRUCTURE_ROAD, pos:{x: part.x, y: part.y}});
        }
    }

    // Build 1x road loop around spawn.
    let targets = (this.lookForAtArea((LOOK_TERRAIN),(pSpawn.pos.y)-1, (pSpawn.pos.x) -1, (pSpawn.pos.y) +1, (pSpawn.pos.x) +1, true));
    for (let tgt of targets){
        if(tgt.terrain != 'wall'){
            buildArray.push({type:STRUCTURE_ROAD, pos:{x: tgt.x, y: tgt.y}});
        }
    }

    this.memory.bldArray = buildArray;

};

/*
comment out prior to removal
Room.prototype.phaseBuild = function(){
    let buildArray = this.memory.bldArray;
    if (buildArray == undefined){
        buildArray = [];
    }

    if (this.find(FIND_CONSTRUCTION_SITES).length == 0 && buildArray.length == 0){
        if (this.memory.phase === 0) {
            if (this.controller.level >=2 && this.memory.numExtRooms >= 2) {
                if (this.energyCapacityAvailable > 500){
                    this.bldMiningContainers();
                    this.memory.phase = 1;
                }
            }
        } else if(this.memory.phase === 1) {
            if (this.controller.level >= 4) {
                this.buildStorage();
                this.memory.phase = 2;
            }
        }
        this.bldExtRoom();

    }

    this.memory.bldArray = buildArray;

};
 */

Room.prototype.phaseUpdate = function(){
    if (this.memory.phase != this.controller.level && this.controller.my){
        this.phaseCreepUpdate();
        this.phaseBuildingUpdate();
        this.memory.phase = this.controller.level;
    }
};


Room.prototype.phaseBuildingUpdate = function(){

    let buildArray = this.memory.bldArray;
    if (buildArray == undefined){
        buildArray = [];
    }

    switch(this.controller.level){

        case 0:
            // Room with out claimed controller
            // Can make roads and Containers
            break;
        case 1:
            // Inital Spawn / Claimed room
            // Make spawn if one is not present.
            // Also Roads / Containers
            break;
        case 2:
            // One Extention room
            this.bldExtRoom();
            this.bldMiningContainers(); // Might as well start the miners now..
            // Walls and Ramparts open up
            break;
        case 3:
            // 1 Extension rooms
            this.bldExtRoom();
            this.buildTower(1);
            // 1st Tower
            break;
        case 4:
            // 2 Extension rooms
            this.buildStorage();
            this.bldExtRoom();
            this.bldExtRoom();
            // Storage
            break;
        case 5:
            // 2 Extension rooms
            this.bldExtRoom();
            this.bldExtRoom();
            this.buildTower(2);
            // 1 additional tower
            // 2 Links
            break;
        case 6:
            // 2 Extension rooms
            this.bldExtRoom();
            this.bldExtRoom();
            // 1 Additional link
            // Extractor
            // 3 Labs
            // Terminal
            break;
        case 7:
            // 2 Extensions
            this.bldExtRoom();
            this.bldExtRoom();
            this.buildTower(3);
            // 1 Additional link
            // 3 labs
            // Factory
            // 1 more spawn
            // 1 More tower
            break;
        case 8:
            // 2 Extensinos
            this.bldExtRoom();
            this.bldExtRoom();
            this.buildTower(4);
            this.buildTower(5);
            this.buildTower(6);
            // 2 Links
            // 3 Towers
            // 4 Labs
            // Observer, Power Spawn, Nuke
            break;
    }

    this.memory.bldArray = buildArray;

};

Room.prototype.phaseCreepUpdate = function(){

    switch(this.controller.level){

        case 0:
            // Empty room case
            this.memory.numMiners = 0;
            this.memory.numUpgrade = 0;
            this.memory.numBuild = 0;
            this.memory.numRepair = 0;
            this.memory.numLogi = 0;
            this.memory.numHarvest = 0;
            this.memory.numTank = 0;
            this.memory.numRec = 0;
            this.memory.numGather = 0;
            break;
        case 1:
            // Inital Room Spawn
            //this.memory.numMiners = 0;
            this.memory.numUpgrade = 2;
            this.memory.numBuild = 2;
            this.memory.numRepair = 2;
            //this.memory.numLogi = 0;
            this.memory.numHarvest = 2;
            //this.memory.numTank = 0;
            //this.memory.numRec = 0;
            //this.memory.numGather = 0;
            break;
        case 2:
            // Still inital spawn (walls can be built maybe wall builders are needed...
            break;
        case 3:
            // Enough Max energy to build proper miners..
            // Towers Introduced
            this.memory.numMiners = this.memory.roomSources.length;
            this.memory.numTank = 1;
            break;
        case 4:
            // Storage is introduced
            this.memory.numLogi = this.memory.numMiners * 2;
            break;
        case 5:
            // Links introduced
            break;
        case 6:
            // Extractos, Labs
            break;
        case 7:
            // Factories & Additional Spawns
            this.memory.numTank = 2;
            break;
        case 8:
            // Observer, Power Spawn, Nuke
            break;
    }

};

Room.prototype.buildTower = function(towerNumber) {
    let buildArray = this.memory.bldArray;
    let towerRoom = this.memory.bldTower;

    switch(towerNumber){

        case 1:
            buildArray.push({type:STRUCTURE_ROAD, pos:{x: towerRoom[0].x -1, y: towerRoom[0].y -1}});
            buildArray.push({type:STRUCTURE_TOWER, pos:{x: towerRoom[0].x, y: towerRoom[0].y -1}});
            buildArray.push({type:STRUCTURE_ROAD, pos:{x: towerRoom[0].x +1, y: towerRoom[0].y -1}});

            buildArray.push({type:STRUCTURE_ROAD, pos:{x: towerRoom[0].x -1, y: towerRoom[0].y}});
            buildArray.push({type:STRUCTURE_ROAD, pos:{x: towerRoom[0].x, y: towerRoom[0].y}});
            buildArray.push({type:STRUCTURE_ROAD, pos:{x: towerRoom[0].x +1, y: towerRoom[0].y}});


            buildArray.push({type:STRUCTURE_ROAD, pos:{x: towerRoom[0].x, y: towerRoom[0].y +1}});


            break;
        case 2:
            buildArray.push({type:STRUCTURE_ROAD, pos:{x: towerRoom[1].x -1, y: towerRoom[1].y -1}});
            buildArray.push({type:STRUCTURE_TOWER, pos:{x: towerRoom[1].x, y: towerRoom[1].y -1}});
            buildArray.push({type:STRUCTURE_ROAD, pos:{x: towerRoom[1].x +1, y: towerRoom[1].y -1}});

            buildArray.push({type:STRUCTURE_ROAD, pos:{x: towerRoom[1].x -1, y: towerRoom[1].y}});
            buildArray.push({type:STRUCTURE_ROAD, pos:{x: towerRoom[1].x, y: towerRoom[1].y}});
            buildArray.push({type:STRUCTURE_ROAD, pos:{x: towerRoom[1].x +1, y: towerRoom[1].y}});


            buildArray.push({type:STRUCTURE_ROAD, pos:{x: towerRoom[1].x, y: towerRoom[1].y +1}});

            break;
        case 3:
            buildArray.push({type:STRUCTURE_TOWER, pos:{x: towerRoom[0].x -1, y: towerRoom[0].y +1}});
            break;
        case 4:
            buildArray.push({type:STRUCTURE_TOWER, pos:{x: towerRoom[1].x -1, y: towerRoom[1].y +1}});
            break;
        case 5:
            buildArray.push({type:STRUCTURE_TOWER, pos:{x: towerRoom[0].x +1, y: towerRoom[0].y +1}});
            break;
        case 6:
            buildArray.push({type:STRUCTURE_TOWER, pos:{x: towerRoom[1].x +1, y: towerRoom[1].y +1}});
            break;
    }

    this.memory.bldArray = buildArray;

};

Room.prototype.bldExtRoom = function() {

    let buildArray = this.memory.bldArray;
    if (this.memory.extensionCords == undefined){
        return;
    }
    let bRoom = this.memory.extensionCords.shift();
    if (bRoom == undefined){
        return;
    }

    if (buildArray == undefined){
        buildArray = [];
    }

    buildArray.push({type:STRUCTURE_EXTENSION, pos:{x: bRoom.x -1, y: bRoom.y -1}});
    buildArray.push({type:STRUCTURE_ROAD, pos:{x: bRoom.x, y: bRoom.y -1}});
    buildArray.push({type:STRUCTURE_EXTENSION, pos:{x: bRoom.x +1, y: bRoom.y -1}});

    buildArray.push({type:STRUCTURE_ROAD, pos:{x: bRoom.x -1, y: bRoom.y}});
    buildArray.push({type:STRUCTURE_EXTENSION, pos:{x: bRoom.x, y: bRoom.y}});
    buildArray.push({type:STRUCTURE_ROAD, pos:{x: bRoom.x +1, y: bRoom.y}});

    buildArray.push({type:STRUCTURE_EXTENSION, pos:{x: bRoom.x -1, y: bRoom.y +1}});
    buildArray.push({type:STRUCTURE_ROAD, pos:{x: bRoom.x, y: bRoom.y +1}});
    buildArray.push({type:STRUCTURE_EXTENSION, pos:{x: bRoom.x +1, y: bRoom.y +1}});

    this.memory.bldArray = buildArray;

};

Room.prototype.bldMiningContainers = function(){
    let sources = this.memory.bldContain;
    let buildArray = this.memory.bldArray;
    for (let source of sources){
        buildArray.push({type:STRUCTURE_CONTAINER, pos:{x: source.x, y: source.y}});
    }

    this.memory.bldArray = buildArray;
};

Room.prototype.buildStorage = function(){
    let buildArray = this.memory.bldArray;
    let pSpawn = Game.getObjectById(this.memory.primeSpawn);
    // Build Construct Storage Commited out for array test and moved to end.
    let bStorage = new RoomPosition(this.memory.bldStorage.x, this.memory.bldStorage.y, this.memory.bldStorage.roomName);

    // Build roads around Storage
    // Build roads to Storage.

    const sources = this.memory.roomSources;

    for (source of sources) {
        let path = this.findPath(bStorage, source.pos, {ignoreCreeps: true, ignoreRoads:true});
        for (part of path) {

            let buildRoad = new RoomPosition(part.x, part.y, (this.name));
            if ((buildRoad.x == source.pos.x && buildRoad.y == source.pos.y) == false) {
                buildArray.push({type:STRUCTURE_ROAD, pos:{x: part.x, y: part.y}});
            }
        }
    }

    let path = this.findPath(pSpawn.pos, bStorage, {ignoreCreeps: true, ignoreRoads: true});
    for (part of path) {
        let buildRoad = new RoomPosition(part.x, part.y, (this.name));
        buildArray.push({type:STRUCTURE_ROAD, pos:{x: part.x, y: part.y}});
    }

    let targets = (this.lookForAtArea((LOOK_TERRAIN),(bStorage.y)-1, (bStorage.x) -1, (bStorage.y) +1, (bStorage.x) +1, true));
    for (let tgt of targets){
        if(tgt.terrain != 'wall'){
            buildArray.push({type:STRUCTURE_ROAD, pos:{x: tgt.x, y: tgt.y}});
        }
    }

    buildArray.push({type:STRUCTURE_STORAGE, pos:{x: this.memory.bldStorage.x, y: this.memory.bldStorage.y}});

    this.memory.bldArray = buildArray;

};



Room.prototype.run = function(){
    if (this.memory.phase == undefined) {
        var startCpu = Game.cpu.getUsed();

        this.initMemory();
        this.whereCanIBuild();
        this.initRoad();

        console.log('CPU spent on Planning:', Game.cpu.getUsed() - startCpu);
    }

    this.phaseUpdate();
    this.fillSpawnQueue();
    // this.overlay();
    // startCpu = Game.cpu.getUsed();
    this.planner();
    //console.log('CPU spent on Planner:', Game.cpu.getUsed() - startCpu);
};

Room.prototype.fillSpawnQueue = function(){
    // Initalize Array
    let spawnArray = this.memory.swnArray;
    if (spawnArray == undefined){
        spawnArray = [];
    }

    /** @type {Array.<Creep>} */
    let creepsInRoom = this.find(FIND_MY_CREEPS);

    /** @type {Object.<string, nunber>} */
    // IDENTIFIED CPU SINK HERE (uses about 1 cpu per tick)
    let numCreeps = {};
    for (let role of roleTypes){
        numCreeps[role] = _.sum(creepsInRoom, (c) => c.memory.role == role);
    }
    // END OF CPU ISSUE.

    // Baseline Queue fill
    if (spawnArray.length == 0){

        if (numCreeps['gather'] < this.memory.numGather){
            spawnArray.push('gather');
        }

        if (numCreeps['repair'] < this.memory.numRepair){
            spawnArray.push('repair');
        }

        if (numCreeps['build'] < this.memory.numBuild){
            spawnArray.push('build');
        }

        if (numCreeps['upgrade'] < this.memory.numUpgrade){
            spawnArray.push('upgrade');
        }

        if (numCreeps['harvest'] < this.memory.numHarvest){
            spawnArray.push('harvest');
        }

        if (numCreeps['logi'] < this.memory.numLogi) {
            spawnArray.push('logi');
        }

        if (numCreeps['miner'] < this.memory.numMiners){
            spawnArray.push('miner');
        }

    }


    // Special Case adds.
    if (spawnArray.length == 0 && this.memory.creepct < 16) {
        // Add in repair room creep before standard build.
        if (this.memory.bldArray.length > 0 && numCreeps['build'] < 6) {
            spawnArray.push('build');
        } else if (numCreeps['upgrade'] < 10 && this.controller.level < 8) {
            spawnArray.push('upgrade');
        }
    }

        // Panic Add
    if ((this.energyAvailable > 301 && numCreeps['miner'] == 0
        && numCreeps['harvest'] == 0 && numCreeps['logi'] == 0 && numCreeps['recover'] == 0) && spawnArray[spawnArray.length -1] != 'recover') {
        // Create spawn panic guy.
        spawnArray.push('recover');
    }


     this.memory.swnArray = spawnArray;

};


// Needs to be adjusted to be a room fuction.
Room.prototype.whereCanIBuild = function() {


    if (baseSpawn == undefined){
        if (this.find(FIND_MY_SPAWNS).length == 0){
            console.log("I shouldn't be here yet!");
            // Function call for the find my spawn function
        } else {
            this.memory.primeSpawn = this.find(FIND_MY_SPAWNS)[0].id;
        }
    }
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
    var tgtX = baseSpawn.pos.x;
    var tgtY = baseSpawn.pos.y;

    // Find average center of sources and spawn

    for (let source of numOfSources){
        tgtX = tgtX + source.pos.x;
        tgtY = tgtY + source.pos.y;
    }
    tgtX = _.floor(tgtX / (numOfSources.length + 1));
    tgtY = _.floor(tgtY / (numOfSources.length + 1));

    // Determine location in build matrix
    tgtX = _.floor(tgtX / 3);
    tgtY = _.floor(tgtY / 3);

    // block out the spawns Location
    buildMatrix[_.floor(baseSpawn.pos.y/3)][_.floor(baseSpawn.pos.x/3)].reserved = true;

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

};

Room.prototype.overlay = function(){
    let visOverlay = this.memory.overlay;
    if (visOverlay != undefined) {
        for (vis of visOverlay) {
            new RoomVisual(this.name).text("R", vis, {color: 'blue', font: 0.8});
        }
    }
};