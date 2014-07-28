angular.module( 'vismining-evowave', [] )

	.run(['$templateCache', function($templateCache) {
		$templateCache.put("template/vismining/evowave.html",
			"<canvas style='border: 1px dashed #FFFFFF; padding:4px; background-color: #CCCCCC; outline: none; -webkit-tap-highlight-color: rgba(255, 255, 255, 0);' />"
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
				background: 'FFFFFFFF',
				sector_odd: 'FFF4F4F4',
				sector_even:'FFEFEFEF',
				guidelines: 'FF5796FD',
				messages: 	'FFFFFFFF',
				sectorlines:'FFFFFFFF',
				molecule: 	'FF333333'
			};

			this.init = function() {
				
				var sectorWithSmallestAngle;
				var previousSector;

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

				}, this);

				this.smallestRadius = this.data._window.size;

				do {
					this.smallestRadius++;
					var offset = Math.atan( (this.data._window.size) / this.smallestRadius);
				} while((sectorWithSmallestAngle.startAngle + offset) > (sectorWithSmallestAngle.endAngle - offset));

				this.biggestRadius = this.smallestRadius + (this.data._window.amount * this.data._window.size) + 12;

				this.buffer = this.createGraphics((this.biggestRadius+1)*2, (this.biggestRadius+1)*2, 1);

				this.center = {x: this.buffer.width / 2, y: this.buffer.height / 2};

				this.reset();	
				this.draw();

				console.log(this.data);
			};

			this.draw = function() {
				var execTime = Date.now();
				if(this.data === undefined) {
					return;
				}

				if(this.dirty === undefined) {
					angular.forEach(this.data.sectors, function(sector, sectorId) {
						this.drawSector(sectorId);
					}, this);
				}

				this.dirty = {};

				this.background(this.unhex(this.colors.background));
				
				// TODO: Check why bigger visualization is taking longer to copy
				this.copy(	this.buffer, 
							Math.min(Math.max(0, this.center.x - (this.width/2)), this.buffer.width), 
							Math.min(Math.max(0, this.center.y - (this.height/2)), this.buffer.height), 						
							Math.max(0, Math.min(this.buffer.width - Math.min(Math.max(0, this.center.x - (this.width/2)), this.buffer.width), this.width)),
							Math.max(0, Math.min(this.buffer.height - Math.min(Math.max(0, this.center.y - (this.height/2)), this.buffer.height), this.height)),
							Math.abs(Math.min(0, this.center.x - (this.width/2))), 
							Math.abs(Math.min(0, this.center.y - (this.height/2))), 
							Math.max(0, Math.min(this.buffer.width - Math.min(Math.max(0, this.center.x - (this.width/2)), this.buffer.width), this.width)),
							Math.max(0, Math.min(this.buffer.height - Math.min(Math.max(0, this.center.y - (this.height/2)), this.buffer.height), this.height)));

				console.log(Math.max(0, Math.min(this.buffer.height - Math.min(Math.max(0, this.center.y - (this.height/2)), this.buffer.height), this.height)));

				console.log('Drawing in ' + (Date.now() - execTime) + 'ms');
			};

			this.drawSector = function(sectorId) {
	
				var sector = this.data.sectors[sectorId];

				this.cleanSector(sectorId);

				this.buffer.stroke(this.buffer.unhex(this.colors.sectorlines));
				this.buffer.strokeWeight(2);

				this.buffer.line(	(this.center.x) + (this.smallestRadius * this.buffer.cos(sector.startAngle)), 
									(this.center.y) + (this.smallestRadius * this.buffer.sin(sector.startAngle)),
									(this.center.x) + (this.biggestRadius * this.buffer.cos(sector.startAngle)), 
									(this.center.y) + (this.biggestRadius * this.buffer.sin(sector.startAngle)));

				this.buffer.line(	(this.center.x) + (this.smallestRadius * this.buffer.cos(sector.endAngle)), 
									(this.center.y) + (this.smallestRadius * this.buffer.sin(sector.endAngle)),
									(this.center.x) + (this.biggestRadius * this.buffer.cos(sector.endAngle)), 
									(this.center.y) + (this.biggestRadius * this.buffer.sin(sector.endAngle)));

				for(var w = this.smallestRadius; w < this.smallestRadius + (this.data._window.amount*this.data._window.size); w += this.data._window.size){
					var startAngle = sector.startAngle + (Math.atan( this.data._window.size / w )/2);
					var endAngle = sector.endAngle - (Math.atan( this.data._window.size / w )/2);

					this.buffer.fill(255);
					this.buffer.stroke(255);
					this.fillSector(startAngle, endAngle, (w+this.data._window.size)-2, w+2);
				}

				angular.forEach(sector.windows, function(_window, windowId){
					this.drawWindow(sectorId, windowId);
				}, this);

			};

			this.cleanSector = function(sectorId) {

				var sector = this.data.sectors[sectorId];

				if((sectorId % 2) == 0){
					sector.background = this.colors.sector_odd;
				} else {
					sector.background = this.colors.sector_even;
				}

				this.buffer.fill(this.buffer.unhex(sector.background));
				this.buffer.stroke(this.buffer.unhex(sector.background));

				var r = Math.random() * 255, g =  Math.random() * 255, b =  Math.random() * 255;

				//this.fill(r, g, b);
				//this.stroke(r, g, b);

				this.fillSector(sector.startAngle, sector.endAngle, this.biggestRadius, this.smallestRadius);

			};

			this.fillSector = function(startAngle, endAngle, biggestRadius, smallestRadius) {
				var angle = startAngle;

				while(angle <= endAngle){
					var nextAngle = Math.min(endAngle, angle + (Math.PI/180));
					this.buffer.beginShape();
						this.buffer.vertex((this.center.x) + (biggestRadius * this.buffer.cos(angle)), (this.center.y) + (biggestRadius * this.buffer.sin(angle)));
						this.buffer.vertex((this.center.x) + (biggestRadius * this.buffer.cos(nextAngle)), (this.center.y) + (biggestRadius * this.buffer.sin(nextAngle)));
						this.buffer.vertex((this.center.x) + (smallestRadius * this.buffer.cos(nextAngle)), (this.center.y) + (smallestRadius * this.buffer.sin(nextAngle)));
						this.buffer.vertex((this.center.x) + (smallestRadius * this.buffer.cos(angle)), (this.center.y) + (smallestRadius * this.buffer.sin(angle)));
					this.buffer.endShape(2);
					angle += (Math.PI/180);
				}
			};

			this.mouseDragged = function() {
				if(this.mouseButton === 37) {
					this.externals.canvas.style.cursor = '-webkit-grabbing';
					if(this.mouseTracker === undefined){
						this.mouseTracker = {x: this.mouseX, y: this.mouseY};
					} else {
						this.center.x += this.mouseTracker.x - this.mouseX;
						this.center.y += this.mouseTracker.y - this.mouseY;
						this.draw();
						this.mouseTracker.x = this.mouseX;
						this.mouseTracker.y = this.mouseY;
					}
				}
			};

			this.mouseReleased = function() {
				this.externals.canvas.style.cursor = 'default';
				delete this.mouseTracker;
			};

			this.drawWindow = function(sectorId, windowId) {
				var sector = this.data.sectors[sectorId];
				var _window = sector.windows[windowId];
				if(_window.offset === undefined){
					_window.offset = Math.atan((this.data._window.size-1) / ((_window.position * this.data._window.size) + this.smallestRadius));
				}

				var startAngle = sector.startAngle + (_window.offset);
				var endAngle = sector.endAngle - (_window.offset);
				
				if(_window.molecules !== undefined && (endAngle - startAngle) > (_window.molecules.length * _window.offset)) {

					var moleculeIndex = 0;

					angular.forEach(_window.molecules, function(molecule, moleculeId) {

						if( moleculeIndex == 0 ) {
							angle = ( ( endAngle - startAngle ) / 2 );
						} else if( moleculeIndex % 2 != 0) {
							angle = ( ( endAngle - startAngle ) / 2 ) + ( ( ( moleculeIndex + 1 ) / 2 ) * ( _window.offset ) );
						} else {
							angle = ( ( endAngle - startAngle ) / 2 ) - ( ( moleculeIndex / 2 ) * ( _window.offset ) );
						}

						moleculeIndex++;

						molecule.position = {
							x: this.center.x + ((((_window.position * this.data._window.size) + this.smallestRadius) - this.data._window.size/2) * this.cos(startAngle + angle)),
							y: this.center.y + ((((_window.position * this.data._window.size) + this.smallestRadius) - this.data._window.size/2) * this.sin(startAngle + angle))
						};

						this.drawMolecule(sectorId, windowId, moleculeId);

					}, this);

				} else {

					angular.forEach(_window.molecules, function(molecule, moleculeId) {

						if(molecule.color === undefined){
							molecule.color = this.colors.molecule;
						}

						if(_window['_' + molecule.color] === undefined){
							_window['_' + molecule.color] = [];
						}

						_window['_' + molecule.color].push(moleculeId);
					}, this);

					var _startAngle = startAngle;
					
					angular.forEach(_window, function(value, key) {
						if(key.match('^_')){
							this.buffer.fill(this.buffer.unhex(key.replace('_','')));
							this.buffer.stroke(this.buffer.unhex(key.replace('_','')));
							this.buffer.strokeWeight(1);

							angle = (endAngle - startAngle) * (_window[key].length / _window.molecules.length);

							this.fillSector(_startAngle, _startAngle + angle, (((_window.position * this.data._window.size) + this.smallestRadius - 3)), (((Math.max(0, _window.position-1) * this.data._window.size) + this.smallestRadius + 3)));
							_startAngle += angle;
						}
					}, this);

				}

			};

			this.drawMolecule = function(sectorId, windowId, moleculeId) {
				var sector = this.data.sectors[sectorId];
				var _window = sector.windows[windowId];
				var molecule = _window.molecules[moleculeId];

				if(molecule.color === undefined){
					molecule.color = this.colors.molecule;
				}

				this.buffer.fill(this.buffer.unhex(molecule.color));
				this.buffer.stroke(this.buffer.unhex(molecule.color));
				this.buffer.strokeWeight(2);

				var r = Math.random() * 255, g =  Math.random() * 255, b =  Math.random() * 255;

				//this.buffer.fill(255);
				//this.buffer.stroke(r, g, b);

				this.buffer.ellipse(	molecule.position.x,
										molecule.position.y,
										this.data._window.size-5, 
										this.data._window.size-5);
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
					this.buffer.arc((this.center.x), (this.center.y), (this.biggestRadius*2),  (this.biggestRadius*2), 0, Math.PI * 2);

					this.biggestRadius -= 3;

					this.buffer.noFill();
					this.buffer.stroke(this.buffer.unhex(this.colors.guidelines));
					this.buffer.strokeWeight(1);
					this.buffer.arc((this.center.x), (this.center.y), (this.biggestRadius*2),  (this.biggestRadius*2), 0, Math.PI * 2);

					this.buffer.noFill();
					this.buffer.stroke(this.buffer.unhex(this.colors.guidelines));
					this.buffer.strokeWeight(1);
					this.buffer.arc((this.center.x), (this.center.y), (this.smallestRadius*2), (this.smallestRadius*2), 0, Math.PI * 2);

					this.biggestRadius -= 4;
					this.smallestRadius += 4;
				}

				
				
			};

			this.clean = function() {
				this.buffer.background(this.buffer.unhex(this.colors.background));
			}

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
				evowave.data = { _window: { size: 6, amount: 100 }, sectors: [ { angle: 0.10 }, { angle: 0.15 }, { angle: 0.75, windows: [ { position: 10, molecules: [{ color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}] }, { position: 9, molecules: [{ color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FFFF0000'}, { color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF00FF00'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FF0000FF'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'},{ color: 'FFFF0000'}] } ] } ] };

				$canvas.attr('width', attrs.width);
				$element.removeAttr('width');

				$canvas.attr('height', attrs.height);
				$element.removeAttr('height');

				new Processing(canvas, function(processing) {
					
					angular.extend(processing, evowave);

					processing.setup = function() {
						processing.size(parseInt(attrs.width), parseInt(attrs.height));
				  		processing.noLoop();
				  		processing.init();
					};

				});

			}
		};
	}]);