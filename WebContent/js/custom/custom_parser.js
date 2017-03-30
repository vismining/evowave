var xhttp = new XMLHttpRequest();

xhttp.overrideMimeType("application/json");

xhttp.open("GET", "new.json", true);

xhttp.onreadystatechange = function() {
    if(xhttp.readyState == 4 && xhttp.status == "200") {
        var container = document.querySelector("#container");
        var responseText = xhttp.responseText;
        var responseObj = JSON.parse(responseText);

        var data = {
            period: {
                starts: '',
                ends: ''
            },
            query: '',
            window: {
                size: 16,
                amount: 7,
                mode: 'GLOBAL'
            },
            sector: {
                label: 'project'
            },
            sectors: [
                {
                    angle: 0.4,
                    label: 'Seção 1',
                    windows: [
                        {
                            position: 1,
                            molecules: [
                                {
                                    color: 'FFFF0000', 
                                    data: {
                                        complexity: 2,
                                        LOC: 400
                                    }
                                },
                                {
                                    color: 'FF00FF00', 
                                    data: {
                                        complexity: 6,
                                        LOC: 1500
                                    }
                                },
                                {
                                    color: 'FF0000FF', 
                                    data: {
                                        complexity: 5,
                                        LOC: 900
                                    }
                                }
                            ]
                        },
                        {
                            position: 7,
                            molecules: [
                                {
                                    color: 'FFFF0000', 
                                    data: {
                                        complexity: 3,
                                        LOC: 440
                                    }
                                },
                                {
                                    color: 'FF00FF00', 
                                    data: {
                                        complexity: 5,
                                        LOC: 300
                                    }
                                },
                                {
                                    color: 'FF0000FF', 
                                    data: {
                                        complexity: 4,
                                        LOC: 550
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    angle: 0.6,
                    label: 'Seção 2',
                    windows: [
                        {
                            position: 1,
                            molecules: [
                                {
                                    color: 'FFFF0000', 
                                    data: {
                                        complexity: 2,
                                        LOC: 420
                                    }
                                },
                                {
                                    color: 'FF00FF00', 
                                    data: {
                                        complexity: 6,
                                        LOC: 1300
                                    }
                                },
                                {
                                    color: 'FF0000FF', 
                                    data: {
                                        complexity: 5,
                                        LOC: 940
                                    }
                                }
                            ]
                        },
                        {
                            position: 7,
                            molecules: [
                                {
                                    color: 'FFFF0000', 
                                    data: {
                                        complexity: 3,
                                        LOC: 460
                                    }
                                },
                                {
                                    color: 'FF00FF00', 
                                    data: {
                                        complexity: 5,
                                        LOC: 360
                                    }
                                },
                                {
                                    color: 'FF0000FF', 
                                    data: {
                                        complexity: 4,
                                        LOC: 580
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        console.log(JSON.stringify(data));
        container.innerHTML = responseText;
    }
}
xhttp.send();