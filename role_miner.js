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
            // I'm doing work
            // Is there a container saved?
            if (creep.memory.depoContainer == undefined) {
                var containers = creep.memory.conCords;
                var tgt = undefined;

                // look for a container!
                for (let contain of containers) {
                    if ((Math.abs(creep.pos.x - contain.x)) <= 1 && (Math.abs(creep.pos.y - contain.y) <= 1)) {
                        tgt = (creep.room.lookForAt(LOOK_CONSTRUCTION_SITES, new RoomPosition(contain.x, contain.y, creep.room.name)));
                    }
                }

                // I found a site
                if (tgt != undefined && tgt != '' && tgt != null){
                    creep.build(Game.getObjectById(tgt[0].id));
                } else {
                    for (let contain of containers) {
                        if ((Math.abs(creep.pos.x - contain.x)) <= 1 && (Math.abs(creep.pos.y - contain.y) <= 1)) {
                            tgt = (creep.room.lookForAt(LOOK_STRUCTURES, new RoomPosition(contain.x, contain.y, creep.room.name)));
                            for (let t of tgt){
                                if (t.structureType == STRUCTURE_CONTAINER){
                                    creep.memory.depoContainer = t.id;
                                }
                            }
                        }
                    }

                }

            } else {
                var targets = Game.getObjectById(creep.memory.depoContainer);
                if (creep.transfer(targets, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets);
                }
            }



        }
        else {
            var source = Game.getObjectById(creep.memory.src_container);
            if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source);
            }

        }
    }
};