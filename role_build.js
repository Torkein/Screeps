var roleUpgrade = require('role_upgrade');

module.exports = {
    run: function(creep)
    {
        // Code that will send building to work in another room, other than the one spawned.
        if (creep.room.name != creep.memory.target && creep.memory.target != undefined){
                var exit = creep.room.findExitTo(creep.memory.target);
                creep.moveTo(creep.pos.findClosestByRange(exit));
                return;
        }

        // If you are working but run out of energy... Stop working
        // Else aren't working and you've got all your energy, Get back to work.
        if (creep.memory.working == true && creep.carry.energy == 0) {
            creep.memory.working = false;
        } else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            creep.memory.working = true;
        }

        // Lets get to works!
        if (creep.memory.working == true) {

            var constructionSite = undefined;
            // Do I currently have a job?
            if (creep.memory.workSite != undefined) {
                // Do your Job
                construcitonSite = Game.getObjectById(creep.memory.workSite);
            }
            // I don't have work now;
            else {
                let remainingWork = creep.room.memory.abadWork;
                let newWork = creep.room.memory.bldArray;

                console.log(remainingWork);
                if (remainingWork.length > 0){

                    console.log('There is work left on the table');
                } else if (newWork.length > 0){
                    console.log('Gotta get a new job');
                }
                else {
                    console.log('There might be work left)');
                    constructionSite = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);

                }


            }

            if (constructionSite != undefined) {

                if (creep.build(constructionSite) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(constructionSite);
                }
            } else {
                roleUpgrade.run(creep);
            }
        } else {
            creep.getEnergy(true, true, true);
        }

    }
};