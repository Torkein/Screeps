module.exports = {
    run: function (creep) {

        if (creep.memory.working == true && creep.carry.energy == 0) {
            creep.memory.working = false;
        } else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            creep.memory.working = true;
        }

        if (creep.memory.working == true) {
            var structure = creep.pos.findClosestByPath(FIND_STRUCTURES,
                {filter: (z) => (z.structureType == STRUCTURE_STORAGE)});
            if (structure != undefined) {
                if (creep.transfer(structure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(structure);
                }
            }
        } else {
            var corpse = creep.room.find(FIND_TOMBSTONES);
            if (corpse != undefined) {
                var source = creep.pos.findClosestByPath(corpse)
                if (creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source);
                }
            } else {
                var source = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES);
                if (creep.pickup(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source);
                }
            }
        }
    }
};
