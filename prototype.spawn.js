require ('roomPlanner');
var roleTypes = ['miner', 'upgrade', 'build', 'repair', 'logi', 'harvest', 'tank', 'lrecv', 'gather', 'recover'];

// Main run process
// Will have to be transitioned to own function not of an object.
StructureSpawn.prototype.run = function(){
    this.spawn();
}

StructureSpawn.prototype.spawn = function(){

    // Initalize Array
    let spawnArray = this.room.memory.swnArray;

    let maxEnergy = this.room.energyCapacityAvailable;
    if (spawnArray.length > 0 && this.spawning == null &&
        (this.room.energyAvailable == this.room.energyCapacityAvailable
            || (spawnArray[spawnArray.length-1] == 'recover' && this.room.energyAvailable > 200)
            || (spawnArray[spawnArray.length-1] == 'miner' && this.room.energyAvailable >= 500))) {

        let creep = spawnArray.pop();

        switch(creep) {
            case 'miner':
                this.createMiner();
                break;

            case 'upgrade':
                this.balancedCreep(maxEnergy, 'upgrade');
                break;

            case 'build':
                this.balancedCreep(maxEnergy, 'build');
                break;

            case 'repair':
                this.balancedCreep(maxEnergy, 'repair');
                break;

            case 'logi':
                this.createLogi(2);
                break;

            case 'harvest':
                this.balancedCreep(maxEnergy, 'harvest');
                break;

            case 'tank':
                this.createTank(2);
                break;

            case 'lrecv':
                this.createLRecv();
                break;

            case 'gather':
                this.createCart(2);
                break;

            case 'recover':
                this.balancedCreep(200, 'recover');
                this.room.memory.recover = false;
                break;

            default:
                console.log('Nothing to spawn!?!?!?')
        }

        this.room.memory.swnArray = spawnArray;

    }


}


StructureSpawn.prototype.spawnMinCreeps = function () {
    if (this.room.memory.phase == undefined){
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
        this.balancedCreep(200, 'harvest'); // Changed to test out building queue
        // this.balancedCreep(200, 'build');  // Used for testing, to force creep spawn types
    }

    if (this.room.memory.phase == 0){
        maxEnergy = 300;
        // Produce harvesters, builders, repair, upgrade, gather
        if (numCreeps['harvest'] < this.room.memory.numHarvest){
            // Make Harvest
            this.balancedCreep(maxEnergy, 'harvest');
            // this.balancedCreep(maxEnergy, 'build'); // used for testing to force creep spawn types

        } else if (numCreeps['upgrade'] < this.room.memory.numUpgrade){
            // make upgrader
            this.balancedCreep(maxEnergy, 'upgrade');

        } else if (numCreeps['build'] < this.room.memory.numBuild){
            // Make Build
            this.balancedCreep(maxEnergy, 'build');

        } else if (numCreeps['repair'] < this.room.memory.numRepair){
            // Make Repair

            this.balancedCreep(maxEnergy, 'repair');
        } else if (numCreeps['gather'] < this.room.memory.numGather){
            // make grather
            this.createCart(2);

        }

    } else if (this.room.memory.phase == 1){
        maxEnergy = 600;
        // Produce harvesters, builders, repair, upgrade, gather, miner
        if (numCreeps['miner'] < this.room.memory.numMiners){
            // Make Miner
            this.createMiner();
        } else if (numCreeps['harvest'] < this.room.memory.numHarvest){
            // Make Harvest
            this.balancedCreep(maxEnergy, 'harvest');
        } else if (numCreeps['upgrade'] < this.room.memory.numUpgrade){
            // make upgrader
            this.balancedCreep(maxEnergy, 'upgrade');
        } else if (numCreeps['build'] < this.room.memory.numBuild){
            // Make Build
            this.balancedCreep(maxEnergy, 'build');
        } else if (numCreeps['repair'] < this.room.memory.numRepair){
            // Make Repair
            this.balancedCreep(maxEnergy, 'repair');
        } else if (numCreeps['gather'] < this.room.memory.numGather){
            // make grather
            this.createCart(2);
        }

    } else if (this.room.memory.phase == 2){
        maxEnergy = 600;
        // produce harvesters, builders, repair, upgrade, gather, miner, logi
        if (numCreeps['miner'] < this.room.memory.numMiners){
            // Make Miner
            this.createMiner();
        } else if (numCreeps['logi'] < this.room.memory.numLogi) {
            // Make Harvest
            this.createLogi(2);
        } else if (numCreeps['harvest'] < this.room.memory.numHarvest){
            // Make Harvest
            this.balancedCreep(maxEnergy, 'harvest');
        } else if (numCreeps['upgrade'] < this.room.memory.numUpgrade){
            // make upgrader
            this.balancedCreep(maxEnergy, 'upgrade');
        } else if (numCreeps['build'] < this.room.memory.numBuild){
            // Make Build
            this.balancedCreep(maxEnergy, 'build');
        } else if (numCreeps['repair'] < this.room.memory.numRepair){
            // Make Repair
            this.balancedCreep(maxEnergy, 'repair');
        } else if (numCreeps['gather'] < this.room.memory.numGather){
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
        let sources = this.room.memory.roomSources;

        for (let source of sources){
            if (_.sum(creepsInRoom, (c) => (c.memory.src_container == source.id && c.memory.role == 'miner')) == 0){
                var sourceID = source.id;
                break;
            }
        }




        return this.createCreep(body, undefined,
            {role: 'miner', working: false, src_container: sourceID, conCords: this.room.memory.bldContain});
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
        let sources = this.room.memory.bldContain;
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

StructureSpawn.prototype.createRecover =
    function () {

        var body = [];
        body.push(WORK);
        body.push(CARRY);
        body.push(MOVE);
        body.push(MOVE);



        return this.createCreep(body, undefined, {role: 'recover', working: false});
    };

// Will Kill all creeps Not just this room.
StructureSpawn.prototype.killAll = function (){
    for (let name in Game.creeps) {
        Game.creeps[name].suicide();
    }

    for (let site in Game.constructionSites){
        Game.constructionSites[site].remove();
    }

    for (let struct in Game.structures){
        if (Game.structures[struct].structureType != STRUCTURE_SPAWN){
            Game.structures[struct].destroy();
        }
    }

    let roads = this.room.find(FIND_STRUCTURES);
    for (let road of roads){
        if (road.structureType != STRUCTURE_SPAWN){
            road.destroy();
        }
    }

    delete Memory.creeps;
    delete Memory.rooms;

};