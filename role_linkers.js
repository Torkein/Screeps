module.exports = {
    run: function (creep) {
        if (creep.memory.role == 'lsend') {
            if (creep.memory.working == true && creep.carry.energy == 0) {
                creep.memory.working = false;
            } else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
                creep.memory.working = true;
            }

            if (creep.memory.working == true) {

                var link = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: (s) => {
                        return (s.structureType == STRUCTURE_LINK)
                    }
                });

                if (creep.transfer(link, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){

                    creep.moveTo(link);
                }

            } else {
                var containers = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => {
                        return (s.structureType == STRUCTURE_LINK) && (s.id == '05e153dd49083df')
                    }
                });
                var source = creep.pos.findClosestByPath(containers);
                if (creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source);
                }
            }
        }
        else if (creep.memory.role == 'lrecv') {
            if (creep.memory.working == true && creep.carry.energy == 0) {
                creep.memory.working = false;
            } else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
                creep.memory.working = true;
            }

            if (creep.memory.working == true) {
                var link = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                    filter: (s) => {
                        return (s.structureType == STRUCTURE_STORAGE)
                    }
                });
                if (creep.transfer(link, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    creep.moveTo(link);

            } else {
                var containers = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => {
                        return (s.structureType == STRUCTURE_LINK) && (s.id == '8a0e52c9b253dfb')
                    }
                });
                var source = creep.pos.findClosestByPath(containers);
                if (creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source);
                }
            }
        }
    }
};