var world;
window.addEventListener('DOMContentLoaded', function () {
	var world_canvas = document.getElementById('world');
	var ide_morph = new IDE_Morph();
	var loop = function loop() {
		requestAnimationFrame(loop);
		world.doOneCycle();
	};
	world = new WorldMorph(world_canvas);
//  world.worldCanvas.focus(); // not good for pages with iframes containing Snap! programs
	ide_morph.openIn(world);
	if (window.frameElement) { // if running in an iframe see if a local project_path is declared
		var project_path = window.frameElement.getAttribute("project_path");
		var run_full_screen = window.frameElement.getAttribute("run_full_screen");
		var full_screen = run_full_screen || window.frameElement.getAttribute("full_screen");
		var stage_scale = window.frameElement.getAttribute("stage_ratio");
		var load_project_string = 
			function (project_text) {
				// timeout wasn't needed before Snap 4.1
				// without it iframes show only Snap! background texture
				setTimeout(function () {
					           // following didn't work well - not that important
// 					           let message = new MenuMorph(null, "Loading. Please wait.");
// 			                   message.popup(world, new Point(230, 110));
							   ide_morph.rawOpenProjectString(project_text);
							   if (full_screen) {
								   ide_morph.toggleAppMode(true);
							    } 
								if (run_full_screen) {
									ide_morph.runScripts();
								}
							},
							3000);
			};
		if (project_path) {
			fetch(project_path).then(function (response) {
										 response.text().then(load_project_string);
									 }).catch(function (error) {
										 console.error("Error fetching " + project_path + ": " + error.message);
									 });
		}
		if (!full_screen) {
			ide_morph.controlBar.hide();    // no need for the control bar
			ide_morph.toggleAppMode(false); // launch in edit mode
		}
		if (stage_scale) {
			ide_morph.toggleStageSize(true, +stage_scale);
		}
		ide_morph.setBlocksScale(1); // the chapter projects were designed with default block size (though scaled via CSS)
		window.onbeforeunload = function () {}; // don't bother the user about reloading
		window.speechSynthesis.getVoices();     // no need to wait for them to load
	}
	loop();
// 	window.addEventListener('load', loop);
});

