var adjs = [
	"Aggressive",
	"Happy",
	"High-Speed",
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
	"Charity",
	"Forest",
	"Llama",
	"Marsh",
	"Powerthirst&trade;",
	"Racer",
	"Star",
	"Tin",
	"Tornado",
	"Whatever",
];
function getRandomName() {
	return adjs[Math.floor(Math.random() * adjs.length)] + " " + nouns[Math.floor(Math.random() * nouns.length)];
}