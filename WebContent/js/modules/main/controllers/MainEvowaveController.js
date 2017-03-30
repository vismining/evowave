app.controller('MainEvowaveController', ['$scope', 'evowave', function MainEvowaveController( $scope, evowave ) {
/*
Projeto
	setor1
	setor2
		a
		b
		c
		d
			1
			2



	this.LOC > 400 && this.complexity < 5
*/
var data = { 
		period: { starts: '01/09/1998 00:00:00 +0000', ends: '07/09/1998 00:00:00 +0000'},
		query: "this.LOC > 400 && this.complexity < 5", 
		window: { size: 16, amount: 7, mode: 'GLOBAL' },
		sector: { label: 'project' },
		sectors: [
			{ angle: 0.40, label: 'Sector01', 
				windows: [ 
					{ position: 1, 
						molecules: [ 
							{ color: 'FFFF0000', data: { complexity: 2, LOC: 500 }}, 
							{ color: 'FF00FF00', data: { complexity: 5, LOC: 1000 }}, 
							{ color: 'FF00FF00', data: { complexity: 6, LOC: 45 }}, { color: 'FF00FF00', data: { complexity: 9, LOC: 5040 }}, { color: 'FF0000FF', data: { complexity: 10, LOC: 3200 }}, { color: 'FF0000FF', data: { complexity: 10, LOC: 1001 }}
						]
					},
					{ position: 7, 
						molecules: [ 
							{ color: 'FFFF0000', data: { complexity: 1, LOC: 401 }}, { color: 'FF00FF00', data: { complexity: 11, LOC: 3045 }}, { color: 'FF0000FF', data: { complexity: 3, LOC: 1209 }}, { color: 'FF0000FF', data: { complexity: 14, LOC: 4567 }}
						]
					} 
				] 
			},
			{ angle: 0.60, label: 'Sector02', 
				sectors: [
					{ angle: 0.25, label: 'A',
						windows: [
							{ position: 1, 
								molecules: [
									{ color: 'FF0000FF', data: { complexity: 3, LOC: 10 }}, { color: 'FFFF0000', data: { complexity: 10, LOC: 200 }}, { color: 'FF0000FF', data: { complexity: 5, LOC: 43 }}, { color: 'FF0000FF', data: { complexity: 1, LOC: 8 }}, { color: 'FFFF0000', data: { complexity: 20, LOC: 42 }}, { color: 'FFFF0000', data: { complexity: 10, LOC: 567 }}
								]
							}
						]
					},
					{ angle: 0.25, label: 'B',
						windows: [
							{ position: 1, 
								molecules: [
									{ color: 'FFFF0000', data: { complexity: 2, LOC: 4400 }}
								]
							},
							{ position: 2, 
								molecules: [
									{ color: 'FF00FF00', data: { complexity: 9, LOC: 560 }}
								]
							}
						]
					},
					{ angle: 0.25, label: 'C',
						windows: [
							{ position: 3, 
								molecules: [
									{ color: 'FF0000FF', data: { complexity: 11, LOC: 10000 }}
								]
							}
						]
					},
					{ angle: 0.25, label: 'D',
						sectors: [
							{ angle: 0.4, label: '1',
								windows: [
									{ position: 5, 
										molecules: [
											{ color: 'FFFF0000', data: { complexity: 10, LOC: 900 }}
										]
									}
								]
							},
							{ angle: 0.6, label: '2',
								windows: [
									{ position: 6, 
										molecules: [
											{ color: 'FFFF0000', data: { complexity: 10, LOC: 8800 }}, { color: 'FF00FF00', data: { complexity: 11, LOC: 321 }}, { color: 'FFFF0000', data: { complexity: 9, LOC: 1000 }}, { color: 'FFFF0000', data: { complexity: 14, LOC: 2543 }}
										]
									}
								]
							}
						]
					}
				]
			}
		]
	}

	$scope.data = data;
	$scope._from = new Date(1998, 08, 27);
	$scope._to = new Date(2013, 07, 19);
	
	$scope.apply = function() {
		$scope.groupby = $scope._groupby;
		$scope.query = $scope._query;
	}

	$scope.dtFrom = 'Tue Jun 23 1998 21:00:00 GMT-0300';
	$scope.dtFromShow = false;

	$scope.dtTo = 'Tue Jun 23 2012 21:00:00 GMT-0300';
	$scope.dtToShow = false;

	$scope.dtMin = 'Tue Jun 23 1998 21:00:00 GMT-0300';
	$scope.dtMax = 'Tue Jun 23 2012 21:00:00 GMT-0300';



	$scope.formatDate = function(date) {
		return moment(date, 'ddd MMM DD YYYY').format('MMMM Do YYYY');
	};

	$scope.showHideDtFrom = function() {
		$scope.dtToShow = false;
		$scope.dtFromShow = !$scope.dtFromShow;
	};

	$scope.showHideDtTo = function() {
		$scope.dtFromShow = false;
		$scope.dtToShow = !$scope.dtToShow;
	};

	$scope.handle = function(mouseTracker){

		

	};




}]);