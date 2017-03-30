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
var data = '{"period":{"starts":"","ends":""},"query":"","window":{"size":16,"amount":7,"mode":"GLOBAL"},"sector":{"label":"project"},"sectors":[{"angle":0.4,"label":"Seção 1","windows":[{"position":1,"molecules":[{"color":"FFFF0000","data":{"complexity":2,"LOC":400}},{"color":"FF00FF00","data":{"complexity":6,"LOC":1500}},{"color":"FF0000FF","data":{"complexity":5,"LOC":900}}]},{"position":7,"molecules":[{"color":"FFFF0000","data":{"complexity":3,"LOC":440}},{"color":"FF00FF00","data":{"complexity":5,"LOC":300}},{"color":"FF0000FF","data":{"complexity":4,"LOC":550}}]}]},{"angle":0.6,"label":"Seção 2","windows":[{"position":1,"molecules":[{"color":"FFFF0000","data":{"complexity":2,"LOC":420}},{"color":"FF00FF00","data":{"complexity":6,"LOC":1300}},{"color":"FF0000FF","data":{"complexity":5,"LOC":940}}]},{"position":7,"molecules":[{"color":"FFFF0000","data":{"complexity":3,"LOC":460}},{"color":"FF00FF00","data":{"complexity":5,"LOC":360}},{"color":"FF0000FF","data":{"complexity":4,"LOC":580}}]}]}]}';
data = JSON.parse(data);
console.log(data);

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