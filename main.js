//require ('prototype_spawn')();
require ('prototype.spawn');
require ('prototype.creep');
var roleHarvest = require('role_harvest');
var roleUpgrade = require('role_upgrade');
var roleBuild = require('role_build');
var roleRepair = require('role_repair');
var roleGather = require('role_gather');
var roleMiner = require('role_miner');
var roleLogi = require('role_logibot');
var roleTank = require('role_tank');
var roleDriller = require('role_rangedriller');
//var roleLink = require('role_linkers');
var roleClaim = require('role_claim');


module.exports.loop = function () {

    for (let name in Memory.creeps) {

        // and checking if the creep is still alive

        if (Game.creeps[name] == undefined) {

            // if not, delete the memory entry

            delete Memory.creeps[name];

        }

    }

 //   const linkFrom = Game.rooms['W9N6'].lookForAt('structure', 44, 47)[0];
 //   const linkTo = linkFrom.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: (s) => { return s.structureType == STRUCTURE_LINK && s.id == '8a0e52c9b253dfb'}});

  //  if (linkFrom.store.getFreeCapacity(RESOURCE_ENERGY) == 0 && linkFrom.cooldown == 0){
 //       linkFrom.transferEnergy(linkTo);
 //   }


    for (let name in Game.creeps) {
        var creep = Game.creeps[name];
        creep.say(creep.memory.role);
        if (creep.memory.role == 'harvest') {
            roleHarvest.run(creep);
        }
        else if (creep.memory.role == 'upgrade') {
            roleUpgrade.run(creep);
        }
        else if (creep.memory.role == 'build') {
            roleBuild.run(creep);
        }
        else if (creep.memory.role == 'repair'){
            roleRepair.run(creep);
        }
        else if (creep.memory.role == 'gather'){
            roleGather.run(creep);
        }
        else if (creep.memory.role == 'miner'){
            roleMiner.run(creep);
        }
        else if (creep.memory.role == "logi"){
            roleLogi.run(creep);
        }
        else if (creep.memory.role == 'tank'){
            roleTank.run(creep);
        }
        else if (creep.memory.role == 'driller'){
            roleDriller.run(creep);
        }
  //      else if (creep.memory.role == 'lsend' || creep.memory.role == 'lrecv'){
//            roleLink.run(creep);
 //       }
        else if (creep.memory.role == 'claim'){
            roleClaim.run(creep);
        }


    }

    var towers = _.filter(Game.structures, s => s.structureType == STRUCTURE_TOWER);
    for (let tower of towers) {
        var tgt = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (tgt != undefined) {
            tower.attack(tgt);
        }
    }

    for (let spawnName in Game.spawns) {
       Game.spawns[spawnName].spawnMinCreeps();
    }

    Game.spawns.Spawn1.overlay();

};