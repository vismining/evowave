angular.module( 'vismining-evowave', [] )

	.run(['$templateCache', function($templateCache) {
		$templateCache.put("template/vismining/evowave.html",
			"<canvas style='background-color: #CCCCCC; outline: none; -webkit-tap-highlight-color: rgba(255, 255, 255, 0);' />"
		);
	}])

	.factory('evowave', function() {

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
				noDataFound: 'No data found to display!'
			};

			this.colors = {
				background:  'FFFFFFFF',
				sector_odd:  'FFF0F0F0',
				sector_even: 'FFE3E3E3',
				guidelines:  'FF5796FD',
				messages: 	 'FFFFFFFF',
				sectorlines: 'FF000000',
				molecule: 	 'FF333333',
				selection:   '1F000000'
			};

			this.fonts = {
				SectorLabel: undefined
			};

			this.init = function() {
				
				var sectorWithSmallestAngle;
				var previousSector;
				var biggestSectorLabel = 0;

				this.fonts.SectorLabel = { font: this.loadFont('Calibri'), size: 12 , color: 'FF000000' };

				this.loadSectorLabelConfig(this);

				angular.forEach(this.data.sectors, function(sector, sectorId) {

					var startAngle = 0;
					var endAngle = (Math.PI * 2);

					sector.startAngle = (previousSector === undefined) ? startAngle : previousSector.endAngle;
					sector.endAngle = sector.startAngle + ((endAngle-startAngle) * sector.angle);

					previousSector = sector;

					if(sectorWithSmallestAngle === undefined){
						sectorWithSmallestAngle = sector;
					} else if(sectorWithSmallestAngle.angle > sector.angle){
						sectorWithSmallestAngle = sector;
					}

					if(biggestSectorLabel === undefined || biggestSectorLabel < this.textWidth(sector.label) ){
						biggestSectorLabel = this.textWidth(sector.label);
					}



				}, this);

				this.smallestRadius = this.data._window.size;

				do {
					this.smallestRadius++;
					var offset = Math.atan( (this.data._window.size) / this.smallestRadius);
				} while((sectorWithSmallestAngle.startAngle + offset) > (sectorWithSmallestAngle.endAngle - offset));

				this.biggestRadius = this.smallestRadius + (this.data._window.amount * this.data._window.size) + 14;

				this.buffer = this.createGraphics((this.biggestRadius + biggestSectorLabel + 13)*2, (this.biggestRadius + biggestSectorLabel + 13)*2, 1);

				this.center = {x: (this.buffer.width/2), y: (this.buffer.width/2)};

				this.reset();	
				this.draw();

				console.log(this.data);
			};

			this.draw = function() {
				
				var execTime = Date.now();
				
				if(this.data === undefined) {
					return;
				}

				var srcX = Math.round(Math.min(Math.max(0, this.center.x - (this.width/2)), this.buffer.width));
				var	srcY = Math.round(Math.min(Math.max(0, this.center.y - (this.height/2)), this.buffer.width));
				var	dstX = Math.round(Math.abs(Math.min(0, this.center.x - (this.width/2))));
				var	dstY = Math.round(Math.abs(Math.min(0, this.center.y - (this.height/2))));

				var	srcWidth = Math.round(Math.max(0, Math.min((this.buffer.width) - srcX, (this.width) - dstX)));
				var	srcHeight = Math.round(Math.max(0, Math.min((this.buffer.width) - srcY, (this.height) - dstY)));
				var	dstWidth = srcWidth;
				var	dstHeight = srcHeight;				

				if(this.dirty === undefined) {
					angular.forEach(this.data.sectors, function(sector, sectorId) {
						this.drawSector(sectorId);
					}, this);
					this.buffer.loadPixels(srcX, srcY, srcWidth, srcHeight);
				} else if(Object.keys(this.dirty) > 0) {
					angular.forEach(this.dirty, function(sector, sectorId) {
						if(sector.windows !== undefined && Object.keys(sector.windows).length > 0) {
							angular.forEach(sector.windows, function(_window, windowId) {
								if(_window.molecules !== undefined && Object.keys(_window.molecules).length > 0){
									angular.forEach(_window.molecules, function(molecule, moleculeId) {
										this.drawMolecule(sectorId, windowId, moleculeId);
									}, this);
								} else {
									this.drawWindow(sectorId, windowId);
								}
							}, this);
						} else {
							this.drawSector(sectorId);
						}
					}, this);
					this.buffer.loadPixels(srcX, srcY, srcWidth, srcHeight);
 				}

				this.dirty = {};

				this.background(this.unhex(this.colors.background));
				this.loadPixels();
				
				for(var x = srcX; x < srcWidth + srcX; x++){
					for(var y = srcY; y < srcHeight + srcY; y++){
						this.pixels.setPixel(((y-srcY+dstY) * this.width) + (x-srcX+dstX), this.buffer.pixels.getPixel((y * this.buffer.width) + x));
					}
				}
	
				this.updatePixels();

				console.log('Drawing in ' + (Date.now() - execTime) + 'ms');
			};

			this.loadSectorLabelConfig = function(buffer) {
				buffer.textFont(this.fonts.SectorLabel.font);
				buffer.textSize(this.fonts.SectorLabel.size);
			};

			this.drawSector = function(sectorId) {
	
				var sector = this.data.sectors[sectorId];

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

				this.loadSectorLabelConfig(this.buffer);

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
				var sector = this.data.sectors[sectorId];
				var _window = sector.windows[windowId];

				var w = this.smallestRadius + ((_window.position-1)*this.data._window.size);

				var startAngle = sector.startAngle + (Math.atan( 2/*sector border weight*/ / (w + (this.data._window.size/2)) ));
				var endAngle = sector.endAngle - (Math.atan( 2/*sector border weight*/ / (w + (this.data._window.size/2)) ));

				this.fillSector(startAngle, endAngle, (w+this.data._window.size), w);

			};

			this.cleanWindow = function(sectorId, windowId) {
				this.buffer.fill(255);
				this.buffer.noStroke();
				this.fillWindow(sectorId, windowId);
			};

			this.cleanSector = function(sectorId) {

				var sector = this.data.sectors[sectorId];
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

				while(angle <= endAngle){
					var nextAngle = Math.min(endAngle, angle + (Math.PI/180));
					this.buffer.beginShape();
						this.buffer.vertex((this.buffer.width/2) + (biggestRadius * this.buffer.cos(angle)), (this.buffer.width/2) + (biggestRadius * this.buffer.sin(angle)));
						this.buffer.vertex((this.buffer.width/2) + (biggestRadius * this.buffer.cos(nextAngle)), (this.buffer.width/2) + (biggestRadius * this.buffer.sin(nextAngle)));
						this.buffer.vertex((this.buffer.width/2) + (smallestRadius * this.buffer.cos(nextAngle)), (this.buffer.width/2) + (smallestRadius * this.buffer.sin(nextAngle)));
						this.buffer.vertex((this.buffer.width/2) + (smallestRadius * this.buffer.cos(angle)), (this.buffer.width/2) + (smallestRadius * this.buffer.sin(angle)));
					this.buffer.endShape(2);
					angle += (Math.PI/180);
				}
			};

			this.drawWindow = function(sectorId, windowId) {
				var sector = this.data.sectors[sectorId];
				var _window = sector.windows[windowId];
				
				if(_window.position > this.data._window.amount) {
					return;
				}

				_window.offset = Math.atan((this.data._window.size) / ((_window.position * this.data._window.size) + this.smallestRadius));

				var startAngle = sector.startAngle + (_window.offset * 2);
				var endAngle = sector.endAngle - (_window.offset * 2);

				this.cleanWindow(sectorId, windowId);

				var offset = ((endAngle - startAngle)/(_window.molecules.length-1));

				var tmp_color = Math.floor(Math.random()*200);

				this.buffer.strokeWeight(1);
				this.buffer.fill(tmp_color);
				this.buffer.stroke(tmp_color);
				this.fillSector(
					sector.startAngle + _window.offset/2, 
					sector.startAngle + _window.offset, 
					(_window.position * this.data._window.size) + this.smallestRadius - this.data._window.size + 1,
					(_window.position * this.data._window.size) + this.smallestRadius - 1
				);

				this.fillSector(
					sector.endAngle - _window.offset, 
					sector.endAngle - _window.offset/2, 
					(_window.position * this.data._window.size) + this.smallestRadius - this.data._window.size + 1,
					(_window.position * this.data._window.size) + this.smallestRadius - 1
				);

				if(_window.molecules !== undefined && _window.offset <= offset) {

					var moleculeIndex = 0;

					_window.hasSpace = true;

					angular.forEach(_window.molecules, function(molecule, moleculeId) {
						
						/*
						if( moleculeIndex == 0 ) {
							angle = ( ( endAngle - startAngle ) / 2 );
						} else if( moleculeIndex % 2 != 0) {
							angle = ( ( endAngle - startAngle ) / 2 ) + ( ( ( moleculeIndex + 1 ) / 2 ) * ( _window.offset ) );
						} else {
							angle = ( ( endAngle - startAngle ) / 2 ) - ( ( moleculeIndex / 2 ) * ( _window.offset ) );
						}
						*/

						angle = (moleculeIndex * offset);

						moleculeIndex++;

						molecule.position = {
							x: this.buffer.width/2 + ((((_window.position * this.data._window.size) + this.smallestRadius) - this.data._window.size/2) * this.cos(startAngle + angle)),
							y: this.buffer.width/2 + ((((_window.position * this.data._window.size) + this.smallestRadius) - this.data._window.size/2) * this.sin(startAngle + angle)),
							angle: startAngle + angle
						};

						this.drawMolecule(sectorId, windowId, moleculeId);
						
					}, this);

				} else {

					var w = this.smallestRadius + ((_window.position-1)*this.data._window.size) + (this.data._window.size/2);

					startAngle = sector.startAngle + (_window.offset);
					endAngle = sector.endAngle - (_window.offset);

					if(_window.hasSpace === undefined){

						_window.hasSpace = false;

						_window.groups = {};

						angular.forEach(_window.molecules, function(molecule, moleculeId) {

							if(molecule.color === undefined){
								molecule.color = this.colors.molecule;
							}

							if(_window.groups['_' + molecule.color] === undefined){
								_window.groups['_' + molecule.color] = {startAngle: 0, endAngle: 0, molecules: []};
							}

							_window.groups['_' + molecule.color].molecules.push(moleculeId);
						}, this);

					}

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

				var sector = this.data.sectors[sectorId];
				var _window = sector.windows[windowId];
				var moleculeGroup = _window.groups[moleculeGroupId];

				var offset = 2;

				var w = this.smallestRadius + ((_window.position-1)*this.data._window.size) + (this.data._window.size/2);
				var startAngle = moleculeGroup.startAngle + ((Math.atan( 2/*sector border weight*/ / w )));
				var endAngle = moleculeGroup.endAngle - ((Math.atan( 2/*sector border weight*/ / w )));
				var biggestRadius = (((_window.position * this.data._window.size) + this.smallestRadius - offset));
				var smallestRadius = (((Math.max(0, _window.position-1) * this.data._window.size) + this.smallestRadius + offset))


				this.buffer.fill(this.buffer.unhex(moleculeGroupId.replace('_','')));
				this.buffer.stroke(this.buffer.unhex(moleculeGroupId.replace('_','')));
				this.fillSector(startAngle, endAngle, biggestRadius, smallestRadius);
			};

			this.cleanMoleculeGroup = function(sectorId, windowId, moleculeGroupId) {

				var sector = this.data.sectors[sectorId];
				var _window = sector.windows[windowId];
				var moleculeGroup = _window.groups[moleculeGroupId];

				var offset = 2;

				var w = this.smallestRadius + ((_window.position-1)*this.data._window.size) + (this.data._window.size/2);
				var startAngle = moleculeGroup.startAngle + (Math.atan( 2/*sector border weight*/ / w ));
				var endAngle = moleculeGroup.endAngle - (Math.atan( 2/*sector border weight*/ / w ));
				var biggestRadius = (((_window.position * this.data._window.size) + this.smallestRadius - offset));
				var smallestRadius = (((Math.max(0, _window.position-1) * this.data._window.size) + this.smallestRadius + offset))


				this.buffer.fill(255);
				this.buffer.stroke(255);
				this.fillSector(startAngle, endAngle, biggestRadius, smallestRadius);
			};

			this.drawMolecule = function(sectorId, windowId, moleculeId) {

				this.cleanMolecule(sectorId, windowId, moleculeId);

				var sector = this.data.sectors[sectorId];
				var _window = sector.windows[windowId];
				var molecule = _window.molecules[moleculeId];

				if(molecule.color === undefined){
					molecule.color = this.colors.molecule;
				}

				this.buffer.strokeWeight(1);
				this.buffer.fill(this.buffer.unhex(molecule.color));
				this.buffer.stroke(255);
				this.buffer.noStroke();
				this.buffer.ellipse(	molecule.position.x,
										molecule.position.y,
										this.data._window.size-2, 
										this.data._window.size-2);
			};

			this.cleanMolecule = function(sectorId, windowId, moleculeId) {
				var sector = this.data.sectors[sectorId];
				var _window = sector.windows[windowId];
				var molecule = _window.molecules[moleculeId];

				if(molecule.color === undefined){
					molecule.color = this.colors.molecule;
				}

				this.buffer.fill(255);
				this.buffer.noStroke();

				this.buffer.ellipse(	molecule.position.x,
										molecule.position.y,
										this.data._window.size-1, 
										this.data._window.size-1);
			};

			this.reset = function() {

				if(this.data === undefined){
					this.buffer.fill(this.buffer.unhex(this.colors.messages));
					this.buffer.text(this.messages.noDataFound, (this.buffer.width - this.textWidth(this.messages.noDataFound))/2, this.buffer.height/2);
				} else {

					this.clean();
					
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

					this.biggestRadius -= 4;
					this.smallestRadius += 4;
				}

				
				
			};

			this.clean = function() {
				this.buffer.background(this.buffer.unhex(this.colors.background));
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

				var windowPosition = Math.min(this.data._window.amount, Math.max(0, Math.ceil((this.mouseTracker.radius - this.smallestRadius) / this.data._window.size)));
				
				angular.forEach(this.data.sectors, function(sector, sectorId){
					if(this.mouseTracker.angle >= sector.startAngle && this.mouseTracker.angle <= sector.endAngle){
						this.mouseTracker.sector = sectorId;
						angular.forEach(sector.windows, function(_window, windowId){
							if(_window.position === windowPosition){
								this.mouseTracker.window = windowId;
								if(_window.hasSpace){
									angular.forEach(_window.molecules, function(molecule, moleculeId){
										if(this.mouseTracker.angle <= molecule.position.angle + (_window.offset/2) && this.mouseTracker.angle >= molecule.position.angle - (_window.offset/2)){
											this.mouseTracker.molecule = moleculeId;
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
			};

			this.updateSelectionTracker = function() {
				if(this.selectionTracker === undefined){
					this.selectionTracker = { selections: {} };
				}

				if(this.mouseTracker.window !== undefined){
					
					var currentSelection = {sector: this.mouseTracker.sector, window: this.mouseTracker.window};
					var removeSelectionSector;

					angular.forEach(this.selectionTracker.selections, function(selection, selectionSector) {
						if((selection.max.sector === currentSelection.sector && selection.max.window === currentSelection.window) || (selection.min.sector === currentSelection.sector && selection.min.window === currentSelection.window)){
							removeSelectionSector = selectionSector;
						}
					}, this);

					if(false/*removeSelectionSector !== undefined*/){
						var previouslySelection = this.selectionTracker.selections[removeSelectionSector].min;

						if(this.selectionTracker.selections[removeSelectionSector].min.window === currentSelection.window){
							previouslySelection = this.selectionTracker.selections[removeSelectionSector].max;
						}

						if(previouslySelection.window !== currentSelection.window) {
							this.selectionTracker.previously = previouslySelection;
						}

						delete this.selectionTracker.selections[removeSelectionSector];
					} else {

						if(this.selectionTracker.previously === undefined){

							var sectorAlreadySelected = false;

							angular.forEach(this.selectionTracker.selections, function(selection, selectionSector) {
								if(selection.max.sector === currentSelection.sector){
									sectorAlreadySelected = true;
								}
							}, this);

							if(!sectorAlreadySelected){

								if(
									this.selectionTracker.min === undefined || 
									this.selectionTracker.max === undefined || 
									(this.data.sectors[currentSelection.sector].windows[currentSelection.window].position <= this.data.sectors[this.selectionTracker.max.sector].windows[this.selectionTracker.max.window].position &&
									this.data.sectors[currentSelection.sector].windows[currentSelection.window].position >= this.data.sectors[this.selectionTracker.min.sector].windows[this.selectionTracker.min.window].position)
								){ 
									this.selectionTracker.previously = {sector: this.mouseTracker.sector, window: this.mouseTracker.window};
								}

							}

						} else {

							if(this.selectionTracker.selections[currentSelection.sector] !== undefined || currentSelection.sector !== this.selectionTracker.previously.sector) {
								return;
							}

							var selectionMin = this.selectionTracker.previously;
							var selectionMax = currentSelection;

							if(this.data.sectors[selectionMin.sector].windows[selectionMin.window].position > this.data.sectors[selectionMax.sector].windows[selectionMax.window].position) {
								selectionMin = currentSelection;
								selectionMax = this.selectionTracker.previously;
							}

							this.selectionTracker.max = selectionMax;
							this.selectionTracker.min = selectionMin;

							this.selectionTracker.selections[this.mouseTracker.sector] = {min: selectionMin, max: selectionMax};
							delete this.selectionTracker.previously;

						}
					}
				}
			};

			this.makeDirty = function(sectorId, windowId, moleculeId) {
				
				if(sectorId === undefined) {
					return;
				}

				if(this.dirty === undefined){
					this.dirty = {};
				}

				if(this.dirty[sectorId] === undefined) {
					this.dirty[sectorId] = { windows: {} };
				}

				if(windowId !== undefined && this.dirty[sectorId].windows[windowId] === undefined) {
					this.dirty[sectorId].windows[windowId] = { molecules: {} };
				}

				if(moleculeId !== undefined && this.dirty[sectorId].windows[windowId].molecules[moleculeId] === undefined) {
					this.dirty[sectorId].windows[windowId].molecules[moleculeId] = 'dirty';
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

			this.mouseMoved = function() {				
				this.updateMouseTracker();
				this.externals.canvas.style.cursor = 'default';
				//this.drawSelection();
			};

			this.mouseDragged = function() {
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

			this.mousePressed = function() {
				this.updateMouseTracker();
				/*
				if(this.mouseButton == 39) {
					this.updateSelectionTracker();
				}
				*/
			};

			this.mouseReleased = function() {
				this.updateMouseTracker();
			};

		};

	})

	.directive('evowave', ['evowave', function(evowave) {
		return {
			restrict: 'E',
			scope: {
				data: '='
			},
			templateUrl: 'template/vismining/evowave.html',
			link: function($scope, $element, attrs) {
				var $canvas = $element.find('canvas');
				var canvas = $canvas[0];

				evowave.data = $scope.data;
				evowave.data = { 
					_window: { size: 6, amount: 25 },
					sectors: [
						{ angle: 0.20, label: 'Sector01', 
							windows: [ { position: 1, molecules: [ 
								{ color: 'FFFF0000' }, { color: 'FF00FF00' }, { color: 'FF0000FF' } 
							] } ] }, 
						{ angle: 0.10, label: 'Sector02', 
							windows: [ { position: 150, molecules: [
								{ color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}, { color: 'FFFF0000'}, { color: 'FF00FF00'}, { color: 'FF0000FF'}
							] } ] }, 
						{ angle: 0.10, label: 'Sector03', 
							windows: [ { position: 8, molecules: [
								{ color: 'FFFFF5F5'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}
							] } ] }, 
						{ angle: 0.60, label: 'Sector04', 
							windows: [ { position: 40, molecules: [
								{ color: 'FFFF0000'}, { color: 'FF0000FF'}, { color: 'FF0000FF'}, { color: 'FF0000FF'}, { color: 'FF0000FF'}, { color: 'FF0000FF'}, { color: 'FF0000FF'}, { color: 'FF0000FF'}, { color: 'FF0000FF'}, { color: 'FF0000FF'}, { color: 'FF0000FF'}, { color: 'FF0000FF'}, { color: 'FF0000FF'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'} ] }
								, { position: 42, molecules: [
									{ color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}] }
								, { position: 41, molecules: [
									{ color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}] }
								, { position: 11, molecules: [
									{ color: 'FFFF0000'}, { color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}] }
								, { position: 12, molecules: [
									{ color: 'FFFF0000'}, { color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}] }
								, { position: 13, molecules: [
									{ color: 'FFFF0000'}, { color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}] }
								, { position: 14, molecules: [
									{ color: 'FFFF0000'}, { color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}] }
								, { position: 15, molecules: [
									{ color: 'FFFF0000'}, { color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}] }
								, { position: 16, molecules: [
									{ color: 'FFFF0000'}, { color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}] }
								, { position: 17, molecules: [
									{ color: 'FFFF0000'}, { color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}] }
								, { position: 18, molecules: [
									{ color: 'FFFF0000'}, { color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}] }
								, { position: 19, molecules: [
									{ color: 'FFFF0000'}, { color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}] }
								, { position: 20, molecules: [
									{ color: 'FFFF0000'}, { color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}] }
								, { position: 21, molecules: [
									{ color: 'FFFF0000'}, { color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}] }
								, { position: 150, molecules: [
									{ color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}] }
								, { position: 30, molecules: [
									{ color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FFAAD6A5'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'} 
									] } ] } ] };
				
				$canvas.attr('width', $element.parent()[0].clientWidth);

				$canvas.attr('height', $element.parent()[0].clientHeight);

				new Processing(canvas, function(processing) {
					
					angular.extend(processing, evowave);

					processing.setup = function() {
						processing.size(parseInt($canvas.attr('width')), parseInt($canvas.attr('height')));
				  		processing.noLoop();
				  		processing.init();
					};

				});

			}
		};
	}]);