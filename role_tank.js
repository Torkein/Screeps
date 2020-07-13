var roleUpgrade = require('role_upgrade');

module.exports = {
    run: function(creep)
    {
        // Switch Flag Working
        if (creep.memory.working == true && creep.carry.energy == 0) {
            creep.memory.working = false;
        }
        else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            creep.memory.working = true;
        }

        // Tanks does some work
        if (creep.memory.working == true) {
            // Attacks bad guys (if around)
            var isEnemy = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            var structure = creep.pos.findClosestByPath(FIND_MY_STRUCTURES,
                {filter:(z) => (z.structureType == STRUCTURE_TOWER && (z.energy < z.energyCapacity))});
            var walls = creep.room.find(FIND_STRUCTURES, {filter: (w) => (w.structureType == STRUCTURE_RAMPART)});
            var tgt = undefined;

            if (isEnemy != undefined){
                if (creep.pos.findInRange(isEnemy,3)){
                    creep.rangedAttack(isEnemy);
                }
                else {
                    creep.moveTo(isEnemy);
                }
            }

            // no enemy fill the gun.

            else if (structure != undefined) {
                if (creep.transfer(structure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(structure);
                }
            }


            // no enemy repair

            else if (walls != undefined){
                var wallmax = 300000000;
                for (let wall of walls){
                    if (wall.hits < wallmax){
                        tgt = wall;
                        wallmax = wall.hits;
                        }
                    }

                if (tgt != undefined){
                    if (creep.repair(tgt) == ERR_NOT_IN_RANGE){
                        creep.moveTo(tgt);
                    }
                }
            }

            else {
                roleUpgrade.run(creep);
            }
        }
        else {
            var containers = creep.room.find(FIND_STRUCTURES, {filter:(s) => {return (s.structureType == STRUCTURE_STORAGE) && (s.store[RESOURCE_ENERGY] > 0)}});
            var source = creep.pos.findClosestByPath(containers);
            if (creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source);
            }
        }
    }
};