var roleUpgrade = require('role_upgrade');

module.exports = {
    run: function(creep)
    {
        if (creep.room.name != creep.memory.target && creep.memory.target != undefined){
                var exit = creep.room.findExitTo(creep.memory.target);
                creep.moveTo(creep.pos.findClosestByRange(exit));
                return;
        }

            if (creep.memory.working == true && creep.carry.energy == 0) {
                creep.memory.working = false;
            } else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
                creep.memory.working = true;
            }

            if (creep.memory.working == true) {
                var constructionSite = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
                if (constructionSite != undefined) {

                    if (creep.build(constructionSite) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(constructionSite);
                    }
                } else {
                    roleUpgrade.run(creep);
                }
            } else {

                creep.getEnergy(true,true,true);

            }

    }
};