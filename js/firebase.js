let CONFIG = {};

const xhr = new XMLHttpRequest();
const startTime = new Date().getTime();
xhr.addEventListener('load', function loadConfig() {
	CONFIG = JSON.parse(this.responseText);
	firebase.initializeApp(CONFIG.firebase);
	document.dispatchEvent(new Event('config-loaded'));
});
xhr.open('GET', '/ggj18/js/config.json');
xhr.send();
