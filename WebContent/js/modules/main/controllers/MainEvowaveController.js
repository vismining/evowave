app.controller('MainEvowaveController', ['$scope', 'evowave', function MainEvowaveController($scope, evowave) {
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
    function loadProjectJson(callback, debug) {
        var url = new URL(window.location.href);
        var searchParams = new URLSearchParams(url.search);
        var jsonPath = searchParams.get('jsonPath') || "json/data.json";
        var status = 0, debug = searchParams.get('debug') || false, xhr = new XMLHttpRequest;
        console.log("jsonPath: ", jsonPath);
        xhr.open("GET", jsonPath, true);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.responseType = "application/json";
        xhr.onerror = function() {
            console.error("Cannot connect to server!");
        };
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                status = parseInt(xhr.status);
                if (debug) {
                    console.log("results from xhr request");
                    console.log("xhr.status: ", status);
                    console.log("xhr.responseText: ", xhr.responseText);
                }
                if (callback) {
                    try {
                        console.log('antes');
                        callback(status, JSON.parse(xhr.responseText));
                        console.log('depois');
                    } catch(e) {
                        callback(status, {});
                    }
                }
            }
        };
        xhr.send();
    }

    loadProjectJson(function(status, result) {
    	$scope.data = result;
    	$scope._from = new Date(1998, 08, 27);
    	$scope._to = new Date(2013, 07, 19);
    	$scope.apply = function() {
    		$scope.groupby = $scope._groupby;
    		$scope.query = $scope._query;
    	}
    	$scope.dtFrom = 'Tue Jun 23 1900 21:00:00 GMT-0300';
    	$scope.dtFromShow = false;
    	$scope.dtTo = 'Tue Jun 23 2018 21:00:00 GMT-0300';
    	$scope.dtToShow = false;
    	$scope.dtMin = 'Tue Jun 23 1900 21:00:00 GMT-0300';
    	$scope.dtMax = 'Tue Jun 23 2017 21:00:00 GMT-0300';
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
    	$scope.handle = function(mouseTracker){ };
    });
}]);
