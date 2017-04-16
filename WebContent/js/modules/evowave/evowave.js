var vismining = angular.module( 'vismining-evowave', [] );

	vismining.run(['$templateCache', function($templateCache) {
		$templateCache.put("template/vismining/evowave.html",
			"<canvas style='cursor: default; background-color: #CCCCCC; outline: none; -webkit-tap-highlight-color: rgba(255, 255, 255, 0);' />"
		);
	}]);

	vismining.factory('evowave-utilities', [function() {
		return new function() {

			this.clone = function(source) {

				var destination = undefined;

				if(typeof source === 'object' && source instanceof Array){
					destination = [];
           			source.forEach(function(elem, index){
           				var clonnedElem;
           				clonnedElem = this.clone(elem);
           				destination.push(clonnedElem);
           			}, this);
				} else if(typeof source === 'object'){
					destination = {};
					for (var property in source) {
						if(typeof source[property] === 'object'){
							destination[property] = this.clone(source[property]);
						} else {
							destination[property] = source[property];
						}
			        }
				}

				return destination;

		    };

		};
	}]);

	vismining.factory('evowave-filters', ['evowave-utilities', function(util) {
		return new function() {

			this.groupWindowsInDays = function(days, data){

				if(this.data === undefined){
					return;
				}

				if(data === undefined){
					data = this.data;
				}

				var result;

				delete this.days;

				if(this.starts !== undefined && this.ends !== undefined){
					result = this.changePeriod(this.starts, this.ends);
				} else {
					result = util.clone(data);
				}

				this.days = days;

				var aggregator = (function(sector, days){

					if(sector.sectors !== undefined){

						sector.sectors.forEach(function( s, sectorId) {

							aggregator(s, days);

						});

					} else if(sector.windows !== undefined){

						var windows = [];
						var windowsDictionary = {};

						sector.windows.forEach(function( _window, windowId ){

							var newPosition = Math.ceil(_window.position / days);

							if(windowsDictionary[newPosition] === undefined){
								windowsDictionary[newPosition] = { position: newPosition, molecules: [] };
							}

							var cWindow = windowsDictionary[newPosition];

							Array.prototype.push.apply(cWindow.molecules, _window.molecules);
							windows.push(cWindow);

						});

						sector.windows = windows;

					}
				}).bind(this);

				aggregator(result, days);

				result.window.amount = Math.ceil(data.window.amount / days);

				return result;

			};


			this.changePeriod = function(starts, ends) {

				if(this.data === undefined){
					return;
				}

				delete this.starts;
				delete this.ends;

				var cStarts = moment(this.data.period.starts, "DD/MM/YYYY");
				var cEnds = moment(this.data.period.ends, "DD/MM/YYYY");

				mStarts = moment(starts, "DD/MM/YYYY HH:mm:ss");
				mEnds = moment(ends, "DD/MM/YYYY HH:mm:ss");

				var daysAfter = mStarts.diff(cStarts, 'days');
				var daysBefore = mEnds.diff(cEnds, 'days');

				var result = util.clone(this.data);

				if((this.data.window.amount - daysAfter + daysBefore) < 0 || (this.data.window.amount - daysAfter + daysBefore) > this.data.window.amount || daysAfter < 0 || daysBefore > 0){
					return;
				}

				var remover = (function(sector, daysAfter, daysBefore) {

					if(sector.sectors !== undefined){

						sector.sectors.forEach(function( s, sectorId) {

							remover(s, daysAfter, daysBefore);

						});

					} else if(sector.windows !== undefined){

						var windows = [];

						sector.windows.forEach(function( _window, windowId ){
							if(_window.position > daysAfter && _window.position <= (this.data.window.amount + daysBefore)){
								_window.position -= daysAfter;
								windows.push(_window);
							}
						}, this);

						sector.windows = windows;

					}

				}).bind(this);

				remover(result, daysAfter, daysBefore);

				result.window.amount -= daysAfter;
				result.window.amount += daysBefore;

				if(this.days !== undefined){

					result = this.groupWindowsInDays(this.days, result);

				}

				this.starts = starts;
				this.ends = ends;

				return result;

			};

		};

	}]);

	vismining.factory('evowave-algorithm', ['evowave-utilities', function(util) {

		/*
			TODO: this should be another project (perhaps evowave-js)
			TODO: should use its own forEach solution to remove angular.forEach dependency
		*/
		return new function() {

			this.exceptions = {
				SectorNotFoundException: function(sectorId) {
					return 'SectorNotFoundException';
				}
			};

			this.messages = {
				noDataFound: 'No data found to display!',
				loading: 'Loading...',
				tooManyData: 'The current configuration generates a visualization too big for this browser. Please, use the filters to reduce the amount of data to be analyzed.'
			};

			this.colors = {
				background_canvas:  'FFFFFFFF',
				background:  		'FFFFFFFF',
				sector_odd:  		'FFCCCCCC',
				sector_even: 		'FFCCCCCC',
				guidelines:  		'FF5796FD',
				window_guideline:	'6E000000',
				messages: 	 		'FF000000',
				sectorlines: 		'FF000000',
				molecule: 	 		'FF333333',
				selection:   		'F0000000',
				fromAmount:  		'FF0000FF',
				toAmount:    		'FFFF0000',
				matchQuery: 		'FFCCCCCC'
			};

			this.fonts = {
				SectorLabel: { font: undefined, fontName: 'Calibri', size: 12, color: 'FF000000' },
				Messages: { font: undefined, fontName: 'Arial', size: 12, color: 'FF000000' }
			};


			this.start = function() {
				this.mode = 'OVERVIEW';
				this.sector = undefined;
				this.sectors = undefined;

				angular.forEach(this.fonts, function(font, fontId){
					font.font = this.loadFont(font.fontName);
				}, this);

				this.loadFontInBuffer(this, this.fonts.Messages);


				if(this.data === undefined){
					console.log('teste')
					this.background(this.unhex(this.colors.background_canvas));
					this.fill(this.unhex(this.colors.messages));
					this.text(this.messages.noDataFound, (this.width - this.textWidth(this.messages.noDataFound))/2, this.height/2);
				}

				this.init();
			};

			this.init = function() {

				this.isInitialized = false;

				if(this.data === undefined){
					return false;
				}

				var sectorWithSmallestAngle;
				var previousSector;
				var biggestSectorLabel = 0;

				delete this.dirty;
				delete this.mouseTracker;

				if(this.mode === undefined){
					this.mode = 'OVERVIEW';
				}

				if(this.data.window === undefined){
					this.data.window = { size: 5, amount: 50 };
				}

				if(this.sector === undefined){
					this.sector = this.data;
					this.sector.label = this.data.sector.label;
					this.sectorsZoom = [];
				}

				this.loadFontInBuffer(this, this.fonts.SectorLabel);

				this.data.window.max = 0;

				if(this.mode === 'OVERVIEW'){
					this.sectors = [];
					this.sectors.push(this.sector);
				} else if(this.mode === 'DETAILED'){
					this.sectors = this.sector.sectors;
				}

				this.extractWindowsFromSectors(this.data);

				angular.forEach(this.sectors, function(sector, sectorId) {

					var startAngle = 0;
					var endAngle = (Math.PI * 2);
					var sectorAngle = sector.angle;

					if(this.mode === 'OVERVIEW'){
						sectorAngle = 1;
					}

					sector.startAngle = (previousSector === undefined) ? startAngle : previousSector.endAngle;
					sector.endAngle = sector.startAngle + ((endAngle-startAngle) * sectorAngle);

					previousSector = sector;

					if(sectorWithSmallestAngle === undefined){
						sectorWithSmallestAngle = sector;
					} else if(sectorWithSmallestAngle.angle > sectorAngle){
						sectorWithSmallestAngle = sector;
					}

					if(biggestSectorLabel === undefined || biggestSectorLabel < this.textWidth(sector.label) ){
						biggestSectorLabel = this.textWidth(sector.label);
					}

					sector.max = 0;

					angular.forEach(sector.windows, function(_window, windowId){
						if(_window.molecules.length > sector.max && _window.position <= this.data.window.amount){
							sector.max = _window.molecules.length;
						}
					}, this);

					if(sector.max > this.data.window.max) {
						this.data.window.max = sector.max;
					}

				}, this);

				var fromColor = new Color(	this.red(this.unhex(this.colors.fromAmount)),
											this.green(this.unhex(this.colors.fromAmount)),
											this.blue(this.unhex(this.colors.fromAmount)));

				var toColor = new Color(	this.red(this.unhex(this.colors.toAmount)),
											this.green(this.unhex(this.colors.toAmount)),
											this.blue(this.unhex(this.colors.toAmount)));


				this.amountColorTransition = new ColorTransition(fromColor, toColor, this.data.window.max);

				this.smallestRadius = this.data.window.size;

				do {
					this.smallestRadius++;
					var offset = Math.atan((this.data.window.size) / this.smallestRadius) + (Math.atan( 4 /*sector border weight*/ / this.smallestRadius ) * 2);
				} while((sectorWithSmallestAngle.startAngle + offset) > (sectorWithSmallestAngle.endAngle - offset));

				this.biggestRadius = this.smallestRadius + ((this.data.window.amount) * this.data.window.size) + 6;

				var size = (this.biggestRadius + biggestSectorLabel + 13)*2;

				if(size >= 32767 || size * size >= 268435456){
					//console.debug(size);
					this.background(this.unhex(this.colors.background_canvas));
					this.fill(this.unhex(this.colors.messages));
					this.text(this.messages.tooManyData, (this.width - this.textWidth(this.messages.tooManyData))/2, this.height/2);
					return;
				}

				if(this.buffer === undefined || this.buffer.width !== (this.biggestRadius + biggestSectorLabel + 13)*2 || this.buffer.height !== (this.biggestRadius + biggestSectorLabel + 13)*2){
					this.buffer = this.createGraphics(size, size, 1);
				}

				this.center = {x: (this.buffer.width/2), y: (this.buffer.width/2)};

				this.isInitialized = true;

				this.biggestRadius -=4;
				this.smallestRadius +=1;

				this.draw();

			};

			this.extractWindowsFromSectors = function(sector) {
				if(sector.sectors !== undefined){

					var context = {};

					context.windows = [];
					context.windowsDictionary = {};
					context['extractWindowsFromSectors'] = this.extractWindowsFromSectors;

					angular.forEach(sector.sectors, function(_sector, sectorId) {

						this.extractWindowsFromSectors(_sector);

						_sector.windows.some(function(_window, windowId){

							if(this.windowsDictionary[_window.position] === undefined){
								this.windowsDictionary[_window.position] = { position: _window.position, molecules: [] };
								this.windows.push(this.windowsDictionary[_window.position]);
							}

							var cWindow = this.windowsDictionary[_window.position];

							Array.prototype.push.apply(cWindow.molecules, _window.molecules);

						}, context);

					}, context);

					sector.windows = context.windows;

				}
			};

			this.draw = function() {

				if(this.data === undefined || !this.isInitialized) {
					return;
				}

				var execTime = Date.now();

				var srcX = Math.round(Math.min(Math.max(0, this.center.x - (this.width/2)), this.buffer.width));
				var	srcY = Math.round(Math.min(Math.max(0, this.center.y - (this.height/2)), this.buffer.width));
				var	dstX = Math.round(Math.abs(Math.min(0, this.center.x - (this.width/2))));
				var	dstY = Math.round(Math.abs(Math.min(0, this.center.y - (this.height/2))));

				var	srcWidth = Math.round(Math.max(0, Math.min((this.buffer.width) - srcX, (this.width) - dstX)));
				var	srcHeight = Math.round(Math.max(0, Math.min((this.buffer.width) - srcY, (this.height) - dstY)));
				var	dstWidth = srcWidth;
				var	dstHeight = srcHeight;

				if(this.dirty === undefined) {
					this.reset();
					angular.forEach(this.sectors, function(sector, sectorId) {
						this.drawSector(sectorId);
					}, this);
				} else if(Object.keys(this.dirty).length > 0) {
					angular.forEach(this.dirty, function(sector, sectorId) {
						if(sector.windows !== undefined && Object.keys(sector.windows).length > 0) {
							angular.forEach(sector.windows, function(_window, windowId) {
								if(_window.molecules !== undefined && Object.keys(_window.molecules).length > 0){
									angular.forEach(_window.molecules, function(molecule, moleculeId) {
										this.drawMolecule(sectorId, windowId, moleculeId);
									}, this);
								} else if(_window.moleculeGroups !== undefined && Object.keys(_window.moleculeGroups).length > 0){
									angular.forEach(_window.moleculeGroups, function(moleculeGroup, moleculeGroupId) {
										this.drawMoleculeGroup(sectorId, windowId, moleculeGroupId);
									}, this);
								} else {
									this.drawWindow(sectorId, windowId);
								}
							}, this);
						} else {
							this.drawSector(sectorId);
						}
					}, this);
 				}

 				this.buffer.loadPixels(srcX, srcY, srcWidth, srcHeight);

				this.dirty = {};

				this.background(this.unhex(this.colors.background_canvas));
				this.loadPixels();

				for(var x = srcX; x < srcWidth + srcX; x++){
					for(var y = srcY; y < srcHeight + srcY; y++){
						this.pixels.setPixel(((y-srcY+dstY) * this.width) + (x-srcX+dstX), this.buffer.pixels.getPixel((y * this.buffer.width) + x));
					}
				}

				this.updatePixels();

				console.log('Drawing in ' + (Date.now() - execTime) + 'ms');
			};

			this.loadFontInBuffer = function(buffer, font) {
				buffer.fill(buffer.unhex(font.color));
				buffer.textFont(font.font);
				buffer.textSize(font.size);
			};

			this.drawSector = function(sectorId) {

				var sector = this.sectors[sectorId];

				this.cleanSector(sectorId);

				this.buffer.stroke(this.buffer.unhex(this.colors.sectorlines));
				this.buffer.strokeWeight(2);

				this.buffer.line(	(this.buffer.width/2) + (this.smallestRadius * this.buffer.cos(sector.startAngle)),
									(this.buffer.width/2) + (this.smallestRadius * this.buffer.sin(sector.startAngle)),
									(this.buffer.width/2) + (this.biggestRadius * this.buffer.cos(sector.startAngle)),
									(this.buffer.width/2) + (this.biggestRadius * this.buffer.sin(sector.startAngle)));

				this.buffer.line(	(this.buffer.width/2) + (this.smallestRadius * this.buffer.cos(sector.endAngle)),
									(this.buffer.width/2) + (this.smallestRadius * this.buffer.sin(sector.endAngle)),
									(this.buffer.width/2) + (this.biggestRadius * this.buffer.cos(sector.endAngle)),
									(this.buffer.width/2) + (this.biggestRadius * this.buffer.sin(sector.endAngle)));

				this.loadFontInBuffer(this.buffer, this.fonts.SectorLabel);

				var sectorLabelAngle = sector.startAngle + ((sector.endAngle - sector.startAngle) / 2);
				var sectorLabelRadius = (this.biggestRadius + (this.textWidth(sector.label) / 2)) + 12;

				var sectorLabelPosition = { x: (this.buffer.width/2) + (sectorLabelRadius * this.buffer.cos(sectorLabelAngle)),
											y: (this.buffer.width/2) + (sectorLabelRadius * this.buffer.sin(sectorLabelAngle))};

				this.buffer.fill(this.buffer.unhex(this.fonts.SectorLabel.color));

				this.buffer.pushMatrix();
				this.buffer.translate(sectorLabelPosition.x, sectorLabelPosition.y);
				if(sectorLabelAngle > (Math.PI/2) && sectorLabelAngle < Math.PI + (Math.PI/2)) {
					this.buffer.rotate(sectorLabelAngle + Math.PI);
				} else {
					this.buffer.rotate(sectorLabelAngle);
				}

				this.buffer.text(sector.label, -(this.textWidth(sector.label)/2), this.fonts.SectorLabel.size/4);
				this.buffer.popMatrix();

				angular.forEach(sector.windows, function(_window, windowId){
					this.drawWindow(sectorId, windowId);
				}, this);

			};

			this.fillWindow = function(sectorId, windowId) {
				var sector = this.sectors[sectorId];
				var _window = sector.windows[windowId];

				var w = this.smallestRadius + ((_window.position-1)*this.data.window.size);

				var startAngle = sector.startAngle + (Math.atan( 2/*sector border weight*/ / (w + (this.data.window.size/2)) ));
				var endAngle = sector.endAngle - (Math.atan( 2/*sector border weight*/ / (w + (this.data.window.size/2)) ));

				this.fillSector(startAngle, endAngle, (w+this.data.window.size), w);

			};

			this.cleanWindow = function(sectorId, windowId) {
				this.buffer.fill(this.buffer.unhex(this.colors.background));
				this.buffer.noStroke();
				this.fillWindow(sectorId, windowId);
			};

			this.cleanSector = function(sectorId) {

				var sector = this.sectors[sectorId];

				if(sector.background === undefined){
					if((sectorId % 2) == 0){
						sector.background = this.colors.sector_odd;
					} else {
						sector.background = this.colors.sector_even;
					}
				}

				this.buffer.fill(this.buffer.unhex(sector.background));
				this.buffer.stroke(this.buffer.unhex(sector.background));
				this.fillSector(sector.startAngle, sector.endAngle, this.biggestRadius, this.smallestRadius);

			};

			this.fillSector = function(startAngle, endAngle, biggestRadius, smallestRadius) {
				var angle = startAngle;

				this.buffer.beginShape();

				while(angle <= endAngle){
					var nextAngle = Math.min(endAngle, angle + (Math.PI/90));

					this.buffer.vertex((this.buffer.width/2) + (smallestRadius * this.buffer.cos(angle)), (this.buffer.width/2) + (smallestRadius * this.buffer.sin(angle)));
					this.buffer.vertex((this.buffer.width/2) + (smallestRadius * this.buffer.cos(nextAngle)), (this.buffer.width/2) + (smallestRadius * this.buffer.sin(nextAngle)));

					angle += (Math.PI/90);
				}

				angle = endAngle;

				while(angle >= startAngle){
					var nextAngle = Math.max(startAngle, angle - (Math.PI/90));

					this.buffer.vertex((this.buffer.width/2) + (biggestRadius * this.buffer.cos(angle)), (this.buffer.width/2) + (biggestRadius * this.buffer.sin(angle)));
					this.buffer.vertex((this.buffer.width/2) + (biggestRadius * this.buffer.cos(nextAngle)), (this.buffer.width/2) + (biggestRadius * this.buffer.sin(nextAngle)));

					angle -= (Math.PI/90);
				}


				this.buffer.endShape(2);
			};



			this.drawWindow = function(sectorId, windowId) {
				var sector = this.sectors[sectorId];
				var _window = sector.windows[windowId];

				if(_window.position > this.data.window.amount) {
					return;
				}

				_window.offset = Math.atan((this.data.window.size) / ((_window.position * this.data.window.size) + this.smallestRadius));

				var w = this.smallestRadius + ((_window.position-1)*this.data.window.size) + (this.data.window.size/2);
				var startAngle = sector.startAngle + Math.atan( 3*3 /*sector border weight*/ / w ) + (_window.offset/2);
				var endAngle = sector.endAngle - Math.atan( 3*3 /*sector border weight*/ / w ) - (_window.offset/2);

				this.cleanWindow(sectorId, windowId);

				var offset = ((endAngle - startAngle)/Math.max((_window.molecules.length-1), 1));

				var amountColor = (_window.molecules.length * 200) / this.data.window.max;

				var hex = this.amountColorTransition.getColorAtValue(_window.molecules.length/(this.data.window.max+1)).getHex();

				if(this.data.window.mode === 'LOCAL'){
					hex = this.amountColorTransition.getColorAtValue(_window.molecules.length/(sector.max+1)).getHex();
				}

				amountColor = this.buffer.unhex('FF' + hex.substring(1, hex.length));

				this.buffer.strokeWeight(1);
				this.buffer.fill(amountColor);
				this.buffer.stroke(amountColor);
				this.fillSector(
					sector.startAngle + Math.atan( 3 /*sector border weight*/ / w ),
					sector.startAngle + Math.atan( 4 /*sector border weight*/ / w ),
					(_window.position * this.data.window.size) + this.smallestRadius - this.data.window.size + 1,
					(_window.position * this.data.window.size) + this.smallestRadius - 1
				);

				this.fillSector(
					sector.endAngle - Math.atan( 4 /*sector border weight*/ / w ),
					sector.endAngle - Math.atan( 3 /*sector border weight*/ / w ),
					(_window.position * this.data.window.size) + this.smallestRadius - this.data.window.size + 1,
					(_window.position * this.data.window.size) + this.smallestRadius - 1
				);

				if(_window.molecules !== undefined && _window.offset <= offset) {

					var moleculeIndex = 0;

					if(_window.molecules.length === 1){
						moleculeIndex = 1;
						offset = (endAngle - startAngle) / 2;
					}

					_window.hasSpace = true;

					angular.forEach(_window.molecules, function(molecule, moleculeId) {

						angle = (moleculeIndex * offset);

						moleculeIndex++;

						molecule.position = {
							x: this.buffer.width/2 + ((((_window.position * this.data.window.size) + this.smallestRadius) - this.data.window.size/2) * this.cos(startAngle + angle)),
							y: this.buffer.width/2 + ((((_window.position * this.data.window.size) + this.smallestRadius) - this.data.window.size/2) * this.sin(startAngle + angle)),
							angle: startAngle + angle
						};

						molecule.matchQuery = function(query){
							return query === undefined || query.length == 0 || typeof eval(query) !== 'boolean' || eval(query);
						}.call(util.clone(molecule.data), this.data.query);

						if(molecule.matchQuery){
							_window.matchQuery++;
							sector.matchQuery++;
						}

						this.drawMolecule(sectorId, windowId, moleculeId);

					}, this);

				} else {

					startAngle  = startAngle - _window.offset/2 + Math.atan( 1 / w );
					endAngle = endAngle + _window.offset/2 - Math.atan( 1 / w );

					_window.hasSpace = false;

					_window.groups = {};

					_window.matchQuery = 0;

					angular.forEach(_window.molecules, function(molecule, moleculeId) {

						if(molecule.color === undefined){
							molecule.color = this.colors.molecule;
						}

						if(_window.groups['_' + molecule.color] === undefined){
							_window.groups['_' + molecule.color] = {startAngle: 0, endAngle: 0, matchQuery: 0, molecules: []};
						}

						molecule.matchQuery = function(query){
							return query === undefined || query.length == 0 || typeof eval(query) !== 'boolean' || eval(query);
						}.call(util.clone(molecule.data), this.data.query);

						if(molecule.matchQuery){
							_window.groups['_' + molecule.color].matchQuery++;
							_window.matchQuery++;
							sector.matchQuery++;
						}

						_window.groups['_' + molecule.color].molecules.push(moleculeId);
					}, this);

					var _startAngle = startAngle;

					angular.forEach(_window.groups, function(group, groupId) {
						angle = (endAngle - startAngle) * (group.molecules.length / _window.molecules.length);

						group.startAngle = _startAngle;
						group.endAngle = _startAngle + angle;

						this.drawMoleculeGroup(sectorId, windowId, groupId);
						_startAngle += angle;
					}, this);
				}

			};

			this.drawMoleculeGroup = function(sectorId, windowId, moleculeGroupId) {

				this.cleanMoleculeGroup(sectorId, windowId, moleculeGroupId);

				var sector = this.sectors[sectorId];
				var _window = sector.windows[windowId];
				var moleculeGroup = _window.groups[moleculeGroupId];

				var w = this.smallestRadius + ((_window.position-1)*this.data.window.size);
				var startAngle = moleculeGroup.startAngle;
				var endAngle = moleculeGroup.endAngle;
				var biggestRadius = w + this.data.window.size;
				var smallestRadius = w;


				if(moleculeGroup.matchQuery >= 0){
					var matchQueryAngle = (endAngle - startAngle) - (((endAngle - startAngle) * moleculeGroup.matchQuery) / moleculeGroup.molecules.length);
					endAngle -= matchQueryAngle;
				}


				this.buffer.fill(this.buffer.unhex(moleculeGroupId.replace('_','')));
				this.buffer.noStroke();
				this.fillSector(startAngle, endAngle, biggestRadius, smallestRadius);


				if(moleculeGroup.matchQuery >= 0){
					this.buffer.fill(this.buffer.unhex(this.colors.matchQuery));
					this.buffer.noStroke();
					this.fillSector(endAngle, endAngle + matchQueryAngle, biggestRadius, smallestRadius);
				}

			};

			this.cleanMoleculeGroup = function(sectorId, windowId, moleculeGroupId) {

				var sector = this.sectors[sectorId];
				var _window = sector.windows[windowId];
				var moleculeGroup = _window.groups[moleculeGroupId];

				var w = this.smallestRadius + ((_window.position-1)*this.data.window.size);
				var startAngle = moleculeGroup.startAngle;
				var endAngle = moleculeGroup.endAngle;
				var biggestRadius = w + this.data.window.size;
				var smallestRadius = w;

				this.buffer.fill(this.buffer.unhex(this.colors.background));
				this.buffer.noStroke();
				this.fillSector(startAngle, endAngle, biggestRadius, smallestRadius);

			};

			this.drawMolecule = function(sectorId, windowId, moleculeId) {

				this.cleanMolecule(sectorId, windowId, moleculeId);

				var sector = this.sectors[sectorId];
				var _window = sector.windows[windowId];
				var molecule = _window.molecules[moleculeId];

				if(molecule.color === undefined){
					molecule.color = this.colors.molecule;
				}

				if(!molecule.matchQuery){
					this.buffer.strokeWeight(1);
					this.buffer.fill(this.buffer.unhex(this.colors.background));
					this.buffer.stroke(this.buffer.unhex(this.colors.matchQuery));
				} else {
					this.buffer.strokeWeight(1);
					this.buffer.fill(this.buffer.unhex(molecule.color));
					this.buffer.stroke(this.buffer.unhex(molecule.color));
				}

				this.buffer.ellipse(	molecule.position.x,
										molecule.position.y,
										this.data.window.size-3,
										this.data.window.size-3);
			};

			this.cleanMolecule = function(sectorId, windowId, moleculeId) {

				var sector = this.sectors[sectorId];
				var _window = sector.windows[windowId];
				var molecule = _window.molecules[moleculeId];

				if(molecule.color === undefined){
					molecule.color = this.colors.molecule;
				}

				this.buffer.fill(this.buffer.unhex(this.colors.background));
				this.buffer.noStroke();

				this.buffer.ellipse(	molecule.position.x,
										molecule.position.y,
										this.data.window.size-3,
										this.data.window.size-3);

			};

			this.reset = function() {

				this.clean();

				this.biggestRadius +=4;
				this.smallestRadius -=1;

				this.buffer.noFill();
				this.buffer.stroke(this.buffer.unhex(this.colors.guidelines));
				this.buffer.strokeWeight(1);
				this.buffer.arc((this.buffer.width/2), (this.buffer.width/2), (this.biggestRadius*2),  (this.biggestRadius*2), 0, Math.PI * 2);

				this.biggestRadius -= 3;

				this.buffer.noFill();
				this.buffer.stroke(this.buffer.unhex(this.colors.guidelines));
				this.buffer.strokeWeight(1);
				this.buffer.arc((this.buffer.width/2), (this.buffer.width/2), (this.biggestRadius*2),  (this.biggestRadius*2), 0, Math.PI * 2);

				this.buffer.noFill();
				this.buffer.stroke(this.buffer.unhex(this.colors.guidelines));
				this.buffer.strokeWeight(1);
				this.buffer.arc((this.buffer.width/2), (this.buffer.width/2), (this.smallestRadius*2), (this.smallestRadius*2), 0, Math.PI * 2);

				this.biggestRadius -= 1;
				this.smallestRadius += 1;

			};

			this.clean = function() {
				this.buffer.background(this.buffer.unhex(this.colors.background_canvas));
				this.buffer.background(this.buffer.unhex(this.colors.background_canvas));
			};


			this.updateMouseTracker = function() {

				if(this.mouseTracker !== undefined) {
					delete this.mouseTracker.previously;
				}

				var previouslyMouseTracker = this.mouseTracker;

				this.mouseTracker = { 	x: this.mouseX,
										y: this.mouseY,
										previously: previouslyMouseTracker};

				var srcX = Math.min(Math.max(0, this.center.x - (this.width/2)), this.buffer.width);
				var	srcY = Math.min(Math.max(0, this.center.y - (this.height/2)), this.buffer.width);
				var	dstX = Math.abs(Math.min(0, this.center.x - (this.width/2)));
				var	dstY = Math.abs(Math.min(0, this.center.y - (this.height/2)));

				var	srcWidth = Math.max(0, Math.min((this.buffer.width) - srcX, (this.width) - dstX));
				var	srcHeight = Math.max(0, Math.min((this.buffer.width) - srcY, (this.height) - dstY));
				var	dstWidth = srcWidth;
				var	dstHeight = srcHeight;

				var centerX = this.center.x;
				var centerY = this.center.y;

				var bufferX = this.buffer.width/2 - (this.mouseTracker.x - this.width/2);
				var bufferY = this.buffer.width/2 - (this.mouseTracker.y - this.height/2);

				this.mouseTracker.angle = Math.abs(Math.atan((bufferY - centerY)/(bufferX - centerX)));
				this.mouseTracker.radius = Math.round(Math.abs((bufferX - centerX) / Math.cos(this.mouseTracker.angle)));

				if(isNaN(this.mouseTracker.radius)){
					this.mouseTracker.radius = Math.abs((bufferY - centerY) / Math.sin(this.mouseTracker.angle));
				}

				if(bufferX > centerX && bufferY < centerY){
					this.mouseTracker.angle = ((Math.PI/2) - this.mouseTracker.angle) + (Math.PI/2);
				} else if(bufferX > centerX && bufferY > centerY){
					this.mouseTracker.angle += Math.PI;
				} else if(bufferX < centerX && bufferY > centerY){
					this.mouseTracker.angle = ((Math.PI/2) - this.mouseTracker.angle) + Math.PI + (Math.PI/2);
				}

				if(isNaN(this.mouseTracker.angle)){
					this.mouseTracker.angle = 0;
				}

				if(isNaN(this.mouseTracker.radius)){
					this.mouseTracker.radius = 0;
				}

				var windowPosition = Math.min(this.data.window.amount, Math.max(0, Math.ceil((this.mouseTracker.radius - this.smallestRadius) / this.data.window.size)));

				angular.forEach(this.sectors, function(sector, sectorId){
					if(this.mouseTracker.angle >= sector.startAngle && this.mouseTracker.angle <= sector.endAngle){
						this.mouseTracker.sector = sectorId;
						this.mouseTracker.sectorLabel = sector.label;
						angular.forEach(sector.windows, function(_window, windowId){
							if(_window.position === windowPosition){
								this.mouseTracker.window = windowId;
								this.mouseTracker.windowId = _window.position;
								if(_window.hasSpace){
									angular.forEach(_window.molecules, function(molecule, moleculeId){
										if(this.mouseTracker.angle <= molecule.position.angle + (_window.offset/2) && this.mouseTracker.angle >= molecule.position.angle - (_window.offset/2)){
											this.mouseTracker.molecule = moleculeId;
											this.mouseTracker.moleculeData = molecule.data;
											return false;
										}
									}, this);
								} else {
									angular.forEach(_window.groups, function(group, groupId){
										if(this.mouseTracker.angle <= group.endAngle && this.mouseTracker.angle >= group.startAngle){
											this.mouseTracker.group = groupId;
											return false;
										}
									}, this);
								}
								return false;
							}
						}, this);
						return false;
					}
				}, this);

				this.onMouseTrackerUpdatedHandler(this.mouseTracker);

			};

			this.makeDirty = function(sectorId, windowId, moleculeId, moleculeGroupId) {

				if(sectorId === undefined) {
					delete this.dirty;
					return;
				}

				if(this.dirty === undefined){
					this.dirty = {};
				}

				if(this.dirty[sectorId] === undefined) {
					this.dirty[sectorId] = { windows: {} };
				}

				if(windowId !== undefined && this.dirty[sectorId].windows[windowId] === undefined) {
					this.dirty[sectorId].windows[windowId] = { molecules: {}, moleculeGroups: {} };
				}

				if(moleculeId !== undefined && this.dirty[sectorId].windows[windowId].molecules[moleculeId] === undefined) {
					this.dirty[sectorId].windows[windowId].molecules[moleculeId] = 'dirty';
				}

				if(moleculeId !== undefined && this.dirty[sectorId].windows[windowId].moleculeGroups[moleculeGroupId] === undefined) {
					this.dirty[sectorId].windows[windowId].moleculeGroups[moleculeGroupId] = 'dirty';
				}

			};

			this.drawSelection = function() {

				var srcX = Math.round(Math.min(Math.max(0, this.center.x - (this.width/2)), this.buffer.width));
				var	srcY = Math.round(Math.min(Math.max(0, this.center.y - (this.height/2)), this.buffer.width));
				var	dstX = Math.round(Math.abs(Math.min(0, this.center.x - (this.width/2))));
				var	dstY = Math.round(Math.abs(Math.min(0, this.center.y - (this.height/2))));

				var	srcWidth = Math.round(Math.max(0, Math.min((this.buffer.width) - srcX, (this.width) - dstX)));
				var	srcHeight = Math.round(Math.max(0, Math.min((this.buffer.width) - srcY, (this.height) - dstY)));
				var	dstWidth = srcWidth;
				var	dstHeight = srcHeight;

				if(this.mouseTracker.previously !== undefined && this.mouseTracker.previously.sector === this.mouseTracker.sector && this.mouseTracker.previously.window === this.mouseTracker.window){
					return;
				}

				if(this.mouseTracker.sector !== undefined && this.mouseTracker.window !== undefined){
					var doSelection = true;

					if(this.selectionTracker !== undefined){
						if(this.selectionTracker.previously !== undefined && this.selectionTracker.previously.sector === this.mouseTracker.sector && this.selectionTracker.previously.window === this.mouseTracker.window) {
							doSelection = false;
						} else {
							angular.forEach(this.selectionTracker.selections, function(selection, selectionSector) {
								if((selection.max.sector === this.mouseTracker.sector && selection.max.window === this.mouseTracker.window) || (selection.min.sector === this.mouseTracker.sector && selection.min.window === this.mouseTracker.window)){
									doSelection = false;
								}
							}, this);
						}
					}

					if(doSelection){
						this.buffer.fill(this.unhex(this.colors.selection));
						this.buffer.noStroke();
						this.fillWindow(this.mouseTracker.sector, this.mouseTracker.window);
					}
				}


				if(this.mouseTracker.previously !== undefined && this.mouseTracker.previously.sector !== undefined && this.mouseTracker.previously.window !== undefined){

					var makeDirty = true;

					if(this.selectionTracker !== undefined){
						if(this.selectionTracker.previously !== undefined && this.selectionTracker.previously.sector === this.mouseTracker.previously.sector && this.selectionTracker.previously.window === this.mouseTracker.previously.window) {
							makeDirty = false;
						} else {
							angular.forEach(this.selectionTracker.selections, function(selection, selectionSector) {
								if((selection.max.sector === this.mouseTracker.previously.sector && selection.max.window === this.mouseTracker.previously.window) || (selection.min.sector === this.mouseTracker.previously.sector && selection.min.window === this.mouseTracker.previously.window)){
									makeDirty = false;
								}
							}, this);
						}
					}

					if(makeDirty){
						this.makeDirty(this.mouseTracker.previously.sector, this.mouseTracker.previously.window);
					}
				} else {
					this.buffer.loadPixels(srcX, srcY, srcWidth, srcHeight);
				}

				this.redraw();
			};

			this.drawWindowGuideline = function() {

				var windowPosition = Math.ceil((this.mouseTracker.radius - this.smallestRadius) / this.data.window.size);

				if(this.mouseTracker.previously !== undefined){

					var previouslyWindowPosition = Math.ceil((this.mouseTracker.previously.radius - this.smallestRadius) / this.data.window.size);

					if(windowPosition == previouslyWindowPosition) {
						return;
					}

					if(this.mouseTracker.previously.sector !== undefined && (previouslyWindowPosition > 0 && previouslyWindowPosition <= this.data.window.amount)){
						for(i = 0; i < this.sectors.length; i++){

							var sector = this.sectors[i];

							var windowPositionPreviously = Math.min(this.data.window.amount, Math.max(0, Math.ceil((this.mouseTracker.previously.radius - this.smallestRadius) / this.data.window.size)));

							var w = this.smallestRadius + ((windowPositionPreviously-1)*this.data.window.size);

							var startAngle = sector.startAngle + (Math.atan( 2/*sector border weight*/ / (w + (this.data.window.size/2)) ));
							var endAngle = sector.endAngle - (Math.atan( 2/*sector border weight*/ / (w + (this.data.window.size/2)) ));

							var result = {};

							var hasWindow = sector.windows.some(function(_window, windowId){
								if(_window.position === windowPositionPreviously){
									this.windowId = windowId;
									return true;
								}
							}, result);

							if(hasWindow){
								this.makeDirty(i, result.windowId);
							} else {
								this.buffer.fill(this.buffer.unhex(sector.background));
								this.buffer.noStroke();
								this.fillSector(startAngle, endAngle, (w+this.data.window.size-1), w+1);
							}
						}
					}

				}

				if(this.mouseTracker.sector !== undefined && (windowPosition > 0 && windowPosition <= this.data.window.amount)){

					var sector = this.sectors[this.mouseTracker.sector];

					var radius = this.smallestRadius + ( windowPosition * this.data.window.size) - this.data.window.size/2;

					this.buffer.noFill();
					this.buffer.stroke(this.buffer.unhex(this.colors.window_guideline));
					this.buffer.ellipse(this.buffer.width/2, this.buffer.height/2, radius * 2, radius * 2);
				}

				this.redraw();

			};

			this.showMoleculeInfo = function() {

				document.getElementById("sector").innerHTML = this.mouseTracker.sectorLabel;
				document.getElementById("window").innerHTML = this.mouseTracker.windowId;
				document.getElementById("files_modified").innerHTML = this.mouseTracker.moleculeData.files_modified;
				document.getElementById("lines_modified").innerHTML = this.mouseTracker.moleculeData.lines_modified;
			};

			this.mouseMoved = function() {
				if(!this.isInitialized){
					return;
				}

				this.updateMouseTracker();
				this.externals.canvas.style.cursor = 'crosshair';
				this.drawWindowGuideline();
				this.showMoleculeInfo();
			};

			this.mouseDragged = function() {
				if(!this.isInitialized){
					return;
				}

				if(this.mouseButton === 37) {
					if(this.mouseTracker === undefined){
						this.updateMouseTracker();
					}
					this.externals.canvas.style.cursor = '-webkit-grabbing';
					this.center.x += this.mouseTracker.x - this.mouseX;
					this.center.y += this.mouseTracker.y - this.mouseY;
					this.redraw();
					this.updateMouseTracker();
				}
			};

			this.mouseClicked = function() {

				if(!this.isInitialized){
					return;
				}

				this.updateMouseTracker();

				var redraw = false;

				if(this.mouseButton == 37 || this.mouseButton == 39){
					if(this.mouseButton == 37) {
						if(this.mode === 'OVERVIEW'){
							if(this.sector.sectors !== undefined){
								this.mode = 'DETAILED';
								redraw = true;
							}
						} else if(this.mode === 'DETAILED') {
							this.mode = 'OVERVIEW';
							this.sectorsZoom.push(this.sector);
							this.sector = this.sectors[this.mouseTracker.sector];
							redraw = true;
						}
					} else if(this.mouseButton == 39){
						if(this.mode === 'DETAILED'){
							this.mode = 'OVERVIEW';
							redraw = true;
						} else if(this.mode === 'OVERVIEW') {
							if(this.sectorsZoom.length > 0){
								this.mode = 'DETAILED';
								this.sector = this.sectorsZoom.pop();
								redraw = true;
							}
						}
					}

					if(redraw){
						this.isInitialized = false;
						this.background(this.unhex(this.colors.background));
						this.loadFontInBuffer(this, this.fonts.Messages);
						this.text(this.messages.loading, this.width/2 - (this.textWidth(this.messages.loading)/2), this.height/2);
						var context = this;
						window.setTimeout(function(){context.init()}, 10);
					}
				}

			};

			this.mouseReleased = function() {
				if(!this.isInitialized){
					return;
				}

				this.updateMouseTracker();
			};

		};

	}]);

	vismining.value('evowave', undefined);

	vismining.directive('evowave', ['evowave-algorithm', 'evowave-filters', 'evowave-utilities', function(algorithm, filters, util) {
		return {
			restrict: 'E',
			templateUrl: 'template/vismining/evowave.html',
			link: function($scope, $element, attrs) {
				var $canvas = $element.find('canvas');
				var canvas = $canvas[0];

				canvas.width = $element.parent()[0].clientWidth;
				canvas.height = $element.parent()[0].clientHeight;

				var evowave = new Processing(canvas, function(processing) {

					angular.extend(processing, algorithm);

					processing.setup = function() {
						processing.size(canvas.width, canvas.height);
				  		processing.noLoop();
					};

				});

				$scope.$watch(attrs.groupby, function(groupby){
					evowave.data = filters.groupWindowsInDays(groupby);
	                evowave.start();
	            });

	            $scope.$watch(attrs.query, function(query){

	            	if(evowave.data === undefined){
						return;
					}

					evowave.data.query = query;
					evowave.makeDirty();
	                evowave.redraw();
	            });

				$scope.$watch(attrs.handler, function(handler){
	                evowave.onMouseTrackerUpdatedHandler = handler;
	            });

				$scope.$watch(attrs.data, function(data){
	                evowave.data = util.clone(data);
					filters.data = util.clone(data);

					//filters.starts = filters.data.starts;
					//filters.ends = filters.data.ends;

					evowave.start();
	            });

				evowave.start();

				vismining.value('evowave', evowave);

			}
		};
	}]);
