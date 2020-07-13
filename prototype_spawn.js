module.exports = function () {
    StructureSpawn.prototype.customCreep =
        function (energy, job, roomName) {

            var num_of_parts = Math.floor(energy / 200);
            var body = [];
            for (let i = 0; i < num_of_parts; i++) {
                body.push(WORK);
            }
            for (let i = 0; i < num_of_parts; i++) {
                body.push(CARRY);
            }
            for (let i = 0; i < num_of_parts; i++) {
                body.push(MOVE);
            }


            return this.createCreep(body, undefined, {role: job, working: false , target: roomName});
        };

    StructureSpawn.prototype.createMiner =
        function (energy) {
            var max_work = energy - 100;
            var num_of_parts = Math.floor(max_work / 100);
            var body = [];
            for (let i = 0; i < num_of_parts; i++) {
                body.push(WORK);
            }

            body.push(CARRY);
            body.push(MOVE);



            return this.createCreep(body, undefined, {role: 'miner', working: false, src_container: undefined});
        };

    StructureSpawn.prototype.createLogi =
        function (capacity) {
            var body = [];
            for (let i = 0; i < capacity; i++) {
                body.push(CARRY);
            }
            for (let i = 0; i < capacity; i++) {
                body.push(MOVE);
            }

            return this.createCreep(body, undefined, {role: 'logi', working: false, src_container: undefined});
        };

    StructureSpawn.prototype.createCart =
        function (capacity) {
            var body = [];
            for (let i = 0; i < capacity; i++) {
                body.push(CARRY);
            }
            for (let i = 0; i < capacity; i++) {
                body.push(MOVE);
            }

            return this.createCreep(body, undefined, {role: 'gather', working: false});
        };

    StructureSpawn.prototype.createClaim =
        function (target){
            return this.createCreep([CLAIM,MOVE], undefined, {role: 'claim', target: target});
        }

    StructureSpawn.prototype.createTank =
        function (atk_prts) {
            var body = [];
            body.push(WORK);

            for (let i = 0; i < atk_prts; i++) {
                body.push(RANGED_ATTACK);
            }

            body.push(CARRY);
            body.push(MOVE);

            return this.createCreep(body, undefined, {role: 'tank', working: false});
        };

    StructureSpawn.prototype.createLSend =
        function () {
            var body = [];
            body.push(WORK);
            body.push(CARRY);
            body.push(CARRY);
            body.push(MOVE);

            return this.createCreep(body, undefined, {role: 'lsend', working: false});
        };

    StructureSpawn.prototype.createLRecv =
        function () {
            var body = [];
            body.push(WORK);
            body.push(CARRY);
            body.push(CARRY);
            body.push(MOVE);

            return this.createCreep(body, undefined, {role: 'lrecv', working: false});
        };

    StructureSpawn.prototype.createDriller =

        function (energy, numberOfWorkParts, home, target) {

            // create a body with the specified number of WORK parts and one MOVE part per non-MOVE part

            var body = [];

            for (let i = 0; i < numberOfWorkParts; i++) {

                body.push(WORK);

            }



            // 150 = 100 (cost of WORK) + 50 (cost of MOVE)

            energy -= 150 * numberOfWorkParts;



            var numberOfParts = Math.floor(energy / 100);

            for (let i = 0; i < numberOfParts; i++) {

                body.push(CARRY);

            }

            for (let i = 0; i < numberOfParts + numberOfWorkParts; i++) {

                body.push(MOVE);

            }



            // create creep with the created body

            return this.createCreep(body, undefined, {

                role: 'driller',

                home: home,

                target: target,

                working: false

            });

        };

};