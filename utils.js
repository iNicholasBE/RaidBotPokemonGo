module.exports = 
{
  idToName: function (id) 
  {
    switch(id) {
      case 3:
          return "Venusour";
          break;
      case 6:
          return "Charizard";
          break;
      case 9:
        return "Blastoise";
        break;
      case 59:
        return "Arcanine";
        break;
      case 65:
        return "Alkazam";
        break;
      case 68:
        return "Machamp";
        break;
      case 89:
        return "Muk";
        break;
      case 94:
        return "Gengar";
        break;
      case 103:
        return "Exeggutor";
        break;
      case 110:
        return "Weezing";
        break;
      case 112:
        return "Rhydon";
        break;
      case 125:
        return "Electabuzz";
        break;
      case 126:
        return "Magmar";
        break;
      case 129:
        return "Magikarp";
        break;
      case 131:
        return "Lapras";
        break;
      case 134:
        return "Vaporeon";
        break;
      case 135:
        return "Jolteon";
        break;
      case 136:
        return "Flareon";
        break;
      case 143:
        return "Snorlax";
        break;
      case 153:
          return "Bayleef";
          break;
      case 156:
          return "Quilava";
          break;
      case 159:
          return "Croconaw";
          break;
      case 243:
        return "Raikou";
        break;
      case 244:
        return "Entei";
        break;
      case 245:
        return "Suicune";
        break;
      case 248:
        return "Tyranitar";
        break;
      default:
        return "Pokemon #" + id;
    }
  },

  addRandomDistanceToCoords: function (coord) 
  {
      return coord + Math.floor((Math.random()*10) -5)*0.000001;
  },
  /**
 * Convert seconds to time string (hh:mm:ss).
 *
 * @param Number s
 *
 * @return String
 */
  getTimeString: function (s) {
    var dt =  new Date(s * 1e3);
    return dt;
  }
};

var privateFunction = function () 
{
};