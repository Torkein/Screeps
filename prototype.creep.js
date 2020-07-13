Creep.prototype.getEnergy = function (useStorage, useContainer, useSource){
    var container = undefined;

    if (useStorage && (this.room.storage != undefined) && (this.room.storage.store[RESOURCE_ENERGY] > 0)){
        container = this.room.storage;

        if (container != undefined) {
            if (this.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.moveTo(container);
                return;
            }
        }

    } else if (useContainer || useSource) {

        if (this.memory.src_container != undefined) {
            container = Game.getObjectById(this.memory.src_container);


        } else {
            container = this.pos.findClosestByPath(FIND_STRUCTURES,
                {filter: s=> ((s.structureType == STRUCTURE_CONTAINER) && (s.store[RESOURCE_ENERGY] > 0) )});
        }

        if (container != undefined) {
    //        console.log('I made it AND here');
            if (this.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.moveTo(container);
                return;
            }
        }

    }

    if (container == undefined && useSource){
        var source = this.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
        if (this.harvest(source) == ERR_NOT_IN_RANGE){
            this.moveTo(source);
            return;
        }
    }
};
