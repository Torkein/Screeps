
module.exports = {
    run: function(creep) {

        const found_road = creep.pos.lookFor(LOOK_STRUCTURES, {filter: (r) => (r.structureType == STRUCTURE_ROAD)});
        const found_construct = creep.pos.lookFor(LOOK_CONSTRUCTION_SITES);
        if (found_road == '' && found_construct == '') {
    //        creep.pos.createConstructionSite(STRUCTURE_ROAD);
        }


        if (creep.memory.working == true && creep.carry.energy == 0) {
            creep.memory.working = false;
        } else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            creep.memory.working = true;
        }


        // If in the home room ( Get out / or go deposit)
        if (creep.memory.home == creep.room.name) {
            if (creep.memory.working == false) {
                var exit = creep.room.findExitTo(creep.memory.target);
                creep.moveTo(creep.pos.findClosestByRange(exit));
            } else {
                var structure = creep.pos.findClosestByPath(FIND_STRUCTURES,
                    {filter: (s) => (s.structureType == STRUCTURE_LINK)});

                if (creep.transfer(structure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(structure);
                }
            }
        }

        // if not in home room...
        else if (creep.memory.target == creep.room.name)
            if (creep.memory.working == false) {
                var source = creep.pos.findClosestByPath(FIND_SOURCES);
                if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source);
                }

            } else {
                var exit = creep.room.findExitTo(creep.memory.home);
                creep.moveTo(creep.pos.findClosestByRange(exit));

            }

        else {
            if (creep.memory.working == false) {
                var exit = creep.room.findExitTo(creep.memory.target);
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }
            else {
                var exit = creep.room.findExitTo(creep.memory.home);
                    creep.moveTo(creep.pos.findClosestByRange(exit));

            }

        }

    }

};