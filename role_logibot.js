module.exports = {
    run: function(creep)
    {
        // Get your container


        if (creep.memory.working == true && creep.carry.energy == 0) {
            creep.memory.working = false;
        }

        else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            creep.memory.working = true;
        }

        if (creep.memory.working == true) {
            var structure = creep.pos.findClosestByPath(FIND_STRUCTURES,
                {filter:(z) => (z.structureType == STRUCTURE_STORAGE)});
            if (structure != undefined) {
                if (creep.transfer(structure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(structure);
                }
            }
        }
        else {
            var container = Game.getObjectById(creep.memory.src_container);
            if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(container);
            }
        }
    }
};