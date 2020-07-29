var roleUpgrade = require('role_upgrade');

module.exports = {
    run: function(creep)
    {

        // Checks if this is the end, if it is dump work into abandon'd que
        if (creep.ticksToLive == 1){
            let remainingWork = creep.room.memory.abadWork;
            remainingWork.push(creep.memory.workSite);
            creep.room.memory.abadWork = remainingWork;
            return; // Stops worker from working on last tick, Ment to reduce CPU cost by limiting memory usage
        }

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

            var constructionSite = undefined;  // Start with no site
            // Do I currently have a job?
            // Did I make a Site last ticket:  Required because of construction sites are done at the end of a tick.
            if (creep.memory.constCords != undefined){
                let site = creep.memory.constCords;
                let workSite = creep.room.lookForAt(LOOK_CONSTRUCTION_SITES, site.x, site.y);
                if (workSite[0] != undefined){
                    creep.memory.workSite = workSite[0].id;
                }
                creep.memory.constCords = undefined;
            }

            if (creep.memory.workSite != undefined) {
                // Do your Job
                constructionSite = Game.getObjectById(creep.memory.workSite);

            }

            // I don't have work now;
            else {
                let remainingWork = creep.room.memory.abadWork;
                let newWork = creep.room.memory.bldArray;
                let masterWork = creep.room.memory.mstBldArray;

                console.log(remainingWork);
                if (remainingWork.length > 0){
                    let workSite = remainingWork.pop();
                    creep.memory.workSite = workSite;
                    constructionSite = Game.getObjectById(workSite);
                    creep.room.memory.abadWork = remainingWork;


                } else if (newWork.length > 0){
                    console.log('Gotta get a new job');
                    let buildObject = newWork.pop();
                    masterWork.push({type: buildObject.type, pos: {x: buildObject.x, y:buildObject.y} });
                    let site = new RoomPosition(buildObject.pos.x, buildObject.pos.y, creep.room.name);
                    site.createConstructionSite(buildObject.type);
                    creep.memory.constCords = site;
                    creep.room.memory.bldArray = newWork;
                    creep.room.memory.mstBldArray = masterWork;


                }

                else {
                    if (Game.time % 5 == 0) {
                        console.log('There might be work left');
                        constructionSite = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
                    }

                }


            }

            if(constructionSite == undefined && creep.memory.workSite != undefined)
            {
                creep.memory.workSite = undefined;
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