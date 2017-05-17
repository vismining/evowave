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
	var data = JSON.parse('{"period":{"starts":"","ends":""},"query":"","window":{"size":16,"amount":7,"mode":"GLOBAL"},"sector":{"label":"Verificação de transações bancárias"},"sectors":[{"angle":50,"label":"Anos Pares","windows":[{"position":1,"molecules":[{"color":"FFFF0000","data":{"qtd_outran":4057,"qtd_salext":43}}]},{"position":2,"molecules":[{"color":"FFFF0000","data":{"qtd_outran":4878,"qtd_salext":48}}]},{"position":3,"molecules":[{"color":"FFFF0000","data":{"qtd_outran":5197,"qtd_salext":53}}]}]},{"angle":0.5,"label":"Anos Ímpares","windows":[{"position":1,"molecules":[{"color":"FF00FF00","data":{"qtd_outran":4490,"qtd_salext":41}}]},{"position":2,"molecules":[{"color":"FF00FF00","data":{"qtd_outran":4949,"qtd_salext":46}}]},{"position":3,"molecules":[{"color":"FF00FF00","data":{"qtd_outran":5226,"qtd_salext":50}}]}]}]}
');

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