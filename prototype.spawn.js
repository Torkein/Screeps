var roleTypes = ['miner', 'upgrade', 'build', 'repair', 'logi', 'harvest', 'tank', 'lrecv', 'gather'];

function buildableCell(buildible, roomobj){
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



StructureSpawn.prototype.setMemory = function () {

    if (this.memory.phase == undefined) {
        var sources = this.room.find(FIND_SOURCES);
        this.memory.phase = 0;
        this.memory.roomSources = sources;
        this.memory.numMiners = sources.length;
        this.memory.numUpgrade = this.memory.numMiners;
        this.memory.numBuild = this.memory.numMiners;
        this.memory.numRepair = this.memory.numMiners;
        this.memory.numLogi = this.memory.numMiners * 2;
        this.memory.numHarvest = this.memory.numMiners;
        this.memory.numTank = this.memory.numMiners;
        this.memory.numRec = 1;
        this.memory.numGather = 1;
    }

}


StructureSpawn.prototype.whereCanIBuild = function() {
    // Based on spawn location what is the lowest X and Y value for building 3x3 squares
    var lowX = this.pos.x % 3;
    var lowY = this.pos.y % 3;

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
    const baseRoom = Game.map.getRoomTerrain(this.room.name);

    // Run though map tiles, build matrix based on 3x3 grid, any wall prevents building in that segement
    for (y = lowY; y < 49; y = y +3){
        let buildRow = [];
        for (x = lowX; x < 49; x = x +3) {

            buildRow.push(new buildableCell(getSquare(baseRoom,x,y),new RoomPosition(x,y,this.room.name)));

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
    var tgtX = this.pos.x;
    var tgtY = this.pos.y;

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
    console.log(this.pos.y);
    buildMatrix[_.floor(this.pos.y/3)][_.floor(this.pos.x/3)].reserved = true;

    // Test the Location to see if we can build there.  If not start looking in next closest area
    if (buildMatrix[tgtY][tgtX].canBuild() == true && buildMatrix[tgtY][tgtX].isReserved() == false){
        storageCords = new RoomPosition(buildMatrix[tgtY][tgtX].pos().x,buildMatrix[tgtY][tgtX].pos().y, this.room.name);
        buildMatrix[tgtY][tgtX].reserved = true;

    } else {
        let passCount = 1;
        while (storageCords == undefined){
            for (c = tgtY - passCount; c <= tgtY + passCount ; c ++){
                for (r = tgtX - passCount ; r <= tgtX - passCount ; r ++){
                    if (buildMatrix[r][c].canBuild() == true && buildMatrix[r][c].isReserved() == false) {
                        storageCords = new RoomPosition(buildMatrix[r][c].pos().x,buildMatrix[r][c].pos().y, this.room.name);
                        buildMatrix[tgtY][tgtX].reserved = true;
                        break;
                    }
                }
            }
            passCount++;
        }
    }
    // Pass storage build location to memory.
    this.memory.bldStorage = storageCords;

    // ************************ //
    // Mark Container Locations //
    //    and save locations    //
    // ************************ //

    // Future to do,  remove lookForAt and utilize the build room, cut down on CPU usage.

    var bldContain = [];
    for (let source of numOfSources){
        let path = this.room.findPath(this.pos, new RoomPosition( source.pos.x, source.pos.y, this.room.name), {ignoreCreeps: true});
        bldContain.push(new RoomPosition(path[path.length -2].x, path[path.length -2].y, this.room.name));
    }

    // array containing cords for container builds.
    this.memory.bldContain = bldContain;

    // Reserve locations for  containers
    for (container of bldContain) {
        buildMatrix[_.floor(container.y / 3)][_.floor(container.x / 3)].reserved = true;
    }

    

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
    this.memory.surRooms = surroundRooms; */

    // Claming room for extensions.
    var bldExtenCords = [];
    let numOfExtensions = 12;
    let offsetValue = 2;
    while (numOfExtensions >= 1) {
        for (c = (_.floor(this.pos.y / 3)) - offsetValue; c <= (_.floor(this.pos.y / 3)) + offsetValue ; c++){
            for (r = (_.floor(this.pos.x / 3)) - offsetValue ; r <= (_.floor(this.pos.x / 3)) + offsetValue ; r++){
                if (c < 0){
                    c= 0;
                }
                if (r < 0){
                    r = 0;
                }

                if (buildMatrix[c][r].canBuild() == true && buildMatrix[c][r].isReserved() == false) {
                    bldExtenCords.push(new RoomPosition(buildMatrix[c][r].pos().x,buildMatrix[c][r].pos().y, this.room.name));
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




    // Utilize Visual for testing
    for (c = 0 ; c < buildMatrix.length; c++){
        for (r = 0 ; r < buildMatrix[c].length; r++){
            if (buildMatrix[c][r].canBuild() == true && buildMatrix[c][r].isReserved() == false) {
                new RoomVisual(this.room.name).text("T", buildMatrix[c][r].pos(), {color: 'green', font: 0.8});
            } else if (buildMatrix[c][r].isReserved() == true) {
                new RoomVisual(this.room.name).text("R", buildMatrix[c][r].pos(), {color: 'blue', font: 0.8});
            } else {
                new RoomVisual(this.room.name).text("F", buildMatrix[c][r].pos(), {color: 'red', font: 0.8});
            }
        }
    }

    new RoomVisual(this.room.name).text('S', storageCords, {color: 'green', font: 0.8});
    
};


StructureSpawn.prototype.initRoad = function () {
    const sources = this.memory.roomSources;


    for (source of sources) {
        let path = this.room.findPath(this.pos, source.pos, {ignoreCreeps: true});
        for (part of path) {
            let buildRoad = new RoomPosition(part.x, part.y, (this.room.name));
            if ((buildRoad.x == source.pos.x && buildRoad.y == source.pos.y) == false) {
                buildRoad.createConstructionSite(STRUCTURE_ROAD);
            }

        }
    }

    let path = this.room.findPath(this.pos, this.room.controller.pos, {ignoreCreeps: true});
    for (part of path) {
        let buildRoad = new RoomPosition(part.x, part.y, (this.room.name));
        if ((buildRoad.x == this.room.controller.pos.x && buildRoad.y == this.room.controller.pos.y) == false) {
            buildRoad.createConstructionSite(STRUCTURE_ROAD);
        }
    }

    // Build 2x road loop around spawn.
    let targets = (this.room.lookForAtArea((LOOK_TERRAIN),(this.pos.y)-2, (this.pos.x) -2, (this.pos.y) +2, (this.pos.x) +2, true));
    for (let tgt of targets){
        if(tgt.terrain != 'wall'){
            let buildRoad = new RoomPosition(tgt.x, tgt.y, (this.room.name));
            buildRoad.createConstructionSite(STRUCTURE_ROAD);
        }
    }

};

StructureSpawn.prototype.buildTest = function () {
    if (this.memory.roomSources != undefined){
        var numOfSources = this.room.find(FIND_SOURCES);

        for (let source of numOfSources){
            if (source != undefined){
                let possibleConstructionSites = [];
                let spos = source.pos;
                let targets = (this.room.lookForAtArea((LOOK_TERRAIN), (spos.y)-2, (spos.x) -2, (spos.y) +2, (spos.x) +2, true));
                for (let tgt of targets){
                    if (tgt.terrain != 'wall'){
                        possibleConstructionSites.push(new RoomPosition(tgt.x,tgt.y, (this.room.name)));
                    }
                }
                let build = this.pos.findClosestByPath(possibleConstructionSites);
                build.createConstructionSite(STRUCTURE_CONTAINER);

            }
        }
    }
};

StructureSpawn.prototype.storageTest = function(roomMatrix) {
  var numOfSources = this.memory.roomSources;
  var storageCords = undefined;
  var tgtX = this.pos.x;
  var tgtY = this.pos.y;
  for (let source of numOfSources){
      tgtX = tgtX + source.pos.x;
      tgtY = tgtY + source.pos.y;
  }
  console.log(tgtX);

  tgtX = _.floor(tgtX / (numOfSources.length + 1));
  tgtY = _.floor(tgtY / (numOfSources.length + 1));

  console.log('Here ' + tgtX + ' y: ' + tgtY);
  tgtX = _.floor(tgtX / 3);
  tgtY = _.floor(tgtY / 3);

  console.log (roomMatrix[tgtX][tgtY].build);
  if (roomMatrix[tgtX][tgtY].build == true && roomMatrix[tgtX][tgtY].reserved == false){
      storageCords = new RoomPosition(tgtX,tgtY, this.room.name);
  } else {
      let passCount = 1;
      while (storageCords == undefined){
          for (r = tgtX - passCount; r < tgtX + passCount ; r ++){
              for (c = tgtY - passCount ; r < tgtY - passCount ; r ++){
                  if (roomMatrix[r][c].build == true && roomMatrix[r][c].reserved == false) {
                      storageCords = new RoomPosition(r,c, this.room.name);
                      break;
                  }
              }
          }
          passCount++;
      }

  }

  // this.memory.buildStorageCords = storageCords;
  return storageCords;

};

StructureSpawn.prototype.bldExtRoom = function() {

    function build(object, bRoom){
        object.room.createConstructionSite(bRoom.x -1, bRoom.y -1, STRUCTURE_EXTENSION);
        object.room.createConstructionSite(bRoom.x , bRoom.y -1, STRUCTURE_ROAD);
        object.room.createConstructionSite(bRoom.x +1 , bRoom.y -1, STRUCTURE_EXTENSION);

        object.room.createConstructionSite(bRoom.x -1, bRoom.y, STRUCTURE_ROAD);
        object.room.createConstructionSite(bRoom.x, bRoom.y, STRUCTURE_EXTENSION);
        object.room.createConstructionSite(bRoom.x +1 , bRoom.y, STRUCTURE_ROAD);

        object.room.createConstructionSite(bRoom.x -1, bRoom.y +1, STRUCTURE_EXTENSION);
        object.room.createConstructionSite(bRoom.x, bRoom.y +1 , STRUCTURE_ROAD);
        object.room.createConstructionSite(bRoom.x +1, bRoom.y +1 , STRUCTURE_EXTENSION);

    };

    if (this.memory.numExtRooms == undefined){
        this.memory.numExtRooms = 0;

    } else if (this.memory.numExtRooms === 0 && this.room.controller.level >= 2){
        build(this, this.memory.extensionCords.shift());
        this.memory.numExtRooms = 1;
    } else if (this.memory.numExtRooms === 1 && this.room.controller.level >= 3 && this.memory.phase > 0) {
        build(this, this.memory.extensionCords.shift());
        this.memory.numExtRooms = 2;
    } else if (this.memory.numExtRooms === 2 && this.room.controller.level >= 3 && this.memory.phase > 1) {
        build(this, this.memory.extensionCords.shift());
        build(this, this.memory.extensionCords.shift());
        this.memory.numExtRooms = 4;
    }


};

StructureSpawn.prototype.bldMiningContainers = function(){
    let sources = this.memory.bldContain;
    for (let source of sources){
        this.room.createConstructionSite(source.x,source.y,STRUCTURE_CONTAINER);
    }

};

StructureSpawn.prototype.buildStorage = function(){
    // Build Construct Storage
    let bStorage = new RoomPosition(this.memory.bldStorage.x, this.memory.bldStorage.y, this.memory.bldStorage.roomName);
    bStorage.createConstructionSite(STRUCTURE_STORAGE);

    // Build roads around Storage
    // Build roads to Storage.

    const sources = this.memory.roomSources;

    for (source of sources) {
        let path = this.room.findPath(bStorage, source.pos, {ignoreCreeps: true, ignoreRoads:true});
        for (part of path) {
            let buildRoad = new RoomPosition(part.x, part.y, (this.room.name));
            if ((buildRoad.x == source.pos.x && buildRoad.y == source.pos.y) == false) {
                buildRoad.createConstructionSite(STRUCTURE_ROAD);
            }
        }
    }

    let path = this.room.findPath(this.pos, bStorage, {ignoreCreeps: true, ignoreRoads: true});
    for (part of path) {
        let buildRoad = new RoomPosition(part.x, part.y, (this.room.name));
        buildRoad.createConstructionSite(STRUCTURE_ROAD);
    }

    let targets = (this.room.lookForAtArea((LOOK_TERRAIN),(bStorage.y)-1, (bStorage.x) -1, (bStorage.y) +1, (bStorage.x) +1, true));
    for (let tgt of targets){
        if(tgt.terrain != 'wall'){
            let buildRoad = new RoomPosition(tgt.x, tgt.y, (this.room.name));
            buildRoad.createConstructionSite(STRUCTURE_ROAD);
        }
    }


};




StructureSpawn.prototype.phaseBuild = function(){
    if (this.room.find(FIND_CONSTRUCTION_SITES).length == 0){
        if (this.memory.phase === 0) {
            if (this.room.controller.level >=2) {
                if (this.room.energyCapacityAvailable > 500){
                    this.bldMiningContainers();
                    this.memory.phase = 1;
                }
            }
        } else if(this.memory.phase === 1) {
            if (this.room.controller.level >= 4) {
                this.buildStorage();
                this.memory.phase = 2;
            }
        }
        this.bldExtRoom();

    }
    else {
    //    console.log(this.room.find(FIND_CONSTRUCTION_SITES).length);
    }

};

StructureSpawn.prototype.resetPhase = function() {
    this.memory.phase = undefined;
}

StructureSpawn.prototype.spawnMinCreeps = function () {
    if (this.memory.phase == undefined){
        this.setMemory();
        this.whereCanIBuild();
        this.initRoad();
        console.log('I ran agian!');
    }

    this.phaseBuild();

    /** @type {Room} */
    let room = this.room;

    /** @type {Array.<Creep>} */
    let creepsInRoom = room.find(FIND_MY_CREEPS);

    /** @type {Object.<string, number>} */
    let numCreeps = {};
    for (let role of roleTypes){
         numCreeps[role] = _.sum(creepsInRoom, (c) => c.memory.role == role);
         }

    let maxEnergy = room.energyCapacityAvailable;

    // Emergancy energy is out.
    if (numCreeps['harvest'] == 0 && numCreeps['miner'] == 0 && numCreeps['logi'] == 0){
        this.balancedCreep(200, 'harvest');
    }

    if (this.memory.phase == 0){
        maxEnergy = 300;
        // Produce harvesters, builders, repair, upgrade, gather
        if (numCreeps['harvest'] < this.memory.numHarvest){
            // Make Harvest
            this.balancedCreep(maxEnergy, 'harvest');
        } else if (numCreeps['upgrade'] < this.memory.numUpgrade){
            // make upgrader
            this.balancedCreep(maxEnergy, 'upgrade');

        } else if (numCreeps['build'] < this.memory.numBuild){
            // Make Build
            this.balancedCreep(maxEnergy, 'build');

        } else if (numCreeps['repair'] < this.memory.numRepair){
            // Make Repair

            this.balancedCreep(maxEnergy, 'repair');
        } else if (numCreeps['gather'] < this.memory.numGather){
            // make grather
            this.createCart(2);

        }

    } else if (this.memory.phase == 1){
        maxEnergy = 600;
        // Produce harvesters, builders, repair, upgrade, gather, miner
        if (numCreeps['miner'] < this.memory.numMiners){
            // Make Miner
            this.createMiner();
        } else if (numCreeps['harvest'] < this.memory.numHarvest){
            // Make Harvest
            this.balancedCreep(maxEnergy, 'harvest');
        } else if (numCreeps['upgrade'] < this.memory.numUpgrade){
            // make upgrader
            this.balancedCreep(maxEnergy, 'upgrade');
        } else if (numCreeps['build'] < this.memory.numBuild){
            // Make Build
            this.balancedCreep(maxEnergy, 'build');
        } else if (numCreeps['repair'] < this.memory.numRepair){
            // Make Repair
            this.balancedCreep(maxEnergy, 'repair');
        } else if (numCreeps['gather'] < this.memory.numGather){
            // make grather
            this.createCart(2);
        }

    } else if (this.memory.phase == 2){
        maxEnergy = 600;
        // produce harvesters, builders, repair, upgrade, gather, miner, logi
        if (numCreeps['miner'] < this.memory.numMiners){
            // Make Miner
            this.createMiner();
        } else if (numCreeps['logi'] < this.memory.numLogi) {
            // Make Harvest
            this.createLogi(2);
        } else if (numCreeps['harvest'] < this.memory.numHarvest){
            // Make Harvest
            this.balancedCreep(maxEnergy, 'harvest');
        } else if (numCreeps['upgrade'] < this.memory.numUpgrade){
            // make upgrader
            this.balancedCreep(maxEnergy, 'upgrade');
        } else if (numCreeps['build'] < this.memory.numBuild){
            // Make Build
            this.balancedCreep(maxEnergy, 'build');
        } else if (numCreeps['repair'] < this.memory.numRepair){
            // Make Repair
            this.balancedCreep(maxEnergy, 'repair');
        } else if (numCreeps['gather'] < this.memory.numGather){
            // make grather
            this.createCart(2);
        }


    }

    // Other one off not tied into normal minimums
    //if (this.spawning == null && this.room.find(FIND_MY_CREEPS).length < 10){
      //  if(this.room.find(FIND_CONSTRUCTION_SITES).length > 0){
        //    this.balancedCreep(maxEnergy, 'build');
        //}
    /*    else{
            this.balancedCreep(maxEnergy, 'harvest');
        }*/
    //}


};

StructureSpawn.prototype.balancedCreep =
    function (energy, job, roomName) {

        var num_of_parts = Math.floor(energy / 200);
        var body = [];
        for (let i = 0; i < num_of_parts; i++) {
            body.push(WORK);
        }
        for (let i = 0; i < num_of_parts; i++) {
            body.push(CARRY);
        }
        for (let i = 0; i < num_of_parts; i++) {
            body.push(MOVE);
        }


        return this.createCreep(body, undefined, {role: job, working: false , target: roomName});
    };

StructureSpawn.prototype.createMiner =
    function () {
        var body = [];
        body.push(WORK);
        body.push(WORK);
        body.push(WORK);
        body.push(WORK);
        body.push(WORK);

        body.push(CARRY);
        body.push(MOVE);

        let creepsInRoom = this.room.find(FIND_MY_CREEPS);
        let sources = this.memory.roomSources;

        for (let source of sources){
            if (_.sum(creepsInRoom, (c) => (c.memory.src_container == source.id && c.memory.role == 'miner')) == 0){
                var sourceID = source.id;
                break;
            }
        }




        return this.createCreep(body, undefined,
            {role: 'miner', working: false, src_container: sourceID, conCords: this.memory.bldContain});
    };

StructureSpawn.prototype.createLogi =
    function (capacity) {
        var body = [];
        for (let i = 0; i < capacity; i++) {
            body.push(CARRY);
        }
        for (let i = 0; i < capacity; i++) {
            body.push(MOVE);
        }

        let creepsInRoom = this.room.find(FIND_MY_CREEPS);
        let sources = this.memory.bldContain;
        let containers = [];

        for(let source of sources){
            var tgt = (this.room.lookForAt(LOOK_STRUCTURES, new RoomPosition(source.x, source.y, this.room.name)));
            for (let t of tgt) {
                if (t.structureType == STRUCTURE_CONTAINER) {
                    containers.push(t);
                }
            }
        }

        for (let contain of containers){
            if (_.sum(creepsInRoom, (c) => (c.memory.src_container == contain.id && c.memory.role == 'logi')) < 2){
                var sourceID = contain.id;
                break;
            }
        }


        return this.createCreep(body, undefined, {role: 'logi', working: false, src_container: sourceID});
    };

StructureSpawn.prototype.createCart =
    function (capacity) {
        var body = [];
        for (let i = 0; i < capacity; i++) {
            body.push(CARRY);
        }
        for (let i = 0; i < capacity; i++) {
            body.push(MOVE);
        }

        return this.createCreep(body, undefined, {role: 'gather', working: false});
    };

StructureSpawn.prototype.createClaim =
    function (target){
        return this.createCreep([CLAIM,MOVE], undefined, {role: 'claim', target: target});
    }

StructureSpawn.prototype.createTank =
    function (atk_prts) {
        var body = [];
        body.push(WORK);

        for (let i = 0; i < atk_prts; i++) {
            body.push(RANGED_ATTACK);
        }

        body.push(CARRY);
        body.push(MOVE);

        return this.createCreep(body, undefined, {role: 'tank', working: false});
    };

StructureSpawn.prototype.createLSend =
    function () {
        var body = [];
        body.push(WORK);
        body.push(CARRY);
        body.push(CARRY);
        body.push(MOVE);

        return this.createCreep(body, undefined, {role: 'lsend', working: false});
    };

StructureSpawn.prototype.createLRecv =
    function () {
        var body = [];
        body.push(WORK);
        body.push(CARRY);
        body.push(CARRY);
        body.push(MOVE);

        return this.createCreep(body, undefined, {role: 'lrecv', working: false});
    };

StructureSpawn.prototype.createDriller =
    function (energy, numberOfWorkParts, home, target) {

        // create a body with the specified number of WORK parts and one MOVE part per non-MOVE part

        var body = [];

        for (let i = 0; i < numberOfWorkParts; i++) {

            body.push(WORK);

        }



        // 150 = 100 (cost of WORK) + 50 (cost of MOVE)

        energy -= 150 * numberOfWorkParts;



        var numberOfParts = Math.floor(energy / 100);

        for (let i = 0; i < numberOfParts; i++) {

            body.push(CARRY);

        }

        for (let i = 0; i < numberOfParts + numberOfWorkParts; i++) {

            body.push(MOVE);

        }



        // create creep with the created body

        return this.createCreep(body, undefined, {

            role: 'driller',

            home: home,

            target: target,

            working: false

        });

    };

StructureSpawn.prototype.killAll = function (){
    for (let name in Game.creeps) {
        Game.creeps[name].suicide();
    }
};