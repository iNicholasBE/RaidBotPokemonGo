function Raid(pokemonId, gymId, seed, long, lat, deSpawn, level) {
    // always initialize all instance properties
    this.pokemonId = pokemonId;
    this.gymId = gymId;
    this.seed = seed;
    this.long = long;
    this.lat = lat;
    this.deSpawn = deSpawn;
    this.level = level;
}
// class methods
Raid.prototype.fooBar = function() {

};
// export the class
module.exports = Raid;