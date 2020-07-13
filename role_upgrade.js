/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role_upgrade');
 * mod.thing == 'a thing'; // true
 */

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
        }

        else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            creep.memory.working = true;
        }

        if (creep.memory.working == true) {
            if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller);
            }
        }
        else {
            creep.getEnergy(true,true,true);
        }
    }
};