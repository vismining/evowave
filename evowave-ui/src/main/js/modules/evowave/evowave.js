angular.module( 'vismining-evowave', [] )

	.run(['$templateCache', function($templateCache) {
		$templateCache.put("template/vismining/evowave.html",
			"<canvas style='border: 1px dashed #FFFFFF; padding:4px; background-color: #E4E4E4' />"
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
				messages: 	'FF999999',
				sectorlines:'FFFFFFFF'
			};

			this.init = function(gc) {
				delete gc.draw;
				
				angular.extend(this, gc);

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
				} else {
					angular.forEach(this.dirty, function(sector, sectorId) {
						if(Object.keys(sector) > 0) {
							angular.forEach(sector, function(_window, windowId) {
								if(Object.keys(_window) > 0){
									angular.forEach(_window, function(molecule, moleculeId) {
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
				}

				this.dirty = {};

				console.log('Drawing in ' + (Date.now() - execTime) + 'ms');
			};

			this.drawSector = function(sectorId) {
	
				var sector = this.data.sectors[sectorId];

				this.cleanSector(sectorId);

				this.stroke(this.unhex(this.colors.sectorlines));
				this.strokeWeight(2);

				this.line(	(this.width/2) + (this.smallestRadius * this.cos(sector.startAngle)), 
									(this.width/2) + (this.smallestRadius * this.sin(sector.startAngle)),
									(this.width/2) + (this.biggestRadius * this.cos(sector.startAngle)), 
									(this.width/2) + (this.biggestRadius * this.sin(sector.startAngle)));

				this.line(	(this.width/2) + (this.smallestRadius * this.cos(sector.endAngle)), 
									(this.width/2) + (this.smallestRadius * this.sin(sector.endAngle)),
									(this.width/2) + (this.biggestRadius * this.cos(sector.endAngle)), 
									(this.width/2) + (this.biggestRadius * this.sin(sector.endAngle)));

				console.log("$: " + (this.biggestRadius) + ", "+ (this.smallestRadius));

				for(var w = this.smallestRadius; w < (this.data._window.amount*this.data._window.size); w += this.data._window.size){
					var startAngle = sector.startAngle + (Math.atan( 4 / w ));
					var endAngle = sector.endAngle - (Math.atan( 4 / w ));

					this.fill(255);
					this.stroke(255);
					this.fillSector(startAngle, endAngle, (w+this.data._window.size)-2, w+2);
				}

				angular.forEach(sector.windows, function(_window, windowId){
					this.drawWindow(sectorId, windowId);
				}, this);

			};

			this.cleanSector = function(sectorId) {

				var sector = this.data.sectors[sectorId];

				if((Object.keys(this.data.sectors).indexOf(sectorId) % 2) == 0){
					sector.background = this.colors.sector_odd;
				} else {
					sector.background = this.colors.sector_even;
				}

				this.fill(this.unhex(sector.background));
				this.stroke(this.unhex(sector.background));

				var r = Math.random() * 255, g =  Math.random() * 255, b =  Math.random() * 255;

				//this.fill(r, g, b);
				//this.stroke(r, g, b);

				this.fillSector(sector.startAngle, sector.endAngle, this.biggestRadius, this.smallestRadius);

			};

			this.fillSector = function(startAngle, endAngle, biggestRadius, smallestRadius) {
				var angle = startAngle;

				while(angle <= endAngle){
					var nextAngle = Math.min(endAngle, angle + (Math.PI/180));
					this.beginShape();
						this.vertex((this.width/2) + (biggestRadius * this.cos(angle)), (this.width/2) + (biggestRadius * this.sin(angle)));
						this.vertex((this.width/2) + (biggestRadius * this.cos(nextAngle)), (this.width/2) + (biggestRadius * this.sin(nextAngle)));
						this.vertex((this.width/2) + (smallestRadius * this.cos(nextAngle)), (this.width/2) + (smallestRadius * this.sin(nextAngle)));
						this.vertex((this.width/2) + (smallestRadius * this.cos(angle)), (this.width/2) + (smallestRadius * this.sin(angle)));
					this.endShape(2);
					angle += (Math.PI/180);
				}
			};

			this.drawWindow = function(sectorId, windowId) {

			};

			this.drawMolecule = function(sectorId, windowId, moleculeId) {

			};

			this.reset = function() {

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

				this.smallestRadius = 0;

				do {
					this.smallestRadius++;
					var offset = Math.atan( (this.data._window.size-2) / this.smallestRadius);
				} while((sectorWithSmallestAngle.startAngle + offset) > (sectorWithSmallestAngle.endAngle - offset));

				this.biggestRadius = (this.data._window.amount * this.data._window.size) + 8;					

				this.clean();
				
				this.noFill();
				this.stroke(this.unhex(this.colors.guidelines));
				this.strokeWeight(1);
				this.arc((this.width/2), (this.width/2), (this.biggestRadius*2),  (this.biggestRadius*2), 0, Math.PI * 2);

				this.biggestRadius -= 3;

				this.noFill();
				this.stroke(this.unhex(this.colors.guidelines));
				this.strokeWeight(1);
				this.arc((this.width/2), (this.width/2), (this.biggestRadius*2),  (this.biggestRadius*2), 0, Math.PI * 2);

				if(this.data === undefined){
					this.fill(this.unhex(this.colors.messages));
					this.text(this.messages.noDataFound, ((this.biggestRadius*2) - this.textWidth(this.messages.noDataFound))/2, this.height/2);
				} else {
					this.noFill();
					this.stroke(this.unhex(this.colors.guidelines));
					this.strokeWeight(1);
					this.arc((this.width/2), (this.width/2), (this.smallestRadius*2), (this.smallestRadius*2), 0, Math.PI * 2);
				}

				this.biggestRadius -= 4;
				this.smallestRadius += 4;
				
			};

			this.clean = function() {
				this.background(this.unhex(this.colors.background));
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
				$canvas = $element.find('canvas');

				evowave.data = $scope.data;
				evowave.data = { _window: { size: 6, amount: 150 }, sectors: { sector5: { angle: 0.15 }, sector6: { angle: 0.35 }, sector3: { angle: 0.25 }, sector4: { angle: 0.05 }, sector2: { angle: 0.15 }, sector1: { angle: 0.05 } } };

				var size = parseInt(attrs.size);

				new Processing($canvas[0], function(processing) {
					var ProcessingAPIContext = processing; // TODO: Create a context wrapper object for processing

					processing.setup = function() {
						/*if(evowave.data){
							size = parseInt(parseInt(attrs.size)-(((((parseInt(attrs.size)/2)-10)-((((parseInt(attrs.size)/2) - 1) * 0.1)+11)) % evowave.data._window.size)*2));
						}*/

						processing.size(size, size);
				  		evowave.init(ProcessingAPIContext);
				  		processing.noLoop();
					};

					processing.draw = evowave.draw;
				});
				
			}
		};
	}]);