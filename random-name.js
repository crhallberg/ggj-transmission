var adjs = [
	"Aggressive",
	"Happy",
	"Quiet",
	"Short",
	"Slippery",
	"Stupid",
	"Super",
	"World",
	"Zen",
];
var nouns = [
	"Aerial",
	"Canyon",
	"Forest",
	"Llama",
	"Marsh",
	"Powerthirst&trade;",
	"Star",
	"Tin",
	"Tornado",
	"Whatever",
];
function getRandomName() {
	return adjs[Math.floor(Math.random() * adjs.length)] + " " + nouns[Math.floor(Math.random() * nouns.length)];
}