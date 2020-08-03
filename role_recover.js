var roleUpgrade = require('role_upgrade');

module.exports = {
    run: function(creep)
    {
        if (creep.memory.working == true && creep.carry.energy == 0) {
            creep.memory.working = false;
        }

        else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            creep.memory.working = true;
        }


        if (creep.memory.working == true) {
            if (creep.room.energyAvailable != creep.room.energyCapacityAvailable) {
                var structure = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: (z) => (z.structureType == STRUCTURE_SPAWN || z.structureType == STRUCTURE_EXTENSION) && z.energy < z.energyCapacity});
                if (structure != undefined) {
                    if (creep.transfer(structure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(structure);
                    }
                }
            }
            else {
                roleUpgrade.run(creep);
            }
        }
        else {
            creep.getEnergy(true,true,true);
        }
    }
};