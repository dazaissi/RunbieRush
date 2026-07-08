const WIDTH = 800;
const HEIGHT = 450;
const GROUND_Y = HEIGHT - 95;

const GameState = {
  selectedHero: 0,   // 0 = male, 1 = female
  lastScore: 0,
  bestScore: 0
};

const HEROES = [
  { name: "Micky", key: "male" },
  { name: "Ruby", key: "female" }
];
  