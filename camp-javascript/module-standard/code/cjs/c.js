const getFavoriteGames = require("./a.js");
const { name } = require("./b.js");
function selfIntroduce() {
  // prettier-ignore
  console.log(`my name is ${name}, and my favorite games are ${getFavoriteGames()}`);
}
selfIntroduce();
