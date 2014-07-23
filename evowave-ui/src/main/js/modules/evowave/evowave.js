angular.module( 'vismining-evowave', [] )

	.run(['$templateCache', function($templateCache) {
		$templateCache.put("template/vismining/evowave.html",
			"<canvas />"
		);
	}])

	.factory('evowave', function() {

		/* TODO: this should be another project (perhaps evowave-js) */
		return new function() {

			this.messages = {
				noDataFound: 'No data found to display!'
			}

			this.colors = {
				background: 'FFFFFFFF',
				guidelines: 'FF5796FD',
				messages: 	'FF999999'
			};

			this.init = function(gc) {
				
				delete gc.draw;
				
				angular.extend(this, gc);
				
				this.buffer = this.createGraphics(this.width, this.height, this.JAVA2D), this.createGraphics(this.width, this.height, this.JAVA2D);

				this.reset();
				
				this.draw();

			};

			this.draw = function() {

				if(this.data === undefined) {
					return;
				}

				

				this.image(this.buffer, 0, 0);

			};

			this.reset = function() {
				
				this.clean();
				
				// Create the maximum guideline
				this.buffer.noFill();
				this.buffer.stroke(this.unhex(this.colors.guidelines));
				this.buffer.strokeWeight(1);
				this.buffer.arc(this.width/2, this.height/2, this.width - 1, this.height - 1, 0, Math.PI * 2);

				if(this.data === undefined){
					this.buffer.fill(this.unhex(this.colors.messages));
					this.buffer.text(this.messages.noDataFound, (this.width - this.textWidth(this.messages.noDataFound))/2, this.height/2);
				} else {
					// Creae the minimum guideline
					this.buffer.noFill();
					this.buffer.stroke(this.unhex(this.colors.guidelines));
					this.buffer.strokeWeight(1);
					this.buffer.arc(this.width/2, this.height/2, this.width * 0.10, this.height  * 0.10, 0, Math.PI * 2);
				}
				
			};

			this.clean = function() {
				this.buffer.background(this.unhex(this.colors.background));
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

				$canvas.attr('width', attrs.width);	
				$element.removeAttr('width');

				$canvas.attr('height', attrs.height);
				$element.removeAttr('height');

				evowave.data = $scope.data;

				new Processing($canvas[0], function(processing) {

					var ProcessingAPIContext = processing; // TODO: Create a context wrapper object for processing

					processing.setup = function() {
						processing.size($canvas.attr('width').match(/\d+/g), $canvas.attr('height').match(/\d+/g));
				  		evowave.init(ProcessingAPIContext); 
				  		processing.noLoop();
					};

					processing.draw = evowave.draw;

				});
				
			}
		};
	}]);